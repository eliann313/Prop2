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

/** Cotización del dólar para las equivalencias. La provee shared/lib/cotizacionDolar. */
export type Cotizacion = {
  /** Cuántos pesos vale un dólar. */
  pesosPorDolar: number;
  /** Nombre del tipo de cambio, para poder decir cuál se usó. */
  nombre: string;
  actualizadoEn: Date;
};

/**
 * El precio en la otra moneda, o null si no hay cotización.
 *
 * Devolver null y no un número calculado con una cotización inventada es la única opción
 * honesta: si el servicio de cotización no responde, se muestra el precio real y nada más.
 */
export function convertir(
  precio: number,
  moneda: "ARS" | "USD",
  cotizacion: Cotizacion | null,
): { valor: number; moneda: "ARS" | "USD" } | null {
  if (!cotizacion || cotizacion.pesosPorDolar <= 0) return null;

  return moneda === "USD"
    ? { valor: precio * cotizacion.pesosPorDolar, moneda: "ARS" }
    : { valor: precio / cotizacion.pesosPorDolar, moneda: "USD" };
}

/**
 * Redondea a 3 cifras significativas.
 *
 * Una conversión de USD 135.000 al oficial da $205.200.000, y ese número miente: aparenta una
 * precisión que no existe cuando el tipo de cambio se mueve todos los días y hay cuatro dólares
 * distintos para elegir. "$205.000.000" comunica el orden de magnitud, que es lo único que esta
 * cifra puede afirmar de verdad.
 */
function redondearAOrdenDeMagnitud(valor: number): number {
  if (valor === 0) return 0;
  const digitos = Math.floor(Math.log10(Math.abs(valor))) + 1;
  const factor = Math.pow(10, Math.max(0, digitos - 3));
  return Math.round(valor / factor) * factor;
}

/**
 * La equivalencia lista para mostrar debajo del precio real.
 *
 * Siempre lleva el "≈" y el nombre del tipo de cambio: sin decir cuál dólar se usó, el mismo
 * inmueble parece valer 30% más o menos según quién lo mire, y el número deja de ser
 * información para pasar a ser una afirmación que la app no puede sostener.
 */
export function formatearEquivalencia(
  precio: number,
  moneda: "ARS" | "USD",
  cotizacion: Cotizacion | null,
): string | null {
  const convertido = convertir(precio, moneda, cotizacion);
  if (!convertido || !cotizacion) return null;

  const redondeado = redondearAOrdenDeMagnitud(convertido.valor);
  return `≈ ${formatearPrecio(redondeado, convertido.moneda)} (${cotizacion.nombre})`;
}

export function formatearSuperficie(metros: number): string {
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(metros)} m²`;
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(fecha);
}
