import { env } from "@/shared/lib/serverEnv";

/**
 * URL base pública de la app, para armar los links absolutos que van en los emails.
 *
 * Orden de resolución:
 *  1. AUTH_URL — la que se configura explícitamente (en producción es el dominio real).
 *  2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — las inyecta Vercel solo. La segunda es la
 *     URL única del deployment, que es lo correcto en un preview deployment de PR: el link del
 *     email tiene que apuntar al mismo preview donde se hizo el registro, no a producción.
 *  3. localhost, para desarrollo.
 */
function resolverUrlBase(): string {
  if (env.AUTH_URL) return env.AUTH_URL;

  const produccionVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const deploymentVercel = process.env.VERCEL_URL;
  if (process.env.VERCEL_ENV === "production" && produccionVercel) {
    return `https://${produccionVercel}`;
  }
  if (deploymentVercel) return `https://${deploymentVercel}`;

  return "http://localhost:3000";
}

export function urlAbsoluta(ruta: string, parametros?: Record<string, string>): string {
  const url = new URL(ruta, resolverUrlBase());
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    url.searchParams.set(clave, valor);
  }
  return url.toString();
}
