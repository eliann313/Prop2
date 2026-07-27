import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { rateLimitHabilitado, env } from "@/shared/lib/serverEnv";

// Rate limiting de los endpoints sensibles de auth (8.4). Vive en shared/lib porque es
// infraestructura y lo van a usar varias features (auth ahora, contacto e IA más adelante).

const redis = rateLimitHabilitado
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function crearLimitador(
  nombre: string,
  intentos: number,
  ventana: `${number} ${"s" | "m" | "h"}`,
) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    // Sliding window y no fixed window: con ventana fija, un atacante que manda el cupo al
    // final de una ventana y al principio de la siguiente duplica los intentos efectivos.
    limiter: Ratelimit.slidingWindow(intentos, ventana),
    prefix: `ratelimit:${nombre}`,
    analytics: false,
  });
}

const limitadores = {
  // El más ajustado: es el que frena fuerza bruta y credential stuffing.
  login: crearLimitador("login", 5, "1 m"),
  registro: crearLimitador("registro", 3, "10 m"),
  // Reenvío de verificación y reseteo mandan emails: el límite protege la cuota de Resend
  // además de la cuenta del usuario.
  emailTransaccional: crearLimitador("email-transaccional", 3, "15 m"),
  // Contacto: más holgado que los de auth porque consultar por varios inmuebles seguidos es
  // comportamiento normal de alguien buscando casa. Igual frena el envío masivo, que acá
  // además gasta cuota de Resend y le llena la casilla a los vendedores (6.6).
  contacto: crearLimitador("contacto", 5, "10 m"),
  // Generación con IA (7.3): la cuota del free tier es del proyecto entero, así que un solo
  // vendedor generando en loop se la gasta para todos. Diez por hora alcanza de sobra para
  // publicar varios inmuebles probando un par de versiones de cada descripción.
  ia: crearLimitador("ia", 10, "1 h"),
} as const;

export type NombreLimitador = keyof typeof limitadores;

export type ResultadoRateLimit = {
  permitido: boolean;
  /** Segundos hasta que se libere un intento. 0 cuando está permitido. */
  reintentarEnSegundos: number;
};

/**
 * Consume un intento del limitador indicado.
 *
 * Si Upstash no está configurado devuelve `permitido: true`: en desarrollo se prioriza poder
 * correr la app sin dar de alta el servicio. En producción las variables SÍ tienen que estar
 * — el arranque lo advierte por consola (ver más abajo) y la tarjeta de Etapa 5 lo cubre
 * como requisito de release.
 */
export async function consumirIntento(
  nombre: NombreLimitador,
  identificador: string,
): Promise<ResultadoRateLimit> {
  const limitador = limitadores[nombre];
  if (!limitador) return { permitido: true, reintentarEnSegundos: 0 };

  try {
    const { success, reset } = await limitador.limit(identificador);
    return {
      permitido: success,
      reintentarEnSegundos: success
        ? 0
        : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    // Si Upstash falla, se DEJA PASAR. Es deliberado, y la alternativa es peor: cortar el
    // registro y el login porque un servicio auxiliar no contesta convierte una caída de
    // Upstash en una caída de la app entera. El límite existe para frenar abuso, no para ser
    // un requisito de disponibilidad del login.
    //
    // Esto no estaba y se pagó caro: una credencial mal cargada en Vercel devolvía WRONGPASS,
    // la excepción subía hasta la Server Action y el registro contestaba 500 — con un error
    // ofuscado en producción, que es la peor combinación para diagnosticar.
    //
    // Se loguea con nivel error a propósito: quedarse sin rate limiting es una degradación
    // real de seguridad y tiene que verse en los logs, no pasar en silencio.
    console.error(
      `[ratelimit] ${nombre} no pudo consultarse; se permite el intento. ` +
        `Revisá UPSTASH_REDIS_REST_URL/TOKEN.`,
      error instanceof Error ? error.message : error,
    );
    return { permitido: true, reintentarEnSegundos: 0 };
  }
}

// El aviso importa en el servidor corriendo, no durante `next build`: en el build no hay
// requests que limitar, y además el mensaje se repetiría una vez por worker de compilación.
if (
  !rateLimitHabilitado &&
  env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  console.warn(
    "UPSTASH_REDIS_REST_URL/TOKEN no están configuradas en producción: " +
      "el rate limiting de login, registro y emails está INACTIVO.",
  );
}
