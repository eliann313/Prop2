import { z } from "zod";

import {
  MONEDAS,
  OPERACIONES,
  PROVINCIAS,
  TIPOS_INMUEBLE,
} from "@/shared/catalogoInmuebles";

// Los filtros de búsqueda viven en la URL y no en estado de cliente (6.3): así un link de
// búsqueda se puede compartir, el botón "atrás" del navegador funciona solo, y Google puede
// indexar una búsqueda concreta.
//
// Eso tiene una consecuencia que manda sobre todo el diseño de este archivo: la entrada es un
// string arbitrario escrito por cualquiera. `?precioMax=abc`, `?pagina=-5` o `?orden=DROP TABLE`
// son entradas esperables, no casos raros.

/**
 * Ignora el valor en vez de fallar.
 *
 * Un parámetro inválido en la URL NO puede tirar la página: alguien que edita la barra de
 * direcciones, un link viejo con un filtro que ya no existe o un bot probando cosas tienen que
 * ver resultados sin ese filtro, no un error 500. `catch` convierte cualquier fallo de
 * validación en `undefined`, que aguas abajo significa "este filtro no se aplica".
 */
const ignorarSiEsInvalido = <T extends z.ZodType>(schema: T) =>
  schema.optional().catch(undefined);

const textoCorto = (maximo: number) => z.string().trim().min(1).max(maximo);

const numeroPositivo = (maximo: number) => z.coerce.number().min(0).max(maximo);

const enteroPositivo = (maximo: number) => z.coerce.number().int().min(0).max(maximo);

/** Cómo se ordenan los resultados. Es una lista cerrada porque va directo al ORDER BY. */
export const ORDENES = ["relevancia", "precio_asc", "precio_desc", "recientes"] as const;

export type Orden = (typeof ORDENES)[number];

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  relevancia: "Más relevantes",
  precio_asc: "Menor precio",
  precio_desc: "Mayor precio",
  recientes: "Más recientes",
};

export const schemaBusqueda = z.object({
  /** Texto libre. Va contra el índice GIN de `titulo` + `descripcion`. */
  q: ignorarSiEsInvalido(textoCorto(100)),

  provincia: ignorarSiEsInvalido(z.enum(PROVINCIAS)),
  // Ciudad y barrio se comparan por igualdad exacta, no por LIKE: es lo que permite usar el
  // índice `(provincia, ciudad)`. La UI ofrece los valores que existen en la base, así que el
  // usuario no los tipea.
  ciudad: ignorarSiEsInvalido(textoCorto(80)),
  barrio: ignorarSiEsInvalido(textoCorto(80)),

  tipo: ignorarSiEsInvalido(z.enum(TIPOS_INMUEBLE)),
  operacion: ignorarSiEsInvalido(z.enum(OPERACIONES)),

  // La moneda no aparece en la lista de filtros de 6.3, pero un rango de precio sin moneda no
  // significa nada en Argentina: "hasta 150.000" son dos búsquedas completamente distintas en
  // pesos y en dólares, y sin este filtro los resultados mezclan las dos escalas.
  moneda: ignorarSiEsInvalido(z.enum(MONEDAS)),
  precioMin: ignorarSiEsInvalido(numeroPositivo(999_999_999)),
  precioMax: ignorarSiEsInvalido(numeroPositivo(999_999_999)),

  // Estos tres son mínimos, no valores exactos: quien busca "2 dormitorios" está descartando
  // los de 1, no rechazando los de 3.
  ambientes: ignorarSiEsInvalido(enteroPositivo(50)),
  dormitorios: ignorarSiEsInvalido(enteroPositivo(50)),
  banios: ignorarSiEsInvalido(enteroPositivo(30)),

  // Solo filtra cuando vale "1": un checkbox sin marcar significa "me da igual", no "sin
  // cochera". Filtrar por `false` escondería inmuebles que al usuario le sirven.
  cochera: ignorarSiEsInvalido(z.literal("1").transform(() => true)),

  superficieMin: ignorarSiEsInvalido(numeroPositivo(100_000)),
  superficieMax: ignorarSiEsInvalido(numeroPositivo(100_000)),

  orden: ignorarSiEsInvalido(z.enum(ORDENES)),
  pagina: ignorarSiEsInvalido(z.coerce.number().int().min(1).max(500)),
});

/** Lo que llega ya parseado, antes de normalizar (ver services/criteriosDeBusqueda). */
export type FiltrosDeBusqueda = z.output<typeof schemaBusqueda>;

/**
 * Los `searchParams` de Next llegan como `string | string[] | undefined`.
 *
 * Cuando un parámetro viene repetido (`?tipo=casa&tipo=ph`) se queda con el primero en vez de
 * rechazar la búsqueda entera: es más probable que sea un link mal armado que un intento del
 * usuario de filtrar por dos tipos, y en cualquier caso mostrar resultados de más es mejor que
 * mostrar un error.
 */
export function parsearFiltros(
  searchParams: Record<string, string | string[] | undefined>,
): FiltrosDeBusqueda {
  const planos = Object.fromEntries(
    Object.entries(searchParams).map(([clave, valor]) => [
      clave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );

  return schemaBusqueda.parse(planos);
}
