import Image from "next/image";
import Link from "next/link";

import { ETIQUETAS_TIPO_INMUEBLE } from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
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
};

export function TarjetaDePublicacion({ publicacion, cotizacion }: Props) {
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
    <Card className="overflow-hidden pt-0">
      <Link href={`/publicaciones/${publicacion.id}`} className="grid gap-3">
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
