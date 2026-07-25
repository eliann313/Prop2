"use server";

import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/features/auth/authJsInstance";
import { RUTAS } from "@/shared/rutas";
import { schemaLogin } from "@/features/auth/authSchemas";
import { mensajeParaCodigo } from "@/features/auth/erroresDeLogin";
import { fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/**
 * Solo se aceptan destinos internos: si el `volverA` viniera de una URL manipulada
 * (`?volverA=https://sitio-falso`), un login legítimo terminaría enviando al usuario a un
 * dominio ajeno con aspecto de haber sido validado por nosotros — un open redirect clásico.
 */
function destinoSeguro(volverA: string | undefined): string {
  if (!volverA) return RUTAS.dashboard;
  // Tiene que empezar con una sola barra: "//otro-dominio.com" es una URL protocol-relative
  // que el navegador resuelve como externa.
  if (!volverA.startsWith("/") || volverA.startsWith("//")) return RUTAS.dashboard;
  return volverA;
}

/** El código del motivo viaja en el resultado para que la UI decida qué salida ofrecer. */
export type ResultadoLogin = ResultadoAccion<{ codigo?: string }>;

export async function iniciarSesionConCredenciales(
  entrada: unknown,
  volverA?: string,
): Promise<ResultadoLogin> {
  const validacion = schemaLogin.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Revisá los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const { email, password } = validacion.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: destinoSeguro(volverA),
    });
  } catch (error) {
    // signIn señaliza el redirect exitoso lanzando una excepción especial de Next. Si se
    // capturara acá, el login "funcionaría" pero el usuario nunca navegaría a destino, así que
    // se re-lanza todo lo que no sea un error de autenticación.
    if (error instanceof CredentialsSignin) {
      return { ...fallo(mensajeParaCodigo(error.code)), datos: { codigo: error.code } };
    }
    if (error instanceof AuthError) {
      return fallo(mensajeParaCodigo(undefined));
    }
    throw error;
  }

  // Inalcanzable: signIn siempre redirige o lanza. Está para que el tipo de retorno cierre.
  return fallo(mensajeParaCodigo(undefined));
}

export async function iniciarSesionConGoogle(volverA?: string): Promise<void> {
  await signIn("google", { redirectTo: destinoSeguro(volverA) });
}
