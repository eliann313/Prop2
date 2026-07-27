"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { alternarFavorito as alternarEnBase } from "@/features/favoritos/favoritoRepository";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const schema = z.object({ publicacionId: z.uuid() });

export type ResultadoFavorito = ResultadoAccion<{
  esFavorito?: boolean;
  requiereSesion?: boolean;
}>;

/**
 * Agrega o quita una publicación de los favoritos del usuario logueado.
 *
 * La sesión se lee ACÁ, del lado del servidor, y no llega como parámetro: un `usuarioId` que
 * viaja desde el cliente es un `usuarioId` que el cliente puede cambiar, y eso permitiría
 * escribirle favoritos a la cuenta de otro.
 */
export async function alternarFavorito(entrada: unknown): Promise<ResultadoFavorito> {
  const validacion = schema.safeParse(entrada);
  if (!validacion.success) return fallo("Publicación inválida.");

  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    // No se redirige desde la action: el botón vive dentro de un listado y una redirección
    // desde acá se llevaría puesto el scroll y el contexto. El cliente recibe el motivo y
    // decide — en este caso, mandar al login con el inmueble recordado.
    return {
      ok: false,
      mensaje: "Iniciá sesión para guardar favoritos.",
      datos: { requiereSesion: true },
    };
  }

  const { esFavorito } = await alternarEnBase(usuario.id, validacion.data.publicacionId);

  // La lista de favoritos queda vieja si no se revalida: es la única vista donde el cambio se
  // ve como una fila que aparece o desaparece, no como un corazón que cambia de color.
  revalidatePath(RUTAS.favoritos);

  return exito(undefined, { esFavorito });
}
