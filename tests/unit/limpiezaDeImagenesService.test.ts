import { describe, expect, it } from "vitest";

import {
  HORAS_DE_GRACIA,
  MAXIMO_POR_CORRIDA,
  seleccionarHuerfanas,
} from "@/features/publicaciones/services/limpiezaDeImagenesService";

const AHORA = new Date("2026-07-25T12:00:00.000Z");

/** Un asset creado hace `horas` horas respecto de AHORA. */
const hace = (horas: number, publicId: string) => ({
  publicId,
  creadoEn: new Date(AHORA.getTime() - horas * 60 * 60 * 1000),
});

describe("seleccionarHuerfanas", () => {
  it("no toca las imágenes que pertenecen a una publicación", () => {
    const resultado = seleccionarHuerfanas({
      assets: [hace(100, "usada"), hace(100, "huerfana")],
      referenciados: ["usada"],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toEqual(["huerfana"]);
  });

  it("respeta el período de gracia", () => {
    // Es la protección central: durante todo el rato que alguien tarda en completar el wizard,
    // sus fotos están subidas y sin referenciar. Sin el margen, el cron se las borraría
    // mientras las está usando.
    const resultado = seleccionarHuerfanas({
      assets: [hace(HORAS_DE_GRACIA - 1, "recien-subida")],
      referenciados: [],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toEqual([]);
    expect(resultado.enGracia).toBe(1);
  });

  it("borra recién pasado el período de gracia", () => {
    const resultado = seleccionarHuerfanas({
      assets: [hace(HORAS_DE_GRACIA + 0.1, "vieja")],
      referenciados: [],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toEqual(["vieja"]);
  });

  it("no borra nada cuando todas las imágenes están referenciadas", () => {
    const assets = [hace(500, "a"), hace(500, "b"), hace(500, "c")];
    const resultado = seleccionarHuerfanas({
      assets,
      referenciados: ["a", "b", "c"],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toEqual([]);
  });

  it("limita cuántas borra por corrida", () => {
    // Contención de daño: si la lista de referencias viniera vacía por un bug, TODO parecería
    // huérfano. El tope hace que el peor caso de un día sean 100 archivos y no la cuenta entera.
    const assets = Array.from({ length: MAXIMO_POR_CORRIDA + 50 }, (_, i) =>
      hace(100 + i, `huerfana-${i}`),
    );

    const resultado = seleccionarHuerfanas({
      assets,
      referenciados: [],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toHaveLength(MAXIMO_POR_CORRIDA);
    expect(resultado.postergados).toBe(50);
  });

  it("empieza por las más viejas", () => {
    // Con el tope activo, si el orden fuera arbitrario un huérfano antiguo podría quedar
    // postergado para siempre.
    const resultado = seleccionarHuerfanas({
      assets: [hace(30, "nueva"), hace(900, "antiquisima"), hace(200, "media")],
      referenciados: [],
      ahora: AHORA,
      maximo: 2,
    });

    expect(resultado.aBorrar).toEqual(["antiquisima", "media"]);
  });

  it("no explota con la cuenta vacía", () => {
    const resultado = seleccionarHuerfanas({
      assets: [],
      referenciados: [],
      ahora: AHORA,
    });

    expect(resultado).toEqual({ aBorrar: [], postergados: 0, enGracia: 0 });
  });

  it("ignora referencias a archivos que ya no están en Cloudinary", () => {
    // Puede pasar si alguien borró una imagen a mano desde el panel de Cloudinary. No es un
    // error para esta función: solo hay que no romperse.
    const resultado = seleccionarHuerfanas({
      assets: [hace(100, "existe-y-sobra")],
      referenciados: ["ya-no-existe", "tampoco-existe"],
      ahora: AHORA,
    });

    expect(resultado.aBorrar).toEqual(["existe-y-sobra"]);
  });
});
