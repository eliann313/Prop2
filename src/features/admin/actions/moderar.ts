"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  cambiarEstadoDeUsuario,
  moderarPublicacion,
} from "@/features/admin/adminRepository";
import { requerirRol } from "@/features/auth/sessionQueries";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

// Acciones del panel de moderación (6.7).
//
// Las dos empiezan por `requerirRol("admin")` y no por la validación del payload: el orden
// importa. Validar primero significaría que alguien sin permisos puede distinguir un id que
// existe de uno que no por el mensaje de error que recibe.

const schemaPublicacion = z.object({
  publicacionId: z.uuid(),
  estado: z.enum(["activa", "pausada", "eliminada"]),
});

export async function moderarPublicacionAction(
  entrada: unknown,
): Promise<ResultadoAccion> {
  await requerirRol("admin");

  const validacion = schemaPublicacion.safeParse(entrada);
  if (!validacion.success) return fallo("Datos inválidos.");

  const ok = await moderarPublicacion(
    validacion.data.publicacionId,
    validacion.data.estado,
  );
  if (!ok) return fallo("La publicación ya no existe.");

  revalidatePath(RUTAS.admin);
  // También la vista pública: una publicación pausada por un admin tiene que desaparecer de
  // la búsqueda sin esperar a que expire la caché.
  revalidatePath(RUTAS.publicaciones);

  return exito("Estado actualizado.");
}

const schemaUsuario = z.object({
  usuarioId: z.uuid(),
  estado: z.enum(["activo", "baneado"]),
});

export async function cambiarEstadoDeUsuarioAction(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const admin = await requerirRol("admin");

  const validacion = schemaUsuario.safeParse(entrada);
  if (!validacion.success) return fallo("Datos inválidos.");

  // Un admin que se banea a sí mismo se deja afuera del panel y no puede volver a entrar sin
  // tocar la base a mano. Es un accidente barato de prevenir acá y caro de revertir después.
  if (validacion.data.usuarioId === admin.id) {
    return fallo("No podés cambiar el estado de tu propia cuenta.");
  }

  const ok = await cambiarEstadoDeUsuario(
    validacion.data.usuarioId,
    validacion.data.estado,
  );
  if (!ok) return fallo("El usuario ya no existe.");

  revalidatePath(RUTAS.admin);
  return exito(
    validacion.data.estado === "baneado" ? "Usuario baneado." : "Usuario reactivado.",
  );
}
