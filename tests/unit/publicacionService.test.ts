import { describe, expect, it } from "vitest";

import {
  esVisiblePublicamente,
  motivosParaNoPublicar,
  puedeTransicionar,
  transicionesPosibles,
} from "@/features/publicaciones/services/publicacionService";
import { rolTrasPublicar } from "@/features/usuarios/services/rolService";

const publicable = {
  titulo: "Departamento 2 ambientes en Palermo",
  descripcion:
    "Muy luminoso, con balcón al frente y a dos cuadras del subte. Expensas bajas.",
  precio: 120_000,
  provincia: "CABA",
  ciudad: "Buenos Aires",
  latitud: -34.6,
  longitud: -58.4,
  cantidadDeImagenes: 3,
};

describe("transiciones de estado (6.2)", () => {
  it("permite el camino feliz: borrador → activa → pausada → activa", () => {
    expect(puedeTransicionar("borrador", "activa")).toBe(true);
    expect(puedeTransicionar("activa", "pausada")).toBe(true);
    expect(puedeTransicionar("pausada", "activa")).toBe(true);
  });

  it("no deja volver a borrador desde ningún estado", () => {
    // Editar una publicación activa no la despublica: corregir una errata no debería sacar el
    // inmueble de los resultados de búsqueda.
    for (const estado of ["activa", "pausada", "eliminada"] as const) {
      expect(puedeTransicionar(estado, "borrador")).toBe(false);
    }
  });

  it("trata eliminada como terminal", () => {
    expect(transicionesPosibles("eliminada")).toHaveLength(0);
  });

  it("no permite saltar de borrador a pausada", () => {
    // Pausar algo que nunca estuvo publicado no significa nada.
    expect(puedeTransicionar("borrador", "pausada")).toBe(false);
  });

  it("deja eliminar desde cualquier estado no terminal", () => {
    for (const estado of ["borrador", "activa", "pausada"] as const) {
      expect(puedeTransicionar(estado, "eliminada")).toBe(true);
    }
  });

  it("solo muestra públicamente las activas", () => {
    expect(esVisiblePublicamente("activa")).toBe(true);
    for (const estado of ["borrador", "pausada", "eliminada"] as const) {
      expect(esVisiblePublicamente(estado)).toBe(false);
    }
  });
});

describe("requisitos para publicar", () => {
  it("no encuentra motivos en una publicación completa", () => {
    expect(motivosParaNoPublicar(publicable)).toEqual([]);
  });

  it("exige al menos una imagen", () => {
    expect(motivosParaNoPublicar({ ...publicable, cantidadDeImagenes: 0 })).toContain(
      "sin-imagenes",
    );
  });

  it("rechaza precio cero o negativo", () => {
    expect(motivosParaNoPublicar({ ...publicable, precio: 0 })).toContain("sin-precio");
    expect(motivosParaNoPublicar({ ...publicable, precio: -1 })).toContain("sin-precio");
  });

  it("devuelve TODOS los motivos, no solo el primero", () => {
    // Si devolviera de a uno, el vendedor tendría que corregir, reintentar y descubrir el
    // siguiente error tres veces seguidas.
    const motivos = motivosParaNoPublicar({
      ...publicable,
      titulo: "corto",
      precio: 0,
      cantidadDeImagenes: 0,
    });
    expect(motivos).toHaveLength(3);
  });

  it("no acepta un título o descripción hechos solo de espacios", () => {
    const motivos = motivosParaNoPublicar({
      ...publicable,
      titulo: "          ",
      descripcion: "                                             ",
    });
    expect(motivos).toContain("sin-titulo");
    expect(motivos).toContain("sin-descripcion");
  });
});

describe("ascenso de rol al publicar (3.4)", () => {
  it("promueve al comprador a vendedor", () => {
    expect(rolTrasPublicar("comprador")).toBe("vendedor");
  });

  it("no degrada a un admin que publica", () => {
    expect(rolTrasPublicar("admin")).toBe("admin");
  });

  it("es idempotente para quien ya es vendedor", () => {
    expect(rolTrasPublicar("vendedor")).toBe("vendedor");
  });
});
