import Link from "next/link";

import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { buscarPublicaciones } from "@/features/busqueda/publicacionBusquedaRepository";
import { construirCriterios } from "@/features/busqueda/services/criteriosDeBusqueda";
import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { ETIQUETAS_TIPO_INMUEBLE, TIPOS_INMUEBLE } from "@/shared/catalogoInmuebles";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { RUTAS } from "@/shared/rutas";

/**
 * Home: la landing ES el buscador.
 *
 * No hay una página de marketing separada a propósito. En un portal inmobiliario, quien entra
 * viene a buscar: el argumento de venta cabe en una línea arriba del buscador, y todo lo demás
 * de la pantalla se lo lleva el inventario real. Una landing aparte sería una página más para
 * mantener y un click más entre el visitante y lo que vino a hacer.
 */
const CLASES_SELECT =
  "border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none";

const DESTACADAS = 6;

export default async function PaginaHome() {
  const criterios = {
    ...construirCriterios(parsearFiltros({})),
    limite: DESTACADAS,
  };

  const [usuario, ultimas, cotizacion] = await Promise.all([
    obtenerUsuarioActual(),
    buscarPublicaciones(criterios),
    obtenerCotizacion(),
  ]);

  return (
    <div className="grid gap-12">
      <section className="grid gap-6">
        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Comprá, vendé y alquilá sin intermediarios
          </h1>
          <p className="text-muted-foreground max-w-prose">
            Los propietarios publican directo y vos contactás sin comisiones en el medio.
          </p>
        </div>

        {/* Formulario GET: el navegador arma la URL de búsqueda solo, sin JavaScript. */}
        <form
          method="GET"
          action={RUTAS.publicaciones}
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <Input
            name="q"
            type="search"
            placeholder="Casa con patio en Rosario, monoambiente en Palermo…"
            aria-label="Qué estás buscando"
          />
          <select name="operacion" className={CLASES_SELECT} aria-label="Operación">
            <option value="">Venta y alquiler</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
          <select name="tipo" className={CLASES_SELECT} aria-label="Tipo de inmueble">
            <option value="">Cualquier tipo</option>
            {TIPOS_INMUEBLE.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_INMUEBLE[tipo]}
              </option>
            ))}
          </select>
          <Button type="submit">Buscar</Button>
        </form>
      </section>

      {ultimas.resultados.length > 0 ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Últimas publicaciones
            </h2>
            <Link
              href={RUTAS.publicaciones}
              className="text-sm underline underline-offset-4"
            >
              Ver todas
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ultimas.resultados.map((publicacion) => (
              <TarjetaDePublicacion
                key={publicacion.id}
                publicacion={publicacion}
                cotizacion={cotizacion}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 border-t pt-8 sm:grid-cols-3">
        {[
          {
            titulo: "Publicás vos",
            texto: "Cargás tu inmueble con fotos y ubicación en cuatro pasos.",
          },
          {
            titulo: "Sin comisiones",
            texto: "Nadie se queda con un porcentaje de tu operación.",
          },
          {
            titulo: "Contacto directo",
            texto: "El interesado te escribe a vos, por WhatsApp o por el formulario.",
          },
        ].map((item) => (
          <div key={item.titulo} className="grid gap-1">
            <h3 className="font-medium">{item.titulo}</h3>
            <p className="text-muted-foreground text-sm">{item.texto}</p>
          </div>
        ))}
      </section>

      {usuario ? null : (
        <section className="flex flex-wrap items-center gap-3 rounded-lg border p-6">
          <p className="text-sm">¿Tenés un inmueble para publicar?</p>
          <Button asChild size="sm">
            <Link href={RUTAS.registro}>Crear cuenta</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
