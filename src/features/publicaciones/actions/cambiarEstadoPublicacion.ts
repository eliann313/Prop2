"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import {
  buscarEstadoDePublicacion,
  cambiarEstado,
} from "@/features/publicaciones/publicacionRepository";
import {
  MENSAJES_NO_PUBLICABLE,
  motivosParaNoPublicar,
  puedeTransicionar,
} from "@/features/publicaciones/services/publicacionService";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const schemaEntrada = z.object({
  id: z.uuid(),
  nuevoEstado: z.enum(["activa", "pausada", "eliminada"]),
});

/**
 * Publicar, pausar, reactivar o eliminar (6.2).
 *
 * `borrador` no está entre los destinos posibles a propósito: una publicación nace en borrador
 * y nunca vuelve. Editar una activa no la despublica — corregir una errata no debería sacar el
 * inmueble de los resultados de búsqueda.
 */
export async function cambiarEstadoPublicacion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario(RUTAS.dashboard);

  const validacion = schemaEntrada.safeParse(entrada);
  if (!validacion.success) return fallo("Acción inválida.");

  const { id, nuevoEstado } = validacion.data;

  const publicacion = await buscarEstadoDePublicacion(id, usuario.id);
  // Mismo mensaje para "no existe" y "no es tuya": distinguirlos permitiría averiguar qué ids
  // de publicación existen probando de a uno (8.19).
  if (!publicacion) return fallo("No encontramos esa publicación entre las tuyas.");

  const estadoActual = publicacion.estadoPublicacion;

  if (!puedeTransicionar(estadoActual, nuevoEstado)) {
    return fallo(`Una publicación ${estadoActual} no puede pasar a ${nuevoEstado}.`);
  }

  // Al publicar se exige la validación completa, más estricta que la de guardar un borrador:
  // un borrador puede estar a medias a propósito, pero una publicación visible sin precio o
  // sin foto ensucia los resultados de búsqueda de todos.
  if (nuevoEstado === "activa") {
    const motivos = motivosParaNoPublicar({
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      precio: Number(publicacion.precio),
      provincia: publicacion.provincia,
      ciudad: publicacion.ciudad,
      latitud: Number(publicacion.latitud),
      longitud: Number(publicacion.longitud),
      cantidadDeImagenes: publicacion._count.imagenes,
    });

    if (motivos.length > 0) {
      // Se devuelven todos los motivos juntos: corregir de a uno y reintentar tres veces es
      // una mala experiencia evitable.
      return fallo(
        `Falta completar algo antes de publicar: ${motivos
          .map((motivo) => MENSAJES_NO_PUBLICABLE[motivo])
          .join(" ")}`,
      );
    }
  }

  const aplicado = await cambiarEstado(
    id,
    usuario.id,
    nuevoEstado,
    // publishedAt se setea solo la primera vez. Si se pisara en cada reactivación, pausar y
    // reactivar sería una forma de saltar al principio del orden por "más recientes".
    nuevoEstado === "activa" && estadoActual === "borrador",
  );

  if (!aplicado) return fallo("No pudimos aplicar el cambio. Probá de nuevo.");

  revalidatePath(RUTAS.dashboard);

  const MENSAJES: Record<typeof nuevoEstado, string> = {
    activa: "Publicación activa. Ya aparece en las búsquedas.",
    pausada: "Publicación pausada. No aparece en las búsquedas.",
    eliminada: "Publicación eliminada.",
  };

  return exito(MENSAJES[nuevoEstado]);
}
