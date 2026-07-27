import { describe, expect, it } from "vitest";

import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import {
  construirCriterios,
  hayFiltrosAplicados,
  TAMANIO_PAGINA,
  totalDePaginas,
} from "@/features/busqueda/services/criteriosDeBusqueda";

/** Atajo: de searchParams crudos a criterios, que es el camino real. */
const criteriosDe = (params: Record<string, string | string[] | undefined>) =>
  construirCriterios(parsearFiltros(params));

describe("parsearFiltros", () => {
  it("ignora los parámetros inválidos en vez de fallar", () => {
    const filtros = parsearFiltros({
      precioMax: "abc",
      tipo: "castillo",
      orden: "; DROP TABLE publicacion",
      pagina: "-5",
      provincia: "Cataluña",
    });

    expect(filtros.precioMax).toBeUndefined();
    expect(filtros.tipo).toBeUndefined();
    expect(filtros.orden).toBeUndefined();
    expect(filtros.pagina).toBeUndefined();
    expect(filtros.provincia).toBeUndefined();
  });

  it("conserva los válidos aunque haya inválidos al lado", () => {
    const filtros = parsearFiltros({ ciudad: "Rosario", dormitorios: "no" });

    expect(filtros.ciudad).toBe("Rosario");
    expect(filtros.dormitorios).toBeUndefined();
  });

  it("se queda con el primer valor cuando un parámetro viene repetido", () => {
    expect(parsearFiltros({ tipo: ["casa", "ph"] }).tipo).toBe("casa");
  });

  it("solo activa el filtro de cochera con el valor 1", () => {
    expect(parsearFiltros({ cochera: "1" }).cochera).toBe(true);
    expect(parsearFiltros({ cochera: "0" }).cochera).toBeUndefined();
    expect(parsearFiltros({ cochera: "false" }).cochera).toBeUndefined();
  });

  it("descarta los parámetros que no son filtros", () => {
    expect(parsearFiltros({ usuarioId: "otro" })).not.toHaveProperty("usuarioId");
  });
});

describe("construirCriterios", () => {
  it("da vuelta un rango de precio invertido", () => {
    const criterios = criteriosDe({ precioMin: "200000", precioMax: "100000" });

    expect(criterios.precioMin).toBe(100_000);
    expect(criterios.precioMax).toBe(200_000);
  });

  it("da vuelta un rango de superficie invertido", () => {
    const criterios = criteriosDe({ superficieMin: "120", superficieMax: "60" });

    expect(criterios.superficieMin).toBe(60);
    expect(criterios.superficieMax).toBe(120);
  });

  it("no toca un rango que ya está en orden", () => {
    const criterios = criteriosDe({ precioMin: "100000", precioMax: "200000" });

    expect(criterios.precioMin).toBe(100_000);
    expect(criterios.precioMax).toBe(200_000);
  });

  it("ordena por relevancia cuando hay texto libre", () => {
    expect(criteriosDe({ q: "casa con pileta" }).orden).toBe("relevancia");
  });

  it("ordena por recientes cuando no hay texto", () => {
    expect(criteriosDe({}).orden).toBe("recientes");
  });

  it("degrada relevancia a recientes si se pide sin texto", () => {
    // Sin tsquery, ts_rank devuelve lo mismo para todas las filas y el orden queda arbitrario.
    expect(criteriosDe({ orden: "relevancia" }).orden).toBe("recientes");
  });

  it("respeta un orden explícito por precio, con o sin texto", () => {
    expect(criteriosDe({ orden: "precio_asc" }).orden).toBe("precio_asc");
    expect(criteriosDe({ q: "ph", orden: "precio_desc" }).orden).toBe("precio_desc");
  });

  it("calcula el offset a partir de la página", () => {
    expect(criteriosDe({}).offset).toBe(0);
    expect(criteriosDe({ pagina: "3" }).offset).toBe(2 * TAMANIO_PAGINA);
  });

  it("cae a la página 1 si la página es inválida", () => {
    const criterios = criteriosDe({ pagina: "0" });

    expect(criterios.pagina).toBe(1);
    expect(criterios.offset).toBe(0);
  });

  it("ignora la moneda si no hay nada que dependa del precio", () => {
    // El grupo de radios del formulario siempre manda una moneda: tomarla siempre haría que
    // cualquier búsqueda esconda la mitad del catálogo sin que nadie lo haya pedido.
    expect(criteriosDe({ moneda: "USD" }).moneda).toBeUndefined();
    expect(criteriosDe({ moneda: "USD", tipo: "casa" }).moneda).toBeUndefined();
  });

  it("aplica la moneda cuando hay rango de precio", () => {
    expect(criteriosDe({ moneda: "USD", precioMax: "150000" }).moneda).toBe("USD");
    expect(criteriosDe({ moneda: "ARS", precioMin: "100000" }).moneda).toBe("ARS");
  });

  it("aplica la moneda cuando se ordena por precio", () => {
    // Ordenar por precio mezclando escalas pone USD 135.000 debajo de $200.000.000.
    expect(criteriosDe({ moneda: "USD", orden: "precio_asc" }).moneda).toBe("USD");
    expect(criteriosDe({ moneda: "ARS", orden: "precio_desc" }).moneda).toBe("ARS");
  });

  it("trata ambientes, dormitorios y baños como mínimos", () => {
    const criterios = criteriosDe({ ambientes: "2", dormitorios: "1", banios: "2" });

    expect(criterios.ambientesMin).toBe(2);
    expect(criterios.dormitoriosMin).toBe(1);
    expect(criterios.baniosMin).toBe(2);
  });
});

describe("hayFiltrosAplicados", () => {
  it("es falso con una búsqueda vacía", () => {
    expect(hayFiltrosAplicados(criteriosDe({}))).toBe(false);
  });

  it("es falso si lo único que cambió es el orden o la página", () => {
    expect(hayFiltrosAplicados(criteriosDe({ orden: "precio_asc", pagina: "4" }))).toBe(
      false,
    );
  });

  it("es verdadero con cualquier filtro real", () => {
    expect(hayFiltrosAplicados(criteriosDe({ q: "loft" }))).toBe(true);
    expect(hayFiltrosAplicados(criteriosDe({ ciudad: "Córdoba" }))).toBe(true);
    expect(hayFiltrosAplicados(criteriosDe({ cochera: "1" }))).toBe(true);
    expect(hayFiltrosAplicados(criteriosDe({ precioMax: "150000" }))).toBe(true);
  });

  it("es verdadero con un mínimo en cero, que es un filtro real", () => {
    // 0 es falsy: si la comprobación fuera por truthiness, "hasta 0 pesos" pasaría por
    // "sin filtros" y la UI ofrecería limpiar algo que sí está aplicado.
    expect(hayFiltrosAplicados(criteriosDe({ precioMin: "0" }))).toBe(true);
  });
});

describe("totalDePaginas", () => {
  it("redondea para arriba", () => {
    expect(totalDePaginas(TAMANIO_PAGINA + 1)).toBe(2);
    expect(totalDePaginas(TAMANIO_PAGINA)).toBe(1);
  });

  it("devuelve 1 sin resultados, para no renderizar 'página 1 de 0'", () => {
    expect(totalDePaginas(0)).toBe(1);
  });
});
