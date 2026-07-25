"use server";

import { revalidatePath } from "next/cache";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { schemaPublicacion } from "@/features/publicaciones/publicacionSchemas";
import {
  actualizarPublicacion,
  contarPublicacionesDelUsuario,
  crearPublicacionBorrador,
  type DatosParaGuardar,
} from "@/features/publicaciones/publicacionRepository";
import { promoverAVendedorSiCorresponde } from "@/features/usuarios/promocionDeRol";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/**
 * Crea o actualiza una publicación (paso final del wizard de 5.2).
 *
 * Es una sola action para los dos casos porque el payload y las validaciones son idénticos: lo
 * único que cambia es si hay un id previo. Separarlas duplicaría la validación completa.
 */
export async function guardarPublicacion(
  entrada: unknown,
  idExistente?: string,
): Promise<ResultadoAccion<{ id: string }>> {
  const usuario = await requerirUsuario(RUTAS.dashboard);

  const validacion = schemaPublicacion.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Revisá los datos del formulario.",
      validacion.error.flatten().fieldErrors,
    );
  }

  const datos = validacion.data as DatosParaGuardar;

  if (idExistente) {
    // El repositorio filtra por dueño en el WHERE: si la publicación no es de este usuario,
    // devuelve null en vez de modificarla (8.19).
    const actualizada = await actualizarPublicacion(idExistente, usuario.id, datos);
    if (!actualizada) {
      return fallo("No encontramos esa publicación entre las tuyas.");
    }

    revalidatePath(RUTAS.dashboard);
    return exito("Cambios guardados.", { id: actualizada.id });
  }

  // El ascenso de rol se decide ANTES de crear: después de crear, el conteo ya incluye la
  // nueva y "es su primera publicación" sería siempre falso.
  const esLaPrimera = (await contarPublicacionesDelUsuario(usuario.id)) === 0;

  const creada = await crearPublicacionBorrador(usuario.id, datos);

  // Se le pide al módulo de identidad que promueva; publicaciones no elige el rol ni escribe
  // en la tabla de usuarios.
  if (esLaPrimera) await promoverAVendedorSiCorresponde(usuario);

  revalidatePath(RUTAS.dashboard);
  return exito(
    "Guardamos tu publicación como borrador. Revisala y publicala cuando quieras.",
    { id: creada.id },
  );
}
