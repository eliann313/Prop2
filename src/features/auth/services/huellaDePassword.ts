import { createHash } from "node:crypto";

/**
 * Huella opaca para invalidar JWT cuando cambia la credencial de una cuenta.
 * El hash bcrypt nunca se guarda en la sesión: solo se usa como entrada de SHA-256.
 * Una cuenta de OAuth sin contraseña usa un marcador distinto de cualquier hash bcrypt.
 */
export function crearHuellaDePassword(
  usuarioId: string,
  passwordHash: string | null,
): string {
  const hash = createHash("sha256").update(usuarioId).update("\0");

  if (passwordHash === null) {
    hash.update("oauth-account-without-password:v1");
  } else {
    hash.update("bcrypt-password:v1\0").update(passwordHash);
  }

  return hash.digest("hex");
}

/** Un JWT anterior a la huella es legacy y deja de autenticar al revalidarse. */
export function coincideHuellaDePassword(
  huellaGuardada: string | undefined,
  huellaActual: string,
): boolean {
  return Boolean(huellaGuardada && huellaGuardada === huellaActual);
}
