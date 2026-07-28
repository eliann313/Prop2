import type { ETIQUETAS_TIPO_INMUEBLE } from "@/shared/catalogoInmuebles";

/**
 * Mapeo de una publicación a JSON-LD `RealEstateListing` de Schema.org (9.1).
 *
 * Es lo que habilita los rich snippets: que Google muestre precio y ubicación directo en el
 * resultado, sin que la persona tenga que entrar. Sobre un marketplace eso cambia el CTR mucho
 * más que cualquier ajuste de title o description.
 *
 * Vive en services/ y no en el componente porque es una transformación pura entre dos formas de
 * los mismos datos: entra la publicación, sale el objeto. Así se testea sin base ni servidor
 * (4.2), que es justo lo que hace falta acá — un JSON-LD mal armado no rompe nada visible, no
 * tira ningún error, y simplemente hace que el rich snippet nunca aparezca.
 */

/**
 * Serializa el JSON-LD para meterlo en un `<script>`.
 *
 * El escape de `<` NO es decorativo: `JSON.stringify` no sabe nada de HTML, así que un vendedor
 * que escriba `</script><script>...` en el título o la descripción cierra el tag y ejecuta lo
 * que quiera, en la página pública de su propio inmueble y contra cualquiera que la abra. Es
 * XSS almacenado de manual (8.18), y es el único lugar del proyecto donde el escape automático
 * de React no protege, porque el contenido entra por `dangerouslySetInnerHTML`.
 *
 * Escapar `<` alcanza para los dos vectores: `</script>` y el `<!--` que abre un comentario HTML
 * dentro del script. `<` es JSON válido y el parser lo lee como el mismo carácter, así que
 * el dato no se altera — Google recibe exactamente el texto original.
 */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

/** Lo mínimo que necesita el mapeo. Se pide por estructura y no el registro entero de Prisma. */
export type PublicacionParaJsonLd = {
  titulo: string;
  descripcion: string;
  precio: number;
  moneda: string;
  operacion: string;
  tipoInmueble: keyof typeof ETIQUETAS_TIPO_INMUEBLE;
  provincia: string;
  ciudad: string;
  barrio: string | null;
  direccion: string | null;
  latitud: number;
  longitud: number;
  superficieCubierta: number | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  imagenes: string[];
};

/**
 * Schema.org espera metros cuadrados con el código de unidad de UN/CEFACT, no el texto "m2".
 * `MTK` es el de metro cuadrado.
 */
const CODIGO_METRO_CUADRADO = "MTK";

export function datosEstructuradosDePublicacion(
  publicacion: PublicacionParaJsonLd,
  url: string,
) {
  // Solo lo que tiene valor: una propiedad presente pero vacía es peor que ausente, porque
  // Google la lee igual y puede marcar el structured data como inválido.
  const caracteristicas = [
    publicacion.ambientes !== null && {
      "@type": "LocationFeatureSpecification",
      name: "Ambientes",
      value: publicacion.ambientes,
    },
    publicacion.dormitorios !== null && {
      "@type": "LocationFeatureSpecification",
      name: "Dormitorios",
      value: publicacion.dormitorios,
    },
  ].filter((valor) => valor !== false);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: publicacion.titulo,
    description: publicacion.descripcion,
    url,
    ...(publicacion.imagenes.length > 0 && { image: publicacion.imagenes }),
    // `offers` es lo que hace aparecer el precio en el resultado de búsqueda. La moneda va en
    // ISO 4217 —"ARS"/"USD"— que es como ya se guarda en la base.
    offers: {
      "@type": "Offer",
      price: publicacion.precio,
      priceCurrency: publicacion.moneda,
      availability: "https://schema.org/InStock",
      // Distingue una venta de un alquiler para el buscador. No hay un tipo estándar de
      // Schema.org para esto, así que se expone como categoría en texto.
      category: publicacion.operacion,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "AR",
      addressRegion: publicacion.provincia,
      addressLocality: publicacion.ciudad,
      // El barrio entra como dependentLocality, que es exactamente lo que representa: una
      // subdivisión de la localidad. En CABA/GBA es la señal geográfica que más pesa (3.1).
      ...(publicacion.barrio && { addressSubLocality: publicacion.barrio }),
      // La calle solo si el vendedor decidió mostrarla (3.4): si eligió no publicarla, no puede
      // filtrarse por la puerta de atrás en el structured data.
      ...(publicacion.direccion && { streetAddress: publicacion.direccion }),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: publicacion.latitud,
      longitude: publicacion.longitud,
    },
    ...(publicacion.superficieCubierta !== null && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: publicacion.superficieCubierta,
        unitCode: CODIGO_METRO_CUADRADO,
      },
    }),
    ...(publicacion.banios !== null && { numberOfBathroomsTotal: publicacion.banios }),
    ...(publicacion.dormitorios !== null && {
      numberOfBedrooms: publicacion.dormitorios,
    }),
    ...(caracteristicas.length > 0 && { amenityFeature: caracteristicas }),
  };
}
