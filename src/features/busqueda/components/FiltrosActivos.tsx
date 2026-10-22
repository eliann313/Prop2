import Link from "next/link";
import { X } from "lucide-react";

import { ETIQUETAS_OPERACION, ETIQUETAS_TIPO_INMUEBLE } from "@/shared/catalogoInmuebles";
import { Button } from "@/shared/components/ui/button";
import { formatearPrecio, formatearSuperficie } from "@/shared/utils/formato";
import type { CriteriosDeBusqueda } from "@/features/busqueda/services/criteriosDeBusqueda";
import {
  construirQuery,
  type ParametrosDeUrl,
} from "@/features/busqueda/services/urlDeBusqueda";
import { RUTAS } from "@/shared/rutas";

type Props = {
  criterios: CriteriosDeBusqueda;
  parametros: ParametrosDeUrl;
};

type FiltroActivo = { clave: string; etiqueta: string };

/** Etiquetas legibles de los filtros presentes, sin incluir orden ni página. */
export function filtrosActivos(criterios: CriteriosDeBusqueda): FiltroActivo[] {
  const filtros: FiltroActivo[] = [];
  const agregar = (clave: string, etiqueta: string | undefined) => {
    if (etiqueta) filtros.push({ clave, etiqueta });
  };

  agregar("q", criterios.texto ? `Texto: ${criterios.texto}` : undefined);
  agregar(
    "operacion",
    criterios.operacion
      ? ETIQUETAS_OPERACION[criterios.operacion as keyof typeof ETIQUETAS_OPERACION]
      : undefined,
  );
  agregar(
    "tipo",
    criterios.tipo
      ? ETIQUETAS_TIPO_INMUEBLE[criterios.tipo as keyof typeof ETIQUETAS_TIPO_INMUEBLE]
      : undefined,
  );
  agregar("provincia", criterios.provincia);
  agregar("ciudad", criterios.ciudad ? `Ciudad: ${criterios.ciudad}` : undefined);
  agregar("barrio", criterios.barrio ? `Barrio: ${criterios.barrio}` : undefined);
  agregar(
    "moneda",
    criterios.moneda === "ARS"
      ? "Pesos"
      : criterios.moneda === "USD"
        ? "Dólares"
        : undefined,
  );
  agregar(
    "precioMin",
    criterios.precioMin === undefined
      ? undefined
      : `Desde ${formatearPrecio(criterios.precioMin, criterios.moneda === "ARS" ? "ARS" : "USD")}`,
  );
  agregar(
    "precioMax",
    criterios.precioMax === undefined
      ? undefined
      : `Hasta ${formatearPrecio(criterios.precioMax, criterios.moneda === "ARS" ? "ARS" : "USD")}`,
  );
  agregar(
    "ambientes",
    criterios.ambientesMin === undefined
      ? undefined
      : `${criterios.ambientesMin}+ ambientes`,
  );
  agregar(
    "dormitorios",
    criterios.dormitoriosMin === undefined
      ? undefined
      : `${criterios.dormitoriosMin}+ dormitorios`,
  );
  agregar(
    "banios",
    criterios.baniosMin === undefined ? undefined : `${criterios.baniosMin}+ baños`,
  );
  agregar("cochera", criterios.soloConCochera ? "Con cochera" : undefined);
  agregar(
    "superficieMin",
    criterios.superficieMin === undefined
      ? undefined
      : `Desde ${formatearSuperficie(criterios.superficieMin)}`,
  );
  agregar(
    "superficieMax",
    criterios.superficieMax === undefined
      ? undefined
      : `Hasta ${formatearSuperficie(criterios.superficieMax)}`,
  );

  return filtros;
}

export function FiltrosActivos({ criterios, parametros }: Props) {
  const filtros = filtrosActivos(criterios);
  if (filtros.length === 0) return null;

  return (
    <nav className="search-active-filters" aria-label="Filtros aplicados">
      <div className="search-active-filters-list">
        {filtros.map(({ clave, etiqueta }) => (
          <Link
            key={clave}
            href={`${RUTAS.publicaciones}${construirQuery(parametros, { [clave]: undefined })}`}
            className="search-active-filter"
            aria-label={`Quitar filtro: ${etiqueta}`}
          >
            <span>{etiqueta}</span>
            <X aria-hidden="true" />
          </Link>
        ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="search-clear-filters">
        <Link href={RUTAS.publicaciones}>Quitar todos</Link>
      </Button>
    </nav>
  );
}
