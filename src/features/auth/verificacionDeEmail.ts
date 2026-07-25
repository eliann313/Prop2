import {
  estaVencido,
  hashearToken,
} from "@/features/auth/services/tokenVerificacionService";
import {
  buscarTokenPorHash,
  marcarTokenUsado,
} from "@/features/auth/tokenVerificacionRepository";
import { marcarEmailVerificado } from "@/features/usuarios/usuarioRepository";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

// A diferencia del resto de los flujos de auth, este NO es una Server Action: lo invoca la
// página /verificar-email durante su render en el servidor, cuando el usuario abre el link del
// email. Marcarlo "use server" lo publicaría como endpoint invocable desde el cliente sin que
// nadie lo necesite — superficie de ataque gratis.

export type MotivoFalloVerificacion = "invalido" | "vencido" | "ya-usado";

export async function verificarEmail(
  tokenEnClaro: string,
): Promise<ResultadoAccion<{ motivo?: MotivoFalloVerificacion }>> {
  if (!tokenEnClaro) {
    return { ...fallo("El link no es válido."), datos: { motivo: "invalido" } };
  }

  // Se busca por hash: la base nunca tuvo el token en claro (ver el schema).
  const registro = await buscarTokenPorHash(hashearToken(tokenEnClaro));

  if (!registro || registro.tipo !== "verificacion_email") {
    return { ...fallo("El link no es válido."), datos: { motivo: "invalido" } };
  }

  if (registro.usadoEn) {
    // Caso benigno y frecuente: los escáneres de links de algunos clientes de correo abren la
    // URL antes que la persona. Si el token ya se consumió Y el email quedó verificado, el
    // resultado que el usuario esperaba ya se cumplió — mostrarlo como error solo confundiría.
    if (registro.usuario.emailVerified) {
      return exito("Tu email ya estaba confirmado. Podés iniciar sesión.");
    }
    return {
      ...fallo("Ese link ya se usó. Pedí uno nuevo."),
      datos: { motivo: "ya-usado" },
    };
  }

  if (estaVencido(registro.expiraEn)) {
    return {
      ...fallo("El link venció. Pedí uno nuevo."),
      datos: { motivo: "vencido" },
    };
  }

  // Se marca usado ANTES de verificar el email, y solo se sigue si el update ganó la carrera:
  // así dos requests simultáneas con el mismo token no lo consumen las dos.
  const loConsumio = await marcarTokenUsado(registro.id);
  if (!loConsumio) {
    return {
      ...fallo("Ese link ya se usó. Pedí uno nuevo."),
      datos: { motivo: "ya-usado" },
    };
  }

  await marcarEmailVerificado(registro.usuario.id);

  return exito("Email confirmado. Ya podés iniciar sesión.");
}
