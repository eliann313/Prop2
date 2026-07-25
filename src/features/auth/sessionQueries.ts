import { redirect } from "next/navigation";

import { auth } from "@/features/auth/authJsInstance";
import { RUTAS } from "@/shared/rutas";
import type { Rol } from "@/generated/prisma/enums";

/**
 * Helpers de autorización para componentes de servidor y Server Actions.
 *
 * Son la defensa real: el proxy es una comprobación optimista sobre el JWT (redirige rápido
 * para que el usuario no vea una pantalla que no le corresponde), pero no alcanza como
 * autorización — la propia documentación de Next lo dice. Toda página o action que toque datos
 * de un usuario tiene que volver a chequear acá, del lado del servidor.
 *
 * Se usa `redirect` y no las funciones `unauthorized()`/`forbidden()` de Next: en la versión
 * 16 siguen siendo experimentales y requieren activar el flag `authInterrupts`. El camino de
 * autorización de la app no debería depender de una API experimental.
 */

export async function obtenerSesion() {
  return auth();
}

export async function obtenerUsuarioActual() {
  const sesion = await auth();
  return sesion?.user ?? null;
}

/**
 * Exige sesión. Si no hay, manda al login.
 *
 * `volverA` es la ruta a la que se vuelve después de entrar. No se deduce sola porque un
 * componente de servidor no tiene acceso directo a la URL actual; quien llama la pasa cuando
 * le importa.
 */
export async function requerirUsuario(volverA?: string) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    const destino = volverA
      ? `${RUTAS.login}?volverA=${encodeURIComponent(volverA)}`
      : RUTAS.login;
    redirect(destino);
  }
  return usuario;
}

/** Exige que el rol del usuario esté entre los permitidos; si no, lo saca al home. */
export async function requerirRol(...rolesPermitidos: Rol[]) {
  const usuario = await requerirUsuario();
  if (!rolesPermitidos.includes(usuario.rol)) redirect(RUTAS.home);
  return usuario;
}

/**
 * Para las páginas de login/registro: si ya hay sesión, no tiene sentido mostrarlas.
 * Redirige en vez de cortar con un error, porque no es una falta de permisos.
 */
export async function redirigirSiYaHaySesion(destino: string = RUTAS.dashboard) {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect(destino);
}
