import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2): único archivo de la feature que toca Prisma.

/**
 * Agrega o quita el favorito y devuelve cómo quedó.
 *
 * El toggle se resuelve en la base y no leyendo primero desde la aplicación: entre un `findFirst`
 * y el `create` hay una ventana en la que dos clicks rápidos crean dos filas —o fallan contra el
 * `@@unique([usuarioId, publicacionId])`. Acá el `delete` sobre la clave única es atómico: si
 * borró, estaba; si no había nada que borrar, se crea.
 */
export async function alternarFavorito(
  usuarioId: string,
  publicacionId: string,
): Promise<{ esFavorito: boolean }> {
  const { count } = await prisma.favorito.deleteMany({
    where: { usuarioId, publicacionId },
  });

  if (count > 0) return { esFavorito: false };

  await prisma.favorito.create({ data: { usuarioId, publicacionId } });
  return { esFavorito: true };
}

/**
 * Cuáles de estas publicaciones son favoritas del usuario.
 *
 * Una consulta para todo el listado y no una por tarjeta: con 12 resultados por página, la
 * versión ingenua son 12 viajes a la base para pintar 12 corazones.
 */
export async function idsFavoritosDe(
  usuarioId: string,
  publicacionIds: string[],
): Promise<Set<string>> {
  if (publicacionIds.length === 0) return new Set();

  const filas = await prisma.favorito.findMany({
    where: { usuarioId, publicacionId: { in: publicacionIds } },
    select: { publicacionId: true },
  });

  return new Set(filas.map((fila) => fila.publicacionId));
}

/**
 * Los favoritos del usuario, con la publicación entera.
 *
 * Incluye a propósito las pausadas y las eliminadas: la vista de favoritos las muestra con un
 * cartel de "ya no disponible" en vez de hacerlas desaparecer (6.5). Un favorito que se esfuma
 * sin explicación se lee como un bug de la app, no como un inmueble que se vendió.
 */
export function listarFavoritos(usuarioId: string) {
  return prisma.favorito.findMany({
    where: { usuarioId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      publicacion: {
        select: {
          id: true,
          titulo: true,
          precio: true,
          moneda: true,
          operacion: true,
          tipoInmueble: true,
          provincia: true,
          ciudad: true,
          barrio: true,
          ambientes: true,
          dormitorios: true,
          banios: true,
          superficieCubierta: true,
          estadoPublicacion: true,
          imagenes: {
            where: { esPortada: true },
            select: { url: true, urlThumbnail: true },
            take: 1,
          },
        },
      },
    },
  });
}

export function contarFavoritos(usuarioId: string) {
  return prisma.favorito.count({ where: { usuarioId } });
}
