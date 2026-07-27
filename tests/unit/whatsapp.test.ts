import { describe, expect, it } from "vitest";

import { linkDeWhatsapp, normalizarTelefono } from "@/shared/utils/whatsapp";

describe("normalizarTelefono", () => {
  it("saca todo lo que no sea dígito", () => {
    expect(normalizarTelefono("(011) 2345-6789")).toBe("541123456789");
  });

  it("agrega el código de país cuando falta", () => {
    expect(normalizarTelefono("1123456789")).toBe("541123456789");
  });

  it("no lo duplica cuando ya está", () => {
    expect(normalizarTelefono("+54 9 11 2345 6789")).toBe("5491123456789");
  });

  it("saca el 0 de larga distancia, que no va en formato internacional", () => {
    expect(normalizarTelefono("011 2345 6789")).toBe("541123456789");
  });

  it("rechaza un número demasiado corto en vez de armar un link roto", () => {
    expect(normalizarTelefono("1234")).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
  });
});

describe("linkDeWhatsapp", () => {
  const url = "https://prop2.example/publicaciones/abc";

  it("arma el link con el mensaje precargado", () => {
    const link = linkDeWhatsapp("1123456789", "Casa en Rosario", url);

    expect(link).toContain("https://wa.me/541123456789");
    expect(link).toContain("text=");
  });

  it("escapa el mensaje", () => {
    const link = linkDeWhatsapp("1123456789", "Casa & PH", url);

    expect(link).not.toContain("Casa & PH");
    expect(link).toContain("%26");
  });

  it("devuelve null sin teléfono, para no mostrar un botón que no funciona", () => {
    expect(linkDeWhatsapp(null, "Casa", url)).toBeNull();
    expect(linkDeWhatsapp("123", "Casa", url)).toBeNull();
  });
});
