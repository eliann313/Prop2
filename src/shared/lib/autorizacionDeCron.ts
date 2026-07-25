import "server-only";

import { timingSafeEqual } from "node:crypto";

import { env } from "@/shared/lib/serverEnv";

/**
 * Valida que una request venga del scheduler de Vercel y no de cualquiera.
 *
 * Vercel manda `Authorization: Bearer <CRON_SECRET>` al invocar un cron. Sin esta comprobación
 * el endpoint queda público, y uno que borra archivos siendo público es un botón de "vaciame la
 * cuenta de Cloudinary" al alcance de cualquiera que adivine la URL.
 */
export function cronAutorizado(request: Request): boolean {
  const secreto = env.CRON_SECRET;

  // Sin secreto configurado se rechaza TODO. Es deliberado: la alternativa —dejar pasar
  // cuando no hay secreto, "porque en local es cómodo"— publica el endpoint en cuanto alguien
  // despliega sin configurarlo.
  if (!secreto) return false;

  const recibido = request.headers.get("authorization");
  if (!recibido) return false;

  return comparacionSegura(recibido, `Bearer ${secreto}`);
}

/**
 * Compara en tiempo constante.
 *
 * Un `===` corta apenas encuentra el primer byte distinto, así que el tiempo de respuesta
 * filtra cuántos caracteres del prefijo se acertaron y permite reconstruir el secreto de a un
 * byte. Es un ataque poco práctico sobre la red, pero evitarlo cuesta tres líneas.
 */
function comparacionSegura(recibido: string, esperado: string): boolean {
  const bufferRecibido = Buffer.from(recibido);
  const bufferEsperado = Buffer.from(esperado);

  // timingSafeEqual exige longitudes iguales; comparar los largos primero no filtra nada útil
  // que el atacante no pueda medir igual por el tamaño de lo que envía.
  if (bufferRecibido.length !== bufferEsperado.length) return false;

  return timingSafeEqual(bufferRecibido, bufferEsperado);
}
