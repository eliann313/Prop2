"use server";

import { schemaReenviarVerificacion } from "@/features/auth/authSchemas";
import { emitirYEnviarVerificacionEmail } from "@/features/auth/emisionDeTokens";
import { buscarUsuarioPorEmail } from "@/features/usuarios/usuarioRepository";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const MENSAJE_NEUTRO =
  "Si ese email tiene una cuenta sin confirmar, te acabamos de enviar un nuevo link.";

/** Reenvía el link de verificación (rama "opción de reenviar email" del flujo de 5.1). */
export async function reenviarVerificacion(entrada: unknown): Promise<ResultadoAccion> {
  const validacion = schemaReenviarVerificacion.safeParse(entrada);
  if (!validacion.success) {
    return fallo("Revisá el email.", validacion.error.flatten().fieldErrors);
  }

  const { email } = validacion.data;

  // Este endpoint manda emails: sin límite, sirve para bombardear la casilla de un tercero y
  // para agotar la cuota gratuita de Resend (8.4, 8.10).
  const limite = await consumirIntento("emailTransaccional", email);
  if (!limite.permitido) {
    return fallo("Ya pediste varios links. Esperá unos minutos antes de reintentar.");
  }

  const usuario = await buscarUsuarioPorEmail(email);

  // Mismo mensaje exista o no la cuenta, y esté o no verificada: cualquier diferencia acá
  // vuelve el formulario un enumerador de emails registrados.
  if (usuario && !usuario.emailVerified) {
    await emitirYEnviarVerificacionEmail({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.name,
    });
  }

  return exito(MENSAJE_NEUTRO);
}
