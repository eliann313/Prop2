import { describe, expect, it } from "vitest";

import { filtrosActivos } from "@/features/busqueda/components/FiltrosActivos";
import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { construirCriterios } from "@/features/busqueda/services/criteriosDeBusqueda";
import { construirQuery } from "@/features/busqueda/services/urlDeBusqueda";

describe("filtrosActivos", () => {
  it("presenta solo los criterios aplicados con etiquetas legibles", () => {
    const criterios = construirCriterios(
      parsearFiltros({
        q: "patio",
        tipo: "casa",
        provincia: "CABA",
        operacion: "venta",
        ambientes: "2",
        cochera: "1",
        orden: "precio_asc",
        pagina: "3",
      }),
    );

    expect(filtrosActivos(criterios)).toEqual([
      { clave: "q", etiqueta: "Texto: patio" },
      { clave: "operacion", etiqueta: "Venta" },
      { clave: "tipo", etiqueta: "Casa" },
      { clave: "provincia", etiqueta: "CABA" },
      { clave: "ambientes", etiqueta: "2+ ambientes" },
      { clave: "cochera", etiqueta: "Con cochera" },
    ]);
  });

  it("al quitar un chip conserva los demás filtros y reinicia la página", () => {
    const parametros = {
      q: "patio",
      tipo: "casa",
      provincia: "CABA",
      pagina: "4",
      orden: "precio_asc",
    };

    expect(construirQuery(parametros, { tipo: undefined })).toBe(
      "?orden=precio_asc&provincia=CABA&q=patio",
    );
  });

  it("no muestra chips cuando no hay filtros, aunque exista página u orden", () => {
    const criterios = construirCriterios(
      parsearFiltros({ pagina: "2", orden: "recientes" }),
    );

    expect(filtrosActivos(criterios)).toEqual([]);
  });
});
