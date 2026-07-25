import { describe, expect, it } from "vitest";

import { formatearPrecio } from "@/shared/utils/formato";

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
