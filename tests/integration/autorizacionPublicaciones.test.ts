import { describe, expect, it } from "vitest";

import {
  actualizarPublicacion,
  buscarEstadoDePublicacion,
  buscarPublicacionDelUsuario,
  cambiarEstado,
  listarPublicacionesDelUsuario,
} from "@/features/publicaciones/publicacionRepository";
import { prisma } from "@/shared/lib/prismaClient";

import {
  crearPublicacionDePrueba,
  crearUsuarioDePrueba,
  datosDePublicacion,
} from "./ayudantes";

/**
 * Autorización sobre publicaciones ajenas (caso prioritario de 12.2, defensa de 8.6/8.19).
 *
 * Esto no se puede testear con mocks y es exactamente el motivo por el que 12.2 existe: lo que
 * se está verificando es que el `usuarioId` viaje DENTRO del WHERE de cada consulta. Un mock de
 * Prisma devuelve lo que le pidan, así que un repositorio que se olvidara del dueño pasaría el
 * unit test igual. Acá la que decide es la base.
 */

async function dosUsuariosConUnaPublicacion() {
  const duenio = await crearUsuarioDePrueba();
  const intruso = await crearUsuarioDePrueba();
  const publicacion = await crearPublicacionDePrueba(duenio.id);
  return { duenio, intruso, publicacion };
}

describe("lectura de una publicación ajena", () => {
  it("devuelve null en vez de la fila del otro", async () => {
    const { intruso, publicacion } = await dosUsuariosConUnaPublicacion();

    await expect(
      buscarPublicacionDelUsuario(publicacion.id, intruso.id),
    ).resolves.toBeNull();
  });

  it("el dueño sí la ve", async () => {
    const { duenio, publicacion } = await dosUsuariosConUnaPublicacion();

    await expect(
      buscarPublicacionDelUsuario(publicacion.id, duenio.id),
    ).resolves.toMatchObject({ id: publicacion.id });
  });

  it("no la expone al consultar su estado", async () => {
    const { intruso, publicacion } = await dosUsuariosConUnaPublicacion();

    await expect(
      buscarEstadoDePublicacion(publicacion.id, intruso.id),
    ).resolves.toBeNull();
  });

  it("no aparece en el listado del dashboard de otro", async () => {
    const { intruso } = await dosUsuariosConUnaPublicacion();

    await expect(listarPublicacionesDelUsuario(intruso.id)).resolves.toHaveLength(0);
  });
});

describe("escritura sobre una publicación ajena", () => {
  it("no modifica nada y no rompe", async () => {
    const { intruso, publicacion } = await dosUsuariosConUnaPublicacion();

    // Falla devolviendo null, no lanzando: `updateMany` con el dueño en el WHERE afecta 0 filas.
    // Es la diferencia entre "no te dejo" y "no existe para vos", que además no le confirma al
    // intruso que ese id exista.
    await expect(
      actualizarPublicacion(
        publicacion.id,
        intruso.id,
        datosDePublicacion({ titulo: "Título secuestrado" }),
      ),
    ).resolves.toBeNull();

    const sinTocar = await prisma.publicacion.findUniqueOrThrow({
      where: { id: publicacion.id },
    });
    expect(sinTocar.titulo).toBe("Departamento 2 ambientes en Palermo");
  });

  it("no le cambia el estado", async () => {
    const { intruso, publicacion } = await dosUsuariosConUnaPublicacion();

    await expect(cambiarEstado(publicacion.id, intruso.id, "activa", true)).resolves.toBe(
      false,
    );

    const sinTocar = await prisma.publicacion.findUniqueOrThrow({
      where: { id: publicacion.id },
    });
    expect(sinTocar.estadoPublicacion).toBe("borrador");
    expect(sinTocar.publishedAt).toBeNull();
  });

  it("el dueño sí puede editarla y publicarla", async () => {
    const { duenio, publicacion } = await dosUsuariosConUnaPublicacion();

    await expect(
      actualizarPublicacion(
        publicacion.id,
        duenio.id,
        datosDePublicacion({ titulo: "Título corregido" }),
      ),
    ).resolves.not.toBeNull();

    await expect(cambiarEstado(publicacion.id, duenio.id, "activa", true)).resolves.toBe(
      true,
    );

    const actualizada = await prisma.publicacion.findUniqueOrThrow({
      where: { id: publicacion.id },
    });
    expect(actualizada.titulo).toBe("Título corregido");
    expect(actualizada.estadoPublicacion).toBe("activa");
    expect(actualizada.publishedAt).toBeInstanceOf(Date);
  });
});

describe("campos que el formulario no puede escribir (mass assignment, 8.23)", () => {
  it("editar no cambia el dueño ni el estado, aunque vengan en el payload", async () => {
    const { duenio, intruso, publicacion } = await dosUsuariosConUnaPublicacion();
    await cambiarEstado(publicacion.id, duenio.id, "activa", true);

    // Se cuelan dos campos que el schema de Zod no incluye. `camposEscribibles` los lista uno
    // por uno en vez de hacer spread del payload, así que no deberían llegar a la base.
    await actualizarPublicacion(publicacion.id, duenio.id, {
      ...datosDePublicacion({ titulo: "Editado" }),
      usuarioId: intruso.id,
      estadoPublicacion: "borrador",
    } as never);

    const despues = await prisma.publicacion.findUniqueOrThrow({
      where: { id: publicacion.id },
    });
    expect(despues.usuarioId).toBe(duenio.id);
    // Editar una publicación activa NO la vuelve a borrador (6.2): corregir una errata no puede
    // sacar el inmueble de los resultados de búsqueda.
    expect(despues.estadoPublicacion).toBe("activa");
    expect(despues.titulo).toBe("Editado");
  });
});

describe("soft delete", () => {
  it("una publicación eliminada deja de ser editable pero la fila sobrevive", async () => {
    const { duenio, publicacion } = await dosUsuariosConUnaPublicacion();

    await cambiarEstado(publicacion.id, duenio.id, "eliminada", false);

    await expect(
      buscarPublicacionDelUsuario(publicacion.id, duenio.id),
    ).resolves.toBeNull();
    await expect(
      actualizarPublicacion(publicacion.id, duenio.id, datosDePublicacion()),
    ).resolves.toBeNull();

    // La fila queda: los favoritos y mensajes que la referencian tienen que seguir existiendo
    // (3.4). Un DELETE real se los llevaría puestos.
    await expect(prisma.publicacion.count()).resolves.toBe(1);
  });
});
