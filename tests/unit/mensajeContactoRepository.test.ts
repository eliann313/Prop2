import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  mensajeCount: vi.fn(),
  mensajeFindMany: vi.fn(),
  mensajeGroupBy: vi.fn(),
  mensajeUpdateMany: vi.fn(),
  publicacionFindMany: vi.fn(),
}));

vi.mock("@/shared/lib/prismaClient", () => ({
  prisma: {
    mensajeContacto: {
      count: prismaMocks.mensajeCount,
      findMany: prismaMocks.mensajeFindMany,
      groupBy: prismaMocks.mensajeGroupBy,
      updateMany: prismaMocks.mensajeUpdateMany,
    },
    publicacion: { findMany: prismaMocks.publicacionFindMany },
  },
}));

import {
  actualizarEstadoMensajeDelVendedor,
  contarMensajesPorEstadoDelVendedor,
  listarMensajesDelVendedor,
  listarPublicacionesConConsultasDelVendedor,
} from "@/features/contacto/mensajeContactoRepository";

describe("consultas del vendedor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.mensajeCount.mockResolvedValue(0);
    prismaMocks.mensajeFindMany.mockResolvedValue([]);
    prismaMocks.mensajeGroupBy.mockResolvedValue([]);
    prismaMocks.mensajeUpdateMany.mockResolvedValue({ count: 0 });
    prismaMocks.publicacionFindMany.mockResolvedValue([]);
  });

  it("fija el dueño en la consulta paginada incluso al filtrar por publicación", async () => {
    await listarMensajesDelVendedor("vendedor-1", {
      publicacionId: "publicacion-propia",
      pagina: 3,
    });

    const where = {
      publicacion: { usuarioId: "vendedor-1", id: "publicacion-propia" },
    };
    expect(prismaMocks.mensajeCount).toHaveBeenCalledWith({ where });
    expect(prismaMocks.mensajeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 20,
        take: 10,
      }),
    );
  });

  it("aplica el dueño aunque el cliente no seleccione publicación", async () => {
    await listarMensajesDelVendedor("vendedor-2", { pagina: 1 });

    expect(prismaMocks.mensajeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicacion: { usuarioId: "vendedor-2" } },
        skip: 0,
        take: 10,
      }),
    );
  });

  it("filtra por estado dentro del alcance del dueño y pagina de forma estable", async () => {
    await listarMensajesDelVendedor("vendedor-4", {
      estado: "nueva",
      pagina: 2,
    });

    const where = {
      publicacion: { usuarioId: "vendedor-4" },
      estado: "nueva",
    };
    expect(prismaMocks.mensajeCount).toHaveBeenCalledWith({ where });
    expect(prismaMocks.mensajeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 10,
        take: 10,
      }),
    );
  });

  it("solo ofrece publicaciones propias que recibieron consultas", async () => {
    await listarPublicacionesConConsultasDelVendedor("vendedor-3");

    expect(prismaMocks.publicacionFindMany).toHaveBeenCalledWith({
      where: { usuarioId: "vendedor-3", mensajes: { some: {} } },
      orderBy: [{ titulo: "asc" }, { id: "asc" }],
      select: { id: true, titulo: true },
    });
  });

  it("cuenta estados de consultas sin confiar en un propietario de la URL", async () => {
    await contarMensajesPorEstadoDelVendedor("vendedor-5", "publicacion-propia");

    expect(prismaMocks.mensajeGroupBy).toHaveBeenCalledWith({
      by: ["estado"],
      where: {
        publicacion: { usuarioId: "vendedor-5", id: "publicacion-propia" },
      },
      _count: { _all: true },
    });
  });

  it("actualiza una fila con dueño y estado en el WHERE/SET de Prisma", async () => {
    prismaMocks.mensajeUpdateMany.mockResolvedValue({ count: 1 });

    await expect(
      actualizarEstadoMensajeDelVendedor("vendedor-6", "mensaje-1", "atendida"),
    ).resolves.toBe(true);
    expect(prismaMocks.mensajeUpdateMany).toHaveBeenCalledWith({
      where: { id: "mensaje-1", publicacion: { usuarioId: "vendedor-6" } },
      data: { estado: "atendida" },
    });
  });

  it("no confirma una mutación si el mensaje no es del usuario", async () => {
    await expect(
      actualizarEstadoMensajeDelVendedor("vendedor-7", "mensaje-ajeno", "leida"),
    ).resolves.toBe(false);
  });
});
