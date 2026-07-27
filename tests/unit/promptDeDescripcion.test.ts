import { describe, expect, it } from "vitest";

import {
  construirPrompt,
  contarPalabras,
  limpiarRespuesta,
  MAXIMO_PALABRAS,
  MINIMO_PALABRAS,
  type DatosParaDescripcion,
} from "@/features/ia/services/promptDeDescripcion";

const BASE: DatosParaDescripcion = {
  tipoInmueble: "departamento",
  operacion: "venta",
  ciudad: "CABA",
  provincia: "CABA",
};

describe("construirPrompt", () => {
  it("incluye los datos cargados", () => {
    const prompt = construirPrompt({
      ...BASE,
      barrio: "Palermo",
      ambientes: 2,
      superficieCubierta: 48,
    });

    expect(prompt).toContain("departamento");
    expect(prompt).toContain("Palermo");
    expect(prompt).toContain("48 m²");
  });

  it("omite los campos que el vendedor no completó", () => {
    const prompt = construirPrompt(BASE);

    expect(prompt).not.toContain("Dormitorios");
    expect(prompt).not.toContain("Cochera");
    expect(prompt).not.toContain("undefined");
  });

  it("le prohíbe al modelo inventar datos", () => {
    // Es la instrucción que evita que el aviso afirme cosas falsas sobre un inmueble real.
    const prompt = construirPrompt(BASE);

    expect(prompt).toContain("No inventes");
    expect(prompt).toContain("No exageres");
  });

  it("pide el rango de palabras de 7.2", () => {
    const prompt = construirPrompt(BASE);

    expect(prompt).toContain(String(MINIMO_PALABRAS));
    expect(prompt).toContain(String(MAXIMO_PALABRAS));
  });

  it("distingue 'a estrenar' de una antigüedad en años", () => {
    expect(construirPrompt({ ...BASE, antiguedadAnios: 0 })).toContain("a estrenar");
    expect(construirPrompt({ ...BASE, antiguedadAnios: 12 })).toContain("12 años");
  });

  it("solo menciona la cochera cuando la hay", () => {
    expect(construirPrompt({ ...BASE, tieneCochera: true })).toContain("Cochera: sí");
    expect(construirPrompt({ ...BASE, tieneCochera: false })).not.toContain("Cochera");
  });

  it("funciona sin ubicación, que se carga en otro paso del wizard", () => {
    const prompt = construirPrompt({ tipoInmueble: "casa", operacion: "alquiler" });

    expect(prompt).toContain("casa");
    expect(prompt).not.toContain("Ubicación");
    expect(prompt).not.toContain("undefined");
  });

  it("lista las características seleccionadas", () => {
    const prompt = construirPrompt({ ...BASE, caracteristicas: ["Pileta", "Parrilla"] });

    expect(prompt).toContain("Pileta, Parrilla");
  });
});

describe("limpiarRespuesta", () => {
  it("saca el preámbulo del modelo", () => {
    const texto = limpiarRespuesta("Claro, acá tenés la descripción:\nUn departamento.");

    expect(texto).toBe("Un departamento.");
  });

  it("saca las comillas que envuelven todo", () => {
    expect(limpiarRespuesta('"Un departamento luminoso."')).toBe(
      "Un departamento luminoso.",
    );
    expect(limpiarRespuesta("“Un departamento.”")).toBe("Un departamento.");
  });

  it("no toca unas comillas que solo abren", () => {
    // Si se recortara por posición sin verificar el cierre, se perdería la primera palabra.
    expect(limpiarRespuesta('"Casa taller" es como lo llaman')).toBe(
      '"Casa taller" es como lo llaman',
    );
  });

  it("no confunde una primera línea larga con un preámbulo", () => {
    const largo = `${"Departamento muy luminoso en pleno centro de la ciudad:".repeat(2)}\nsigue`;

    expect(limpiarRespuesta(largo)).toBe(largo);
  });

  it("colapsa los saltos de línea de más", () => {
    expect(limpiarRespuesta("Uno.\n\n\n\nDos.")).toBe("Uno.\n\nDos.");
  });

  it("no rompe con texto vacío", () => {
    expect(limpiarRespuesta("   ")).toBe("");
  });
});

describe("contarPalabras", () => {
  it("cuenta separando por espacios", () => {
    expect(contarPalabras("uno dos tres")).toBe(3);
  });

  it("no cuenta los espacios de más", () => {
    expect(contarPalabras("  uno   dos  ")).toBe(2);
  });

  it("devuelve 0 con texto vacío", () => {
    expect(contarPalabras("   ")).toBe(0);
  });
});
