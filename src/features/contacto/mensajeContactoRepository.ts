import type { EstadoMensajeContacto, MedioContacto } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

const MENSAJES_POR_PAGINA = 10;

// Capa de infraestructura (4.2): único archivo de la feature que toca Prisma.

type DatosDelMensaje = {
  publicacionId: string;
  /** Null cuando quien consulta no tiene sesión: no se exige cuenta para consultar (3.4). */
  usuarioId: string | null;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto?: string;
  mensaje: string;
  medioContacto: MedioContacto;
};

export function crearMensaje(datos: DatosDelMensaje) {
  return prisma.mensajeContacto.create({
    data: {
      publicacionId: datos.publicacionId,
      usuarioId: datos.usuarioId,
      nombreContacto: datos.nombreContacto,
      emailContacto: datos.emailContacto,
      telefonoContacto: datos.telefonoContacto ?? null,
      mensaje: datos.mensaje,
      medioContacto: datos.medioContacto,
    },
    select: { id: true },
  });
}

/**
 * Datos mínimos para poder avisarle al vendedor: a quién escribirle y por qué inmueble.
 *
 * Se consulta acá y no se confía en lo que mande el formulario: el email del destinatario sale
 * de la base a partir del id de la publicación. Si viniera del cliente, el formulario de
 * contacto sería una máquina de mandar emails a cualquier dirección con nuestro dominio.
 */
export function buscarDestinatarioDeConsulta(publicacionId: string) {
  return prisma.publicacion.findFirst({
    where: { id: publicacionId, estadoPublicacion: "activa" },
    select: {
      id: true,
      titulo: true,
      usuario: { select: { email: true, name: true } },
    },
  });
}

/** Mensajes del dueño, filtrados por publicación y paginados, más nuevos primero. */
export async function listarMensajesDelVendedor(
  usuarioId: string,
  opciones: {
    publicacionId?: string;
    estado?: EstadoMensajeContacto;
    pagina: number;
  },
) {
  // El dueño siempre sale de la sesión. El ID de publicación solo refina dentro del mismo
  // WHERE, así que manipular la query string no permite consultar mensajes de otra cuenta.
  const where = {
    publicacion: {
      usuarioId,
      ...(opciones.publicacionId ? { id: opciones.publicacionId } : {}),
    },
    ...(opciones.estado ? { estado: opciones.estado } : {}),
  };

  const [total, resultados] = await Promise.all([
    prisma.mensajeContacto.count({ where }),
    prisma.mensajeContacto.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (opciones.pagina - 1) * MENSAJES_POR_PAGINA,
      take: MENSAJES_POR_PAGINA,
      select: {
        id: true,
        nombreContacto: true,
        emailContacto: true,
        telefonoContacto: true,
        mensaje: true,
        estado: true,
        createdAt: true,
        publicacion: { select: { id: true, titulo: true } },
      },
    }),
  ]);

  return { resultados, total };
}

/** Conteos por estado para la publicación elegida; no dependen de la página visible. */
export function contarMensajesPorEstadoDelVendedor(
  usuarioId: string,
  publicacionId?: string,
) {
  return prisma.mensajeContacto.groupBy({
    by: ["estado"],
    where: {
      publicacion: {
        usuarioId,
        ...(publicacionId ? { id: publicacionId } : {}),
      },
    },
    _count: { _all: true },
  });
}

/** Mutación acotada por dueño en SQL; un id válido ajeno no cambia ninguna fila. */
export async function actualizarEstadoMensajeDelVendedor(
  usuarioId: string,
  mensajeId: string,
  estado: EstadoMensajeContacto,
) {
  const { count } = await prisma.mensajeContacto.updateMany({
    where: { id: mensajeId, publicacion: { usuarioId } },
    data: { estado },
  });
  return count === 1;
}

/** Opciones de filtro limitadas a publicaciones del usuario autenticado. */
export function listarPublicacionesConConsultasDelVendedor(usuarioId: string) {
  return prisma.publicacion.findMany({
    where: { usuarioId, mensajes: { some: {} } },
    orderBy: [{ titulo: "asc" }, { id: "asc" }],
    select: { id: true, titulo: true },
  });
}
