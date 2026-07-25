import { RUTAS } from "@/shared/rutas";
import { EmailRecuperacionPassword } from "@/features/auth/emails/EmailRecuperacionPassword";
import { EmailVerificacion } from "@/features/auth/emails/EmailVerificacion";
import { generarToken } from "@/features/auth/services/tokenVerificacionService";
import {
  crearToken,
  invalidarTokensVigentes,
} from "@/features/auth/tokenVerificacionRepository";
import { enviarEmail } from "@/shared/lib/emailSender";
import { urlAbsoluta } from "@/shared/lib/urlBase";

// Orquestación compartida entre varias actions (registrar y reenviar verificación emiten el
// mismo tipo de token). Vive en la raíz de la feature y no en services/ porque toca
// infraestructura —repositorio y envío de emails— y los services son dominio puro (4.2).

type Destinatario = { id: string; email: string; nombre: string | null };

async function emitir(
  usuario: Destinatario,
  tipo: "verificacion_email" | "recuperacion_password",
) {
  // Se invalidan los tokens vigentes antes de emitir el nuevo: si alguien pide tres links,
  // solo el último debe funcionar (ver tokenVerificacionRepository).
  await invalidarTokensVigentes(usuario.id, tipo);

  const { tokenEnClaro, tokenHash, expiraEn } = generarToken(tipo);
  await crearToken({ usuarioId: usuario.id, tokenHash, tipo, expiraEn });

  return tokenEnClaro;
}

export async function emitirYEnviarVerificacionEmail(usuario: Destinatario) {
  const token = await emitir(usuario, "verificacion_email");
  const url = urlAbsoluta(RUTAS.verificarEmail, { token });

  return enviarEmail({
    para: usuario.email,
    asunto: "Confirmá tu email",
    cuerpo: EmailVerificacion({
      nombre: usuario.nombre ?? "",
      urlVerificacion: url,
    }),
    urlDeFallback: url,
  });
}

export async function emitirYEnviarRecuperacionPassword(usuario: Destinatario) {
  const token = await emitir(usuario, "recuperacion_password");
  const url = urlAbsoluta(RUTAS.restablecerPassword, { token });

  return enviarEmail({
    para: usuario.email,
    asunto: "Restablecé tu contraseña",
    cuerpo: EmailRecuperacionPassword({
      nombre: usuario.nombre ?? "",
      urlRestablecer: url,
    }),
    urlDeFallback: url,
  });
}
