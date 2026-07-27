import { z } from "zod";

// Validación del formulario de contacto (6.6). Única fuente de verdad: la usa el formulario en
// el cliente y la Server Action al recibir el payload.

export const schemaConsulta = z.object({
  publicacionId: z.uuid(),
  nombre: z
    .string()
    .trim()
    .min(2, "Escribí tu nombre")
    .max(80, "El nombre es demasiado largo"),
  email: z.email("Revisá el email").max(160),
  // Opcional: pedir el teléfono como obligatorio ahuyenta consultas que igual sirven.
  telefono: z.preprocess(
    (valor) => (valor === "" || valor === null ? undefined : valor),
    z.string().trim().max(40).optional(),
  ),
  mensaje: z
    .string()
    .trim()
    .min(10, "Contale al vendedor qué querés saber")
    .max(2000, "El mensaje es demasiado largo"),
  /**
   * Honeypot: un campo escondido por CSS que una persona nunca ve ni completa (6.6).
   *
   * Los bots simples llenan todos los inputs del formulario, así que cualquier valor acá es
   * señal de bot. Se valida como "tiene que venir vacío" en vez de ignorarlo: si algún día el
   * campo se rompe y empieza a llegar lleno, es mejor que falle a que deje de filtrar en
   * silencio.
   */
  sitioWeb: z.literal("", { message: "Formulario inválido" }).optional(),
});

export type EntradaConsulta = z.input<typeof schemaConsulta>;
export type DatosConsulta = z.output<typeof schemaConsulta>;
