import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { estaEnFiltraciones } from "@/shared/lib/passwordsFiltradas";

const PASSWORD = "unaContrasenia123";

const sha1 = (texto: string) =>
  createHash("sha1").update(texto, "utf8").digest("hex").toUpperCase();

const HASH = sha1(PASSWORD);
const PREFIJO = HASH.slice(0, 5);
const SUFIJO = HASH.slice(5);

/** HIBP contesta con CRLF y con el conteo detrás de los dos puntos. */
function respuestaCon(sufijos: string[]) {
  return sufijos.map((sufijo) => `${sufijo}:42`).join("\r\n");
}

function mockearFetch(respuesta: Partial<Response> | Error) {
  const fetchMock = vi.fn();
  if (respuesta instanceof Error) fetchMock.mockRejectedValue(respuesta);
  else fetchMock.mockResolvedValue(respuesta);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const ok = (cuerpo: string) => ({ ok: true, text: async () => cuerpo }) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("estaEnFiltraciones", () => {
  it("detecta la contraseña cuando su sufijo está en el rango", async () => {
    mockearFetch(ok(respuestaCon(["0".repeat(35), SUFIJO, "F".repeat(35)])));

    await expect(estaEnFiltraciones(PASSWORD)).resolves.toBe(true);
  });

  it("la deja pasar cuando su sufijo no está en el rango", async () => {
    mockearFetch(ok(respuestaCon(["0".repeat(35), "F".repeat(35)])));

    await expect(estaEnFiltraciones(PASSWORD)).resolves.toBe(false);
  });

  // El corazón de 8.17: si esto se rompiera, se estaría mandando material de la contraseña a
  // un tercero. El test existe para que ese error no pueda pasar desapercibido.
  it("solo envía los primeros 5 caracteres del hash, nunca la contraseña ni el hash completo", async () => {
    const fetchMock = mockearFetch(ok(respuestaCon([SUFIJO])));

    await estaEnFiltraciones(PASSWORD);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${PREFIJO}`);
    expect(url).not.toContain(PASSWORD);
    expect(url).not.toContain(SUFIJO);
  });

  it("pide padding para que el tamaño de la respuesta no delate el prefijo consultado", async () => {
    const fetchMock = mockearFetch(ok(respuestaCon([SUFIJO])));

    await estaEnFiltraciones(PASSWORD);

    const opciones = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((opciones.headers as Record<string, string>)["Add-Padding"]).toBe("true");
  });

  // Falla abierta a propósito: HIBP caído no puede tirar el registro (mismo criterio que el
  // limitador de intentos).
  it("deja pasar la contraseña si la API no responde", async () => {
    mockearFetch(new Error("timeout"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(estaEnFiltraciones(PASSWORD)).resolves.toBe(false);
  });

  it("deja pasar la contraseña si la API contesta con error", async () => {
    mockearFetch({ ok: false, status: 503 } as Response);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(estaEnFiltraciones(PASSWORD)).resolves.toBe(false);
  });

  it("no confunde un sufijo distinto que empieza igual", async () => {
    // Mismo comienzo que el buscado pero distinto al final: si la comparación fuera por
    // "empieza con" en vez de por el largo exacto, esto daría un falso positivo.
    const parecido = `${SUFIJO.slice(0, -1)}${SUFIJO.at(-1) === "0" ? "1" : "0"}`;
    mockearFetch(ok(respuestaCon([parecido])));

    await expect(estaEnFiltraciones(PASSWORD)).resolves.toBe(false);
  });
});
