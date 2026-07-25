import type { TipoToken } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2) de la feature de auth: acceso a la tabla token_verificacion.

export function crearToken(datos: {
  usuarioId: string;
  tokenHash: string;
  tipo: TipoToken;
  expiraEn: Date;
}) {
  return prisma.tokenVerificacion.create({ data: datos, select: { id: true } });
}

export function buscarTokenPorHash(tokenHash: string) {
  return prisma.tokenVerificacion.findUnique({
    where: { tokenHash },
    include: {
      usuario: {
        select: { id: true, email: true, name: true, emailVerified: true },
      },
    },
  });
}

/**
 * Marca el token como usado, pero solo si todavía no lo estaba.
 *
 * El `usadoEn: null` en el where no es redundante: es lo que hace que dos requests con el
 * mismo token (doble click en el link del email, o un atacante reenviando el link) no puedan
 * consumirlo dos veces. El update devuelve 0 filas en el segundo intento y el llamador lo
 * trata como token inválido, en vez de leer-y-después-escribir, que sí tiene la carrera.
 */
export async function marcarTokenUsado(
  tokenId: string,
  cuando: Date = new Date(),
): Promise<boolean> {
  const { count } = await prisma.tokenVerificacion.updateMany({
    where: { id: tokenId, usadoEn: null },
    data: { usadoEn: cuando },
  });
  return count === 1;
}

/**
 * Invalida los tokens vigentes de un tipo para un usuario. Se llama antes de emitir uno
 * nuevo: si alguien pide tres links de reseteo, solo el último debe servir. Si no, un link
 * viejo filtrado por email sigue siendo válido durante toda su vigencia.
 */
export function invalidarTokensVigentes(
  usuarioId: string,
  tipo: TipoToken,
  cuando: Date = new Date(),
) {
  return prisma.tokenVerificacion.updateMany({
    where: { usuarioId, tipo, usadoEn: null },
    data: { usadoEn: cuando },
  });
}
