"use server";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { actualizarPerfilDeUsuario } from "@/features/usuarios/usuarioRepository";
import { schemaPerfilUsuario } from "@/features/usuarios/usuarioSchemas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

/** Actualiza el perfil de la sesión actual. El usuario nunca llega desde el formulario. */
export async function actualizarPerfil(entrada: unknown): Promise<ResultadoAccion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return fallo("Tu sesión venció. Iniciá sesión para guardar los cambios.");

  const validacion = schemaPerfilUsuario.safeParse(entrada);
  if (!validacion.success) {
    return fallo("Revisá los datos del perfil.", validacion.error.flatten().fieldErrors);
  }

  try {
    await actualizarPerfilDeUsuario(usuario.id, validacion.data);
    return exito("Perfil actualizado.");
  } catch {
    return fallo("No pudimos guardar el perfil. Probá de nuevo en unos minutos.");
  }
}
