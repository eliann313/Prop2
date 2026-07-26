/**
 * Catálogos del dominio inmobiliario: los valores que puede tomar cada enum y cómo se escriben
 * para mostrar.
 *
 * Vivían en `features/publicaciones/publicacionSchemas.ts`, que era su lugar mientras el único
 * consumidor era el wizard. La búsqueda de la Etapa 3 necesita exactamente los mismos valores
 * para armar sus filtros, y ESLint prohíbe importar entre features (4.2): lo que usan dos
 * features se sube a `shared/`. Duplicarlos sería peor que moverlos — una lista de tipos que
 * queda coja del lado de la búsqueda hace desaparecer inmuebles de los resultados sin ningún
 * error visible.
 *
 * Este archivo no importa nada, así que es seguro desde un componente de cliente.
 */

export const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const TIPOS_INMUEBLE = [
  "casa",
  "departamento",
  "ph",
  "terreno",
  "local",
  "oficina",
  "galpon",
  "cochera",
  "quinta",
  "campo",
] as const;

export const OPERACIONES = ["venta", "alquiler"] as const;

export const MONEDAS = ["ARS", "USD"] as const;

/** Etiquetas para mostrar; los valores crudos son los del enum de Postgres. */
export const ETIQUETAS_TIPO_INMUEBLE: Record<(typeof TIPOS_INMUEBLE)[number], string> = {
  casa: "Casa",
  departamento: "Departamento",
  ph: "PH",
  terreno: "Terreno",
  local: "Local comercial",
  oficina: "Oficina",
  galpon: "Galpón",
  cochera: "Cochera",
  quinta: "Quinta",
  campo: "Campo",
};

export const ETIQUETAS_OPERACION: Record<(typeof OPERACIONES)[number], string> = {
  venta: "Venta",
  alquiler: "Alquiler",
};

export const ETIQUETAS_ESTADO_INMUEBLE = {
  a_estrenar: "A estrenar",
  excelente: "Excelente",
  muy_bueno: "Muy bueno",
  bueno: "Bueno",
  a_refaccionar: "A refaccionar",
} as const;

export const ETIQUETAS_ORIENTACION = {
  norte: "Norte",
  sur: "Sur",
  este: "Este",
  oeste: "Oeste",
  noreste: "Noreste",
  noroeste: "Noroeste",
  sureste: "Sureste",
  suroeste: "Suroeste",
} as const;

export const ETIQUETAS_ESTADO_PUBLICACION = {
  borrador: "Borrador",
  activa: "Activa",
  pausada: "Pausada",
  eliminada: "Eliminada",
} as const;
