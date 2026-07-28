/**
 * URLs legibles para el detalle de una publicación (9.1).
 *
 * La forma es `/publicaciones/<slug>-<uuid>`: el slug es para la persona y para el buscador, y
 * el UUID sigue siendo el identificador real. No se guarda nada nuevo en la base ni hay que
 * garantizar que el slug sea único, porque no es lo que identifica: si dos publicaciones se
 * llaman igual, sus URLs difieren en el UUID igual.
 *
 * La contra de esta forma es que el título es editable, así que la URL de una publicación puede
 * cambiar. Por eso `idDeRuta` acepta también el UUID pelado y cualquier slug viejo: lo único
 * que se lee de la URL es el UUID del final, y el texto de adelante es decorativo. Un link
 * compartido por WhatsApp hace seis meses sigue funcionando aunque el vendedor haya recargado
 * el título tres veces.
 */

/** 36 caracteres con guiones. Anclado al final: es lo último que aparece en la ruta. */
const UUID_AL_FINAL = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Marcas de no-espaciado: los acentos que `normalize("NFD")` deja sueltos tras separarlos de su
 * letra. Se usa la propiedad Unicode en vez de un rango de codepoints escrito a mano porque son
 * caracteres combinantes — tipeados literalmente se dibujan encima del corchete y vuelven el
 * patrón ilegible — y porque la propiedad cubre el bloque entero sin que haya que acertarle a
 * los límites.
 */
const DIACRITICOS = /\p{Mn}/gu;

/**
 * Cuántos caracteres del título entran. Google no usa la URL como señal de peso, así que una
 * URL larguísima no rankea mejor: 60 alcanza para que se entienda de qué es el aviso y evita
 * los links kilométricos que se cortan al pegarlos en un chat.
 */
const MAX_LARGO_SLUG = 60;

/**
 * Convierte un título en la parte legible de la URL.
 *
 * Se normaliza a NFD y se descartan los diacríticos, en vez de mapear los acentos con una tabla
 * a mano: la tabla siempre se queda corta —basta una "ü" o una "Ñ"— y esto lo resuelve el
 * estándar. Así "Departamento en Núñez" queda "departamento-en-nunez".
 */
export function slugificar(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(DIACRITICOS, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      // Un solo guion en cada punta: el replace de arriba ya colapsó las corridas, así que nunca
      // puede haber dos seguidos (mismo razonamiento que en scripts/crearMigracion.ts).
      .replace(/^-|-$/g, "")
      .slice(0, MAX_LARGO_SLUG)
      // El slice puede cortar justo sobre un guion y dejarlo colgando al final.
      .replace(/-$/, "")
  );
}

/** El segmento de ruta de una publicación: slug legible + UUID. */
export function rutaDePublicacion(id: string, titulo: string): string {
  const slug = slugificar(titulo);
  return slug ? `${slug}-${id}` : id;
}

/**
 * Extrae el UUID de un segmento de ruta. Devuelve null si no hay ninguno, y en ese caso quien
 * llama tiene que responder 404: si se aceptara cualquier cosa, la página terminaría haciendo
 * una consulta con basura por cada URL inventada.
 */
export function idDeRuta(segmento: string): string | null {
  const encontrado = UUID_AL_FINAL.exec(segmento);
  return encontrado ? encontrado[0].toLowerCase() : null;
}
