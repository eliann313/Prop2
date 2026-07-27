import Link from "next/link";

import { AccionesDePublicacion } from "@/features/publicaciones/components/AccionesDePublicacion";
import type { PublicacionParaTarjeta } from "@/features/publicaciones/publicacionRepository";
import {
  ETIQUETAS_ESTADO_PUBLICACION,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatearPrecio, formatearSuperficie } from "@/shared/utils/formato";

type Props = {
  publicacion: PublicacionParaTarjeta;
};

const VARIANTE_POR_ESTADO = {
  borrador: "secondary",
  activa: "default",
  pausada: "outline",
  eliminada: "destructive",
} as const;

/**
 * Tarjeta de publicación en el dashboard del vendedor.
 *
 * Componente de servidor: no tiene interactividad propia. Lo único que necesita cliente son
 * los botones de estado, que están aislados en AccionesDePublicacion — así el JavaScript que
 * se manda al navegador es el de los botones, no el de toda la tarjeta.
 */
export function PublicacionCard({ publicacion }: Props) {
  // Prisma devuelve los Decimal como objeto para no perder precisión. Para mostrar alcanza con
  // pasarlo a number; los cálculos con dinero, si algún día hay, van del lado de la base.
  const precio = Number(publicacion.precio);
  const superficie = publicacion.superficieCubierta
    ? Number(publicacion.superficieCubierta)
    : null;

  const detalles = [
    publicacion.ambientes ? `${publicacion.ambientes} amb.` : null,
    publicacion.dormitorios ? `${publicacion.dormitorios} dorm.` : null,
    publicacion.banios ? `${publicacion.banios} baños` : null,
    superficie ? formatearSuperficie(superficie) : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{publicacion.titulo}</CardTitle>
          <Badge variant={VARIANTE_POR_ESTADO[publicacion.estadoPublicacion]}>
            {ETIQUETAS_ESTADO_PUBLICACION[publicacion.estadoPublicacion]}
          </Badge>
        </div>
        <p className="text-lg font-semibold">
          {formatearPrecio(precio, publicacion.moneda)}
          {publicacion.operacion === "alquiler" ? (
            <span className="text-muted-foreground text-sm font-normal"> / mes</span>
          ) : null}
        </p>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="text-muted-foreground grid gap-1 text-sm">
          <p>
            {ETIQUETAS_TIPO_INMUEBLE[publicacion.tipoInmueble]} ·{" "}
            {publicacion.barrio ? `${publicacion.barrio}, ` : ""}
            {publicacion.ciudad}, {publicacion.provincia}
          </p>
          {detalles.length > 0 ? <p>{detalles.join(" · ")}</p> : null}
          {publicacion.estadoPublicacion === "activa" ? (
            <p>{publicacion.vistas} visitas</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/publicaciones/${publicacion.id}/editar`}>Editar</Link>
          </Button>
          <AccionesDePublicacion
            publicacionId={publicacion.id}
            estado={publicacion.estadoPublicacion}
          />
        </div>
      </CardContent>
    </Card>
  );
}
