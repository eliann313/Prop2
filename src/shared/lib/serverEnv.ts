// Este módulo lee process.env y valida secretos: si alguna vez entra al bundle del cliente, el
// build tiene que fallar con un error claro en vez de romperse en el navegador. Sin este
// import, importar estas constantes desde un componente de cliente compila igual y la
// validación explota recién en runtime, tirando la hidratación con la página ya pintada — que
// es exactamente el bug que motivó separar las rutas a shared/rutas.ts.
import "server-only";
import { z } from "zod";

// Validación de las variables de entorno del servidor en un solo lugar (8.9 / 13.2).
//
// El criterio de qué es obligatorio y qué no: la app tiene que poder levantarse y dejar
// probar los flujos de auth con solo la base y el secreto de Auth.js. Google OAuth, Resend
// y Upstash son integraciones que degradan con gracia (ver los helpers de cada una), así que
// son opcionales — pedirlas de entrada obligaría a cada integrante del equipo a dar de alta
// tres servicios externos antes de poder correr `npm run dev` una sola vez.
const esquemaEnv = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  DATABASE_URL_UNPOOLED: z.string().optional(),

  // Qué driver usa Prisma para hablar con Postgres. Solo se setea en tests, donde la base es
  // un Postgres común en Docker que no entiende el protocolo de Neon (12.2). El enum es a
  // propósito: un valor mal tipeado tiene que romper el arranque, no caer en silencio al
  // adapter de Neon y dar un error de conexión indescifrable diez pasos más adelante.
  DB_DRIVER: z.enum(["neon", "pg"]).optional(),

  AUTH_SECRET: z.string().min(1, "AUTH_SECRET es obligatoria (npx auth secret)"),
  AUTH_URL: z.url().optional(),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Proveedores de IA (7.1). Los tres son opcionales y se usan en cascada: alcanza con tener
  // uno para que la generación de descripciones funcione.
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  // El orden de la cascada vive en el entorno y no en el código: si mañana Gemini cambia su
  // free tier, se reordena la prioridad desde Vercel sin volver a deployar (7.1).
  IA_PROVIDER_ORDER: z.string().optional(),

  // Autoriza los endpoints de /api/cron. Vercel la inyecta sola en producción si se declara
  // en el proyecto; en local se pone a mano para poder probar el endpoint.
  CRON_SECRET: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Las cadenas vacías del .env ('') cuentan como "no configurada": es más cómodo dejar la
// variable declarada y vacía que borrar la línea entera cada vez.
function sinVacios(entorno: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(entorno).map(([clave, valor]) => [
      clave,
      valor === "" ? undefined : valor,
    ]),
  );
}

const resultado = esquemaEnv.safeParse(sinVacios(process.env));

if (!resultado.success) {
  const detalle = resultado.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Variables de entorno inválidas o faltantes:\n${detalle}\n\nVer .env.example.`,
  );
}

export const env = resultado.data;

/** Google OAuth solo se registra como provider si están las dos credenciales. */
export const googleHabilitado = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

/** Sin API key de Resend, los emails se loguean en consola en vez de enviarse. */
export const emailHabilitado = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

/** Sin credenciales de Upstash, el rate limiting queda inactivo (permite todo). */
export const rateLimitHabilitado = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

/**
 * Con una sola API key alcanza: la cascada de 7.1 saltea los proveedores sin configurar.
 *
 * Sin ninguna, el botón de "generar descripción" ni se muestra — es preferible no ofrecer una
 * función que va a fallar siempre. La IA nunca está en el camino crítico (7.3): sin ella el
 * vendedor publica igual, escribiendo la descripción a mano.
 */
export const iaHabilitada = Boolean(
  env.GOOGLE_GENERATIVE_AI_API_KEY ?? env.GROQ_API_KEY ?? env.OPENROUTER_API_KEY,
);

/**
 * Sin credenciales de Cloudinary no se pueden subir fotos. La publicación igual se puede
 * crear y editar como borrador; lo que no se puede es pasarla a activa, porque publicar exige
 * al menos una imagen (ver publicacionService).
 */
export const subidaDeImagenesHabilitada = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
