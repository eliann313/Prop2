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
// Sobre los modelos: en Gemini va el ALIAS `gemini-flash-latest` y no una versión fija, que es
// lo contrario de lo que uno haría por reproducibilidad. El motivo es concreto y se descubrió
// probando: con una API key nueva, `gemini-2.0-flash` devuelve cuota `limit: 0` y
// `gemini-2.5-flash` contesta "no longer available to new users". Google va sacando los modelos
// viejos del free tier, así que fijar una versión garantiza que la función se rompa sola en
// algún momento, sin que nadie toque el código. El alias sigue al flash vigente.
//
// Lo que se paga a cambio: el modelo puede cambiar debajo sin un deploy, y con él el estilo de
// las descripciones. Para un texto que el vendedor edita igual antes de publicar, es un precio
// razonable frente a que el botón deje de andar.
//
// Los de Groq y OpenRouter no se pudieron verificar todavía por falta de credenciales: si
// alguno quedó viejo, el síntoma va a ser que ese proveedor falla y la cascada pasa al
// siguiente — que es exactamente para lo que está.

/**
 * Tope de salida, muy por encima de lo que ocupan 250 palabras (7.2) — y es a propósito.
 *
 * Los modelos flash actuales razonan antes de contestar, y ese razonamiento se descuenta del
 * MISMO presupuesto. Con 700 la descripción volvía cortada a mitad de frase y sin ningún error:
 * el modelo se había gastado los tokens pensando. Apagar el thinking sería más barato, pero la
 * config para hacerlo cambió entre versiones (`thinkingBudget: 0` lo rechaza el flash vigente
 * con "invalid argument"), y atarse a eso es volver a romperse en el próximo modelo. Un techo
 * holgado funciona con cualquiera.
 */
const MAX_TOKENS = 3_000;

/**
 * Veinticinco segundos.
 *
 * Arrancó en 8 y era demasiado poco: con el razonamiento del modelo, una descripción completa
 * tarda más que eso y la cascada la cortaba justo antes de recibirla — el peor resultado
 * posible, porque además quemaba la cuota igual. Sigue siendo un tope: si un proveedor se
 * cuelga, se pasa al siguiente en vez de dejar al vendedor esperando indefinidamente.
 *
 * El techo real es el límite de duración de las funciones de Vercel, así que no conviene
 * subirlo mucho más sin revisar ese número.
 */
const TIMEOUT_MS = 25_000;

function crearProveedor(
  nombre: string,
  apiKey: string | undefined,
  construirModelo: (apiKey: string) => Parameters<typeof generateText>[0]["model"],
  providerOptions?: Parameters<typeof generateText>[0]["providerOptions"],
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
        providerOptions,
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
    createGoogleGenerativeAI({ apiKey })("gemini-flash-latest"),
  ),
  crearProveedor("groq", env.GROQ_API_KEY, (apiKey) =>
    createGroq({ apiKey })("llama-3.3-70b-versatile"),
  ),
  crearProveedor("openrouter", env.OPENROUTER_API_KEY, (apiKey) =>
    createOpenRouter({ apiKey })("meta-llama/llama-3.3-70b-instruct:free"),
  ),
];
