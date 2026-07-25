"use server";

import { signOut } from "@/features/auth/authJsInstance";
import { RUTAS } from "@/shared/rutas";

/**
 * Cerrar sesión es una Server Action y no un link a /api/auth/signout: como muta estado, tiene
 * que llegar por POST. Un GET que cierra sesión se dispara con un `<img src>` en cualquier
 * página de terceros (CSRF de bajo impacto, pero evitable sin costo). Las Server Actions solo
 * aceptan POST y llevan su propia protección CSRF.
 */
export async function cerrarSesion(): Promise<void> {
  await signOut({ redirectTo: RUTAS.home });
}
