import "server-only";

import { PROVEEDORES } from "@/features/ia/providers/proveedores";
import {
  ejecutarConFallback as ejecutarCascada,
  ordenarProveedores,
  type ResultadoIA,
} from "@/features/ia/services/cascada";
import { env } from "@/shared/lib/serverEnv";

// `IAService` de 7.1, la parte que toca infraestructura: resuelve QUÉ proveedores hay y en qué
// orden. La lógica de recorrerlos y quedarse con el primero que conteste es dominio puro y vive
// en services/cascada.
//
// Vive en la raíz de la feature y no en services/ porque lee variables de entorno y arrastra
// los SDKs de los proveedores: services/ tiene que poder testearse sin nada de eso.

const ORDEN_POR_DEFECTO = "gemini,groq,openrouter";

export async function ejecutarConFallback(prompt: string): Promise<ResultadoIA> {
  const proveedores = ordenarProveedores(
    PROVEEDORES,
    env.IA_PROVIDER_ORDER ?? ORDEN_POR_DEFECTO,
  );

  return ejecutarCascada(proveedores, prompt);
}
