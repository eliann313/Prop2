"use server";

import { z } from "zod";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { geocodificar, type Coordenadas } from "@/shared/lib/geocodingNominatim";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { RUTAS } from "@/shared/rutas";
import { exito, fallo, type ResultadoAccion } from "@/shared/types/resultadoAccion";

const schemaEntrada = z.object({
  direccion: z.string().trim().max(160).optional(),
  ciudad: z.string().trim().min(2, "Ingresá la ciudad").max(80),
  provincia: z.string().trim().min(2, "Elegí la provincia").max(80),
});

/**
 * Paso 2 del wizard: convierte la dirección en coordenadas (5.2).
 *
 * Exige sesión aunque no toque datos de nadie: sin eso queda un proxy público y gratuito hacia
 * Nominatim, y el que termina bloqueado por abusar de su rate limit es este proyecto.
 */
export async function geocodificarDireccion(
  entrada: unknown,
): Promise<ResultadoAccion<Coordenadas>> {
  const usuario = await requerirUsuario(RUTAS.dashboard);

  const validacion = schemaEntrada.safeParse(entrada);
  if (!validacion.success) {
    return fallo(
      "Completá la ciudad y la provincia.",
      validacion.error.flatten().fieldErrors,
    );
  }

  // Nominatim admite 1 req/seg en total, así que un solo usuario dándole a "buscar" sin parar
  // afecta a todos los demás. Se reutiliza el limitador de emails: mismo orden de magnitud.
  const limite = await consumirIntento("emailTransaccional", `geocoding:${usuario.id}`);
  if (!limite.permitido) {
    return fallo(
      "Muchas búsquedas seguidas. Esperá unos segundos o cargá las coordenadas a mano.",
    );
  }

  const resultado = await geocodificar(validacion.data);

  if (!resultado.encontrado) {
    // No es un error del usuario: el wizard ofrece cargar las coordenadas a mano y seguir.
    return fallo(
      resultado.motivo === "sin-resultados"
        ? "No encontramos esa dirección. Probá con menos detalle, o cargá las coordenadas a mano."
        : "El servicio de mapas no responde ahora. Podés cargar las coordenadas a mano y seguir.",
    );
  }

  return exito(
    `Ubicación encontrada: ${resultado.coordenadas.etiqueta}`,
    resultado.coordenadas,
  );
}
