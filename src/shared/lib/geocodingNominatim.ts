import "server-only";

// Geocoding contra Nominatim, el servicio de OpenStreetMap (2.9). Gratis y sin credenciales,
// que es justamente el criterio por el que se descartó Google Maps.
//
// Vive en shared/lib y no dentro de features/publicaciones porque la búsqueda por zona de la
// Etapa 3 va a necesitar lo mismo. Es infraestructura: habla con un servicio externo.

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

/**
 * La política de uso de Nominatim exige un User-Agent que identifique a la aplicación, con
 * forma de contacto. Sin esto devuelven 403 — no es una convención opcional.
 *
 * Va "Prop2" y no "Prop²": los valores de header HTTP son ASCII/latin-1, y `undici` rechaza
 * un caracter fuera de ese rango antes de que el pedido salga.
 */
const USER_AGENT =
  "Prop2/0.1 (portfolio; https://github.com/eliann313/ProyectoInmuebles)";

/**
 * Nominatim admite 1 request por segundo. Se serializan los pedidos encadenándolos en una
 * promesa: dos llamadas simultáneas se ejecutan una después de la otra en vez de en paralelo.
 *
 * Alcanza porque solo se geocodifica al crear o editar una publicación, nunca durante una
 * búsqueda (2.9). Si en algún momento hiciera falta más volumen, el paso siguiente es cachear
 * en Redis, no subir la frecuencia.
 */
let ultimoPedido: Promise<unknown> = Promise.resolve();

function enFila<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = ultimoPedido.then(tarea, tarea);
  // La cola no debe romperse si una tarea falla: se encadena el resultado ya "atrapado".
  ultimoPedido = resultado.then(
    () => esperar(1100),
    () => esperar(1100),
  );
  return resultado;
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type Coordenadas = { latitud: number; longitud: number; etiqueta: string };

export type ResultadoGeocoding =
  | { encontrado: true; coordenadas: Coordenadas }
  | { encontrado: false; motivo: "sin-resultados" | "servicio-caido" };

type Consulta = {
  direccion?: string;
  ciudad: string;
  provincia: string;
};

type RespuestaNominatim = {
  lat: string;
  lon: string;
  display_name: string;
};

/**
 * Convierte una dirección en coordenadas.
 *
 * Nunca lanza: si Nominatim está caído o no encuentra nada, devuelve `encontrado: false` y el
 * wizard ofrece cargar la ubicación a mano (rama "usuario ajusta dirección" de 5.2). Un
 * servicio externo gratuito no puede ser capaz de bloquear la publicación de un inmueble.
 */
export async function geocodificar(consulta: Consulta): Promise<ResultadoGeocoding> {
  const partes = [consulta.direccion, consulta.ciudad, consulta.provincia, "Argentina"]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte));

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", partes.join(", "));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  // Restringe a Argentina: sin esto, "San José, Buenos Aires" puede resolver en Costa Rica.
  url.searchParams.set("countrycodes", "ar");

  try {
    const respuesta = await enFila(() =>
      fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "es" },
        // 8 segundos: más que eso y conviene dejar que el usuario cargue las coordenadas a
        // mano en vez de tenerlo esperando.
        signal: AbortSignal.timeout(8_000),
        // El resultado se cachea: la misma dirección consultada dos veces (por ejemplo al
        // corregir otro campo y volver atrás en el wizard) no gasta cuota de Nominatim.
        next: { revalidate: 60 * 60 * 24 },
      }),
    );

    if (!respuesta.ok) return { encontrado: false, motivo: "servicio-caido" };

    const resultados = (await respuesta.json()) as RespuestaNominatim[];
    const primero = resultados[0];
    if (!primero) return { encontrado: false, motivo: "sin-resultados" };

    const latitud = Number(primero.lat);
    const longitud = Number(primero.lon);
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      return { encontrado: false, motivo: "sin-resultados" };
    }

    return {
      encontrado: true,
      coordenadas: { latitud, longitud, etiqueta: primero.display_name },
    };
  } catch (error) {
    console.error("Nominatim no respondió:", error);
    return { encontrado: false, motivo: "servicio-caido" };
  }
}
