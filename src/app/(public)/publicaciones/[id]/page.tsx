import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { FormularioDeConsulta } from "@/features/contacto/components/FormularioDeConsulta";
import { BotonFavorito } from "@/features/favoritos/components/BotonFavorito";
import { FavoritosProvider } from "@/features/favoritos/components/FavoritosProvider";
import { GaleriaDeFotos } from "@/features/publicaciones/components/GaleriaDeFotos";
import { RegistrarVista } from "@/features/publicaciones/components/RegistrarVista";
import {
  buscarPublicacionPublica,
  publicacionesSimilares,
} from "@/features/publicaciones/publicacionRepository";
import {
  datosEstructuradosDePublicacion,
  serializarJsonLd,
} from "@/features/publicaciones/services/datosEstructurados";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_ORIENTACION,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
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
  { loading: () => <div className="bg-muted h-72 w-full rounded-lg" /> },
);

// TODO(9.1): falta declarar el ISR de 60 minutos. No se puede todavía, y no por esta página:
// `EncabezadoSitio` lee la sesión en el servidor para TODO el layout público, y eso vuelve
// dinámica cualquier ruta que lo use. Sacarlo de acá no alcanzaría. Ver la nota del README.

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

  const similares = await publicacionesSimilares(publicacion);

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

  return (
    <FavoritosProvider idsEnPagina={[publicacion.id, ...similares.map((s) => s.id)]}>
      <article className="grid gap-8">
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

            <section className="grid gap-3">
              <h2 className="text-lg font-medium">Ubicación</h2>
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
            <div className="flex items-start justify-between gap-3">
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

              <BotonFavorito
                publicacionId={publicacion.id}
                volverA={rutaCanonica}
                variante="linea"
              />
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
            ) : null}

            {/* Email directo como tercera vía (6.6): quien prefiere su propio cliente de correo
              no debería estar obligado a usar el formulario. El mailto va contra el email de
              quien consulta, no contra el del vendedor: la dirección del vendedor nunca se
              publica en el HTML. */}
            <div id="consultar" className="grid gap-3">
              <p className="text-sm font-medium">Consultar por este inmueble</p>
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
    </FavoritosProvider>
  );
}
