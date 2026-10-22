import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ETIQUETAS_TIPO_INMUEBLE } from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";
import { cn } from "@/shared/utils/cn";
import {
  formatearEquivalencia,
  formatearPrecio,
  formatearSuperficie,
  type Cotizacion,
} from "@/shared/utils/formato";
import { rutaDePublicacion } from "@/shared/utils/slug";

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
  /** Variante de diseño: "vertical" (por defecto en grillas) u "horizontal" (en listas de búsqueda). */
  variante?: "vertical" | "horizontal";
  className?: string;
};

export function TarjetaDePublicacion({
  publicacion,
  cotizacion,
  accion,
  noDisponible = false,
  variante = "vertical",
  className,
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

  const esHorizontal = variante === "horizontal";

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-[#e9e4e0] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        esHorizontal && "sm:flex-row",
        className,
      )}
    >
      {/* Botón de acción / favorito superpuesto en la esquina superior derecha */}
      {accion}

      {noDisponible ? (
        <Badge
          variant="outline"
          className="bg-background/95 text-foreground absolute top-3 left-3 z-10 text-xs font-semibold shadow-sm"
        >
          Ya no disponible
        </Badge>
      ) : null}

      <Link
        href={`${RUTAS.publicaciones}/${rutaDePublicacion(publicacion.id, publicacion.titulo)}`}
        className={cn(
          "flex flex-1 flex-col",
          esHorizontal && "sm:grid sm:grid-cols-[220px_1fr] sm:items-stretch",
          noDisponible && "opacity-60",
        )}
      >
        {/* Contenedor de la imagen */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-[#f3efe9]",
            esHorizontal
              ? "aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-[190px]"
              : "aspect-[16/10]",
          )}
        >
          {portada ? (
            <Image
              src={portada}
              alt={publicacion.titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f8f5f1] to-[#ede6dc] text-xs font-medium text-[#8a8390]">
              Sin foto
            </div>
          )}

          {/* Badge de Venta / Alquiler sobre la foto */}
          {!noDisponible && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md",
                  publicacion.operacion === "venta"
                    ? "bg-[#581845]/90 text-white"
                    : "bg-[#ffc300]/95 text-[#581845]",
                )}
              >
                {publicacion.operacion === "venta" ? "Venta" : "Alquiler"}
              </span>
            </div>
          )}
        </div>

        {/* Contenido de la tarjeta con espacio suficiente y sin texto cortado */}
        <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-2">
            {/* Precio principal y equivalencia */}
            <div>
              <p className="text-xl font-bold tracking-tight text-[#2b2530]">
                {formatearPrecio(publicacion.precio, moneda)}
                {publicacion.operacion === "alquiler" ? (
                  <span className="text-xs font-normal text-[#8a8390]"> / mes</span>
                ) : null}
              </p>
              {equivalencia ? (
                <p className="mt-0.5 text-xs text-[#8a8390]">{equivalencia}</p>
              ) : null}
            </div>

            {/* Título claro con hasta 2 líneas */}
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-[#2b2530] transition-colors group-hover:text-[#581845]">
              {publicacion.titulo}
            </h3>

            {/* Ubicación y tipo de inmueble */}
            <p className="flex items-center gap-1.5 text-xs text-[#8a8390]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#bd9a55]" />
              <span className="truncate">
                {ETIQUETAS_TIPO_INMUEBLE[
                  publicacion.tipoInmueble as keyof typeof ETIQUETAS_TIPO_INMUEBLE
                ] ?? publicacion.tipoInmueble}
                {" · "}
                {publicacion.barrio ? `${publicacion.barrio}, ` : ""}
                {publicacion.ciudad}
              </span>
            </p>
          </div>

          {/* Características / Detalles (ambientes, dorms, baños, m²) */}
          {detalles.length > 0 ? (
            <div className="mt-3 border-t border-[#f0ece7] pt-3 text-xs text-[#6b6572]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {detalles.map((detalle, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-[#d5cfc7]">•</span>}
                    <span>{detalle}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}
