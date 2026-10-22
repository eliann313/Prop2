"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { actualizarEstadoMensajeDelVendedor } from "@/features/contacto/mensajeContactoRepository";
import { ESTADOS_CONSULTA } from "@/features/contacto/consultasSchemas";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const schemaEstadoConsulta = z.object({
  mensajeId: z.uuid(),
  estado: z.enum(ESTADOS_CONSULTA),
});

/** Cambia el estado de una consulta solo si pertenece a una publicación de la sesión. */
export async function actualizarEstadoConsulta(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const usuario = await requerirUsuario(`${RUTAS.dashboard}/mensajes`);
  const validacion = schemaEstadoConsulta.safeParse(entrada);
  if (!validacion.success) return fallo("No se pudo actualizar la consulta.");

  try {
    const actualizada = await actualizarEstadoMensajeDelVendedor(
      usuario.id,
      validacion.data.mensajeId,
      validacion.data.estado,
    );
    if (!actualizada) return fallo("La consulta no existe o ya no está disponible.");

    revalidatePath(`${RUTAS.dashboard}/mensajes`);
    return exito("Estado de la consulta actualizado.");
  } catch {
    return fallo("No pudimos guardar el estado. Probá de nuevo en unos minutos.");
  }
}
