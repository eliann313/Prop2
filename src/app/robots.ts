import type { MetadataRoute } from "next";

import { urlAbsoluta } from "@/shared/lib/urlBase";
import { RUTAS } from "@/shared/rutas";

/**
 * robots.txt (9.1).
 *
 * Se bloquea el dashboard, el admin y las rutas de auth. No es por seguridad —quien quiera
 * entrar no va a pedirle permiso a un archivo de texto, y la autorización real vive en el
 * servidor (8.6)— sino porque ninguna de esas URLs aporta nada en un resultado de búsqueda: son
 * pantallas privadas o formularios. En el caso de `/admin`, además, no hay motivo para
 * publicarle a un buscador dónde está el panel.
 *
 * Lo que sí tiene que indexarse es lo que genera tráfico real: la home y las publicaciones.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        `${RUTAS.dashboard}/`,
        `${RUTAS.admin}/`,
        `${RUTAS.favoritos}/`,
        `${RUTAS.login}`,
        `${RUTAS.registro}`,
        `${RUTAS.verificarEmail}`,
        `${RUTAS.recuperarPassword}`,
        `${RUTAS.restablecerPassword}`,
      ],
    },
    // Absoluta y no relativa: la spec de robots.txt exige URL completa en esta directiva, y es
    // la forma en que el buscador descubre el sitemap sin que haya que darlo de alta a mano.
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
