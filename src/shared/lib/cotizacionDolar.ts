import "server-only";

import type { Cotizacion } from "@/shared/utils/formato";

// Cotización del dólar para las equivalencias que se muestran debajo del precio (6.3/6.4).
//
// Es solo informativo: el precio real de una publicación es el que cargó el vendedor, en la
// moneda que eligió. Esto NUNCA participa del filtrado ni del ordenamiento — con la cotización
// dentro del WHERE, el índice de precio deja de aplicar y, peor, el mismo link devolvería
// resultados distintos a la mañana y a la tarde.

const ENDPOINT = "https://dolarapi.com/v1/dolares/oficial";

/**
 * Se usa el dólar oficial.
 *
 * En Argentina no hay "un" dólar —oficial, MEP, contado con liqui, blue— así que cuál se
 * muestra es una decisión y no un detalle. Se elige el oficial por ser la referencia pública
 * que cualquiera puede verificar contra el BCRA, sin tener que explicar en la interfaz qué es
 * un MEP. La contra a tener presente: lo publica el BCRA en días hábiles, así que un fin de
 * semana la cotización es la del viernes.
 *
 * Cambiar de dólar es cambiar este endpoint y el nombre visible: la API expone `bolsa` (MEP),
 * `blue` y `contadoconliqui` con la misma forma de respuesta.
 *
 * Se toma el valor de VENTA: es lo que le costaría a un comprador conseguir esos dólares.
 */
const NOMBRE_VISIBLE = "dólar oficial";

type RespuestaDolarApi = {
  venta: number;
  fechaActualizacion: string;
};

/**
 * Devuelve la cotización, o null si el servicio no responde.
 *
 * Nunca lanza, igual que el geocoding: esto es un dato de conveniencia, y que un servicio
 * externo gratuito esté caído no puede tumbar la página de un inmueble. Sin cotización
 * simplemente no se muestra la equivalencia.
 */
export async function obtenerCotizacion(): Promise<Cotizacion | null> {
  try {
    const respuesta = await fetch(ENDPOINT, {
      // Una hora: el MEP se mueve durante la rueda, pero la equivalencia se redondea a tres
      // cifras significativas, así que un cambio intradiario ni siquiera se ve. Sin cache, cada
      // render de un listado de 12 tarjetas dispararía un pedido a un servicio de terceros.
      next: { revalidate: 60 * 60 },
      signal: AbortSignal.timeout(4_000),
    });

    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as RespuestaDolarApi;
    if (typeof datos.venta !== "number" || datos.venta <= 0) return null;

    return {
      pesosPorDolar: datos.venta,
      nombre: NOMBRE_VISIBLE,
      actualizadoEn: new Date(datos.fechaActualizacion),
    };
  } catch (error) {
    console.error("No se pudo obtener la cotización del dólar:", error);
    return null;
  }
}
