// Capa de dominio (4.2): arma el prompt y limpia la respuesta. Sin red y sin SDKs, así que el
// prompt —que es la parte del sistema de IA que más se toca— se puede testear sin gastar cuota
// de ningún proveedor.

export type DatosParaDescripcion = {
  tipoInmueble: string;
  operacion: string;
  ciudad: string;
  provincia: string;
  barrio?: string;
  ambientes?: number;
  dormitorios?: number;
  banios?: number;
  superficieCubierta?: number;
  superficieTotal?: number;
  antiguedadAnios?: number;
  tieneCochera?: boolean;
  caracteristicas?: string[];
};

/** Palabras que pide 7.2. Se le dicen al modelo y se verifican al recortar. */
export const MINIMO_PALABRAS = 150;
export const MAXIMO_PALABRAS = 250;

function lineaSiHay(etiqueta: string, valor: string | number | undefined | null) {
  if (valor === undefined || valor === null || valor === "") return null;
  return `- ${etiqueta}: ${valor}`;
}

/**
 * El prompt de generación de descripción (7.2).
 *
 * Dos instrucciones no son decorativas y hacen a la responsabilidad de lo que se publica:
 *
 * 1. "No inventes datos": un modelo al que le das cinco campos rellena los huecos con detalles
 *    plausibles —"a metros del subte", "luminoso todo el día"— que después son afirmaciones
 *    falsas sobre un inmueble real, firmadas por el vendedor.
 * 2. "Sin exagerar cualidades no confirmadas": es la instrucción de tono que pide 7.2, y evita
 *    el "oportunidad única e irrepetible" que ensucia el aviso.
 */
export function construirPrompt(datos: DatosParaDescripcion): string {
  const hechos = [
    lineaSiHay("Tipo de inmueble", datos.tipoInmueble),
    lineaSiHay("Operación", datos.operacion),
    lineaSiHay(
      "Ubicación",
      [datos.barrio, datos.ciudad, datos.provincia].filter(Boolean).join(", "),
    ),
    lineaSiHay("Ambientes", datos.ambientes),
    lineaSiHay("Dormitorios", datos.dormitorios),
    lineaSiHay("Baños", datos.banios),
    lineaSiHay(
      "Superficie cubierta",
      datos.superficieCubierta ? `${datos.superficieCubierta} m²` : undefined,
    ),
    lineaSiHay(
      "Superficie total",
      datos.superficieTotal ? `${datos.superficieTotal} m²` : undefined,
    ),
    lineaSiHay(
      "Antigüedad",
      datos.antiguedadAnios === 0
        ? "a estrenar"
        : datos.antiguedadAnios
          ? `${datos.antiguedadAnios} años`
          : undefined,
    ),
    datos.tieneCochera ? "- Cochera: sí" : null,
    datos.caracteristicas?.length
      ? `- Servicios y comodidades: ${datos.caracteristicas.join(", ")}`
      : null,
  ].filter(Boolean);

  return [
    "Sos un vendedor inmobiliario profesional argentino. Escribí la descripción de un aviso",
    "para el siguiente inmueble.",
    "",
    "Datos confirmados del inmueble:",
    ...hechos,
    "",
    "Reglas:",
    `- Entre ${MINIMO_PALABRAS} y ${MAXIMO_PALABRAS} palabras.`,
    "- Usá SOLO los datos de arriba. No inventes ni supongas nada que no esté en la lista:",
    "  ni cercanías, ni orientación, ni luminosidad, ni estado de la propiedad.",
    "- No exageres cualidades que no estén confirmadas en los datos.",
    "- Español rioplatense, voseo, tono profesional y sobrio.",
    "- Texto plano corrido, sin títulos, sin viñetas, sin emojis y sin comillas.",
    "- No incluyas el precio ni datos de contacto.",
    "- Devolvé únicamente la descripción, sin ningún texto introductorio.",
  ].join("\n");
}

/**
 * Limpia lo que devuelve el modelo antes de mostrárselo al vendedor.
 *
 * Aun con la instrucción explícita, los modelos suelen envolver la respuesta en comillas o
 * abrirla con un "Claro, acá tenés:". Eso es ruido del modelo, no parte de la descripción, y
 * el vendedor no tiene por qué borrarlo a mano cada vez.
 */
export function limpiarRespuesta(texto: string): string {
  let limpio = texto.trim();

  // Preámbulo típico: una primera línea corta que termina en ":" y no es parte del aviso.
  const lineas = limpio.split("\n");
  if (lineas.length > 1 && lineas[0].trim().endsWith(":") && lineas[0].length < 80) {
    limpio = lineas.slice(1).join("\n").trim();
  }

  // Comillas envolventes, solo si abren Y cierran: un texto que legítimamente empieza con
  // comillas no debería perder la primera palabra.
  const comillas = ['"', "'", "“", "«"];
  const cierres = ['"', "'", "”", "»"];
  for (const [indice, apertura] of comillas.entries()) {
    if (limpio.startsWith(apertura) && limpio.endsWith(cierres[indice])) {
      limpio = limpio.slice(1, -1).trim();
      break;
    }
  }

  return limpio.replace(/\n{3,}/g, "\n\n");
}

export function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  return limpio === "" ? 0 : limpio.split(/\s+/).length;
}
