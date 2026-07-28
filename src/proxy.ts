import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authJsOptions } from "@/features/auth/authJsOptions";
import { consumirIntento } from "@/shared/lib/rateLimiters";
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
  // Los favoritos son de un usuario: sin sesión no hay nada que mostrar. La página igual
  // vuelve a exigirla del lado del servidor — esto solo evita el parpadeo.
  { prefijo: RUTAS.favoritos },
];

/** Páginas de auth: si ya hay sesión, no tiene sentido mostrarlas. */
const RUTAS_SOLO_ANONIMOS: readonly string[] = [RUTAS.login, RUTAS.registro];

/**
 * Limita el listado de búsqueda por IP (8.10).
 *
 * Va acá y no en la página porque es exactamente lo que el proxy es: capa de red. Y solo sobre
 * el listado, no sobre el detalle — el detalle se sirve por id y es cacheable, el listado
 * arma una query distinta por combinación de filtros.
 *
 * Devuelve `null` cuando se puede seguir. Nunca lanza: si Upstash no contesta, `consumirIntento`
 * ya deja pasar (misma decisión deliberada que en el login).
 */
async function limitarBusqueda(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonimo";
  const { permitido, reintentarEnSegundos } = await consumirIntento("busqueda", ip);
  if (permitido) return null;

  // 429 con Retry-After y no una página de error: un cliente automático entiende la cabecera, y
  // un buscador la interpreta como "volvé más tarde" en vez de como una URL rota.
  return new NextResponse("Demasiadas búsquedas seguidas.", {
    status: 429,
    headers: { "Retry-After": String(reintentarEnSegundos) },
  });
}

export const proxy = auth(async (request) => {
  const { pathname, search } = request.nextUrl;
  const sesion = request.auth;

  // Antes que la lógica de sesión: el listado es público y no depende de estar logueado.
  if (pathname === RUTAS.publicaciones) {
    const respuesta = await limitarBusqueda(request);
    if (respuesta) return respuesta;
  }

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
