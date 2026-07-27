"use server";

import { headers } from "next/headers";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { schemaConsulta } from "@/features/contacto/contactoSchemas";
import { EmailConsulta } from "@/features/contacto/emails/EmailConsulta";
import {
  buscarDestinatarioDeConsulta,
  crearMensaje,
} from "@/features/contacto/mensajeContactoRepository";
import { enviarEmail } from "@/shared/lib/emailSender";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { urlAbsoluta } from "@/shared/lib/urlBase";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/**
 * Envía una consulta al vendedor de una publicación (6.6).
 *
 * No exige sesión: pedir cuenta para preguntar por un inmueble agrega fricción real al
 * comprador (3.4). Por eso el antispam tiene que hacer el trabajo que acá no hace el login.
 */
export async function enviarConsulta(entrada: unknown): Promise<ResultadoAccion> {
  const validacion = schemaConsulta.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Revisá los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const datos = validacion.data;

  // El honeypot ya lo cubre el schema (tiene que venir vacío), pero se responde con un éxito
  // falso en vez de un error: decirle a un bot "detectamos que sos un bot" es enseñarle qué
  // corregir. Para una persona este camino es inalcanzable — el campo está oculto.
  if (datos.sitioWeb) return exito("Consulta enviada.");

  const cabeceras = await headers();
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonimo";
  const limite = await consumirIntento("contacto", ip);
  if (!limite.permitido) {
    return fallo(
      `Enviaste varias consultas seguidas. Probá de nuevo en ${Math.ceil(limite.reintentarEnSegundos / 60)} minutos.`,
    );
  }

  // El destinatario sale de la base a partir del id de la publicación, nunca del formulario:
  // si el email viniera del cliente, esto sería una máquina de mandar correo a cualquier
  // dirección con nuestro dominio y nuestra reputación de envío.
  const destino = await buscarDestinatarioDeConsulta(datos.publicacionId);
  if (!destino) return fallo("Esta publicación ya no está disponible.");

  const usuario = await obtenerUsuarioActual();

  // Se guarda ANTES de mandar el email: si Resend falla, el vendedor igual ve la consulta en
  // su panel. Al revés —mandar primero y guardar después— un error de base perdería para
  // siempre un mensaje que la persona ya dio por enviado.
  await crearMensaje({
    publicacionId: destino.id,
    usuarioId: usuario?.id ?? null,
    nombreContacto: datos.nombre,
    emailContacto: datos.email,
    telefonoContacto: datos.telefono,
    mensaje: datos.mensaje,
    medioContacto: "formulario",
  });

  const urlPublicacion = urlAbsoluta(`${RUTAS.publicaciones}/${destino.id}`);

  await enviarEmail({
    para: destino.usuario.email,
    asunto: `Consulta por ${destino.titulo}`,
    cuerpo: EmailConsulta({
      nombreVendedor: destino.usuario.name ?? "",
      tituloPublicacion: destino.titulo,
      nombreInteresado: datos.nombre,
      emailInteresado: datos.email,
      telefonoInteresado: datos.telefono,
      mensaje: datos.mensaje,
      urlPublicacion,
    }),
    urlDeFallback: urlPublicacion,
  });

  // El resultado no depende del envío del email: el mensaje ya está guardado y el vendedor lo
  // va a ver igual. Decirle "no se pudo" a quien consultó sería falso y lo haría reintentar.
  return exito("Consulta enviada. El vendedor te va a responder por email.");
}
