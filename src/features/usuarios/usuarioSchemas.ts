import { z } from "zod";

/**
 * Acepta teléfonos internacionales con separadores visuales y los guarda en E.164.
 * Para un móvil argentino se debe incluir el 9 internacional: +54 9 11 2345-6789.
 * Para un fijo argentino, se usa +54 11 2345-6789. No se infiere el tipo de línea ni el país.
 */
export const schemaTelefonoPerfil = z
  .string()
  .trim()
  .max(40, "El teléfono es demasiado largo")
  .transform((valor, contexto) => {
    if (!valor) return null;

    // Solo quitamos separadores comunes. No borramos letras u otros caracteres inválidos.
    if (!/^\+[0-9\s().-]+$/.test(valor)) {
      contexto.addIssue({
        code: "custom",
        message: "Usá el formato internacional con + y el código de país",
      });
      return z.NEVER;
    }

    const normalizado = valor.replace(/[\s().-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizado)) {
      contexto.addIssue({
        code: "custom",
        message: "Ingresá un teléfono internacional válido (entre 8 y 15 dígitos)",
      });
      return z.NEVER;
    }

    return normalizado;
  });

export const schemaPerfilUsuario = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Ingresá tu nombre")
      .max(80, "El nombre es demasiado largo"),
    telefono: schemaTelefonoPerfil,
  })
  .strict();

export type DatosPerfilUsuario = z.infer<typeof schemaPerfilUsuario>;
export type EntradaPerfilUsuario = z.input<typeof schemaPerfilUsuario>;
