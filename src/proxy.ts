import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authJsOptions } from "@/features/auth/authJsOptions";
import { RUTAS } from "@/shared/rutas";

// En Next.js 16 esto es `proxy.ts`, no `middleware.ts`: la convención se renombró para dejar
// claro que es una capa de red/routing y no un lugar donde poner lógica de negocio. El runtime
// es nodejs y no se puede configurar a edge.
//
// Instancia propia de Auth.js con las opciones SIN adapter ni providers: acá solo hace falta
// leer y verificar el JWT de la cookie, no tocar la base (ver authJsOptions.ts).
const { auth } = NextAuth(authJsOptions);

/**
 * Prefijos que requieren sesión. `roles` restringe además por rol; sin `roles`, alcanza con
 * estar autenticado.
 *
 * El dashboard NO pide rol vendedor a propósito: todo usuario arranca como comprador y pasa a
 * vendedor al crear su primera publicación (3.4). Exigir el rol acá dejaría al usuario recién
 * registrado sin poder entrar a crear justamente la publicación que se lo otorga.
 */
const RUTAS_PROTEGIDAS: { prefijo: string; roles?: readonly string[] }[] = [
  { prefijo: RUTAS.admin, roles: ["admin"] },
  { prefijo: RUTAS.dashboard },
];

/** Páginas de auth: si ya hay sesión, no tiene sentido mostrarlas. */
const RUTAS_SOLO_ANONIMOS: readonly string[] = [RUTAS.login, RUTAS.registro];

export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const sesion = request.auth;

  if (sesion && RUTAS_SOLO_ANONIMOS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.redirect(new URL(RUTAS.dashboard, request.nextUrl));
  }

  const protegida = RUTAS_PROTEGIDAS.find(({ prefijo }) => pathname.startsWith(prefijo));
  if (!protegida) return NextResponse.next();

  if (!sesion) {
    // Se preserva a dónde quería ir para volver ahí después del login. Solo se manda el
    // pathname+query, nunca una URL absoluta que venga de afuera: aceptar un destino
    // arbitrario sería un open redirect (tarjeta de 8.x).
    const login = new URL(RUTAS.login, request.nextUrl);
    login.searchParams.set("volverA", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (protegida.roles && !protegida.roles.includes(sesion.user.rol)) {
    return NextResponse.redirect(new URL(RUTAS.home, request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Se excluyen assets estáticos y las rutas de Auth.js. Sin esto el proxy correría también
  // sobre /api/auth/* y se metería en medio del callback de OAuth.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
