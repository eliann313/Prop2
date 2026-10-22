import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requerirUsuario: vi.fn(),
  consumirIntento: vi.fn(),
  firmarSubida: vi.fn(),
  subidaDeImagenesHabilitada: true,
}));

vi.mock("@/features/auth/sessionQueries", () => ({
  requerirUsuario: mocks.requerirUsuario,
}));
vi.mock("@/shared/lib/rateLimiters", () => ({
  consumirIntento: mocks.consumirIntento,
}));
vi.mock("@/shared/lib/cloudinaryClient", () => ({
  firmarSubida: mocks.firmarSubida,
}));
vi.mock("@/shared/lib/serverEnv", () => ({
  get subidaDeImagenesHabilitada() {
    return mocks.subidaDeImagenesHabilitada;
  },
}));

import { firmarSubidaDeImagen } from "@/features/publicaciones/actions/firmarSubidaDeImagen";
import { RUTAS } from "@/shared/rutas";

const firma = {
  firma: "firmada",
  timestamp: 1_800_000_000,
  apiKey: "api-key-publica",
  cloudName: "cloud-publico",
  carpeta: "proyecto-inmuebles/publicaciones",
};

describe("firmarSubidaDeImagen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subidaDeImagenesHabilitada = true;
    mocks.requerirUsuario.mockResolvedValue({ id: "usuario-1" });
    mocks.consumirIntento.mockResolvedValue({ permitido: true, reintentarEnSegundos: 0 });
    mocks.firmarSubida.mockReturnValue(firma);
  });

  it("exige sesión y consume el límite dedicado de subidas por usuario", async () => {
    await expect(firmarSubidaDeImagen()).resolves.toEqual({ ok: true, datos: firma });

    expect(mocks.requerirUsuario).toHaveBeenCalledWith(RUTAS.dashboard);
    expect(mocks.consumirIntento).toHaveBeenCalledWith("subidaImagen", "usuario-1");
    expect(mocks.firmarSubida).toHaveBeenCalledOnce();
  });

  it("rechaza una subida cuando se agotó el cupo y no emite firma", async () => {
    mocks.consumirIntento.mockResolvedValue({
      permitido: false,
      reintentarEnSegundos: 300,
    });

    await expect(firmarSubidaDeImagen()).resolves.toMatchObject({
      ok: false,
      mensaje: "Subiste muchas fotos seguidas. Esperá unos minutos.",
    });
    expect(mocks.firmarSubida).not.toHaveBeenCalled();
  });

  it("no consulta el limitador ni Cloudinary si la integración está desactivada", async () => {
    mocks.subidaDeImagenesHabilitada = false;

    await expect(firmarSubidaDeImagen()).resolves.toMatchObject({
      ok: false,
      mensaje: "La subida de imágenes no está configurada en este entorno.",
    });
    expect(mocks.consumirIntento).not.toHaveBeenCalled();
    expect(mocks.firmarSubida).not.toHaveBeenCalled();
  });

  it("no emite firma si el chequeo de autenticación rechaza la solicitud", async () => {
    mocks.requerirUsuario.mockRejectedValue(new Error("AUTH_REQUIRED"));

    await expect(firmarSubidaDeImagen()).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.consumirIntento).not.toHaveBeenCalled();
    expect(mocks.firmarSubida).not.toHaveBeenCalled();
  });
});
