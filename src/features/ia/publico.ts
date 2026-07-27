/**
 * Superficie pública de la feature de IA: lo único que otras features pueden importar.
 *
 * Todo lo demás —los adaptadores de cada proveedor, la cascada de fallback, el prompt— queda
 * privado. Eso no es formalismo: si `publicaciones` pudiera importar el adaptador de Gemini
 * directo, se saltearía el fallback a Groq y OpenRouter, y la primera caída de Gemini dejaría
 * el botón muerto en vez de degradar al siguiente proveedor.
 *
 * Vive en la raíz de la feature por un detalle de la regla de ESLint que lo permite: los
 * patrones de `no-restricted-imports` son estilo gitignore, y ahí no se puede re-incluir un
 * archivo cuyo directorio padre está excluido. `@/features/ia/**` cubre `ia/components/`, así
 * que un `!@/features/ia/components/X` no tiene efecto — pero un archivo suelto en `ia/` sí.
 * Es el mismo motivo por el que el kernel de identidad expone `sessionQueries` desde la raíz.
 */
export { BotonGenerarDescripcion } from "@/features/ia/components/BotonGenerarDescripcion";
