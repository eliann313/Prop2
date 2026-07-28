import { describe, expect, it } from "vitest";

import {
  alternarFavorito,
  contarFavoritos,
  idsFavoritosDe,
  listarFavoritos,
} from "@/features/favoritos/favoritoRepository";
import { cambiarEstado } from "@/features/publicaciones/publicacionRepository";
import { prisma } from "@/shared/lib/prismaClient";

import { crearPublicacionDePrueba, crearUsuarioDePrueba } from "./ayudantes";

/**
 * Favoritos contra la base real, con la restricción UNIQUE puesta (caso prioritario de 12.2).
 *
 * El toggle se resuelve en la base a propósito (ver el repositorio): entre un `findFirst` y un
 * `create` hay una ventana en la que dos clicks rápidos crean dos filas o revientan contra el
 * `@@unique`. Eso es justo lo que un mock nunca reproduce, porque en un mock la restricción no
 * existe.
 */

async function escenario() {
  const usuario = await crearUsuarioDePrueba();
  const otro = await crearUsuarioDePrueba();
  const publicacion = await crearPublicacionDePrueba(usuario.id);
  return { usuario, otro, publicacion };
}

describe("alternar favorito", () => {
  it("lo agrega y lo quita", async () => {
    const { usuario, publicacion } = await escenario();

    await expect(alternarFavorito(usuario.id, publicacion.id)).resolves.toEqual({
      esFavorito: true,
    });
    await expect(contarFavoritos(usuario.id)).resolves.toBe(1);

    await expect(alternarFavorito(usuario.id, publicacion.id)).resolves.toEqual({
      esFavorito: false,
    });
    await expect(contarFavoritos(usuario.id)).resolves.toBe(0);
  });

  it("nunca deja dos filas para el mismo par usuario/publicación", async () => {
    const { usuario, publicacion } = await escenario();

    await alternarFavorito(usuario.id, publicacion.id);
    await alternarFavorito(usuario.id, publicacion.id);
    await alternarFavorito(usuario.id, publicacion.id);

    await expect(prisma.favorito.count()).resolves.toBe(1);
  });

  // La restricción de la base es la última línea de defensa, y este test la ejerce directo:
  // si alguien sacara el @@unique del schema, el toggle seguiría "andando" en los tests de
  // arriba y solo se rompería en producción con dos clicks simultáneos.
  it("la base rechaza el duplicado aunque se lo pidan explícitamente", async () => {
    const { usuario, publicacion } = await escenario();

    await prisma.favorito.create({
      data: { usuarioId: usuario.id, publicacionId: publicacion.id },
    });

    await expect(
      prisma.favorito.create({
        data: { usuarioId: usuario.id, publicacionId: publicacion.id },
      }),
    ).rejects.toThrow();
  });

  it("dos usuarios pueden marcar la misma publicación", async () => {
    const { usuario, otro, publicacion } = await escenario();

    await alternarFavorito(usuario.id, publicacion.id);
    await alternarFavorito(otro.id, publicacion.id);

    await expect(prisma.favorito.count()).resolves.toBe(2);
    await expect(contarFavoritos(usuario.id)).resolves.toBe(1);
    await expect(contarFavoritos(otro.id)).resolves.toBe(1);
  });
});

describe("consulta de favoritos", () => {
  it("solo devuelve los del usuario que pregunta", async () => {
    const { usuario, otro, publicacion } = await escenario();
    await alternarFavorito(otro.id, publicacion.id);

    await expect(idsFavoritosDe(usuario.id, [publicacion.id])).resolves.toEqual(
      new Set(),
    );
    await expect(idsFavoritosDe(otro.id, [publicacion.id])).resolves.toEqual(
      new Set([publicacion.id]),
    );
  });

  it("no consulta la base cuando no hay ids que mirar", async () => {
    const { usuario } = await escenario();

    await expect(idsFavoritosDe(usuario.id, [])).resolves.toEqual(new Set());
  });

  // 6.5: un favorito que se esfuma sin explicación se lee como un bug de la app, no como un
  // inmueble que se vendió. La vista los muestra con el cartel de "ya no disponible".
  it("sigue listando la publicación aunque deje de estar activa", async () => {
    const { usuario, publicacion } = await escenario();
    await alternarFavorito(usuario.id, publicacion.id);

    await cambiarEstado(publicacion.id, usuario.id, "pausada", false);

    const listado = await listarFavoritos(usuario.id);
    expect(listado).toHaveLength(1);
    expect(listado[0]!.publicacion.estadoPublicacion).toBe("pausada");
  });
});

describe("borrado en cascada", () => {
  it("borrar el usuario se lleva sus favoritos", async () => {
    const { usuario, otro, publicacion } = await escenario();
    await alternarFavorito(otro.id, publicacion.id);

    await prisma.user.delete({ where: { id: otro.id } });

    await expect(prisma.favorito.count()).resolves.toBe(0);
    // La publicación es de `usuario`, no de `otro`: no debe irse con él.
    await expect(prisma.publicacion.count()).resolves.toBe(1);
    expect(usuario.id).not.toBe(otro.id);
  });
});
