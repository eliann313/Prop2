import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { configuracion, enviar, enviarSmtp, renderEmail, crearTransporteSmtp } =
  vi.hoisted(() => ({
    configuracion: {
      emailHabilitado: false,
      env: {
        NODE_ENV: "production",
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "dummy-test",
        EMAIL_FROM: "test@example.com",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: 465,
        SMTP_USER: "smtp-user@example.com",
        SMTP_PASSWORD: "smtp-password-test",
      },
    },
    enviar: vi.fn(),
    enviarSmtp: vi.fn(),
    renderEmail: vi.fn(),
    crearTransporteSmtp: vi.fn(() => ({ sendMail: vi.fn() })),
  }));

vi.mock("@/shared/lib/serverEnv", () => configuracion);
vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: enviar };
  },
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: crearTransporteSmtp,
  },
}));
vi.mock("@react-email/render", () => ({ render: renderEmail }));

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
  configuracion.env.EMAIL_PROVIDER = "resend";
  enviar.mockReset();
  enviarSmtp.mockReset();
  crearTransporteSmtp.mockReset();
  crearTransporteSmtp.mockReturnValue({ sendMail: enviarSmtp });
  renderEmail.mockReset();
  renderEmail.mockImplementation(async (_element, options) =>
    options?.plainText ? "Texto plano de prueba" : "<p>HTML de prueba</p>",
  );
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

  it("mantiene el fallback de desarrollo para probar el link sin proveedor", async () => {
    configuracion.env.NODE_ENV = "development";
    const { enviarEmail, emailDeAuthDisponible } =
      await import("@/shared/lib/emailSender");
    expect(emailDeAuthDisponible).toBe(true);
    await enviarEmail(datos);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(datos.urlDeFallback),
    );
    const logs = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logs).toContain(datos.para);
    expect(logs).toContain("token-privado-test");
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

  it("envía SMTP con html y texto renderizados, esperando el resultado", async () => {
    configuracion.emailHabilitado = true;
    configuracion.env.EMAIL_PROVIDER = "smtp";
    const { enviarEmail } = await import("@/shared/lib/emailSender");

    expect(crearTransporteSmtp).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 465,
        secure: true,
        requireTLS: false,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      }),
    );
    await expect(enviarEmail(datos)).resolves.toEqual({ enviado: true });
    expect(renderEmail).toHaveBeenNthCalledWith(1, datos.cuerpo);
    expect(renderEmail).toHaveBeenNthCalledWith(2, datos.cuerpo, {
      plainText: true,
    });
    expect(enviarSmtp).toHaveBeenCalledWith({
      from: "test@example.com",
      to: datos.para,
      subject: datos.asunto,
      html: "<p>HTML de prueba</p>",
      text: "Texto plano de prueba",
    });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("fuerza STARTTLS si SMTP usa el puerto 587", async () => {
    configuracion.emailHabilitado = true;
    configuracion.env.EMAIL_PROVIDER = "smtp";
    configuracion.env.SMTP_PORT = 587;
    await import("@/shared/lib/emailSender");

    expect(crearTransporteSmtp).toHaveBeenCalledWith(
      expect.objectContaining({ secure: false, requireTLS: true }),
    );
  });

  it("no manda si SMTP está seleccionado pero falta configuración", async () => {
    configuracion.emailHabilitado = false;
    configuracion.env.EMAIL_PROVIDER = "smtp";
    const { enviarEmail, emailDeAuthDisponible } =
      await import("@/shared/lib/emailSender");

    expect(emailDeAuthDisponible).toBe(false);
    await expect(enviarEmail(datos)).resolves.toEqual({
      enviado: false,
      motivo: "sin-configurar",
    });
    expect(enviarSmtp).not.toHaveBeenCalled();
    expect(enviar).not.toHaveBeenCalled();
  });

  it("sanitiza errores SMTP que incluyen credenciales y datos privados", async () => {
    configuracion.emailHabilitado = true;
    configuracion.env.EMAIL_PROVIDER = "smtp";
    enviarSmtp.mockRejectedValueOnce(
      new Error("smtp-password-test token-privado-test persona@example.com"),
    );
    const { enviarEmail } = await import("@/shared/lib/emailSender");

    await expect(enviarEmail(datos)).resolves.toEqual({
      enviado: false,
      motivo: "error-proveedor",
    });
    const logs = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logs).not.toContain("smtp-password-test");
    expect(logs).not.toContain("token-privado-test");
    expect(logs).not.toContain(datos.para);
  });
});
