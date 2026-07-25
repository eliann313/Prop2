const FORMATEADORES = new Map<string, Intl.NumberFormat>();

/**
 * Formatea un monto con la convención argentina (punto para miles, coma para decimales).
 *
 * Los Intl.NumberFormat se cachean porque construirlos es caro y en un listado de 20 tarjetas
 * se pediría el mismo formateador 20 veces.
 */
export function formatearPrecio(monto: number, moneda: "ARS" | "USD"): string {
  const clave = `precio-${moneda}`;
  let formateador = FORMATEADORES.get(clave);

  if (!formateador) {
    formateador = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 0,
      // "symbol" y NO "narrowSymbol": en el locale es-AR, narrowSymbol colapsa el dólar a "$",
      // el mismo símbolo que el peso. En un portal donde se publica en las dos monedas eso
      // hace que un aviso de USD 135.000 se lea como $135.000 — un error de mil por ciento en
      // el precio. Con "symbol" el dólar sale como "US$" y el peso como "$".
      currencyDisplay: "symbol",
    });
    FORMATEADORES.set(clave, formateador);
  }

  return formateador.format(monto);
}

export function formatearSuperficie(metros: number): string {
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(metros)} m²`;
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(fecha);
}
