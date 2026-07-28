import type { MetadataRoute } from "next";

import { listarPublicacionesParaSitemap } from "@/features/publicaciones/publicacionRepository";
import { urlAbsoluta } from "@/shared/lib/urlBase";
import { RUTAS } from "@/shared/rutas";
import { rutaDePublicacion } from "@/shared/utils/slug";

/**
 * Se regenera cada hora. Sin esto el sitemap se congelaría en el build y una publicación nueva
 * no aparecería hasta el próximo deploy — que en un proyecto que no deploya todos los días
 * puede ser semanas.
 */
export const revalidate = 3600;

/**
 * sitemap.xml (9.1).
 *
 * Solo entran home, listado y las publicaciones ACTIVAS: el filtro de estado lo hace la query
 * (ver el repositorio), no un `.filter()` acá. Un sitemap que liste borradores o pausadas le
 * entrega a Google URLs que devuelven 404, y eso degrada la confianza en el resto del archivo.
 *
 * No se incluye el dashboard ni el admin, que además están bloqueados en robots.ts: pedirle a
 * Google que rastree algo que robots.txt le prohíbe es mandarle señales contradictorias.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicaciones = await listarPublicacionesParaSitemap();

  return [
    {
      url: urlAbsoluta(RUTAS.home),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: urlAbsoluta(RUTAS.publicaciones),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...publicaciones.map((publicacion) => ({
      // La URL canónica con slug, la misma que declara la página en `alternates.canonical`:
      // si el sitemap apuntara al UUID pelado, cada entrada sería un redirect 308 y Google
      // tendría que dar dos saltos para llegar al contenido.
      url: urlAbsoluta(
        `${RUTAS.publicaciones}/${rutaDePublicacion(publicacion.id, publicacion.titulo)}`,
      ),
      // `updatedAt` y no `publishedAt`: lo que le interesa al buscador es cuándo cambió el
      // contenido por última vez, no cuándo se publicó por primera vez.
      lastModified: publicacion.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
