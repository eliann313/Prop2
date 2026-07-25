"use server";

import { schemaRegistro } from "@/features/auth/authSchemas";
import { emitirYEnviarVerificacionEmail } from "@/features/auth/emisionDeTokens";
import { hashearPassword } from "@/features/auth/services/passwordService";
import {
  buscarUsuarioPorEmail,
  crearUsuarioConCredenciales,
} from "@/features/usuarios/usuarioRepository";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/**
 * Registro por credenciales (flujo de 5.1).
 *
 * La action es delgada a propósito (14.3): valida con Zod, llama a servicios/repositorios y
 * devuelve. Las reglas —costo del hash, vigencia del token— viven en services/.
 */
export async function registrarUsuario(entrada: unknown): Promise<ResultadoAccion> {
  // Se revalida en el servidor con el MISMO schema que usó el formulario: la validación del
  // cliente es UX, no seguridad — un POST directo la saltea entera (8.5).
  const validacion = schemaRegistro.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Revisá los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const { nombre, email, password } = validacion.data;

  const limite = await consumirIntento("registro", email);
  if (!limite.permitido) {
    return fallo("Demasiados intentos. Probá de nuevo en unos minutos.");
  }

  const yaExiste = await buscarUsuarioPorEmail(email);
  if (yaExiste) {
    // Respuesta deliberadamente idéntica a la del registro exitoso: si acá se contestara
    // "ese email ya está registrado", el formulario de registro se volvería un oráculo para
    // averiguar qué emails tienen cuenta (8.17). Quien ya tiene cuenta y llega hasta acá va a
    // encontrar el camino por "olvidé mi contraseña".
    return exito(
      "Listo. Si el email es válido, te llega un mensaje para confirmar tu cuenta.",
    );
  }

  const usuario = await crearUsuarioConCredenciales({
    nombre,
    email,
    passwordHash: await hashearPassword(password),
  });

  // El envío puede fallar sin que el registro falle: el usuario ya existe en la base y puede
  // pedir el reenvío del link. Por eso no se propaga el error (ver emailSender).
  await emitirYEnviarVerificacionEmail({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.name,
  });

  return exito(
    "Listo. Si el email es válido, te llega un mensaje para confirmar tu cuenta.",
  );
}
