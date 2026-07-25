import { createHash, randomBytes } from "node:crypto";

// Capa de dominio (4.2): generación y hasheo de tokens. Sin Prisma, sin HTTP, testeable sola.

/** 24 horas para verificar el email, 1 hora para resetear la contraseña (5.1). */
export const VIGENCIA_MS = {
  verificacion_email: 24 * 60 * 60 * 1000,
  recuperacion_password: 60 * 60 * 1000,
} as const;

export type TokenGenerado = {
  /** Va en el link del email. No se persiste nunca. */
  tokenEnClaro: string;
  /** Lo único que se guarda en la base. */
  tokenHash: string;
  expiraEn: Date;
};

/**
 * 32 bytes de `randomBytes` y no `Math.random` ni un UUID v4: hace falta un generador
 * criptográficamente seguro, porque adivinar un token de reseteo es tomar la cuenta. En
 * base64url para que entre en una URL sin escapes.
 */
export function generarToken(
  tipo: keyof typeof VIGENCIA_MS,
  ahora: Date = new Date(),
): TokenGenerado {
  const tokenEnClaro = randomBytes(32).toString("base64url");
  return {
    tokenEnClaro,
    tokenHash: hashearToken(tokenEnClaro),
    expiraEn: new Date(ahora.getTime() + VIGENCIA_MS[tipo]),
  };
}

/**
 * SHA-256 y no bcrypt: un token de 32 bytes aleatorios no es adivinable por fuerza bruta, así
 * que no necesita un hash lento (que además obligaría a comparar contra todas las filas en
 * vez de buscar por índice). Lo que se busca acá es que un dump de la base no contenga tokens
 * usables, y para eso alcanza un hash rápido de una preimagen impredecible.
 */
export function hashearToken(tokenEnClaro: string): string {
  return createHash("sha256").update(tokenEnClaro).digest("hex");
}

export function estaVencido(expiraEn: Date, ahora: Date = new Date()): boolean {
  return expiraEn.getTime() <= ahora.getTime();
}
