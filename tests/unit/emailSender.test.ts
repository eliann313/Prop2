import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { configuracion, enviar } = vi.hoisted(() => ({
  configuracion: {
    emailHabilitado: false,
    env: {
      NODE_ENV: "production",
      RESEND_API_KEY: "dummy-test",
      EMAIL_FROM: "test@example.com",
    },
  },
  enviar: vi.fn(),
}));

vi.mock("@/shared/lib/serverEnv", () => configuracion);
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: enviar };
  },
}));

const datos = {
  para: "persona@example.com",
  asunto: "Restablecer contraseña",
  cuerpo: createElement("p", null, "Un enlace privado"),
  urlDeFallback: "http://localhost:3100/restablecer-password?token=token-privado-test",
};

beforeEach(() => {
  vi.resetModules();
  configuracion.emailHabilitado = false;
  configuracion.env.NODE_ENV = "production";
  enviar.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("envío de emails de autenticación", () => {
  it("no muestra tokens ni destinatarios en logs de producción sin configurar", async () => {
    const { enviarEmail, emailDeAuthDisponible } =
      await import("@/shared/lib/emailSender");
    expect(emailDeAuthDisponible).toBe(false);
    await expect(enviarEmail(datos)).resolves.toEqual({
      enviado: false,
      motivo: "sin-configurar",
    });
    const logs = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logs).not.toContain(datos.para);
    expect(logs).not.toContain("token-privado-test");
    expect(console.warn).not.toHaveBeenCalled();
    expect(enviar).not.toHaveBeenCalled();
  });

  it("mantiene el enlace local de desarrollo sin enviar a un proveedor", async () => {
    configuracion.env.NODE_ENV = "development";
    const { enviarEmail, emailDeAuthDisponible } =
      await import("@/shared/lib/emailSender");
    expect(emailDeAuthDisponible).toBe(true);
    await enviarEmail(datos);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(datos.urlDeFallback),
    );
    expect(enviar).not.toHaveBeenCalled();
  });

  it("devuelve el rechazo del proveedor sin volcar su payload privado", async () => {
    configuracion.emailHabilitado = true;
    enviar.mockResolvedValue({ error: { message: datos.urlDeFallback } });
    const { enviarEmail } = await import("@/shared/lib/emailSender");
    await expect(enviarEmail(datos)).resolves.toEqual({
      enviado: false,
      motivo: "error-proveedor",
    });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "token-privado-test",
    );
  });

  it("tolera una excepción de red y confirma un envío exitoso", async () => {
    configuracion.emailHabilitado = true;
    enviar.mockRejectedValueOnce(new Error(datos.urlDeFallback));
    enviar.mockResolvedValueOnce({ error: null });
    const { enviarEmail } = await import("@/shared/lib/emailSender");
    await expect(enviarEmail(datos)).resolves.toEqual({
      enviado: false,
      motivo: "error-proveedor",
    });
    await expect(enviarEmail(datos)).resolves.toEqual({ enviado: true });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "token-privado-test",
    );
  });
});
