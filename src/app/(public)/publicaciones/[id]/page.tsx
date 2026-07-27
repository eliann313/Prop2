import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GaleriaDeFotos } from "@/features/publicaciones/components/GaleriaDeFotos";
import {
  buscarPublicacionPublica,
  incrementarVistas,
  publicacionesSimilares,
} from "@/features/publicaciones/publicacionRepository";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_ORIENTACION,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { esVisitaNueva } from "@/shared/lib/contadorDeVistas";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { urlAbsoluta } from "@/shared/lib/urlBase";
import { RUTAS } from "@/shared/rutas";
import {
  formatearEquivalencia,
  formatearPrecio,
  formatearSuperficie,
} from "@/shared/utils/formato";
import { linkDeWhatsapp } from "@/shared/utils/whatsapp";

export async function generateMetadata(
  props: PageProps<"/publicaciones/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const publicacion = await buscarPublicacionPublica(id);

  if (!publicacion) return { title: "Publicación no encontrada" };

  return {
    title: publicacion.titulo,
    // Los primeros 160 caracteres de la descripción del vendedor: es texto real sobre el
    // inmueble, mejor que una plantilla armada con los campos.
    description: publicacion.descripcion.slice(0, 160),
  };
}

export default async function PaginaDetalle(props: PageProps<"/publicaciones/[id]">) {
  const { id } = await props.params;
  const publicacion = await buscarPublicacionPublica(id);

  // 404 y no un mensaje de "no disponible": una publicación pausada o eliminada no debería
  // confirmarle a nadie que ese id existió alguna vez.
  if (!publicacion) notFound();

  const cotizacion = await obtenerCotizacion();
  const precio = Number(publicacion.precio);
  const moneda = publicacion.moneda;

  // El contador se actualiza sin bloquear el render (ver incrementarVistas). El identificador
  // sale de la IP: no hay sesión garantizada en una página pública.
  const cabeceras = await headers();
  const visitante = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonimo";
  if (await esVisitaNueva(publicacion.id, visitante)) {
    void incrementarVistas(publicacion.id).catch(() => {});
  }

  const similares = await publicacionesSimilares(publicacion);

  const whatsapp = linkDeWhatsapp(
    publicacion.usuario.telefono,
    publicacion.titulo,
    urlAbsoluta(`${RUTAS.publicaciones}/${publicacion.id}`),
  );

  const ficha = [
    ["Tipo", ETIQUETAS_TIPO_INMUEBLE[publicacion.tipoInmueble]],
    [
      "Superficie cubierta",
      publicacion.superficieCubierta
        ? formatearSuperficie(Number(publicacion.superficieCubierta))
        : null,
    ],
    [
      "Superficie total",
      publicacion.superficieTotal
        ? formatearSuperficie(Number(publicacion.superficieTotal))
        : null,
    ],
    ["Ambientes", publicacion.ambientes],
    ["Dormitorios", publicacion.dormitorios],
    ["Baños", publicacion.banios],
    ["Piso", publicacion.piso],
    ["Cochera", publicacion.tieneCochera ? "Sí" : null],
    [
      "Antigüedad",
      publicacion.antiguedadAnios !== null
        ? publicacion.antiguedadAnios === 0
          ? "A estrenar"
          : `${publicacion.antiguedadAnios} años`
        : null,
    ],
    [
      "Estado",
      publicacion.estadoInmueble
        ? ETIQUETAS_ESTADO_INMUEBLE[publicacion.estadoInmueble]
        : null,
    ],
    [
      "Orientación",
      publicacion.orientacion ? ETIQUETAS_ORIENTACION[publicacion.orientacion] : null,
    ],
    // Las expensas van siempre en pesos, incluso si la publicación está en dólares (3.4).
    [
      "Expensas",
      publicacion.expensas
        ? `${formatearPrecio(Number(publicacion.expensas), "ARS")} / mes`
        : null,
    ],
  ].filter(([, valor]) => valor !== null && valor !== undefined && valor !== "");

  const servicios = publicacion.caracteristicas
    .map((fila) => fila.caracteristica)
    .filter((c) => c.categoria === "servicio");
  const comodidades = publicacion.caracteristicas
    .map((fila) => fila.caracteristica)
    .filter((c) => c.categoria === "comodidad");

  return (
    <article className="grid gap-8">
      <Link
        href={RUTAS.publicaciones}
        className="text-muted-foreground text-sm underline underline-offset-4"
      >
        ← Volver a la búsqueda
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-6">
          <GaleriaDeFotos
            fotos={publicacion.imagenes.map((imagen) => ({
              id: imagen.id,
              url: imagen.url,
              urlThumbnail: imagen.urlThumbnail,
            }))}
            titulo={publicacion.titulo}
          />

          <header className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {publicacion.operacion === "venta" ? "Venta" : "Alquiler"}
              </Badge>
              <Badge variant="outline">
                {ETIQUETAS_TIPO_INMUEBLE[publicacion.tipoInmueble]}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {publicacion.titulo}
            </h1>
            <p className="text-muted-foreground">
              {/* La dirección exacta solo se muestra si el vendedor la habilitó (3.4). */}
              {publicacion.direccion ? `${publicacion.direccion}, ` : ""}
              {publicacion.barrio ? `${publicacion.barrio}, ` : ""}
              {publicacion.ciudad}, {publicacion.provincia}
            </p>
          </header>

          <Separator />

          <section className="grid gap-3">
            <h2 className="text-lg font-medium">Descripción</h2>
            {/* whitespace-pre-line respeta los saltos de línea que escribió el vendedor sin
                interpretar HTML: el texto entra como texto, nunca como markup (8.1). */}
            <p className="max-w-prose text-sm whitespace-pre-line">
              {publicacion.descripcion}
            </p>
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-medium">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {ficha.map(([etiqueta, valor]) => (
                <div key={String(etiqueta)} className="grid gap-0.5">
                  <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
                  <dd className="font-medium">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          {servicios.length + comodidades.length > 0 ? (
            <section className="grid gap-3">
              <h2 className="text-lg font-medium">Servicios y comodidades</h2>
              <div className="flex flex-wrap gap-2">
                {[...servicios, ...comodidades].map((caracteristica) => (
                  <Badge key={caracteristica.nombre} variant="outline">
                    {caracteristica.nombre}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid gap-4 rounded-lg border p-5 lg:sticky lg:top-6">
          <div className="grid gap-1">
            <p className="text-2xl font-semibold">
              {formatearPrecio(precio, moneda)}
              {publicacion.operacion === "alquiler" ? (
                <span className="text-muted-foreground text-base font-normal">
                  {" "}
                  / mes
                </span>
              ) : null}
            </p>
            {formatearEquivalencia(precio, moneda, cotizacion) ? (
              <p className="text-muted-foreground text-sm">
                {formatearEquivalencia(precio, moneda, cotizacion)}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="grid gap-1 text-sm">
            <p className="text-muted-foreground text-xs">Publica</p>
            <p className="font-medium">{publicacion.usuario.name ?? "Propietario"}</p>
          </div>

          {whatsapp ? (
            <Button asChild>
              {/* rel noopener: sin esto la pestaña de WhatsApp puede tocar window.opener. */}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                Consultar por WhatsApp
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              Este vendedor no cargó un teléfono. El formulario de contacto llega en la
              próxima entrega.
            </p>
          )}

          <p className="text-muted-foreground text-xs">{publicacion.vistas} visitas</p>
        </aside>
      </div>

      {similares.length > 0 ? (
        <section className="grid gap-4 border-t pt-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Publicaciones similares
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similares.map((similar) => (
              <TarjetaDePublicacion
                key={similar.id}
                publicacion={{
                  id: similar.id,
                  titulo: similar.titulo,
                  precio: Number(similar.precio),
                  moneda: similar.moneda,
                  operacion: similar.operacion,
                  tipoInmueble: similar.tipoInmueble,
                  provincia: similar.provincia,
                  ciudad: similar.ciudad,
                  barrio: similar.barrio,
                  ambientes: similar.ambientes,
                  dormitorios: similar.dormitorios,
                  banios: similar.banios,
                  superficieCubierta: similar.superficieCubierta
                    ? Number(similar.superficieCubierta)
                    : null,
                  imagenUrl: similar.imagenes[0]?.url ?? null,
                  imagenThumbnail: similar.imagenes[0]?.urlThumbnail ?? null,
                }}
                cotizacion={cotizacion}
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
