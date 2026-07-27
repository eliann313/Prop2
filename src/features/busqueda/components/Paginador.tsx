import Link from "next/link";

import {
  construirQuery,
  paginasVisibles,
  type ParametrosDeUrl,
} from "@/features/busqueda/services/urlDeBusqueda";
import { Button } from "@/shared/components/ui/button";
import { RUTAS } from "@/shared/rutas";

type Props = {
  paginaActual: number;
  totalDePaginas: number;
  parametros: ParametrosDeUrl;
};

/**
 * Paginador de links reales, no de botones con onClick.
 *
 * Cada página es una URL: se puede abrir en otra pestaña, compartir, y Google la puede seguir
 * para llegar a las publicaciones que no entran en la primera página.
 */
export function Paginador({ paginaActual, totalDePaginas, parametros }: Props) {
  if (totalDePaginas <= 1) return null;

  const urlDe = (pagina: number) =>
    `${RUTAS.publicaciones}${construirQuery(parametros, { pagina: String(pagina) })}`;

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación">
      <Button asChild variant="outline" size="sm" disabled={paginaActual === 1}>
        <Link
          href={urlDe(paginaActual - 1)}
          aria-disabled={paginaActual === 1}
          className={paginaActual === 1 ? "pointer-events-none opacity-50" : undefined}
        >
          Anterior
        </Link>
      </Button>

      {paginasVisibles(paginaActual, totalDePaginas).map((pagina, indice) =>
        pagina === null ? (
          <span key={`hueco-${indice}`} className="text-muted-foreground px-2 text-sm">
            …
          </span>
        ) : (
          <Button
            key={pagina}
            asChild
            size="sm"
            variant={pagina === paginaActual ? "default" : "outline"}
          >
            <Link
              href={urlDe(pagina)}
              aria-current={pagina === paginaActual ? "page" : undefined}
            >
              {pagina}
            </Link>
          </Button>
        ),
      )}

      <Button asChild variant="outline" size="sm">
        <Link
          href={urlDe(paginaActual + 1)}
          aria-disabled={paginaActual === totalDePaginas}
          className={
            paginaActual === totalDePaginas ? "pointer-events-none opacity-50" : undefined
          }
        >
          Siguiente
        </Link>
      </Button>
    </nav>
  );
}
