import type { TipoToken } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2) de la feature de auth: acceso a la tabla token_verificacion.

type DatosToken = {
  usuarioId: string;
  tokenHash: string;
  tipo: TipoToken;
  expiraEn: Date;
};

export function crearToken(datos: DatosToken) {
  return prisma.tokenVerificacion.create({ data: datos, select: { id: true } });
}

/** Reemplaza los enlaces vigentes bajo el mismo lock que usa el reset de contraseña. */
export function crearTokenReemplazandoVigentes(datos: DatosToken) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "usuario" WHERE id = ${datos.usuarioId} FOR UPDATE`;
    await tx.tokenVerificacion.updateMany({
      where: { usuarioId: datos.usuarioId, tipo: datos.tipo, usadoEn: null },
      data: { usadoEn: new Date() },
    });
    return tx.tokenVerificacion.create({ data: datos, select: { id: true } });
  });
}

export function buscarTokenPorHash(tokenHash: string) {
  return prisma.tokenVerificacion.findUnique({
    where: { tokenHash },
    include: {
      usuario: {
        select: { id: true, email: true, name: true, emailVerified: true, estado: true },
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

/** Cambia la contraseña y consume los links en la misma transacción. */
export async function restablecerPasswordConToken(datos: {
  tokenId: string;
  usuarioId: string;
  passwordHash: string;
  emailVerificadoEn: Date | null;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // Serializa los resets de una misma cuenta, incluso si llegan con tokens diferentes.
    const usuarios = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "usuario"
      WHERE id = ${datos.usuarioId} AND estado = 'activo'
      FOR UPDATE
    `;
    if (usuarios.length === 0) return false;

    const ahora = new Date();
    const { count } = await tx.tokenVerificacion.updateMany({
      where: {
        id: datos.tokenId,
        usuarioId: datos.usuarioId,
        tipo: "recuperacion_password",
        usadoEn: null,
        expiraEn: { gt: ahora },
      },
      data: { usadoEn: ahora },
    });
    if (count === 0) return false;

    await tx.user.update({
      where: { id: datos.usuarioId },
      data: {
        passwordHash: datos.passwordHash,
        // Recibir el link prueba el control de la casilla, también para una cuenta sin confirmar.
        emailVerified: datos.emailVerificadoEn ?? ahora,
      },
    });
    await tx.tokenVerificacion.updateMany({
      where: { usuarioId: datos.usuarioId, tipo: "recuperacion_password", usadoEn: null },
      data: { usadoEn: ahora },
    });
    return true;
  });
}
