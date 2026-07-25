import { z } from "zod";

// Única fuente de verdad de las validaciones de publicaciones (14.3): las usa el wizard en el
// cliente, paso por paso, y la Server Action al recibir el payload completo.
//
// Están partidos por paso del wizard (5.2) y no en un solo objeto porque el wizard necesita
// poder validar SOLO el paso actual antes de dejar avanzar. Con un schema único habría que
// listar a mano qué campos corresponden a cada paso, y esa lista se desincroniza en cuanto
// alguien mueve un campo de lugar.

const PROVINCIAS_ARGENTINAS = [
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

export const PROVINCIAS = PROVINCIAS_ARGENTINAS;

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

/**
 * Convierte "" a undefined antes de validar.
 *
 * Un `<input type="number">` vacío llega como cadena vacía, no como undefined. Sin esto, cada
 * campo opcional sin completar fallaría con "expected number, received string" — que para el
 * usuario aparece como un error en un campo que ni siquiera tocó.
 */
const opcional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (valor) => (valor === "" || valor === null ? undefined : valor),
    schema.optional(),
  );

const enteroPositivo = (maximo: number, etiqueta: string) =>
  z.coerce
    .number({ message: `${etiqueta} tiene que ser un número` })
    .int(`${etiqueta} tiene que ser un número entero`)
    .min(0, `${etiqueta} no puede ser negativo`)
    .max(maximo, `${etiqueta} parece demasiado alto`);

const decimalPositivo = (maximo: number, etiqueta: string) =>
  z.coerce
    .number({ message: `${etiqueta} tiene que ser un número` })
    .min(0, `${etiqueta} no puede ser negativo`)
    .max(maximo, `${etiqueta} parece demasiado alto`);

// ─── Paso 1: datos básicos ─────────────────────────────────────────────────────
export const schemaPasoBasicos = z.object({
  tipoInmueble: z.enum(TIPOS_INMUEBLE, { message: "Elegí el tipo de inmueble" }),
  operacion: z.enum(["venta", "alquiler"], { message: "Elegí venta o alquiler" }),
  titulo: z
    .string()
    .trim()
    .min(10, "El título necesita al menos 10 caracteres")
    .max(120, "El título no puede superar los 120 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(40, "Contá algo más: al menos 40 caracteres")
    .max(5000, "La descripción es demasiado larga"),
  // El precio es Decimal en la base para no perder centavos por redondeo binario (3.1). Acá
  // viaja como number y Prisma lo convierte; el tope evita que un cero de más se guarde como
  // un precio de mil millones sin que nadie lo note.
  precio: z.coerce
    .number({ message: "Ingresá el precio" })
    .positive("El precio tiene que ser mayor a cero")
    .max(999_999_999, "Revisá el precio: parece tener un cero de más"),
  moneda: z.enum(["ARS", "USD"], { message: "Elegí la moneda" }),
});

// ─── Paso 2: ubicación ─────────────────────────────────────────────────────────
export const schemaPasoUbicacion = z.object({
  provincia: z.enum(PROVINCIAS_ARGENTINAS, { message: "Elegí la provincia" }),
  ciudad: z.string().trim().min(2, "Ingresá la ciudad").max(80),
  barrio: opcional(z.string().trim().max(80)),
  codigoPostal: opcional(z.string().trim().max(12)),
  direccion: opcional(z.string().trim().max(160)),
  // Las coordenadas las completa el geocoding, pero viajan en el formulario para que el
  // usuario pueda corregirlas a mano cuando Nominatim no encuentra la dirección (5.2).
  latitud: z.coerce.number({ message: "Falta la ubicación en el mapa" }).min(-90).max(90),
  longitud: z.coerce
    .number({ message: "Falta la ubicación en el mapa" })
    .min(-180)
    .max(180),
});

// ─── Paso 3: características ───────────────────────────────────────────────────
export const schemaPasoCaracteristicas = z.object({
  superficieCubierta: opcional(decimalPositivo(100_000, "La superficie cubierta")),
  superficieTotal: opcional(decimalPositivo(100_000_000, "La superficie total")),
  ambientes: opcional(enteroPositivo(50, "Los ambientes")),
  dormitorios: opcional(enteroPositivo(50, "Los dormitorios")),
  banios: opcional(enteroPositivo(30, "Los baños")),
  piso: opcional(enteroPositivo(200, "El piso")),
  orientacion: opcional(
    z.enum([
      "norte",
      "sur",
      "este",
      "oeste",
      "noreste",
      "noroeste",
      "sureste",
      "suroeste",
    ]),
  ),
  // Boolean y no coerce.boolean: `z.coerce.boolean()` convierte con la semántica de JavaScript,
  // donde el string "false" es truthy. El checkbox ya entrega un booleano real, así que
  // coercionar solo agregaría una forma de que un "false" se guarde como true.
  tieneCochera: z.boolean().default(false),
  antiguedadAnios: opcional(enteroPositivo(300, "La antigüedad")),
  // Siempre en ARS, incluso si la publicación está en USD (3.4).
  expensas: opcional(decimalPositivo(99_999_999, "Las expensas")),
  estadoInmueble: opcional(
    z.enum(["a_estrenar", "excelente", "muy_bueno", "bueno", "a_refaccionar"]),
  ),
  caracteristicaIds: z.array(z.uuid()).default([]),
});

// ─── Paso 4: multimedia ────────────────────────────────────────────────────────

/** Una imagen ya subida a Cloudinary, tal como la deja el paso de fotos. */
export const schemaImagen = z.object({
  publicId: z.string().min(1),
  url: z.url(),
  urlThumbnail: z.url(),
});

export const schemaPasoMultimedia = z.object({
  // El ORDEN del arreglo es el orden de la galería, y la primera es la portada. No hay un
  // campo `esPortada` acá a propósito: con un booleano por imagen existen estados inválidos
  // (cero portadas, o dos), y habría que defenderse de ellos en cada lectura. Derivándola de
  // la posición, "exactamente una portada" es cierto por construcción.
  imagenes: z.array(schemaImagen).max(20, "Máximo 20 fotos por publicación").default([]),
  videoUrl: opcional(z.url("Pegá un link válido (YouTube, Vimeo)")),
});

export type ImagenDePublicacion = z.infer<typeof schemaImagen>;

/**
 * Todos los campos de los cuatro pasos, sin las validaciones cruzadas.
 *
 * Se exporta aparte porque `superRefine` devuelve un schema que ya no expone `.shape`, y hace
 * falta poder enumerar los campos (por ejemplo para verificar que ninguno quedó fuera del
 * wizard) sin meter la mano en las internals de Zod.
 */
export const schemaPublicacionBase = schemaPasoBasicos
  .extend(schemaPasoUbicacion.shape)
  .extend(schemaPasoCaracteristicas.shape)
  .extend(schemaPasoMultimedia.shape);

/** El schema completo que revalida la Server Action. */
export const schemaPublicacion = schemaPublicacionBase.superRefine((datos, ctx) => {
  // La superficie total incluye a la cubierta: si el usuario las invierte, el dato queda
  // incoherente y después rompe cualquier filtro por superficie.
  if (
    datos.superficieCubierta !== undefined &&
    datos.superficieTotal !== undefined &&
    datos.superficieCubierta > datos.superficieTotal
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["superficieCubierta"],
      message: "La superficie cubierta no puede ser mayor que la total",
    });
  }

  // Un terreno o un campo con dormitorios es casi siempre un error de carga, no un caso
  // real. Se avisa en vez de aceptarlo en silencio.
  if (
    (datos.tipoInmueble === "terreno" || datos.tipoInmueble === "campo") &&
    (datos.dormitorios ?? 0) > 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["dormitorios"],
      message: `Un ${datos.tipoInmueble} no debería tener dormitorios. ¿Es el tipo correcto?`,
    });
  }

  // El piso solo tiene sentido en una unidad dentro de un edificio.
  const admitePiso = ["departamento", "oficina", "cochera"].includes(datos.tipoInmueble);
  if (!admitePiso && datos.piso !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["piso"],
      message: "El piso solo aplica a departamentos, oficinas y cocheras",
    });
  }
});

/** Pasos del wizard, en orden. Cada uno con el schema que valida antes de dejar avanzar. */
export const PASOS_WIZARD = [
  { id: "basicos", titulo: "Datos básicos", schema: schemaPasoBasicos },
  { id: "ubicacion", titulo: "Ubicación", schema: schemaPasoUbicacion },
  { id: "caracteristicas", titulo: "Características", schema: schemaPasoCaracteristicas },
  { id: "multimedia", titulo: "Fotos y video", schema: schemaPasoMultimedia },
] as const;

export type IdPaso = (typeof PASOS_WIZARD)[number]["id"];

/** Nombres de los campos de cada paso, derivados del schema — nunca listados a mano. */
export const CAMPOS_POR_PASO: Record<IdPaso, string[]> = {
  basicos: Object.keys(schemaPasoBasicos.shape),
  ubicacion: Object.keys(schemaPasoUbicacion.shape),
  caracteristicas: Object.keys(schemaPasoCaracteristicas.shape),
  multimedia: Object.keys(schemaPasoMultimedia.shape),
};

/**
 * El schema tiene `coerce` y `preprocess`, así que su tipo de ENTRADA no es el mismo que el de
 * SALIDA: un `<input type="number">` entrega strings, y los campos opcionales entregan "" antes
 * de convertirse en `undefined`.
 *
 * Por eso hacen falta los dos tipos. El formulario trabaja con `EntradaPublicacion` (lo que el
 * usuario tipea) y la Server Action recibe `DatosPublicacion` (lo ya convertido y validado).
 * Usar uno solo para ambos lados es lo que hace que React Hook Form y Zod no cierren de tipos.
 */
export type EntradaPublicacion = z.input<typeof schemaPublicacion>;
export type DatosPublicacion = z.output<typeof schemaPublicacion>;
