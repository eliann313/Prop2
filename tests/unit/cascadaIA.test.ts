import { describe, expect, it, vi } from "vitest";

import type { IAProvider } from "@/features/ia/providers/tipos";
import {
  ejecutarConFallback,
  ordenarProveedores,
  type Registro,
} from "@/features/ia/services/cascada";

const registroMudo: Registro = { exito: () => {}, fallo: () => {} };

function proveedor(
  nombre: string,
  comportamiento: "responde" | "falla" | "vacio",
  disponible = true,
): IAProvider {
  return {
    nombre,
    disponible,
    generarTexto: vi.fn(async () => {
      if (comportamiento === "falla") throw new Error(`${nombre} explotó`);
      if (comportamiento === "vacio") return "   ";
      return `texto de ${nombre}`;
    }),
  };
}

describe("ejecutarConFallback", () => {
  it("usa el primero que responde y no llama a los siguientes", async () => {
    const gemini = proveedor("gemini", "responde");
    const groq = proveedor("groq", "responde");

    const resultado = await ejecutarConFallback([gemini, groq], "prompt", registroMudo);

    expect(resultado).toEqual({
      ok: true,
      texto: "texto de gemini",
      proveedor: "gemini",
    });
    expect(groq.generarTexto).not.toHaveBeenCalled();
  });

  it("cae al siguiente cuando el primero falla", async () => {
    const resultado = await ejecutarConFallback(
      [proveedor("gemini", "falla"), proveedor("groq", "responde")],
      "prompt",
      registroMudo,
    );

    expect(resultado).toEqual({ ok: true, texto: "texto de groq", proveedor: "groq" });
  });

  it("recorre toda la cascada hasta encontrar uno que ande", async () => {
    const resultado = await ejecutarConFallback(
      [
        proveedor("gemini", "falla"),
        proveedor("groq", "falla"),
        proveedor("openrouter", "responde"),
      ],
      "prompt",
      registroMudo,
    );

    expect(resultado).toEqual({
      ok: true,
      texto: "texto de openrouter",
      proveedor: "openrouter",
    });
  });

  it("trata una respuesta vacía como fallo y sigue", async () => {
    // Un proveedor que devuelve "" por cuota agotada o por un filtro de contenido no puede
    // dejar al vendedor con un textarea vacío creyendo que la función anduvo.
    const resultado = await ejecutarConFallback(
      [proveedor("gemini", "vacio"), proveedor("groq", "responde")],
      "prompt",
      registroMudo,
    );

    expect(resultado).toEqual({ ok: true, texto: "texto de groq", proveedor: "groq" });
  });

  it("avisa cuando los tres fallan, sin lanzar", async () => {
    const resultado = await ejecutarConFallback(
      [
        proveedor("gemini", "falla"),
        proveedor("groq", "falla"),
        proveedor("openrouter", "falla"),
      ],
      "prompt",
      registroMudo,
    );

    expect(resultado).toEqual({ ok: false, motivo: "todos-fallaron" });
  });

  it("distingue 'no hay ninguno configurado' de 'todos fallaron'", async () => {
    const resultado = await ejecutarConFallback(
      [proveedor("gemini", "responde", false)],
      "prompt",
      registroMudo,
    );

    expect(resultado).toEqual({ ok: false, motivo: "sin-proveedores" });
  });

  it("saltea los no configurados sin intentar la llamada", async () => {
    const sinCredenciales = proveedor("gemini", "responde", false);
    const configurado = proveedor("groq", "responde");

    await ejecutarConFallback([sinCredenciales, configurado], "prompt", registroMudo);

    expect(sinCredenciales.generarTexto).not.toHaveBeenCalled();
  });

  it("registra el proveedor que respondió y los que fallaron", async () => {
    const registro: Registro = { exito: vi.fn(), fallo: vi.fn() };

    await ejecutarConFallback(
      [proveedor("gemini", "falla"), proveedor("groq", "responde")],
      "prompt",
      registro,
    );

    expect(registro.fallo).toHaveBeenCalledWith(
      "gemini",
      expect.any(Number),
      expect.anything(),
    );
    expect(registro.exito).toHaveBeenCalledWith("groq", expect.any(Number));
  });
});

describe("ordenarProveedores", () => {
  const todos = [
    proveedor("gemini", "responde"),
    proveedor("groq", "responde"),
    proveedor("openrouter", "responde"),
  ];

  it("respeta el orden de la variable de entorno", () => {
    const orden = ordenarProveedores(todos, "groq,openrouter,gemini").map(
      (p) => p.nombre,
    );

    expect(orden).toEqual(["groq", "openrouter", "gemini"]);
  });

  it("tolera espacios y mayúsculas", () => {
    const orden = ordenarProveedores(todos, " GROQ , Gemini ").map((p) => p.nombre);

    expect(orden.slice(0, 2)).toEqual(["groq", "gemini"]);
  });

  it("ignora los nombres desconocidos en vez de romper", () => {
    // Una env var mal tipeada no puede dejar sin publicar a nadie.
    const orden = ordenarProveedores(todos, "gemini,inventado").map((p) => p.nombre);

    expect(orden).toEqual(["gemini", "groq", "openrouter"]);
  });

  it("agrega al final los que no están en la variable", () => {
    // Sumar un adaptador nuevo no debería obligar a actualizar la env var de producción.
    const orden = ordenarProveedores(todos, "openrouter").map((p) => p.nombre);

    expect(orden).toEqual(["openrouter", "gemini", "groq"]);
  });

  it("con la variable vacía mantiene el orden declarado", () => {
    const orden = ordenarProveedores(todos, undefined).map((p) => p.nombre);

    expect(orden).toEqual(["gemini", "groq", "openrouter"]);
  });
});
