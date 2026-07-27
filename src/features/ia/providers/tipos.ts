// Contrato único de los proveedores de IA (7.1, patrón adaptador).
//
// Todo lo que consume IA depende de ESTA interfaz, no de Gemini ni de Groq. Agregar un cuarto
// proveedor mañana es escribir un adaptador que la cumpla: cero cambios en las Server Actions.

export type IAProvider = {
  /** Nombre corto, el que se loguea y el que se usa en IA_PROVIDER_ORDER. */
  nombre: string;
  /** ¿Tiene credenciales? Los que no, se saltean sin intentar la llamada. */
  disponible: boolean;
  generarTexto(prompt: string): Promise<string>;
};
