import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requerirUsuario: vi.fn(),
  actualizarEstado: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/sessionQueries", () => ({
  requerirUsuario: mocks.requerirUsuario,
}));
vi.mock("@/features/contacto/mensajeContactoRepository", () => ({
  actualizarEstadoMensajeDelVendedor: mocks.actualizarEstado,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { actualizarEstadoConsulta } from "@/features/contacto/actions/actualizarEstadoConsulta";

describe("actualizarEstadoConsulta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requerirUsuario.mockResolvedValue({ id: "usuario-de-la-sesion" });
    mocks.actualizarEstado.mockResolvedValue(true);
  });

  it("toma el dueño de la sesión e ignora cualquier usuarioId del cliente", async () => {
    const resultado = await actualizarEstadoConsulta({
      mensajeId: "550e8400-e29b-41d4-a716-446655440000",
      estado: "leida",
      usuarioId: "usuario-forjado",
    });

    expect(resultado.ok).toBe(true);
    expect(mocks.requerirUsuario).toHaveBeenCalledOnce();
    expect(mocks.actualizarEstado).toHaveBeenCalledWith(
      "usuario-de-la-sesion",
      "550e8400-e29b-41d4-a716-446655440000",
      "leida",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/mensajes");
  });

  it("rechaza IDs y estados que no pasan el schema", async () => {
    const resultado = await actualizarEstadoConsulta({
      mensajeId: "no-es-un-uuid",
      estado: "borrada",
    });

    expect(resultado.ok).toBe(false);
    expect(mocks.actualizarEstado).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("devuelve fallo cuando el repositorio no encuentra mensaje del dueño", async () => {
    mocks.actualizarEstado.mockResolvedValue(false);

    const resultado = await actualizarEstadoConsulta({
      mensajeId: "550e8400-e29b-41d4-a716-446655440000",
      estado: "atendida",
    });

    expect(resultado.ok).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("informa una caída de la base sin revelar el error ni invalidar la página", async () => {
    mocks.actualizarEstado.mockRejectedValue(new Error("detalle privado de conexión"));
    const resultado = await actualizarEstadoConsulta({
      mensajeId: "550e8400-e29b-41d4-a716-446655440000",
      estado: "leida",
    });
    expect(resultado).toMatchObject({
      ok: false,
      mensaje: expect.stringContaining("No pudimos guardar"),
    });
    expect(JSON.stringify(resultado)).not.toContain("detalle privado");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
