import { describe, expect, it } from "vitest";

import { parsearParametrosDeConsultas } from "@/features/contacto/consultasSchemas";

describe("parsearParametrosDeConsultas", () => {
  it("normaliza página y filtro UUID", () => {
    expect(
      parsearParametrosDeConsultas({
        pagina: "4",
        publicacionId: "550e8400-e29b-41d4-a716-446655440000",
        estado: "atendida",
      }),
    ).toEqual({
      pagina: 4,
      publicacionId: "550e8400-e29b-41d4-a716-446655440000",
      estado: "atendida",
    });
  });

  it("toma el primer parámetro repetido y cae a valores seguros si son inválidos", () => {
    expect(
      parsearParametrosDeConsultas({
        pagina: ["2", "999"],
        publicacionId: "no-es-un-uuid",
        estado: "sin-resolver",
      }),
    ).toEqual({ pagina: 2, publicacionId: undefined, estado: undefined });
    expect(parsearParametrosDeConsultas({ pagina: "-3" })).toEqual({
      pagina: 1,
      publicacionId: undefined,
      estado: undefined,
    });
  });
});
