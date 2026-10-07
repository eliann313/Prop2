import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin } from "lucide-react";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { FormularioDeConsulta } from "@/features/contacto/components/FormularioDeConsulta";
import { BotonFavorito } from "@/features/favoritos/components/BotonFavorito";
import { FavoritosProvider } from "@/features/favoritos/components/FavoritosProvider";
import { GaleriaDeFotos } from "@/features/publicaciones/components/GaleriaDeFotos";
import { RegistrarVista } from "@/features/publicaciones/components/RegistrarVista";
import {
  PublicacionesSimilares,
  SimilaresCargando,
} from "@/features/publicaciones/components/PublicacionesSimilares";
import { buscarPublicacionPublica } from "@/features/publicaciones/publicacionRepository";
import {
  datosEstructuradosDePublicacion,
  serializarJsonLd,
} from "@/features/publicaciones/services/datosEstructurados";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_ORIENTACION,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { urlAbsoluta } from "@/shared/lib/urlBase";
import { RUTAS } from "@/shared/rutas";
import {
  formatearEquivalencia,
  formatearPrecio,
  formatearSuperficie,
} from "@/shared/utils/formato";
import { idDeRuta, rutaDePublicacion } from "@/shared/utils/slug";
import { linkDeWhatsapp } from "@/shared/utils/whatsapp";

// Leaflet toca `window` al construirse, así que el mapa no puede renderizarse en el servidor.
// El placeholder reserva la altura exacta del mapa: sin él, la página salta cuando carga.
const MapaDeUbicacion = dynamic(
  () =>
    import("@/features/publicaciones/components/MapaDeUbicacion").then(
      (modulo) => modulo.MapaDeUbicacion,
    ),
  {
    loading: () => (
      <div className="bg-muted h-[clamp(16rem,32vw,24rem)] w-full rounded-xl" />
    ),
  },
);

// Esta página se sirve SSR y no con el ISR de 60 minutos que pide la tabla de 9.1. Es una
// desviación decidida, no algo pendiente: `EncabezadoSitio` lee la sesión en el servidor para
// todo el layout público —muestra el email, el acceso al dashboard y el link de admin según el
// rol— y eso vuelve dinámica cualquier ruta que lo use. Cachear esta página exigiría resolver
// la sesión en el cliente en TODAS, y eso hace que el encabezado muestre un instante el estado
// deslogueado en cada carga del sitio. Se prefirió no pagar ese parpadeo.
//
// Lo que sí se hizo es dejar la puerta abierta: el corazón de favoritos y el contador de
// visitas ya salieron del render (FavoritosProvider y RegistrarVista), así que el día que el
// encabezado se mueva, acá alcanza con declarar `revalidate`. Ver el README.

export async function generateMetadata(
  props: PageProps<"/publicaciones/[id]">,
): Promise<Metadata> {
  const { id: segmento } = await props.params;
  const id = idDeRuta(segmento);
  const publicacion = id ? await buscarPublicacionPublica(id) : null;

  if (!publicacion) return { title: "Publicación no encontrada" };

  // Los primeros 160 caracteres de la descripción del vendedor: es texto real sobre el
  // inmueble, mejor que una plantilla armada con los campos.
  const descripcion = publicacion.descripcion.slice(0, 160);
  const url = urlAbsoluta(
    `${RUTAS.publicaciones}/${rutaDePublicacion(publicacion.id, publicacion.titulo)}`,
  );
  const portada = publicacion.imagenes[0];

  return {
    title: publicacion.titulo,
    description: descripcion,
    // Canónica explícita: la misma publicación es alcanzable con cualquier slug viejo (ver
    // slug.ts), y sin esto Google vería varias URLs con el mismo contenido y repartiría la
    // señal entre todas en vez de concentrarla en una.
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: publicacion.titulo,
      description: descripcion,
      url,
      siteName: "Prop²",
      locale: "es_AR",
      // La preview de WhatsApp es lo que decide si alguien abre el link o lo pasa de largo, y
      // WhatsApp es el canal de contacto principal (6.6). Sin imagen propia, compartir un
      // inmueble muestra una tarjeta genérica del sitio en vez de la foto de la propiedad.
      images: portada ? [{ url: portada.url, alt: publicacion.titulo }] : undefined,
    },
    twitter: {
      card: portada ? "summary_large_image" : "summary",
      title: publicacion.titulo,
      description: descripcion,
      images: portada ? [portada.url] : undefined,
    },
  };
}

export default async function PaginaDetalle(props: PageProps<"/publicaciones/[id]">) {
  const { id: segmento } = await props.params;

  // La URL trae `<slug>-<uuid>`, pero lo único que identifica es el UUID del final. Sin uuid
  // no hay nada que buscar: se corta acá en vez de ir a la base con un valor inventado.
  const id = idDeRuta(segmento);
  if (!id) notFound();

  const publicacion = await buscarPublicacionPublica(id);

  // 404 y no un mensaje de "no disponible": una publicación pausada o eliminada no debería
  // confirmarle a nadie que ese id existió alguna vez.
  if (!publicacion) notFound();

  // Si el slug no es el que corresponde al título actual —link viejo, o el UUID pelado— se
  // redirige a la forma canónica con un 308. Es permanente a propósito: le dice al buscador
  // que consolide la señal en esta URL en vez de tratarlas como dos páginas distintas.
  const rutaCanonica = `${RUTAS.publicaciones}/${rutaDePublicacion(publicacion.id, publicacion.titulo)}`;
  if (segmento !== rutaDePublicacion(publicacion.id, publicacion.titulo)) {
    permanentRedirect(rutaCanonica);
  }

  const cotizacion = await obtenerCotizacion();
  const precio = Number(publicacion.precio);
  const moneda = publicacion.moneda;

  // Lo único que todavía lee la sesión en esta página: precargar el formulario de consulta
  // (6.6). Se mueve al cliente junto con el encabezado cuando se cierre lo del ISR.
  const usuario = await obtenerUsuarioActual();

  const whatsapp = linkDeWhatsapp(
    publicacion.usuario.telefono,
    publicacion.titulo,
    urlAbsoluta(rutaCanonica),
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

  const jsonLd = datosEstructuradosDePublicacion(
    {
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      precio,
      moneda,
      operacion: publicacion.operacion,
      tipoInmueble: publicacion.tipoInmueble,
      provincia: publicacion.provincia,
      ciudad: publicacion.ciudad,
      barrio: publicacion.barrio,
      direccion: publicacion.direccion,
      latitud: Number(publicacion.latitud),
      longitud: Number(publicacion.longitud),
      superficieCubierta: publicacion.superficieCubierta
        ? Number(publicacion.superficieCubierta)
        : null,
      ambientes: publicacion.ambientes,
      dormitorios: publicacion.dormitorios,
      banios: publicacion.banios,
      imagenes: publicacion.imagenes.map((imagen) => imagen.url),
    },
    urlAbsoluta(rutaCanonica),
  );

  const htmlJsonLd = { __html: serializarJsonLd(jsonLd) };

  // Al provider va solo el id de esta publicación: las tarjetas de "similares" no llevan
  // corazón, y además llegan por streaming, así que acá todavía no se conocen.
  return (
    <FavoritosProvider idsEnPagina={[publicacion.id]}>
      <div className="min-h-full bg-[#faf8f6]">
        <article className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
          <RegistrarVista publicacionId={publicacion.id} />
          {/* JSON-LD de 9.1. Es el único `dangerouslySetInnerHTML` del proyecto y la excepción que
          contempla 8.1: un `<script>` no puede recibir su contenido como children de React,
          porque React escaparía las comillas a entidades y el JSON dejaría de parsear.
          El contenido va por `serializarJsonLd`, que neutraliza el `</script>` que un vendedor
          podría meter en el título — ver el porqué en datosEstructurados.ts. */}
          {/* eslint-disable-next-line react/no-danger -- ver comentario de arriba */}
          <script type="application/ld+json" dangerouslySetInnerHTML={htmlJsonLd} />
          <Link
            href={RUTAS.publicaciones}
            className="text-muted-foreground hover:text-bordeaux focus-visible:ring-bordeaux inline-flex w-fit items-center gap-1 rounded-sm text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            ← Volver a la búsqueda
          </Link>

          <header className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-bordeaux hover:bg-bordeaux border-0 text-white">
                {publicacion.operacion === "venta" ? "Venta" : "Alquiler"}
              </Badge>
              <Badge
                className="text-bordeaux border-[#bd9a55]/50 bg-[#ffc300]/15 hover:bg-[#ffc300]/15"
                variant="outline"
              >
                {ETIQUETAS_TIPO_INMUEBLE[publicacion.tipoInmueble]}
              </Badge>
            </div>
            <h1 className="text-bordeaux font-heading text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">
              {publicacion.titulo}
            </h1>
            <p className="text-muted-foreground flex items-start gap-2 text-sm sm:text-base">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[#bd9a55]"
              />
              <span>
                {/* La dirección exacta solo se muestra si el vendedor la habilitó (3.4). */}
                {publicacion.direccion ? `${publicacion.direccion}, ` : ""}
                {publicacion.barrio ? `${publicacion.barrio}, ` : ""}
                {publicacion.ciudad}, {publicacion.provincia}
              </span>
            </p>
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <GaleriaDeFotos
                fotos={publicacion.imagenes.map((imagen) => ({
                  id: imagen.id,
                  url: imagen.url,
                  urlThumbnail: imagen.urlThumbnail,
                }))}
                titulo={publicacion.titulo}
              />
            </div>

            <aside className="grid min-w-0 gap-5 rounded-2xl border border-t-4 border-[#e9e4e0] border-t-[#bd9a55] bg-white p-5 shadow-[0_12px_32px_rgba(59,16,48,0.07)] sm:p-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="flex items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  <p className="text-bordeaux text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
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

                <BotonFavorito
                  publicacionId={publicacion.id}
                  volverA={rutaCanonica}
                  variante="linea"
                />
              </div>

              <Separator className="bg-[#e9e4e0]" />

              <div className="grid gap-1 text-sm">
                <p className="text-muted-foreground text-xs">Publicado por</p>
                <p className="font-medium">{publicacion.usuario.name ?? "Propietario"}</p>
              </div>

              {whatsapp ? (
                <Button asChild className="bg-bordeaux text-white hover:bg-[#3b1030]">
                  {/* rel noopener: sin esto la pestaña de WhatsApp puede tocar window.opener. */}
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    Consultar por WhatsApp
                  </a>
                </Button>
              ) : null}

              <div id="consultar" className="grid scroll-mt-6 gap-3">
                <p className="text-bordeaux text-sm font-semibold">
                  Consultar por este inmueble
                </p>
                <div className="[&_button]:bg-bordeaux [&_button]:text-white [&_button:focus-visible]:ring-[#ffc300] [&_button:hover]:bg-[#3b1030]">
                  <FormularioDeConsulta
                    publicacionId={publicacion.id}
                    tituloPublicacion={publicacion.titulo}
                    usuario={
                      usuario
                        ? { nombre: usuario.name ?? "", email: usuario.email ?? "" }
                        : null
                    }
                  />
                </div>
              </div>

              <p className="text-muted-foreground border-t border-[#f0ece7] pt-3 text-xs">
                {publicacion.vistas} visitas
              </p>
            </aside>

            <div className="grid min-w-0 gap-5 lg:col-start-1 lg:row-start-2 lg:gap-6">
              <section className="grid gap-3 rounded-2xl border border-[#e9e4e0] bg-white p-5 sm:p-6">
                <h2 className="text-bordeaux font-heading text-xl font-semibold">
                  Descripción
                </h2>
                {/* whitespace-pre-line respeta los saltos de línea que escribió el vendedor sin
                interpretar HTML: el texto entra como texto, nunca como markup (8.1). */}
                <p className="text-foreground/85 max-w-prose text-sm leading-7 [overflow-wrap:anywhere] whitespace-pre-line sm:text-base">
                  {publicacion.descripcion}
                </p>
              </section>

              <section className="grid gap-4 rounded-2xl border border-[#e9e4e0] bg-white p-5 sm:p-6">
                <h2 className="text-bordeaux font-heading text-xl font-semibold">
                  Ficha técnica
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-3 sm:gap-x-6">
                  {ficha.map(([etiqueta, valor]) => (
                    <div
                      key={String(etiqueta)}
                      className="grid gap-1 border-b border-[#f0ece7] py-3"
                    >
                      <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
                      <dd className="text-foreground text-sm font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="grid gap-4 rounded-2xl border border-[#e9e4e0] bg-white p-5 sm:p-6">
                <div>
                  <h2 className="text-bordeaux font-heading text-xl font-semibold">
                    Ubicación
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {publicacion.barrio
                      ? `${publicacion.barrio}, ${publicacion.ciudad}`
                      : `${publicacion.ciudad}, ${publicacion.provincia}`}
                  </p>
                </div>
                <MapaDeUbicacion
                  latitud={Number(publicacion.latitud)}
                  longitud={Number(publicacion.longitud)}
                  exacta={publicacion.direccion !== null}
                  etiqueta={publicacion.titulo}
                />
                {publicacion.direccion === null ? (
                  <p className="text-muted-foreground text-xs">
                    El vendedor eligió no publicar la dirección exacta: el mapa muestra la
                    zona.
                  </p>
                ) : null}
              </section>

              {servicios.length + comodidades.length > 0 ? (
                <section className="grid gap-4 rounded-2xl border border-[#e9e4e0] bg-white p-5 sm:p-6">
                  <h2 className="text-bordeaux font-heading text-xl font-semibold">
                    Servicios y comodidades
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[...servicios, ...comodidades].map((caracteristica) => (
                      <Badge
                        key={caracteristica.nombre}
                        variant="outline"
                        className="text-foreground border-[#e9e4e0] bg-[#faf8f6] px-3 py-1.5"
                      >
                        {caracteristica.nombre}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          {/* En Suspense: es la consulta mas cara de la pagina y la menos urgente (9.2). Sin
            esto, la ficha del inmueble espera a que termine una busqueda de similares que
            vive al final y fuera de la primera pantalla. */}
          <Suspense fallback={<SimilaresCargando />}>
            <PublicacionesSimilares publicacion={publicacion} cotizacion={cotizacion} />
          </Suspense>
        </article>
      </div>
    </FavoritosProvider>
  );
}
