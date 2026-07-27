// Capa de dominio (4.2): armado de las URLs de búsqueda. Sin APIs de Next, así se testea sola.

/** Los filtros tal como viajan en la URL. */
export type ParametrosDeUrl = Record<string, string | undefined>;

/**
 * Devuelve la query string con `cambios` aplicados sobre los parámetros actuales.
 *
 * Un valor `undefined` borra el parámetro. Esto es lo que permite que el paginador, el selector
 * de orden y el botón de cambiar moneda modifiquen UNA cosa sin perder el resto de los filtros
 * — que es justo lo que se rompe cuando cada control arma su link a mano.
 *
 * La página se resetea sola ante cualquier cambio que no sea la página misma: si estás en la
 * página 5 y agregás un filtro, quedarte en la 5 casi siempre muestra un vacío, porque el
 * resultado nuevo tiene menos páginas que el anterior.
 */
export function construirQuery(
  actuales: ParametrosDeUrl,
  cambios: ParametrosDeUrl,
): string {
  const resultado = new URLSearchParams();
  const cambiaAlgoQueNoEsLaPagina = Object.keys(cambios).some(
    (clave) => clave !== "pagina",
  );

  const combinados: ParametrosDeUrl = {
    ...actuales,
    ...cambios,
    ...(cambiaAlgoQueNoEsLaPagina && cambios.pagina === undefined
      ? { pagina: undefined }
      : {}),
  };

  // Orden alfabético para que la misma búsqueda produzca siempre la misma URL: dos links
  // distintos a los mismos resultados son dos entradas de caché y dos URLs para Google.
  for (const clave of Object.keys(combinados).sort()) {
    const valor = combinados[clave];
    if (valor !== undefined && valor !== "") resultado.set(clave, valor);
  }

  const query = resultado.toString();
  return query ? `?${query}` : "";
}

/** Las páginas a mostrar en el paginador, con `null` donde va un "…". */
export function paginasVisibles(
  actual: number,
  total: number,
  maximo = 7,
): (number | null)[] {
  if (total <= maximo) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set<number>([1, total, actual]);
  // Una vecina de cada lado alcanza para moverse de a un paso sin escribir en la URL.
  if (actual - 1 > 1) paginas.add(actual - 1);
  if (actual + 1 < total) paginas.add(actual + 1);

  const ordenadas = [...paginas].sort((a, b) => a - b);
  const conHuecos: (number | null)[] = [];

  for (const [indice, pagina] of ordenadas.entries()) {
    const anterior = ordenadas[indice - 1];
    if (anterior !== undefined && pagina - anterior > 1) conHuecos.push(null);
    conHuecos.push(pagina);
  }

  return conHuecos;
}
