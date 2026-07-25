"use server";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { firmarSubida, type FirmaDeSubida } from "@/shared/lib/cloudinaryClient";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";
import { subidaDeImagenesHabilitada } from "@/shared/lib/serverEnv";

/**
 * Entrega una firma para que el navegador suba una imagen DIRECTO a Cloudinary.
 *
 * Es el único punto donde se decide quién puede subir. Exige sesión y está rate-limitado: una
 * firma sin control es, en la práctica, acceso de escritura a la cuenta de Cloudinary del
 * proyecto, y el free tier se agota rápido.
 */
export async function firmarSubidaDeImagen(): Promise<ResultadoAccion<FirmaDeSubida>> {
  const usuario = await requerirUsuario(RUTAS.dashboard);

  if (!subidaDeImagenesHabilitada) {
    return fallo("La subida de imágenes no está configurada en este entorno.");
  }

  const limite = await consumirIntento("emailTransaccional", `subida:${usuario.id}`);
  if (!limite.permitido) {
    return fallo("Subiste muchas fotos seguidas. Esperá unos minutos.");
  }

  return exito(undefined, firmarSubida());
}
