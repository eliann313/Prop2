import { refrescarSesion } from "@/features/auth/authJsInstance";

/**
 * Vuelve a emitir el JWT de la sesión actual releyendo el rol y el estado desde la base.
 *
 * Hace falta porque la estrategia de sesión es JWT: el rol viaja firmado dentro del token y no
 * se consulta contra la base en cada request. Cuando el rol CAMBIA mientras el usuario está
 * logueado —el caso concreto es el ascenso comprador→vendedor al publicar por primera vez
 * (3.4)— la base queda actualizada pero la sesión sigue diciendo "comprador" hasta que el
 * usuario cierra sesión y vuelve a entrar. Sin esto, el dashboard muestra el rol viejo justo
 * después de la acción que lo cambió.
 *
 * Internamente dispara el callback `jwt` con `trigger: "update"`, que es donde se relee el rol
 * (ver authJsInstance). Por eso alcanza con invocarlo sin datos: no se le pasa el rol nuevo
 * desde afuera, se relee del origen de verdad.
 *
 * `unstable_update` es la API que expone Auth.js v5 para esto. Se envuelve acá, en un solo
 * lugar, para que el día que se estabilice o cambie de nombre haya un único archivo que tocar.
 */
export async function refrescarRolEnSesion(): Promise<void> {
  await refrescarSesion({});
}
