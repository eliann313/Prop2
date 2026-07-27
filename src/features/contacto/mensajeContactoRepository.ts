import type { MedioContacto } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

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

/** Los mensajes recibidos en las publicaciones del vendedor, más nuevos primero (6.6). */
export function listarMensajesDelVendedor(usuarioId: string) {
  return prisma.mensajeContacto.findMany({
    where: { publicacion: { usuarioId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombreContacto: true,
      emailContacto: true,
      telefonoContacto: true,
      mensaje: true,
      createdAt: true,
      publicacion: { select: { id: true, titulo: true } },
    },
  });
}
