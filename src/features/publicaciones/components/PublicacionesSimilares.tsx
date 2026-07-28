import { publicacionesSimilares } from "@/features/publicaciones/publicacionRepository";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
import type { Cotizacion } from "@/shared/utils/formato";

/**
 * "Propiedades similares" del detalle (6.4), aislado para poder envolverlo en `Suspense` (9.2).
 *
 * Es la consulta más cara de la página y la menos urgente: compara tipo, operación, ciudad,
 * moneda y un rango de precio, y vive al final, fuera de la primera pantalla. Mientras se
 * resolvía junto al resto, la ficha del inmueble —que es lo que la persona vino a leer— no se
 * pintaba hasta que esta terminaba.
 *
 * Separado, el servidor manda la página completa de entrada y este bloque llega en streaming
 * cuando está listo. El tiempo total no baja; lo que baja es cuánto tarda en verse el contenido
 * principal, que es lo que mide el LCP.
 */

type Props = {
  publicacion: Parameters<typeof publicacionesSimilares>[0];
  /** Puede faltar: la cotización sale de un servicio externo que degrada con gracia. */
  cotizacion: Cotizacion | null;
};

export async function PublicacionesSimilares({ publicacion, cotizacion }: Props) {
  const similares = await publicacionesSimilares(publicacion);

  // Sin similares no se muestra ni el título: una sección vacía con un encabezado se lee como
  // que algo falló.
  if (similares.length === 0) return null;

  return (
    <section className="grid gap-4 border-t pt-8">
      <h2 className="text-xl font-semibold tracking-tight">Publicaciones similares</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {similares.map((similar) => (
          <TarjetaDePublicacion
            key={similar.id}
            publicacion={{
              id: similar.id,
              titulo: similar.titulo,
              precio: Number(similar.precio),
              moneda: similar.moneda,
              operacion: similar.operacion,
              tipoInmueble: similar.tipoInmueble,
              provincia: similar.provincia,
              ciudad: similar.ciudad,
              barrio: similar.barrio,
              ambientes: similar.ambientes,
              dormitorios: similar.dormitorios,
              banios: similar.banios,
              superficieCubierta: similar.superficieCubierta
                ? Number(similar.superficieCubierta)
                : null,
              imagenUrl: similar.imagenes[0]?.url ?? null,
              imagenThumbnail: similar.imagenes[0]?.urlThumbnail ?? null,
            }}
            cotizacion={cotizacion}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Placeholder con la MISMA altura y grilla que el contenido real. Es lo que evita que la página
 * salte cuando llega el bloque, que es exactamente lo que penaliza el CLS (9.2): un skeleton más
 * bajo que el contenido empuja todo hacia abajo al reemplazarse.
 */
export function SimilaresCargando() {
  return (
    <section className="grid gap-4 border-t pt-8">
      <div className="bg-muted h-7 w-64 animate-pulse rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((posicion) => (
          <div key={posicion} className="grid gap-3">
            <div className="bg-muted aspect-[4/3] w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
