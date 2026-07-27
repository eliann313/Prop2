import { describe, expect, it } from "vitest";

import {
  construirQuery,
  paginasVisibles,
} from "@/features/busqueda/services/urlDeBusqueda";

describe("construirQuery", () => {
  it("conserva los filtros que ya estaban", () => {
    const query = construirQuery({ tipo: "casa", ciudad: "Rosario" }, { pagina: "2" });

    expect(query).toContain("tipo=casa");
    expect(query).toContain("ciudad=Rosario");
    expect(query).toContain("pagina=2");
  });

  it("borra un parámetro con undefined", () => {
    expect(construirQuery({ tipo: "casa" }, { tipo: undefined })).toBe("");
  });

  it("vuelve a la página 1 al cambiar un filtro", () => {
    // Quedarse en la página 5 al agregar un filtro casi siempre muestra un vacío: el
    // resultado nuevo tiene menos páginas que el anterior.
    expect(construirQuery({ pagina: "5" }, { tipo: "ph" })).toBe("?tipo=ph");
  });

  it("no resetea la página cuando lo único que cambia es la página", () => {
    expect(construirQuery({ tipo: "ph", pagina: "2" }, { pagina: "3" })).toContain(
      "pagina=3",
    );
  });

  it("ordena los parámetros para que la misma búsqueda dé siempre la misma URL", () => {
    const unaForma = construirQuery({ tipo: "casa", ciudad: "Rosario" }, {});
    const otraForma = construirQuery({ ciudad: "Rosario", tipo: "casa" }, {});

    expect(unaForma).toBe(otraForma);
  });

  it("descarta las cadenas vacías, que ensucian la URL sin filtrar nada", () => {
    expect(construirQuery({ tipo: "" }, {})).toBe("");
  });

  it("escapa los valores", () => {
    expect(construirQuery({ ciudad: "San Miguel de Tucumán" }, {})).not.toContain(" ");
  });

  it("devuelve cadena vacía sin parámetros, no un '?' suelto", () => {
    expect(construirQuery({}, {})).toBe("");
  });
});

describe("paginasVisibles", () => {
  it("las muestra todas cuando entran", () => {
    expect(paginasVisibles(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("mete huecos cuando son muchas", () => {
    expect(paginasVisibles(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it("siempre incluye la primera, la última y la actual", () => {
    const paginas = paginasVisibles(15, 30);

    expect(paginas).toContain(1);
    expect(paginas).toContain(30);
    expect(paginas).toContain(15);
  });

  it("no repite ni deja huecos falsos cerca de los extremos", () => {
    expect(paginasVisibles(2, 20)).toEqual([1, 2, 3, null, 20]);
  });
});
