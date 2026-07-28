import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authJsOptions } from "@/features/auth/authJsOptions";
import { cspConNonce, cspSinNonce } from "@/shared/lib/csp";
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

/**
 * Rutas que se sirven cacheadas y por eso NO pueden llevar nonce (ver csp.ts): son las únicas
 * públicas y de solo lectura, y las únicas para las que 9.1 pide ISR.
 *
 * Se define por lo que ENTRA, no por lo que queda afuera: si mañana se agrega una ruta con
 * sesión, el default la deja del lado del nonce, que es el lado seguro. Al revés —listar las
 * que llevan nonce— olvidarse de una la dejaría con la política débil sin que nadie lo note.
 */
function esRutaCacheable(pathname: string): boolean {
  if (pathname === RUTAS.home) return true;
  // El detalle (`/publicaciones/<id>`), pero no el listado (`/publicaciones`), que depende de
  // los filtros de la URL y ya se renderiza dinámico.
  return pathname.startsWith(`${RUTAS.publicaciones}/`);
}

export const proxy = auth(async (request) => {
  const { pathname, search } = request.nextUrl;
  const sesion = request.auth;

  // El nonce se genera por request y solo para las rutas que no se cachean. Es lo que hace que
  // un script inyectado no pueda ejecutarse: no tiene forma de conocer este valor.
  const nonce = esRutaCacheable(pathname)
    ? null
    : Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = nonce ? cspConNonce(nonce) : cspSinNonce();

  /**
   * Adjunta la CSP a la respuesta. Todas las salidas de abajo pasan por acá: una rama que se
   * olvidara de hacerlo dejaría esa ruta sin política y nadie se enteraría hasta un pentest.
   *
   * Cuando hay nonce se reinyecta también en los headers de la REQUEST: así es como Next lo
   * descubre y se lo pone a sus propios `<script>`. Sin ese paso el nonce quedaría solo en la
   * respuesta, no coincidiría con nada, y la página no hidrataría.
   */
  function conCsp(respuesta: NextResponse): NextResponse {
    respuesta.headers.set("Content-Security-Policy", csp);
    return respuesta;
  }

  function seguir(): NextResponse {
    if (!nonce) return conCsp(NextResponse.next());

    const cabeceras = new Headers(request.headers);
    cabeceras.set("x-nonce", nonce);
    cabeceras.set("Content-Security-Policy", csp);
    return conCsp(NextResponse.next({ request: { headers: cabeceras } }));
  }

  // Antes que la lógica de sesión: el listado es público y no depende de estar logueado.
  if (pathname === RUTAS.publicaciones) {
    const respuesta = await limitarBusqueda(request);
    if (respuesta) return conCsp(respuesta);
  }

  if (sesion && RUTAS_SOLO_ANONIMOS.some((ruta) => pathname.startsWith(ruta))) {
    return conCsp(NextResponse.redirect(new URL(RUTAS.dashboard, request.nextUrl)));
  }

  const protegida = RUTAS_PROTEGIDAS.find(({ prefijo }) => pathname.startsWith(prefijo));
  if (!protegida) return seguir();

  if (!sesion) {
    // Se preserva a dónde quería ir para volver ahí después del login. Solo se manda el
    // pathname+query, nunca una URL absoluta que venga de afuera: aceptar un destino
    // arbitrario sería un open redirect (tarjeta de 8.x).
    const login = new URL(RUTAS.login, request.nextUrl);
    login.searchParams.set("volverA", `${pathname}${search}`);
    return conCsp(NextResponse.redirect(login));
  }

  if (protegida.roles && !protegida.roles.includes(sesion.user.rol)) {
    return conCsp(NextResponse.redirect(new URL(RUTAS.home, request.nextUrl)));
  }

  return seguir();
});

export const config = {
  // Se excluyen assets estáticos y las rutas de Auth.js. Sin esto el proxy correría también
  // sobre /api/auth/* y se metería en medio del callback de OAuth.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
