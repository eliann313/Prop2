import { CredentialsSignin } from "next-auth";

/**
 * Errores de login con un código estable.
 *
 * Auth.js no propaga el `message` de una excepción lanzada dentro de `authorize` hasta el
 * cliente (a propósito: evita filtrar detalles del servidor). Lo que sí propaga es el `code`
 * de una subclase de `CredentialsSignin`, que viaja en la query del redirect. Por eso cada
 * motivo que el usuario SÍ tiene que poder distinguir necesita su propia clase con su código.
 *
 * Ese código termina en la URL, así que no puede insinuar nada sensible. Los tres de acá son
 * seguros: solo se llega a "email sin verificar" o "cuenta suspendida" después de haber
 * validado la contraseña correcta, así que no sirven para enumerar cuentas.
 */

export class CredencialesInvalidas extends CredentialsSignin {
  code = "credenciales_invalidas";
}

export class EmailSinVerificar extends CredentialsSignin {
  code = "email_sin_verificar";
}

export class CuentaSuspendida extends CredentialsSignin {
  code = "cuenta_suspendida";
}

export class DemasiadosIntentos extends CredentialsSignin {
  code = "demasiados_intentos";
}

const MENSAJES: Record<string, string> = {
  credenciales_invalidas: "Email o contraseña incorrectos.",
  email_sin_verificar:
    "Todavía no confirmaste tu email. Revisá tu casilla o pedí un nuevo link.",
  cuenta_suspendida: "Esta cuenta está suspendida. Escribinos si creés que es un error.",
  demasiados_intentos:
    "Demasiados intentos fallidos. Esperá unos minutos y probá de nuevo.",
};

export function mensajeParaCodigo(codigo: string | undefined): string {
  return (
    (codigo && MENSAJES[codigo]) ??
    "No pudimos iniciar tu sesión. Probá de nuevo en unos minutos."
  );
}

/** `true` si el motivo del fallo es que falta verificar el email (habilita el botón de reenvío). */
export function esEmailSinVerificar(codigo: string | undefined): boolean {
  return codigo === "email_sin_verificar";
}
