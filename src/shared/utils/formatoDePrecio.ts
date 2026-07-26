// Formato y conversión de precios. Funciones puras: no leen la cotización, la reciben. Eso las
// hace testeables sin red y evita que un componente termine disparando un fetch para formatear.

export type Moneda = "ARS" | "USD";

/** Cotización del dólar usada para las equivalencias. La provee shared/lib/cotizacionDolar. */
export type Cotizacion = {
  /** Cuántos pesos vale un dólar. */
  pesosPorDolar: number;
  /** Nombre del tipo de cambio, para poder decir cuál se usó. */
  nombre: string;
  actualizadoEn: Date;
};

const FORMATO: Record<Moneda, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }),
  // Sin decimales tampoco en dólares: los inmuebles se publican en montos redondos y
  // "US$ 135.000,00" solo agrega ruido.
  USD: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
};

export function formatearPrecio(precio: number, moneda: Moneda): string {
  return FORMATO[moneda].format(precio);
}

/**
 * La equivalencia en la otra moneda, o null si no hay cotización.
 *
 * Devolver null y no un precio con una cotización inventada es la única opción honesta: si el
 * servicio de cotización no responde, la app muestra el precio real y nada más.
 */
export function convertir(
  precio: number,
  moneda: Moneda,
  cotizacion: Cotizacion | null,
): { valor: number; moneda: Moneda } | null {
  if (!cotizacion || cotizacion.pesosPorDolar <= 0) return null;

  return moneda === "USD"
    ? { valor: precio * cotizacion.pesosPorDolar, moneda: "ARS" }
    : { valor: precio / cotizacion.pesosPorDolar, moneda: "USD" };
}

/**
 * Redondea a 3 cifras significativas antes de mostrar.
 *
 * Una conversión de USD 135.000 da $207.022.500 al peso, y ese número miente: sugiere una
 * precisión que no existe cuando el tipo de cambio se mueve todos los días y hay cuatro dólares
 * distintos para elegir. "$207.000.000" comunica el orden de magnitud, que es lo único que esta
 * cifra puede afirmar de verdad.
 */
function redondearAOrdenDeMagnitud(valor: number): number {
  if (valor === 0) return 0;
  const digitos = Math.floor(Math.log10(Math.abs(valor))) + 1;
  const factor = Math.pow(10, Math.max(0, digitos - 3));
  return Math.round(valor / factor) * factor;
}

/**
 * El texto de la equivalencia, listo para mostrar debajo del precio real.
 *
 * Siempre lleva el "≈" y el nombre del tipo de cambio: sin decir cuál dólar se usó, el mismo
 * inmueble parece valer 30% más o menos según quién lo mire, y el número deja de ser
 * información para pasar a ser una afirmación que la app no puede sostener.
 */
export function formatearEquivalencia(
  precio: number,
  moneda: Moneda,
  cotizacion: Cotizacion | null,
): string | null {
  const convertido = convertir(precio, moneda, cotizacion);
  if (!convertido || !cotizacion) return null;

  const redondeado = redondearAOrdenDeMagnitud(convertido.valor);
  return `≈ ${formatearPrecio(redondeado, convertido.moneda)} (${cotizacion.nombre})`;
}
