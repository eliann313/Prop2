"use server";

import { schemaSolicitudRecuperacion } from "@/features/auth/authSchemas";
import { emitirYEnviarRecuperacionPassword } from "@/features/auth/emisionDeTokens";
import { buscarUsuarioPorEmail } from "@/features/usuarios/usuarioRepository";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const MENSAJE_NEUTRO =
  "Si ese email tiene una cuenta, te enviamos un link para elegir una nueva contraseña.";

/** Rama "olvidé mi contraseña" del flujo de 5.1. */
export async function solicitarRecuperacionPassword(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const validacion = schemaSolicitudRecuperacion.safeParse(entrada);
  if (!validacion.success) {
    return fallo("Revisá el email.", validacion.error.flatten().fieldErrors);
  }

  const { email } = validacion.data;

  const limite = await consumirIntento("emailTransaccional", email);
  if (!limite.permitido) {
    return fallo("Ya pediste varios links. Esperá unos minutos antes de reintentar.");
  }

  const usuario = await buscarUsuarioPorEmail(email);

  // El caso de la cuenta solo-Google (passwordHash null) igual recibe el link: poder definir
  // una contraseña es justamente lo que le permite dejar de depender de Google para entrar. Lo
  // que NO se hace es contestar distinto, que revelaría con qué método se registró cada email.
  if (usuario && usuario.estado === "activo") {
    await emitirYEnviarRecuperacionPassword({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.name,
    });
  }

  return exito(MENSAJE_NEUTRO);
}
