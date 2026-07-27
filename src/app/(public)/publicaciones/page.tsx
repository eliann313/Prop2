import type { Metadata } from "next";
import Link from "next/link";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { BotonFavorito } from "@/features/favoritos/components/BotonFavorito";
import { idsFavoritosDe } from "@/features/favoritos/favoritoRepository";
import { FormularioDeFiltros } from "@/features/busqueda/components/FormularioDeFiltros";
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

export const metadata: Metadata = { title: "Buscar inmuebles" };

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

  // Los favoritos del usuario para TODA la página en una consulta, no una por tarjeta.
  const usuario = await obtenerUsuarioActual();
  const favoritos = usuario
    ? await idsFavoritosDe(
        usuario.id,
        pagina.resultados.map((resultado) => resultado.id),
      )
    : new Set<string>();

  // La búsqueda entera se preserva para volver acá después del login.
  const volverA = `${RUTAS.publicaciones}${construirQuery(parametros, {})}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <FormularioDeFiltros
          criterios={criterios}
          rango={rango}
          ciudades={[...new Set(ubicaciones.map((u) => u.ciudad))]}
        />
      </aside>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {pagina.total === 0
              ? "Sin resultados"
              : `${pagina.total} ${pagina.total === 1 ? "publicación" : "publicaciones"}`}
          </h1>
          {paginas > 1 ? (
            <p className="text-muted-foreground text-sm">
              Página {criterios.pagina} de {paginas}
            </p>
          ) : null}
        </div>

        {enLaOtraMoneda > 0 ? (
          <p className="text-muted-foreground text-sm">
            Hay {enLaOtraMoneda} {enLaOtraMoneda === 1 ? "publicación" : "publicaciones"}{" "}
            en {otraMoneda === "USD" ? "dólares" : "pesos"} que cumplen el resto de los
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
          <div className="grid gap-3 rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pagina.resultados.map((publicacion) => (
              <TarjetaDePublicacion
                key={publicacion.id}
                publicacion={publicacion}
                cotizacion={cotizacion}
                accion={
                  <BotonFavorito
                    publicacionId={publicacion.id}
                    esFavorito={favoritos.has(publicacion.id)}
                    volverA={volverA}
                  />
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
  );
}
