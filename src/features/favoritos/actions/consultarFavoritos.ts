"use server";

import { z } from "zod";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { idsFavoritosDe } from "@/features/favoritos/favoritoRepository";

// Cuántos ids admite una consulta. Es el techo de lo que puede haber en una página: el listado
// pagina de a 12 y el detalle muestra 6 similares. El límite existe para que nadie use esta
// action como una forma barata de preguntar por miles de ids en un solo pedido.
const MAX_IDS = 100;

const schema = z.object({ ids: z.array(z.uuid()).max(MAX_IDS) });

/**
 * Cuáles de estas publicaciones son favoritas del usuario logueado.
 *
 * Existe para que la home y el detalle puedan cachearse (9.1): mientras el estado del corazón se
 * resolviera en el servidor, esas páginas dependían de la sesión y no podían servirse desde un
 * cache compartido. Ahora el HTML sale igual para todos y el estado por usuario lo pide el
 * cliente después de montar.
 *
 * Sin sesión devuelve la lista vacía en vez de un error: no estar logueado no es una falla, y
 * el visitante anónimo simplemente no tiene favoritos que marcar.
 *
 * La sesión se lee acá y no llega por parámetro, igual que en `alternarFavorito`: un usuarioId
 * que viaja desde el cliente permitiría leer los favoritos de la cuenta de otro.
 */
export async function consultarFavoritos(entrada: unknown): Promise<string[]> {
  const validacion = schema.safeParse(entrada);
  if (!validacion.success) return [];

  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const favoritos = await idsFavoritosDe(usuario.id, validacion.data.ids);
  return [...favoritos];
}
