import { describe, expect, it } from "vitest";

import {
  CAMPOS_POR_PASO,
  PASOS_WIZARD,
  schemaPublicacion,
  schemaPublicacionBase,
} from "@/features/publicaciones/publicacionSchemas";

const valida = {
  tipoInmueble: "departamento",
  operacion: "venta",
  titulo: "Departamento 2 ambientes en Palermo",
  descripcion:
    "Muy luminoso, con balcón al frente y a dos cuadras del subte. Expensas bajas.",
  precio: "120000",
  moneda: "USD",
  provincia: "CABA",
  ciudad: "Buenos Aires",
  latitud: "-34.6",
  longitud: "-58.4",
  tieneCochera: false,
  caracteristicaIds: [],
};

describe("schemaPublicacion", () => {
  it("convierte los strings del formulario a números", () => {
    // Los <input type="number"> entregan strings; sin la conversión, el precio llegaría a
    // Prisma como texto.
    const resultado = schemaPublicacion.parse(valida);
    expect(resultado.precio).toBe(120000);
    expect(resultado.latitud).toBeCloseTo(-34.6);
  });

  it("trata los campos numéricos vacíos como ausentes, no como error", () => {
    // Un opcional sin completar llega como "" desde el DOM. Si eso fallara, el usuario vería
    // un error en un campo que nunca tocó.
    const resultado = schemaPublicacion.parse({
      ...valida,
      ambientes: "",
      expensas: "",
      piso: "",
    });
    expect(resultado.ambientes).toBeUndefined();
    expect(resultado.expensas).toBeUndefined();
  });

  it("rechaza una superficie cubierta mayor que la total", () => {
    const resultado = schemaPublicacion.safeParse({
      ...valida,
      superficieCubierta: "90",
      superficieTotal: "60",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.superficieCubierta).toBeDefined();
    }
  });

  it("avisa si un terreno declara dormitorios", () => {
    const resultado = schemaPublicacion.safeParse({
      ...valida,
      tipoInmueble: "terreno",
      dormitorios: "3",
    });
    expect(resultado.success).toBe(false);
  });

  it("solo acepta piso en tipos que están dentro de un edificio", () => {
    expect(
      schemaPublicacion.safeParse({ ...valida, tipoInmueble: "casa", piso: "3" }).success,
    ).toBe(false);
    expect(
      schemaPublicacion.safeParse({ ...valida, tipoInmueble: "departamento", piso: "3" })
        .success,
    ).toBe(true);
  });

  it("rechaza un precio con un cero de más", () => {
    expect(schemaPublicacion.safeParse({ ...valida, precio: "9999999999" }).success).toBe(
      false,
    );
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(schemaPublicacion.safeParse({ ...valida, latitud: "120" }).success).toBe(
      false,
    );
  });
});

describe("pasos del wizard", () => {
  it("deriva los campos de cada paso del schema, sin listarlos a mano", () => {
    // Si esto se rompe es porque alguien movió un campo de paso sin tocar el schema, y el
    // wizard estaría validando el paso equivocado antes de dejar avanzar.
    expect(CAMPOS_POR_PASO.basicos).toContain("titulo");
    expect(CAMPOS_POR_PASO.ubicacion).toContain("latitud");
    expect(CAMPOS_POR_PASO.caracteristicas).toContain("ambientes");
    expect(CAMPOS_POR_PASO.multimedia).toContain("videoUrl");
  });

  it("no repite un campo en dos pasos", () => {
    const todos = Object.values(CAMPOS_POR_PASO).flat();
    expect(new Set(todos).size).toBe(todos.length);
  });

  it("cubre con los 4 pasos todos los campos del formulario", () => {
    const enPasos = new Set(Object.values(CAMPOS_POR_PASO).flat());
    const enSchema = Object.keys(schemaPublicacionBase.shape);
    for (const campo of enSchema) expect(enPasos).toContain(campo);
    expect(PASOS_WIZARD).toHaveLength(4);
  });
});
