import { RangoDePrecio } from "@/features/busqueda/components/RangoDePrecio";
import type { RangoDePrecios } from "@/features/busqueda/publicacionBusquedaRepository";
import type { CriteriosDeBusqueda } from "@/features/busqueda/services/criteriosDeBusqueda";
import { ETIQUETAS_ORDEN, ORDENES } from "@/features/busqueda/busquedaSchemas";
import {
  ETIQUETAS_TIPO_INMUEBLE,
  PROVINCIAS,
  TIPOS_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RUTAS } from "@/shared/rutas";
import {
  ArrowLeftRight,
  BedDouble,
  Building2,
  CarFront,
  DollarSign,
  Grid2X2,
  ListFilter,
  MapPin,
  Search,
} from "lucide-react";

// Formulario de filtros: un <form method="GET"> nativo, no estado de cliente.
//
// El navegador arma la query string solo, así que los filtros terminan en la URL sin una línea
// de JavaScript — que es lo que 6.3 pide (búsqueda compartible, botón "atrás" funcionando) y de
// paso hace que la página ande antes de hidratar y sin JS.
//
// Los <select> son nativos y no el Select de shadcn: el de shadcn es Radix, renderiza un botón
// con un portal y NO manda un valor en un formulario nativo. Habría que sostenerlo con estado
// de cliente e inputs ocultos, o sea perder exactamente lo que este enfoque gana.

const CLASES_SELECT = "search-filter-control";

type Props = {
  criterios: CriteriosDeBusqueda;
  rango: RangoDePrecios;
  ciudades: string[];
};

/** Los mínimos que se ofrecen para ambientes y dormitorios. */
const MINIMOS = [1, 2, 3, 4, 5];

export function FormularioDeFiltros({ criterios, rango, ciudades }: Props) {
  // La moneda del rango: la elegida, o el default por operación. Las ventas se publican casi
  // siempre en dólares y los alquileres en pesos, pero es un DEFAULT y no una regla — el modelo
  // acepta las dos monedas para las dos operaciones, porque el mercado también.
  const moneda =
    criterios.moneda === "ARS" || criterios.moneda === "USD"
      ? criterios.moneda
      : criterios.operacion === "alquiler"
        ? "ARS"
        : "USD";

  return (
    <form method="GET" action={RUTAS.publicaciones} className="search-filter-form">
      <div className="search-filter-field">
        <Label htmlFor="q" className="search-filter-label">
          <Search aria-hidden="true" />
          Buscar
        </Label>
        <Input
          id="q"
          name="q"
          type="search"
          placeholder="Casa con patio, monoambiente…"
          defaultValue={criterios.texto ?? ""}
        />
      </div>

      <div className="search-filter-field">
        <Label htmlFor="operacion" className="search-filter-label">
          <ArrowLeftRight aria-hidden="true" />
          Operación
        </Label>
        <select
          id="operacion"
          name="operacion"
          defaultValue={criterios.operacion ?? ""}
          className={CLASES_SELECT}
        >
          <option value="">Venta y alquiler</option>
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
        </select>
      </div>

      <div className="search-filter-field">
        <Label htmlFor="tipo" className="search-filter-label">
          <Building2 aria-hidden="true" />
          Tipo
        </Label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={criterios.tipo ?? ""}
          className={CLASES_SELECT}
        >
          <option value="">Cualquiera</option>
          {TIPOS_INMUEBLE.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS_TIPO_INMUEBLE[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div className="search-filter-field">
        <Label htmlFor="provincia" className="search-filter-label">
          <MapPin aria-hidden="true" />
          Provincia
        </Label>
        <select
          id="provincia"
          name="provincia"
          defaultValue={criterios.provincia ?? ""}
          className={CLASES_SELECT}
        >
          <option value="">Todas</option>
          {PROVINCIAS.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
      </div>

      {/* Las ciudades salen de la base, no de un catálogo fijo: el filtro compara por igualdad
          exacta para poder usar el índice, así que ofrecer una ciudad que nadie cargó sería
          ofrecer un filtro que garantiza cero resultados. */}
      {ciudades.length > 0 ? (
        <div className="search-filter-field">
          <Label htmlFor="ciudad" className="search-filter-label">
            <Building2 aria-hidden="true" />
            Ciudad
          </Label>
          <select
            id="ciudad"
            name="ciudad"
            defaultValue={criterios.ciudad ?? ""}
            className={CLASES_SELECT}
          >
            <option value="">Todas</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="search-filter-options">
        <legend className="search-filter-label">
          <DollarSign aria-hidden="true" />
          Moneda
        </legend>
        <div>
          {(["USD", "ARS"] as const).map((opcion) => (
            <label key={opcion}>
              <input
                type="radio"
                name="moneda"
                value={opcion}
                defaultChecked={moneda === opcion}
                className="accent-primary"
              />
              {opcion === "USD" ? "Dólares" : "Pesos"}
            </label>
          ))}
        </div>
        <p>El rango de precio aplica sobre publicaciones en esta moneda.</p>
      </fieldset>

      {/* Sin publicaciones en esta moneda no hay rango que mostrar, y con una sola el mínimo y
          el máximo coinciden: un slider ahí no ofrece ninguna decisión. */}
      {rango && rango.maximo > rango.minimo ? (
        <RangoDePrecio
          minimo={rango.minimo}
          maximo={rango.maximo}
          moneda={moneda}
          valorInicialMin={criterios.precioMin}
          valorInicialMax={criterios.precioMax}
        />
      ) : null}

      <div className="search-filter-columns">
        <div className="search-filter-field">
          <Label htmlFor="ambientes" className="search-filter-label">
            <Grid2X2 aria-hidden="true" />
            Ambientes
          </Label>
          <select
            id="ambientes"
            name="ambientes"
            defaultValue={criterios.ambientesMin?.toString() ?? ""}
            className={CLASES_SELECT}
          >
            <option value="">Cualquiera</option>
            {MINIMOS.map((minimo) => (
              <option key={minimo} value={minimo}>
                {minimo}+
              </option>
            ))}
          </select>
        </div>

        <div className="search-filter-field">
          <Label htmlFor="dormitorios" className="search-filter-label">
            <BedDouble aria-hidden="true" />
            Dormitorios
          </Label>
          <select
            id="dormitorios"
            name="dormitorios"
            defaultValue={criterios.dormitoriosMin?.toString() ?? ""}
            className={CLASES_SELECT}
          >
            <option value="">Cualquiera</option>
            {MINIMOS.map((minimo) => (
              <option key={minimo} value={minimo}>
                {minimo}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="search-filter-checkbox">
        <input
          type="checkbox"
          name="cochera"
          value="1"
          defaultChecked={criterios.soloConCochera}
          className="accent-primary size-4"
        />
        <CarFront aria-hidden="true" />
        Con cochera
      </label>

      <div className="search-filter-field">
        <Label htmlFor="orden" className="search-filter-label">
          <ListFilter aria-hidden="true" />
          Ordenar por
        </Label>
        <select
          id="orden"
          name="orden"
          defaultValue={criterios.orden}
          className={CLASES_SELECT}
        >
          {ORDENES.map((orden) => (
            <option key={orden} value={orden}>
              {ETIQUETAS_ORDEN[orden]}
            </option>
          ))}
        </select>
      </div>

      <div className="search-filter-actions flex flex-wrap gap-2">
        <Button type="submit">Aplicar filtros</Button>
        <Button asChild variant="ghost">
          <a href={RUTAS.publicaciones}>Limpiar</a>
        </Button>
      </div>
    </form>
  );
}
