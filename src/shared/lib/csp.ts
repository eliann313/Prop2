/**
 * Content-Security-Policy (8.12), en dos variantes según la ruta.
 *
 * POR QUÉ DOS. La sección pide `script-src 'self'`, pero eso rompe la app tal cual está
 * escrito: el App Router inyecta scripts inline con el payload de RSC en cada respuesta, y sin
 * `'unsafe-inline'` ni un nonce el navegador los bloquea y la página no hidrata. Las dos
 * salidas reales tienen costo:
 *
 * - Con nonce la política es fuerte de verdad (un script inyectado no puede adivinarlo), pero
 *   el nonce tiene que ser único por request, y eso obliga a renderizar la página en cada
 *   visita — se pierde el ISR que 9.1 pide para la home y el detalle.
 * - Sin nonce hace falta `'unsafe-inline'`, que deja pasar cualquier script inline: la CSP
 *   sigue acotando de dónde se cargan recursos, pero deja de ser la segunda capa contra XSS
 *   que 8.12 dice que es.
 *
 * La resolución es por ruta, dándole a cada una la política más fuerte que puede sostener:
 * donde hay datos privados y acciones autenticadas (dashboard, admin, favoritos, auth) y donde
 * el render ya era dinámico igual (el listado, que depende de los filtros de la URL), va el
 * nonce. La home y el detalle —públicas, de solo lectura y las únicas que se benefician del
 * cacheado— se quedan sin nonce.
 *
 * Vale la pena ser explícito sobre qué protege eso último: en la home y el detalle, la defensa
 * contra XSS sigue siendo el escape automático de React (8.1), que es el mecanismo principal en
 * TODAS las páginas; lo que se resigna es la red de contención de más abajo, justamente en las
 * dos páginas que no ejecutan ninguna acción con sesión.
 */

/**
 * Orígenes externos que el navegador realmente necesita. Sale de recorrer el código de cliente,
 * no de copiar una lista genérica: cada entrada de más es superficie que la CSP deja de cerrar.
 *
 * - `res.cloudinary.com` sirve las fotos de las publicaciones (2.6).
 * - `tile.openstreetmap.org` sirve los tiles del mapa de Leaflet (2.9).
 * - `api.cloudinary.com` recibe la subida firmada, que va directo del navegador (5.5). Es el
 *   único destino de fetch fuera del propio dominio: el geocoding pega contra Nominatim desde
 *   el servidor, no desde el cliente.
 * - Vercel Web Analytics (2.15) no figura porque se sirve desde el propio dominio
 *   (`/_vercel/insights`), así que ya entra por `'self'`.
 */
const IMAGENES_EXTERNAS = "https://res.cloudinary.com https://tile.openstreetmap.org";
const FETCH_EXTERNOS = "https://api.cloudinary.com";

const DIRECTIVAS_COMUNES = [
  "default-src 'self'",
  // Tailwind emite CSS inline en el build, y Leaflet setea estilos inline al posicionar el
  // mapa. Ninguno de los dos sale de datos del usuario: no hay campo que permita definir
  // estilos propios, así que no hay superficie real de inyección de CSS (8.12).
  "style-src 'self' 'unsafe-inline'",
  // `blob:` es para la vista previa local de una foto antes de subirla; `data:` para los
  // iconos de marcador que Leaflet embebe.
  `img-src 'self' data: blob: ${IMAGENES_EXTERNAS}`,
  "font-src 'self' data:",
  `connect-src 'self' ${FETCH_EXTERNOS}`,
  // El equivalente moderno de X-Frame-Options: nadie puede embeber la plataforma (8.11).
  "frame-ancestors 'none'",
  // Sin esto, un `<base>` inyectado reescribe a dónde apuntan todas las URLs relativas.
  "base-uri 'self'",
  // Un formulario inyectado no puede postear las credenciales a un dominio ajeno.
  "form-action 'self'",
  "object-src 'none'",
];

/**
 * Variante fuerte. No lleva `'strict-dynamic'` a propósito: con esa palabra el navegador ignora
 * `'self'` y solo confía en lo que cargue un script ya nonceado. Sin ella, `'self'` sigue
 * cubriendo los bundles del propio dominio y el nonce cubre los inline — que es lo que hace
 * falta.
 *
 * No es una precaución teórica. Al verificarlo en el navegador, 28 de los 29 scripts de la
 * página llevaban el nonce que les pone Next; el que faltaba era el de Vercel Web Analytics,
 * que el paquete inyecta desde el cliente y por lo tanto nunca lo recibe. En producción ese
 * script se sirve del propio dominio, así que `'self'` lo habilita. Con `'strict-dynamic'`
 * habría quedado bloqueado, y el analytics habría dejado de reportar sin ningún error visible.
 */
export function cspConNonce(nonce: string): string {
  return [`script-src 'self' 'nonce-${nonce}'`, ...DIRECTIVAS_COMUNES].join("; ");
}

/** Variante para las rutas cacheables. Ver el porqué del `'unsafe-inline'` arriba. */
export function cspSinNonce(): string {
  return [`script-src 'self' 'unsafe-inline'`, ...DIRECTIVAS_COMUNES].join("; ");
}
