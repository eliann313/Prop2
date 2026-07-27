"use server";

import { z } from "zod";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { ejecutarConFallback } from "@/features/ia/cascadaDeProveedores";
import {
  construirPrompt,
  limpiarRespuesta,
} from "@/features/ia/services/promptDeDescripcion";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

// Solo los campos que el wizard ya tiene cargados cuando aparece el botón (paso 1 a 3).
const schema = z.object({
  tipoInmueble: z.string().min(1),
  operacion: z.string().min(1),
  ciudad: z.string().min(1),
  provincia: z.string().min(1),
  barrio: z.string().optional(),
  ambientes: z.coerce.number().int().positive().optional(),
  dormitorios: z.coerce.number().int().positive().optional(),
  banios: z.coerce.number().int().positive().optional(),
  superficieCubierta: z.coerce.number().positive().optional(),
  superficieTotal: z.coerce.number().positive().optional(),
  antiguedadAnios: z.coerce.number().int().min(0).optional(),
  tieneCochera: z.boolean().optional(),
  caracteristicas: z.array(z.string().max(60)).max(40).optional(),
});

/**
 * Genera una descripción sugerida para el wizard (5.4).
 *
 * Exige sesión aunque el dato no sea sensible: cada llamada gasta cuota de un free tier
 * compartido, así que tiene que haber alguien a quien limitarle el uso. Por lo mismo el rate
 * limit va por usuario y no por IP — la cuota es del proyecto, no de la conexión.
 */
export async function generarDescripcion(
  entrada: unknown,
): Promise<ResultadoAccion<{ descripcion: string }>> {
  const validacion = schema.safeParse(entrada);
  if (!validacion.success) {
    return fallo("Faltan datos del inmueble para generar la descripción.");
  }

  const usuario = await requerirUsuario();

  const limite = await consumirIntento("ia", usuario.id);
  if (!limite.permitido) {
    return fallo(
      `Generaste varias descripciones seguidas. Probá de nuevo en ${Math.ceil(limite.reintentarEnSegundos / 60)} minutos.`,
    );
  }

  const resultado = await ejecutarConFallback(construirPrompt(validacion.data));

  if (!resultado.ok) {
    // Se distingue "no hay IA configurada" de "los tres fallaron": son dos problemas
    // distintos y el segundo puede resolverse reintentando.
    return fallo(
      resultado.motivo === "sin-proveedores"
        ? "La generación con IA no está disponible en este entorno. Escribí la descripción a mano."
        : "No pudimos generar la descripción ahora. Probá de nuevo o escribila a mano.",
    );
  }

  return exito(undefined, { descripcion: limpiarRespuesta(resultado.texto) });
}
