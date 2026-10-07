"use server";

import {
  MENSAJE_PASSWORD_FILTRADA,
  schemaRestablecerPassword,
} from "@/features/auth/authSchemas";
import { hashearPassword } from "@/features/auth/services/passwordService";
import {
  estaVencido,
  hashearToken,
} from "@/features/auth/services/tokenVerificacionService";
import {
  buscarTokenPorHash,
  restablecerPasswordConToken,
} from "@/features/auth/tokenVerificacionRepository";
import { estaEnFiltraciones } from "@/shared/lib/passwordsFiltradas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/** Última rama del flujo de 5.1: el usuario define una contraseña nueva con el token del email. */
export async function restablecerPassword(entrada: unknown): Promise<ResultadoAccion> {
  const validacion = schemaRestablecerPassword.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Revisá los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const { token, password } = validacion.data;

  const registro = await buscarTokenPorHash(hashearToken(token));

  const invalido =
    !registro ||
    registro.tipo !== "recuperacion_password" ||
    registro.usuario.estado !== "activo" ||
    registro.usadoEn !== null ||
    estaVencido(registro.expiraEn);

  if (invalido) {
    return fallo(
      "El link no es válido o venció. Pedí uno nuevo desde “Olvidé mi contraseña”.",
    );
  }

  // El chequeo va ANTES de consumir el token, no después: el token es de un solo uso, así que
  // rechazar la contraseña una vez gastado dejaría a la persona con el link quemado y obligada
  // a pedir otro por email solo por haber elegido mal la contraseña.
  if (await estaEnFiltraciones(password)) {
    return fallo(MENSAJE_PASSWORD_FILTRADA, {
      password: [MENSAJE_PASSWORD_FILTRADA],
    });
  }

  const actualizado = await restablecerPasswordConToken({
    tokenId: registro.id,
    usuarioId: registro.usuario.id,
    passwordHash: await hashearPassword(password),
    emailVerificadoEn: registro.usuario.emailVerified,
  });
  if (!actualizado) {
    return fallo(
      "El link no es válido o venció. Pedí uno nuevo desde “Olvidé mi contraseña”.",
    );
  }

  return exito("Contraseña actualizada. Ya podés iniciar sesión.");
}
