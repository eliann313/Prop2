import { describe, expect, it } from "vitest";

import {
  datosEstructuradosDePublicacion,
  serializarJsonLd,
  type PublicacionParaJsonLd,
} from "@/features/publicaciones/services/datosEstructurados";

const URL_PUBLICACION = "https://prop2.example/publicaciones/casa-en-nunez-abc";

const BASE: PublicacionParaJsonLd = {
  titulo: "Departamento 2 ambientes en Núñez",
  descripcion: "Luminoso, con balcón al frente.",
  precio: 120000,
  moneda: "USD",
  operacion: "venta",
  tipoInmueble: "departamento",
  provincia: "Buenos Aires",
  ciudad: "CABA",
  barrio: "Núñez",
  direccion: "Av. Cabildo 3000",
  latitud: -34.5445,
  longitud: -58.4614,
  superficieCubierta: 55,
  ambientes: 2,
  dormitorios: 1,
  banios: 1,
  imagenes: ["https://res.cloudinary.com/demo/a.jpg"],
};

const armar = (cambios: Partial<PublicacionParaJsonLd> = {}) =>
  datosEstructuradosDePublicacion({ ...BASE, ...cambios }, URL_PUBLICACION);

describe("datosEstructuradosDePublicacion", () => {
  it("declara el tipo y la URL que Google espera", () => {
    const datos = armar();

    expect(datos["@context"]).toBe("https://schema.org");
    expect(datos["@type"]).toBe("RealEstateListing");
    expect(datos.url).toBe(URL_PUBLICACION);
  });

  // Es el motivo entero de tener JSON-LD: sin `offers` bien armado no hay precio en el snippet.
  it("expone el precio con la moneda en ISO 4217", () => {
    const datos = armar();

    expect(datos.offers).toMatchObject({ price: 120000, priceCurrency: "USD" });
  });

  it("ubica el inmueble con el barrio como sublocalidad", () => {
    const datos = armar();

    expect(datos.address).toMatchObject({
      addressCountry: "AR",
      addressRegion: "Buenos Aires",
      addressLocality: "CABA",
      addressSubLocality: "Núñez",
    });
    expect(datos.geo).toMatchObject({ latitude: -34.5445, longitude: -58.4614 });
  });

  // 3.4: mostrar la calle es decisión del propietario. Si eligió no publicarla, no puede
  // filtrarse por el structured data, que es justamente donde nadie la va a mirar.
  it("omite la calle cuando el vendedor decidió no mostrarla", () => {
    const datos = armar({ direccion: null });

    expect(datos.address).not.toHaveProperty("streetAddress");
  });

  it("omite los campos vacíos en vez de mandarlos en null", () => {
    const datos = armar({
      barrio: null,
      superficieCubierta: null,
      ambientes: null,
      dormitorios: null,
      banios: null,
      imagenes: [],
    });

    expect(datos).not.toHaveProperty("floorSize");
    expect(datos).not.toHaveProperty("numberOfBedrooms");
    expect(datos).not.toHaveProperty("numberOfBathroomsTotal");
    expect(datos).not.toHaveProperty("amenityFeature");
    expect(datos).not.toHaveProperty("image");
    expect(datos.address).not.toHaveProperty("addressSubLocality");
  });

  it("informa la superficie en metros cuadrados con el código de unidad", () => {
    const datos = armar();

    expect(datos.floorSize).toMatchObject({ value: 55, unitCode: "MTK" });
  });
});

describe("serializarJsonLd", () => {
  // XSS almacenado (8.18). Sin el escape, el vendedor cierra el <script> desde el título de su
  // propia publicación y ejecuta lo que quiera contra quien la abra.
  it("neutraliza un </script> metido en el título", () => {
    const serializado = serializarJsonLd(
      armar({ titulo: "Casa</script><script>alert(1)</script>" }),
    );

    expect(serializado).not.toContain("</script>");
    expect(serializado).toContain("\\u003c");
  });

  it("neutraliza la apertura de un comentario HTML", () => {
    const serializado = serializarJsonLd(armar({ descripcion: "<!--" }));

    expect(serializado).not.toContain("<!--");
  });

  // El escape no puede alterar el dato: Google tiene que leer exactamente el texto original.
  it("no altera el contenido: al parsear vuelve el texto tal cual", () => {
    const titulo = "Casa</script> con <balcón>";
    const serializado = serializarJsonLd(armar({ titulo }));

    expect(JSON.parse(serializado).name).toBe(titulo);
  });
});
