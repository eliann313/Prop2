import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ETIQUETAS_TIPO_INMUEBLE } from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import {
  formatearEquivalencia,
  formatearPrecio,
  formatearSuperficie,
  type Cotizacion,
} from "@/shared/utils/formato";

// Vive en shared/ y no en una feature porque la usan tres: la búsqueda, los favoritos y las
// "propiedades similares" del detalle (6.3/6.4/6.5). Es la tarjeta PÚBLICA — la del dashboard
// del vendedor es otra (features/publicaciones/components/PublicacionCard) y muestra otra cosa:
// estado, visitas y botones de edición. Mismo dato, dos lectores distintos.

export type PublicacionEnTarjeta = {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  operacion: string;
  tipoInmueble: string;
  provincia: string;
  ciudad: string;
  barrio: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  superficieCubierta: number | null;
  imagenUrl: string | null;
  imagenThumbnail: string | null;
};

type Props = {
  publicacion: PublicacionEnTarjeta;
  /** Null cuando el servicio de cotización no respondió: ahí no se muestra la equivalencia. */
  cotizacion: Cotizacion | null;
  /**
   * Control que se superpone a la foto — hoy, el botón de favorito.
   *
   * Entra como slot y no importando el botón acá: este componente vive en shared/ y el favorito
   * es una feature. Invertir la dependencia deja que la página, que ya conoce las dos cosas,
   * las junte — y de paso la tarjeta sigue sirviendo donde no haya favoritos.
   */
  accion?: ReactNode;
  /** Marca un favorito cuya publicación ya no está activa (6.5). */
  noDisponible?: boolean;
};

export function TarjetaDePublicacion({
  publicacion,
  cotizacion,
  accion,
  noDisponible = false,
}: Props) {
  const moneda = publicacion.moneda === "USD" ? "USD" : "ARS";
  const equivalencia = formatearEquivalencia(publicacion.precio, moneda, cotizacion);
  const portada = publicacion.imagenThumbnail ?? publicacion.imagenUrl;

  const detalles = [
    publicacion.ambientes ? `${publicacion.ambientes} amb.` : null,
    publicacion.dormitorios ? `${publicacion.dormitorios} dorm.` : null,
    publicacion.banios ? `${publicacion.banios} baños` : null,
    publicacion.superficieCubierta
      ? formatearSuperficie(publicacion.superficieCubierta)
      : null,
  ].filter(Boolean);

  return (
    <Card className="relative overflow-hidden pt-0">
      {/* Fuera del Link a propósito: un <button> adentro de un <a> es HTML inválido, y en la
          práctica hace que el click en el corazón navegue a la publicación. */}
      {accion}

      {noDisponible ? (
        <Badge variant="outline" className="bg-background/90 absolute top-2 left-2 z-10">
          Ya no disponible
        </Badge>
      ) : null}

      <Link
        href={`/publicaciones/${publicacion.id}`}
        className={cn("grid gap-3", noDisponible && "opacity-60")}
      >
        <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
          {portada ? (
            // `sizes` no es opcional con `fill`: sin él Next pide la imagen al ancho del
            // viewport, y en una grilla de tres columnas eso es descargar el triple de bytes
            // de los que se ven. Los valores siguen a los breakpoints de la grilla de abajo.
            <Image
              src={portada}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Sin foto
            </div>
          )}
        </div>

        <CardContent className="grid gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg leading-tight font-semibold">
                {formatearPrecio(publicacion.precio, moneda)}
                {publicacion.operacion === "alquiler" ? (
                  <span className="text-muted-foreground text-sm font-normal">
                    {" "}
                    / mes
                  </span>
                ) : null}
              </p>
              {/* La equivalencia va debajo y en chico a propósito: es un dato de referencia,
                  no el precio. El precio es el que cargó el vendedor, en su moneda. */}
              {equivalencia ? (
                <p className="text-muted-foreground text-xs">{equivalencia}</p>
              ) : null}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {publicacion.operacion === "venta" ? "Venta" : "Alquiler"}
            </Badge>
          </div>

          <p className="line-clamp-2 text-sm font-medium">{publicacion.titulo}</p>

          <p className="text-muted-foreground text-sm">
            {ETIQUETAS_TIPO_INMUEBLE[
              publicacion.tipoInmueble as keyof typeof ETIQUETAS_TIPO_INMUEBLE
            ] ?? publicacion.tipoInmueble}{" "}
            · {publicacion.barrio ? `${publicacion.barrio}, ` : ""}
            {publicacion.ciudad}
          </p>

          {detalles.length > 0 ? (
            <p className="text-muted-foreground text-sm">{detalles.join(" · ")}</p>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}
