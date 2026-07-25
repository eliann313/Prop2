"use server";

import { schemaRestablecerPassword } from "@/features/auth/authSchemas";
import { hashearPassword } from "@/features/auth/services/passwordService";
import {
  estaVencido,
  hashearToken,
} from "@/features/auth/services/tokenVerificacionService";
import {
  buscarTokenPorHash,
  marcarTokenUsado,
} from "@/features/auth/tokenVerificacionRepository";
import {
  actualizarPasswordHash,
  marcarEmailVerificado,
} from "@/features/usuarios/usuarioRepository";
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
    registro.usadoEn !== null ||
    estaVencido(registro.expiraEn);

  if (invalido) {
    return fallo(
      "El link no es válido o venció. Pedí uno nuevo desde “Olvidé mi contraseña”.",
    );
  }

  // Consumir el token primero: si dos requests llegan juntas, solo una cambia la contraseña.
  const loConsumio = await marcarTokenUsado(registro.id);
  if (!loConsumio) {
    return fallo("Ese link ya se usó. Pedí uno nuevo.");
  }

  await actualizarPasswordHash(registro.usuario.id, await hashearPassword(password));

  // Haber recibido y abierto el link prueba que controla la casilla, que es exactamente lo que
  // verifica el flujo de confirmación de email. Marcarlo verificado acá evita el callejón sin
  // salida de quien se registró, nunca confirmó, y llega por "olvidé mi contraseña": cambiaría
  // la contraseña y seguiría sin poder entrar.
  if (!registro.usuario.emailVerified) {
    await marcarEmailVerificado(registro.usuario.id);
  }

  return exito("Contraseña actualizada. Ya podés iniciar sesión.");
}
