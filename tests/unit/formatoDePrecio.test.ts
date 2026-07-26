import { describe, expect, it } from "vitest";

import {
  convertir,
  formatearEquivalencia,
  formatearPrecio,
  type Cotizacion,
} from "@/shared/utils/formatoDePrecio";

const COTIZACION: Cotizacion = {
  pesosPorDolar: 1520,
  nombre: "dólar oficial",
  actualizadoEn: new Date("2026-07-24T18:55:00.000Z"),
};

describe("formatearPrecio", () => {
  it("no muestra decimales", () => {
    expect(formatearPrecio(135_000, "USD")).not.toContain(",00");
    expect(formatearPrecio(200_000, "ARS")).not.toContain(",00");
  });

  it("separa los miles", () => {
    // El separador exacto lo decide Intl según el runtime; lo que importa es que agrupe.
    expect(formatearPrecio(135_000, "USD")).toMatch(/135[.\s]000/);
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
    // 135.000 × 1520 = 205.200.000, que ya tiene tres cifras significativas.
    expect(formatearEquivalencia(135_000, "USD", COTIZACION)).toMatch(
      /205[.\s]000[.\s]000/,
    );
  });

  it("no arrastra una precisión que la cotización no tiene", () => {
    // 137.500 × 1520 = 209.000.000 exacto; con un precio menos redondo el resultado igual
    // tiene que quedar en tres cifras.
    const texto = formatearEquivalencia(137_531, "USD", COTIZACION);

    expect(texto).toMatch(/209[.\s]000[.\s]000/);
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
