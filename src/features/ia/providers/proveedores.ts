import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import type { IAProvider } from "@/features/ia/providers/tipos";
import { env } from "@/shared/lib/serverEnv";

// Los tres adaptadores (7.1). Cada uno resuelve lo mismo con su propio SDK; el Vercel AI SDK
// normaliza la diferencia y `generateText` es idéntico para los tres.
//
// Los modelos son los del free tier de cada proveedor a julio de 2026. Si alguno cambia de
// nombre, este archivo es el único lugar donde tocarlo.

/** Tope de salida: la descripción pedida son 150-250 palabras (7.2), nunca un ensayo. */
const MAX_TOKENS = 700;

/**
 * Ocho segundos. Es un botón opcional dentro de un formulario: si el proveedor no contestó
 * para entonces, conviene pasar al siguiente antes que hacer esperar al vendedor.
 */
const TIMEOUT_MS = 8_000;

function crearProveedor(
  nombre: string,
  apiKey: string | undefined,
  construirModelo: (apiKey: string) => Parameters<typeof generateText>[0]["model"],
): IAProvider {
  return {
    nombre,
    disponible: Boolean(apiKey),
    async generarTexto(prompt) {
      if (!apiKey) throw new Error(`${nombre} no está configurado`);

      const { text } = await generateText({
        model: construirModelo(apiKey),
        prompt,
        maxOutputTokens: MAX_TOKENS,
        // Un poco de temperatura: con 0 las descripciones de dos departamentos parecidos salen
        // casi calcadas, y el vendedor nota que las escribió una máquina.
        temperature: 0.7,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      });

      return text;
    },
  };
}

export const PROVEEDORES: IAProvider[] = [
  crearProveedor("gemini", env.GOOGLE_GENERATIVE_AI_API_KEY, (apiKey) =>
    createGoogleGenerativeAI({ apiKey })("gemini-2.0-flash"),
  ),
  crearProveedor("groq", env.GROQ_API_KEY, (apiKey) =>
    createGroq({ apiKey })("llama-3.3-70b-versatile"),
  ),
  crearProveedor("openrouter", env.OPENROUTER_API_KEY, (apiKey) =>
    createOpenRouter({ apiKey })("meta-llama/llama-3.3-70b-instruct:free"),
  ),
];
