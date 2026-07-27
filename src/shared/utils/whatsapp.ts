// Link de WhatsApp. Va en shared/ desde el arranque porque lo usan el detalle (6.4) y la
// feature de contacto (6.6), y es una función pura: no habla con WhatsApp, arma una URL.

/**
 * Deja solo los dígitos y antepone el código de país argentino si falta.
 *
 * Los teléfonos se cargan a mano, así que llegan como "11 2345-6789", "(011) 2345 6789" o
 * "+54 9 11 2345 6789". `wa.me` acepta únicamente dígitos: cualquier espacio o guion lo
 * convierte en un link que abre WhatsApp con un número inválido.
 */
export function normalizarTelefono(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 8) return null;

  if (digitos.startsWith("54")) return digitos;
  // Un 0 inicial es el prefijo de larga distancia nacional y no va en formato internacional.
  return `54${digitos.replace(/^0/, "")}`;
}

/**
 * URL de wa.me con el mensaje precargado (6.6).
 *
 * Devuelve null si el número no sirve: es preferible no mostrar el botón a mostrar uno que
 * abre WhatsApp con un error.
 */
export function linkDeWhatsapp(
  telefono: string | null,
  titulo: string,
  urlDeLaPublicacion: string,
): string | null {
  if (!telefono) return null;

  const numero = normalizarTelefono(telefono);
  if (!numero) return null;

  const mensaje = `Hola, me interesa "${titulo}". La vi en Prop²: ${urlDeLaPublicacion}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
