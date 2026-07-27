/**
 * Rutas de la app, en un solo lugar: las usan las páginas, los componentes de cliente, el proxy
 * y los redirects de Auth.js. Tenerlas como constantes evita que un string mal escrito en un
 * redirect produzca un bucle de redirecciones difícil de rastrear.
 *
 * Vive en shared/ y NO en features/auth/ por una razón concreta: los formularios de login y
 * registro son componentes de cliente y necesitan estas rutas. Cuando las constantes estaban en
 * authJsOptions.ts, importarlas desde el cliente arrastraba serverEnv al bundle del navegador,
 * donde AUTH_SECRET no existe — la validación de entorno explotaba y la hidratación se caía con
 * la página ya renderizada. Este archivo no importa nada, así que es seguro desde cualquier lado.
 */
export const RUTAS = {
  login: "/login",
  registro: "/registro",
  verificarEmail: "/verificar-email",
  recuperarPassword: "/recuperar-password",
  restablecerPassword: "/restablecer-password",
  publicaciones: "/publicaciones",
  favoritos: "/favoritos",
  dashboard: "/dashboard",
  admin: "/admin",
  home: "/",
} as const;
