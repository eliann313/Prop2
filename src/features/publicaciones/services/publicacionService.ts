import type { EstadoPublicacion } from "@/generated/prisma/enums";

// Capa de dominio (4.2): el ciclo de vida de una publicación, sin Prisma ni HTTP. Todo lo de
// acá se testea sin levantar base ni servidor.

/**
 * Transiciones permitidas del diagrama de estados de 6.2.
 *
 * Se modela como un mapa explícito y no como una cadena de `if`s dispersos por las actions:
 * así el conjunto completo de transiciones válidas se lee de un vistazo, y agregar un estado
 * es tocar un solo lugar en vez de auditar cada action que cambia el estado.
 */
const TRANSICIONES: Record<EstadoPublicacion, readonly EstadoPublicacion[]> = {
  borrador: ["activa", "eliminada"],
  activa: ["pausada", "eliminada"],
  pausada: ["activa", "eliminada"],
  // Terminal: el soft delete no se revierte desde la UI del vendedor. Si hiciera falta
  // restaurar algo, es una acción de moderación (Etapa 4), no un botón del dashboard.
  eliminada: [],
};

export function puedeTransicionar(
  desde: EstadoPublicacion,
  hacia: EstadoPublicacion,
): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function transicionesPosibles(
  desde: EstadoPublicacion,
): readonly EstadoPublicacion[] {
  return TRANSICIONES[desde];
}

/** Los estados que NO se muestran en el listado público (búsqueda y detalle). */
export const ESTADOS_NO_PUBLICOS: readonly EstadoPublicacion[] = [
  "borrador",
  "pausada",
  "eliminada",
];

export function esVisiblePublicamente(estado: EstadoPublicacion): boolean {
  return estado === "activa";
}

type DatosParaPublicar = {
  titulo: string;
  descripcion: string;
  precio: number;
  provincia: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  cantidadDeImagenes: number;
};

export type MotivoNoPublicable =
  "sin-titulo" | "sin-descripcion" | "sin-precio" | "sin-ubicacion" | "sin-imagenes";

/**
 * Requisitos para que un borrador pueda pasar a `activa` (6.2: "publicar (pasa validación
 * completa)").
 *
 * Son más estrictos que los de guardar: un borrador puede estar a medio completar a propósito
 * —el wizard permite abandonarlo en cualquier paso—, pero una publicación visible sin precio o
 * sin foto es basura en los resultados de búsqueda para todos los demás.
 *
 * Devuelve TODOS los motivos, no el primero: si al vendedor le faltan tres cosas, corregirlas
 * de a una y volver a intentar tres veces es una mala experiencia evitable.
 */
export function motivosParaNoPublicar(datos: DatosParaPublicar): MotivoNoPublicable[] {
  const motivos: MotivoNoPublicable[] = [];

  if (datos.titulo.trim().length < 10) motivos.push("sin-titulo");
  if (datos.descripcion.trim().length < 40) motivos.push("sin-descripcion");
  if (!(datos.precio > 0)) motivos.push("sin-precio");
  if (!datos.provincia.trim() || !datos.ciudad.trim()) motivos.push("sin-ubicacion");
  if (datos.cantidadDeImagenes < 1) motivos.push("sin-imagenes");

  return motivos;
}

export const MENSAJES_NO_PUBLICABLE: Record<MotivoNoPublicable, string> = {
  "sin-titulo": "Falta un título de al menos 10 caracteres.",
  "sin-descripcion": "Falta una descripción de al menos 40 caracteres.",
  "sin-precio": "Falta indicar el precio.",
  "sin-ubicacion": "Falta la provincia o la ciudad.",
  "sin-imagenes": "Agregá al menos una foto antes de publicar.",
};

// El ascenso comprador→vendedor lo dispara una publicación pero es una regla del módulo de
// identidad: vive en features/usuarios/services/rolService.ts.
