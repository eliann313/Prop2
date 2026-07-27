import type { FiltrosDeBusqueda, Orden } from "@/features/busqueda/busquedaSchemas";

// Capa de dominio (4.2): traduce lo que vino en la URL a los criterios con los que se arma la
// query. Sin Prisma y sin SQL, para que las reglas de acá se puedan testear sin base de datos.

/** 12 y no 10: entra justo en grillas de 2, 3 y 4 columnas sin dejar una fila coja. */
export const TAMANIO_PAGINA = 12;

export type CriteriosDeBusqueda = {
  texto?: string;
  provincia?: string;
  ciudad?: string;
  barrio?: string;
  tipo?: string;
  operacion?: string;
  moneda?: string;
  precioMin?: number;
  precioMax?: number;
  ambientesMin?: number;
  dormitoriosMin?: number;
  baniosMin?: number;
  soloConCochera: boolean;
  superficieMin?: number;
  superficieMax?: number;
  orden: Orden;
  pagina: number;
  /** Filas a saltear. Derivado de `pagina`, nunca recibido de afuera. */
  offset: number;
  limite: number;
};

/**
 * Un rango invertido se da vuelta en vez de descartarse.
 *
 * `precioMin=200000&precioMax=100000` no devuelve nada, y para el usuario eso es
 * indistinguible de "no hay inmuebles con esos filtros" — se queda mirando una pantalla vacía
 * sin saber que el error está en su propio rango. Casi siempre es un dedazo o dos sliders
 * cruzados, así que se interpreta la intención.
 */
function ordenarRango(
  min: number | undefined,
  max: number | undefined,
): [number | undefined, number | undefined] {
  if (min !== undefined && max !== undefined && min > max) return [max, min];
  return [min, max];
}

/**
 * Decide el ordenamiento efectivo.
 *
 * "Relevancia" solo existe si hay texto libre: sin `tsquery` contra el que rankear, `ts_rank`
 * devuelve el mismo valor para todas las filas y el orden queda a criterio del planner — o sea,
 * arbitrario y distinto entre dos cargas de la misma página. Sin texto, el default es lo más
 * reciente, que es lo que espera cualquiera que entra a mirar qué hay.
 */
function ordenEfectivo(orden: Orden | undefined, hayTexto: boolean): Orden {
  if (!hayTexto && (orden === undefined || orden === "relevancia")) return "recientes";
  return orden ?? "relevancia";
}

/**
 * La moneda filtra SOLO cuando el precio entra en juego.
 *
 * El selector de moneda del formulario siempre manda un valor (un grupo de radios no tiene
 * estado "ninguno"), así que tomarlo siempre significaría que cualquier búsqueda esconde la
 * mitad del catálogo sin que el usuario haya pedido nada sobre precios.
 *
 * Cuando sí hay rango u orden por precio, la moneda es obligatoria: "hasta 150.000" no
 * significa nada sin saber en qué moneda, y ordenar por precio mezclando escalas pone un
 * departamento de USD 135.000 por debajo de uno de $200.000.000.
 */
function monedaAplicable(
  moneda: string | undefined,
  hayRangoDePrecio: boolean,
  orden: Orden,
): string | undefined {
  const elPrecioImporta =
    hayRangoDePrecio || orden === "precio_asc" || orden === "precio_desc";
  return elPrecioImporta ? moneda : undefined;
}

export function construirCriterios(filtros: FiltrosDeBusqueda): CriteriosDeBusqueda {
  const texto = filtros.q;
  const [precioMin, precioMax] = ordenarRango(filtros.precioMin, filtros.precioMax);
  const [superficieMin, superficieMax] = ordenarRango(
    filtros.superficieMin,
    filtros.superficieMax,
  );
  const pagina = filtros.pagina ?? 1;
  const orden = ordenEfectivo(filtros.orden, texto !== undefined);

  return {
    texto,
    provincia: filtros.provincia,
    ciudad: filtros.ciudad,
    barrio: filtros.barrio,
    tipo: filtros.tipo,
    operacion: filtros.operacion,
    moneda: monedaAplicable(
      filtros.moneda,
      precioMin !== undefined || precioMax !== undefined,
      orden,
    ),
    precioMin,
    precioMax,
    ambientesMin: filtros.ambientes,
    dormitoriosMin: filtros.dormitorios,
    baniosMin: filtros.banios,
    soloConCochera: filtros.cochera === true,
    superficieMin,
    superficieMax,
    orden,
    pagina,
    offset: (pagina - 1) * TAMANIO_PAGINA,
    limite: TAMANIO_PAGINA,
  };
}

/**
 * ¿El usuario acotó la búsqueda de alguna forma?
 *
 * El orden y la página quedan afuera a propósito: son la forma de mirar los resultados, no un
 * recorte de cuáles son. Lo usa la UI para decidir si tiene sentido ofrecer "limpiar filtros"
 * y para distinguir "no hay publicaciones todavía" de "no hay ninguna que cumpla esto".
 */
export function hayFiltrosAplicados(criterios: CriteriosDeBusqueda): boolean {
  // Se listan uno por uno en vez de barrer el objeto entero: barriéndolo habría que excluir
  // `orden`, `pagina`, `offset` y `limite`, y esa exclusión se rompe callada en cuanto se
  // agregue otro campo de presentación. Si sumás un filtro nuevo, va acá.
  const valores = [
    criterios.texto,
    criterios.provincia,
    criterios.ciudad,
    criterios.barrio,
    criterios.tipo,
    criterios.operacion,
    criterios.moneda,
    criterios.precioMin,
    criterios.precioMax,
    criterios.ambientesMin,
    criterios.dormitoriosMin,
    criterios.baniosMin,
    criterios.superficieMin,
    criterios.superficieMax,
  ];

  return criterios.soloConCochera || valores.some((valor) => valor !== undefined);
}

export function totalDePaginas(totalDeResultados: number): number {
  return Math.max(1, Math.ceil(totalDeResultados / TAMANIO_PAGINA));
}
