import "server-only";
import type { ReactElement } from "react";
import nodemailer, { type Transporter } from "nodemailer";
import { render } from "@react-email/render";
import { Resend } from "resend";

import { emailHabilitado, env } from "@/shared/lib/serverEnv";

// Único punto del proyecto que habla con los proveedores de email (capa de infraestructura,
// 4.2). Las features piden "mandá este email" y no saben con qué proveedor se manda.

const resend =
  emailHabilitado && env.EMAIL_PROVIDER === "resend"
    ? new Resend(env.RESEND_API_KEY!)
    : null;

// Vercel invoca funciones Node serverless: conservar un transporte sin pooling permite
// reutilizarlo dentro de una instancia caliente sin mantener sockets entre invocaciones.
const smtp: Transporter | null =
  emailHabilitado && env.EMAIL_PROVIDER === "smtp"
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        requireTLS: env.SMTP_PORT === 587,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

/** Sin proveedor, el link se registra solo en desarrollo/test para completar el flujo a mano.
 * Producción nunca registra datos de destinatarios, links privados o credenciales. */
export const emailDeAuthDisponible = emailHabilitado || env.NODE_ENV !== "production";

export type ResultadoEnvio =
  { enviado: true } | { enviado: false; motivo: "sin-configurar" | "error-proveedor" };

type ParametrosEnvio = {
  para: string;
  asunto: string;
  cuerpo: ReactElement;
  /** URL del email; solo se registra en desarrollo/test si falta configurar el proveedor. */
  urlDeFallback: string;
};

export async function enviarEmail({
  para,
  asunto,
  cuerpo,
  urlDeFallback,
}: ParametrosEnvio): Promise<ResultadoEnvio> {
  if (!emailHabilitado) {
    if (env.NODE_ENV === "production") {
      console.error("[email] Proveedor seleccionado sin configurar por completo.");
      return { enviado: false, motivo: "sin-configurar" };
    }
    console.warn(
      [
        "",
        "──────────────────────────────────────────────────────────────",
        " El proveedor de email no está configurado: no se envió el correo.",
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
    if (env.EMAIL_PROVIDER === "resend" && resend) {
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
    } else if (env.EMAIL_PROVIDER === "smtp" && smtp) {
      const html = await render(cuerpo);
      const text = await render(cuerpo, { plainText: true });
      await smtp.sendMail({
        from: env.EMAIL_FROM!,
        to: para,
        subject: asunto,
        html,
        text,
      });
    } else {
      // Protege frente a una configuración internamente inconsistente sin revelar detalles.
      console.error("[email] No se pudo inicializar el proveedor seleccionado.");
      return { enviado: false, motivo: "sin-configurar" };
    }
  } catch {
    // Una caída de red tampoco debe deshacer un registro ya persistido. Los errores SMTP pueden
    // incluir host, usuario, destinatario o contenido; nunca se registran.
    console.error("[email] Falló el envío con el proveedor seleccionado.");
    return { enviado: false, motivo: "error-proveedor" };
  }

  return { enviado: true };
}
