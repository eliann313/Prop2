import { describe, expect, it } from "vitest";

import {
  convertir,
  formatearEquivalencia,
  formatearPrecio,
  type Cotizacion,
} from "@/shared/utils/formato";

const COTIZACION: Cotizacion = {
  pesosPorDolar: 1520,
  nombre: "dólar oficial",
  actualizadoEn: new Date("2026-07-24T18:55:00.000Z"),
};

describe("formatearPrecio", () => {
  it("distingue dólares de pesos en el símbolo", () => {
    // Es el punto entero de este test. Con currencyDisplay "narrowSymbol", el locale es-AR
    // muestra el dólar como "$" —igual que el peso— y un aviso de USD 135.000 se lee como si
    // fueran pesos: un error de mil por ciento en el precio publicado.
    const enDolares = formatearPrecio(135_000, "USD");
    const enPesos = formatearPrecio(135_000, "ARS");

    expect(enDolares).not.toBe(enPesos);
    expect(enDolares).toContain("US$");
  });

  it("usa el punto como separador de miles, como se escribe en Argentina", () => {
    expect(formatearPrecio(135_000, "ARS")).toContain("135.000");
  });

  it("no muestra centavos: en avisos de inmuebles solo agregan ruido", () => {
    expect(formatearPrecio(135_000.75, "USD")).not.toContain(",75");
  });
});

describe("convertir", () => {
  it("pasa de dólares a pesos", () => {
    expect(convertir(1000, "USD", COTIZACION)).toEqual({
      valor: 1_520_000,
      moneda: "ARS",
    });
  });

  it("pasa de pesos a dólares", () => {
    expect(convertir(1_520_000, "ARS", COTIZACION)).toEqual({
      valor: 1000,
      moneda: "USD",
    });
  });

  it("devuelve null sin cotización", () => {
    expect(convertir(1000, "USD", null)).toBeNull();
  });

  it("devuelve null con una cotización en cero, en vez de dividir por cero", () => {
    const rota: Cotizacion = { ...COTIZACION, pesosPorDolar: 0 };

    expect(convertir(1000, "USD", rota)).toBeNull();
    expect(convertir(1000, "ARS", rota)).toBeNull();
  });
});

describe("formatearEquivalencia", () => {
  it("redondea a tres cifras significativas", () => {
    // 135.000 × 1520 = 205.200.000: se muestra 205.000.000.
    expect(formatearEquivalencia(135_000, "USD", COTIZACION)).toContain("205.000.000");
  });

  it("no arrastra una precisión que la cotización no tiene", () => {
    expect(formatearEquivalencia(137_531, "USD", COTIZACION)).toContain("209.000.000");
  });

  it("aclara siempre qué dólar se usó", () => {
    expect(formatearEquivalencia(135_000, "USD", COTIZACION)).toContain("dólar oficial");
  });

  it("lleva el símbolo de aproximado", () => {
    expect(formatearEquivalencia(135_000, "USD", COTIZACION)).toContain("≈");
  });

  it("devuelve null sin cotización, para no mostrar un número inventado", () => {
    expect(formatearEquivalencia(135_000, "USD", null)).toBeNull();
  });

  it("maneja el precio cero sin romper el logaritmo del redondeo", () => {
    expect(formatearEquivalencia(0, "USD", COTIZACION)).toContain("≈");
  });
});
