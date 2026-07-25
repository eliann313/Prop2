"use client";

import { useFormContext } from "react-hook-form";

import type {
  DatosPublicacion,
  EntradaPublicacion,
} from "@/features/publicaciones/publicacionSchemas";

/**
 * Acceso al formulario del wizard desde cualquiera de sus pasos.
 *
 * Existe para no repetir los tres genéricos en cada paso: React Hook Form necesita saber que
 * el formulario guarda `EntradaPublicacion` (lo que el usuario tipea) pero el submit entrega
 * `DatosPublicacion` (lo ya convertido por Zod). Si un paso los declara distinto, el error de
 * tipos que aparece es de los ilegibles.
 */
export function useCamposPublicacion() {
  return useFormContext<EntradaPublicacion, unknown, DatosPublicacion>();
}
