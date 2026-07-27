import type { EstadoPublicacion, EstadoUsuario } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2). Es el repositorio del panel de moderación (6.7), y por eso es
// el único que puede tocar publicaciones y usuarios ajenos: el resto de la app filtra siempre
// por dueño. Concentrar acá esas consultas es lo que hace que "quién puede tocar lo de otro"
// sea una pregunta con una sola respuesta y un solo archivo donde mirarla.

/** 30 por página: entra en una pantalla sin scroll infinito y sin traer la tabla entera. */
const POR_PAGINA = 30;

export function listarPublicacionesParaModerar(estado?: EstadoPublicacion) {
  return prisma.publicacion.findMany({
    where: estado ? { estadoPublicacion: estado } : {},
    orderBy: [{ createdAt: "desc" }],
    take: POR_PAGINA,
    select: {
      id: true,
      titulo: true,
      estadoPublicacion: true,
      createdAt: true,
      vistas: true,
      ciudad: true,
      provincia: true,
      usuario: { select: { id: true, email: true, name: true } },
    },
  });
}

export function contarPorEstado() {
  return prisma.publicacion.groupBy({
    by: ["estadoPublicacion"],
    _count: { _all: true },
  });
}

/**
 * Cambia el estado de CUALQUIER publicación, sin filtrar por dueño.
 *
 * Es la diferencia con `cambiarEstado` de publicacionRepository, que exige `usuarioId`. Acá el
 * permiso no viene del WHERE sino del rol, así que la action que llame a esto tiene que haber
 * verificado `requerirRol("admin")` antes — no hay red de seguridad a nivel de query.
 */
export async function moderarPublicacion(id: string, estado: EstadoPublicacion) {
  const { count } = await prisma.publicacion.updateMany({
    where: { id },
    data: { estadoPublicacion: estado },
  });
  return count === 1;
}

export function listarUsuarios(busqueda?: string) {
  return prisma.user.findMany({
    where: busqueda
      ? {
          OR: [
            { email: { contains: busqueda, mode: "insensitive" } },
            { name: { contains: busqueda, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ createdAt: "desc" }],
    take: POR_PAGINA,
    select: {
      id: true,
      email: true,
      name: true,
      rol: true,
      estado: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { publicaciones: true } },
    },
  });
}

/**
 * Banea o reactiva un usuario.
 *
 * Cambia `estado` y no borra nada (6.7): las publicaciones, los favoritos y los mensajes del
 * usuario siguen existiendo. Borrarlo en cascada haría desaparecer consultas que otros
 * vendedores necesitan, y sería irreversible ante un baneo equivocado.
 */
export async function cambiarEstadoDeUsuario(id: string, estado: EstadoUsuario) {
  const { count } = await prisma.user.updateMany({ where: { id }, data: { estado } });
  return count === 1;
}

export function contarUsuariosBaneados() {
  return prisma.user.count({ where: { estado: "baneado" } });
}
