import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { BotonFavorito } from "@/features/favoritos/components/BotonFavorito";
import { FavoritosProvider } from "@/features/favoritos/components/FavoritosProvider";
import { FormularioDeFiltros } from "@/features/busqueda/components/FormularioDeFiltros";
import { FiltrosActivos } from "@/features/busqueda/components/FiltrosActivos";
import { Paginador } from "@/features/busqueda/components/Paginador";
import {
  buscarPublicaciones,
  rangoDePrecios,
  ubicacionesDisponibles,
} from "@/features/busqueda/publicacionBusquedaRepository";
import {
  construirCriterios,
  hayFiltrosAplicados,
  totalDePaginas,
} from "@/features/busqueda/services/criteriosDeBusqueda";
import { construirQuery } from "@/features/busqueda/services/urlDeBusqueda";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
import { Button } from "@/shared/components/ui/button";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { RUTAS } from "@/shared/rutas";

export const metadata: Metadata = {
  title: "Buscar inmuebles",
  description:
    "Buscá casas, departamentos, PH y terrenos en venta o alquiler en toda Argentina. Filtrá por zona, precio, ambientes y superficie.",
  // La canónica apunta al listado SIN filtros: cada combinación de searchParams genera una URL
  // distinta con contenido casi idéntico, y sin esto Google las trataría como miles de páginas
  // separadas compitiendo entre sí. La que tiene que rankear es esta.
  alternates: { canonical: RUTAS.publicaciones },
};

/** Solo los strings: los searchParams repetidos ya los resuelve parsearFiltros. */
function aParametros(searchParams: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([clave, valor]) => [
      clave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );
}

export default async function PaginaPublicaciones(props: PageProps<"/publicaciones">) {
  // En Next 16 `searchParams` es una Promise (ver el comentario de la página de login).
  const searchParams = await props.searchParams;
  const criterios = construirCriterios(parsearFiltros(searchParams));

  const moneda = criterios.moneda === "ARS" ? "ARS" : "USD";

  const [pagina, cotizacion, rango, ubicaciones] = await Promise.all([
    buscarPublicaciones(criterios),
    obtenerCotizacion(),
    rangoDePrecios(moneda, criterios.operacion),
    ubicacionesDisponibles(criterios.provincia),
  ]);

  // Cuántas quedan afuera por el filtro de moneda. Solo se pregunta cuando ese filtro está
  // activo: sin él no hay nada escondido. Es lo que evita que acotar por moneda oculte
  // inventario en silencio — el usuario ve que existe y cambia con un click.
  const otraMoneda = moneda === "USD" ? "ARS" : "USD";
  const enLaOtraMoneda = criterios.moneda
    ? (await buscarPublicaciones({ ...criterios, moneda: otraMoneda, offset: 0 })).total
    : 0;

  const paginas = totalDePaginas(pagina.total);
  const parametros = aParametros(searchParams);
  const filtrando = hayFiltrosAplicados(criterios);

  // Una página fuera de rango sigue conservando el total real en el repositorio. Si todavía
  // hay coincidencias, se lleva al visitante a la última página válida manteniendo sus filtros.
  if (pagina.total > 0 && criterios.pagina > paginas) {
    redirect(
      `${RUTAS.publicaciones}${construirQuery(parametros, {
        pagina: String(paginas),
      })}`,
    );
  }

  // La búsqueda entera se preserva para volver acá después del login.
  const volverA = `${RUTAS.publicaciones}${construirQuery(parametros, {})}`;

  return (
    <FavoritosProvider idsEnPagina={pagina.resultados.map((resultado) => resultado.id)}>
      <div className="search-page">
        <aside className="search-filters">
          <details className="search-filters-disclosure">
            <summary
              className="search-filters-summary"
              aria-controls="search-filter-content"
            >
              <span className="search-filters-summary-title">Filtros de búsqueda</span>
              <span className="search-filters-summary-count">
                {filtrando ? "Filtros aplicados" : "Elegí zona, precio y más"}
              </span>
            </summary>
            <div id="search-filter-content" className="search-filters-content">
              <FormularioDeFiltros
                key={JSON.stringify(parametros)}
                criterios={criterios}
                rango={rango}
                ciudades={[...new Set(ubicaciones.map((u) => u.ciudad))]}
              />
            </div>
          </details>
        </aside>

        <section className="search-results">
          <div className="search-results-heading">
            <h1>
              {pagina.total === 0
                ? "Sin resultados"
                : `${pagina.total} ${pagina.total === 1 ? "publicación" : "publicaciones"}`}
            </h1>
            {paginas > 1 ? (
              <p className="search-page-note">
                Página {criterios.pagina} de {paginas}
              </p>
            ) : null}
          </div>

          <FiltrosActivos criterios={criterios} parametros={parametros} />

          {enLaOtraMoneda > 0 ? (
            <p className="search-page-note">
              Hay {enLaOtraMoneda}{" "}
              {enLaOtraMoneda === 1 ? "publicación" : "publicaciones"} en{" "}
              {otraMoneda === "USD" ? "dólares" : "pesos"} que cumplen el resto de los
              filtros.{" "}
              <Link
                href={`${RUTAS.publicaciones}${construirQuery(parametros, { moneda: otraMoneda })}`}
                className="underline underline-offset-4"
              >
                Ver en {otraMoneda === "USD" ? "dólares" : "pesos"}
              </Link>
            </p>
          ) : null}

          {pagina.resultados.length === 0 ? (
            <div className="search-empty-state">
              <p>
                {filtrando
                  ? "Ninguna publicación cumple con estos filtros."
                  : "Todavía no hay publicaciones activas."}
              </p>
              {filtrando ? (
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={RUTAS.publicaciones}>Limpiar filtros</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="property-results-grid">
              {pagina.resultados.map((publicacion) => (
                <TarjetaDePublicacion
                  key={publicacion.id}
                  publicacion={publicacion}
                  cotizacion={cotizacion}
                  variante="horizontal"
                  accion={
                    <BotonFavorito publicacionId={publicacion.id} volverA={volverA} />
                  }
                />
              ))}
            </div>
          )}

          <Paginador
            paginaActual={criterios.pagina}
            totalDePaginas={paginas}
            parametros={parametros}
          />
        </section>
      </div>
    </FavoritosProvider>
  );
}
