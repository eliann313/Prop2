import { z } from "zod";

// Única fuente de verdad de las validaciones de auth (14.3): estos schemas los usa tanto el
// formulario en el cliente (vía React Hook Form + zodResolver) como la Server Action en el
// servidor. Nunca se duplica una condición equivalente a mano en un componente.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Ingresá tu email")
  .email("Ese email no parece válido")
  .max(254, "El email es demasiado largo");

// bcrypt solo considera los primeros 72 bytes de la contraseña y descarta el resto sin
// avisar: dos contraseñas que difieren después del byte 72 son la misma para el hash. Por eso
// el máximo se rechaza en la validación, en vez de dejar que el usuario crea que su
// contraseña de 100 caracteres es más fuerte de lo que realmente es.
const MAX_BYTES_BCRYPT = 72;

const password = z
  .string()
  .min(10, "Usá al menos 10 caracteres")
  .refine(
    (valor) => new TextEncoder().encode(valor).length <= MAX_BYTES_BCRYPT,
    `La contraseña no puede superar los ${MAX_BYTES_BCRYPT} bytes`,
  )
  .refine((valor) => /[a-zA-Z]/.test(valor), "Incluí al menos una letra")
  .refine((valor) => /[0-9]/.test(valor), "Incluí al menos un número");

/**
 * Contraseña presente en filtraciones públicas (8.17). El chequeo NO puede vivir en el schema
 * —es una llamada de red y estos schemas corren también en el cliente—, pero el mensaje sí,
 * para que el registro y el reseteo respondan exactamente lo mismo.
 */
export const MENSAJE_PASSWORD_FILTRADA =
  "Esa contraseña aparece en filtraciones públicas de otros sitios. Elegí una distinta.";

export const schemaRegistro = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre")
    .max(80, "El nombre es demasiado largo"),
  email,
  password,
});

export const schemaLogin = z.object({
  email,
  // En login no se re-valida la política de contraseñas: la contraseña guardada puede haber
  // sido creada con una política anterior, y devolver "usá 10 caracteres" al intentar entrar
  // le confirmaría al atacante que ese email existe con una contraseña vieja.
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const schemaSolicitudRecuperacion = z.object({ email });

export const schemaRestablecerPassword = z
  .object({
    token: z.string().min(1, "Falta el token"),
    password,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  });

export const schemaReenviarVerificacion = z.object({ email });

export type DatosRegistro = z.infer<typeof schemaRegistro>;
export type DatosLogin = z.infer<typeof schemaLogin>;
export type DatosSolicitudRecuperacion = z.infer<typeof schemaSolicitudRecuperacion>;
export type DatosRestablecerPassword = z.infer<typeof schemaRestablecerPassword>;
export type DatosReenviarVerificacion = z.infer<typeof schemaReenviarVerificacion>;
