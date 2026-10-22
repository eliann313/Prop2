import { describe, expect, it } from "vitest";

import {
  schemaPerfilUsuario,
  schemaTelefonoPerfil,
} from "@/features/usuarios/usuarioSchemas";

describe("schemaTelefonoPerfil", () => {
  it("normaliza un móvil argentino internacional a E.164", () => {
    expect(schemaTelefonoPerfil.parse(" +54 9 (11) 2345-6789 ")).toBe("+5491123456789");
  });

  it("deja el teléfono vacío como null", () => {
    expect(schemaTelefonoPerfil.parse("  ")).toBeNull();
  });

  it("exige código internacional y rechaza letras", () => {
    expect(schemaTelefonoPerfil.safeParse("011 2345-6789").success).toBe(false);
    expect(schemaTelefonoPerfil.safeParse("+54 9 11 ABCD-6789").success).toBe(false);
  });
});

describe("schemaPerfilUsuario", () => {
  it("recorta el nombre y no acepta campos sensibles extra", () => {
    expect(schemaPerfilUsuario.parse({ nombre: " Ana Pérez ", telefono: "" })).toEqual({
      nombre: "Ana Pérez",
      telefono: null,
    });
    expect(
      schemaPerfilUsuario.safeParse({
        nombre: "Ana Pérez",
        telefono: "",
        email: "otro@x.com",
      }).success,
    ).toBe(false);
  });

  it("rechaza nombre corto y teléfono internacional demasiado largo", () => {
    expect(
      schemaPerfilUsuario.safeParse({ nombre: "A", telefono: "+54 9 11 2345-6789" })
        .success,
    ).toBe(false);
    expect(
      schemaPerfilUsuario.safeParse({ nombre: "Ana", telefono: `+${"1".repeat(16)}` })
        .success,
    ).toBe(false);
  });
});
