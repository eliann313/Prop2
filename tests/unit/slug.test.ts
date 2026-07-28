import { describe, expect, it } from "vitest";

import { idDeRuta, rutaDePublicacion, slugificar } from "@/shared/utils/slug";

const UUID = "c8ea70d0-3b7a-4e20-aac7-92a7fbfee809";

describe("slugificar", () => {
  it("saca acentos y eñes sin dejar rastros", () => {
    expect(slugificar("Departamento en Núñez")).toBe("departamento-en-nunez");
    expect(slugificar("PH con patio en Villa Crespo")).toBe(
      "ph-con-patio-en-villa-crespo",
    );
  });

  it("colapsa signos y espacios en un solo guion", () => {
    expect(slugificar("Casa   3 amb. — ¡oportunidad!")).toBe("casa-3-amb-oportunidad");
  });

  it("no deja guiones colgando en las puntas", () => {
    expect(slugificar("  ¿Casa?  ")).toBe("casa");
    expect(slugificar("---Casa---")).toBe("casa");
  });

  it("recorta los títulos largos sin cortar sobre un guion", () => {
    const slug = slugificar(`${"palabra ".repeat(20)}final`);

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("devuelve vacío si el título no tiene nada usable", () => {
    expect(slugificar("¿¡—!?")).toBe("");
  });
});

describe("rutaDePublicacion", () => {
  it("arma slug + uuid", () => {
    expect(rutaDePublicacion(UUID, "Departamento en Núñez")).toBe(
      `departamento-en-nunez-${UUID}`,
    );
  });

  it("cae al uuid pelado si el título no deja slug", () => {
    expect(rutaDePublicacion(UUID, "¿¡—!?")).toBe(UUID);
  });
});

describe("idDeRuta", () => {
  it("extrae el uuid del final de la ruta", () => {
    expect(idDeRuta(`departamento-en-nunez-${UUID}`)).toBe(UUID);
  });

  // El título es editable: un link viejo trae un slug que ya no corresponde, y tiene que
  // seguir resolviendo. Es la razón por la que el UUID va al final y no se valida el slug.
  it("acepta un slug viejo que ya no coincide con el título actual", () => {
    expect(idDeRuta(`cualquier-cosa-vieja-${UUID}`)).toBe(UUID);
  });

  it("acepta el uuid pelado, que es la forma que tenían los links antes de los slugs", () => {
    expect(idDeRuta(UUID)).toBe(UUID);
  });

  it("normaliza a minúsculas", () => {
    expect(idDeRuta(`casa-${UUID.toUpperCase()}`)).toBe(UUID);
  });

  it("devuelve null cuando no hay uuid, para que la página responda 404", () => {
    expect(idDeRuta("una-ruta-inventada")).toBeNull();
    expect(idDeRuta("")).toBeNull();
    // Un uuid incompleto no alcanza: si pasara, la consulta se haría igual con basura.
    expect(idDeRuta("casa-c8ea70d0-3b7a-4e20-aac7")).toBeNull();
  });

  it("ignora lo que venga después del uuid", () => {
    expect(idDeRuta(`casa-${UUID}-extra`)).toBeNull();
  });
});
