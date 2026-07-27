import "server-only";
import { Redis } from "@upstash/redis";

import { env, rateLimitHabilitado } from "@/shared/lib/serverEnv";

// Deduplicación del contador de visitas (6.4). Comparte la infraestructura de Upstash con los
// rate limiters, pero vive aparte porque no es un límite: es una marca de "esta visita ya la
// conté", y mezclarlo con los limitadores haría que subir un límite cambie el contador.

const redis = rateLimitHabilitado
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/** Media hora: suficiente para que refrescar la página no cuente, corto para no perder visitas reales. */
const VENTANA_SEGUNDOS = 30 * 60;

/**
 * ¿Corresponde contar esta visita?
 *
 * Sin deduplicar, el propio vendedor refrescando su publicación le infla el contador, y el
 * número que ve en el dashboard deja de significar interés real.
 *
 * Sin Upstash configurado devuelve `true` y se cuenta todo: en desarrollo importa más que la
 * app arranque sin dar de alta el servicio, y un contador de visitas inflado en local no le
 * hace daño a nadie. Mismo criterio que los rate limiters.
 */
export async function esVisitaNueva(
  publicacionId: string,
  visitante: string,
): Promise<boolean> {
  if (!redis) return true;

  try {
    // NX + EX en una sola operación: la marca se crea solo si no existía, así que dos pedidos
    // simultáneos del mismo visitante no pueden contar dos veces.
    const resultado = await redis.set(`vista:${publicacionId}:${visitante}`, 1, {
      nx: true,
      ex: VENTANA_SEGUNDOS,
    });
    return resultado === "OK";
  } catch (error) {
    // Que Redis esté caído no puede impedir ver un inmueble. Ante la duda se cuenta: el peor
    // caso es un contador un poco alto, no una página rota.
    console.error("No se pudo deduplicar la visita:", error);
    return true;
  }
}
