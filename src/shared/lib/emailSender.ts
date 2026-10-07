import type { ReactElement } from "react";
import { Resend } from "resend";

import { emailHabilitado, env } from "@/shared/lib/serverEnv";

// Único punto del proyecto que habla con Resend (capa de infraestructura, 4.2). Las features
// piden "mandá este email" y no saben con qué proveedor se manda.

const resend = emailHabilitado ? new Resend(env.RESEND_API_KEY) : null;

/** El fallback de consola sirve para desarrollo; nunca reemplaza un email en producción. */
export const emailDeAuthDisponible = emailHabilitado || env.NODE_ENV !== "production";

export type ResultadoEnvio =
  { enviado: true } | { enviado: false; motivo: "sin-configurar" | "error-proveedor" };

type ParametrosEnvio = {
  para: string;
  asunto: string;
  cuerpo: ReactElement;
  /**
   * URL que el email invita a abrir. Cuando Resend no está configurado se imprime en la
   * consola del servidor, para poder completar el flujo en desarrollo sin dar de alta el
   * servicio. Es lo que hace que el criterio de finalización de la Etapa 1 (registrarse,
   * verificar, volver a entrar) sea verificable con solo la base configurada.
   */
  urlDeFallback: string;
};

export async function enviarEmail({
  para,
  asunto,
  cuerpo,
  urlDeFallback,
}: ParametrosEnvio): Promise<ResultadoEnvio> {
  if (!resend) {
    if (env.NODE_ENV === "production") {
      console.error(
        "[email] Servicio sin configurar. Revisar RESEND_API_KEY y EMAIL_FROM.",
      );
      return { enviado: false, motivo: "sin-configurar" };
    }
    console.warn(
      [
        "",
        "──────────────────────────────────────────────────────────────",
        " RESEND_API_KEY no está configurada: el email no se envió.",
        ` Para: ${para}`,
        ` Asunto: ${asunto}`,
        ` Link: ${urlDeFallback}`,
        "──────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { enviado: false, motivo: "sin-configurar" };
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM!,
      to: para,
      subject: asunto,
      react: cuerpo,
    });

    if (error) {
      // No se imprime el payload del proveedor: puede contener destinatarios o links privados.
      console.error("[email] El proveedor rechazó el envío.");
      return { enviado: false, motivo: "error-proveedor" };
    }
  } catch {
    // Una caída de red tampoco debe deshacer un registro ya persistido.
    console.error("[email] No se pudo contactar al proveedor.");
    return { enviado: false, motivo: "error-proveedor" };
  }

  return { enviado: true };
}
