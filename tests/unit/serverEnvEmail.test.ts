import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

function configurarBaseEnvio(): void {
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
  vi.stubEnv("AUTH_SECRET", "secret-for-unit-tests-only");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("EMAIL_FROM", "");
  vi.stubEnv("EMAIL_PROVIDER", "");
  vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
  vi.stubEnv("SMTP_PORT", "465");
  vi.stubEnv("SMTP_USER", "account@example.com");
  vi.stubEnv("SMTP_PASSWORD", "app-password-for-unit-tests-only");
}

beforeEach(() => {
  vi.resetModules();
  configurarBaseEnvio();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("configuración de transporte de email", () => {
  it("conserva Resend como proveedor predeterminado y no cae a SMTP", async () => {
    const { env, emailHabilitado } = await import("@/shared/lib/serverEnv");

    expect(env.EMAIL_PROVIDER).toBe("resend");
    expect(emailHabilitado).toBe(false);
  });

  it("habilita SMTP con el puerto TLS 465 y todas las variables requeridas", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("EMAIL_FROM", "Prop <account@example.com>");
    const { env, emailHabilitado } = await import("@/shared/lib/serverEnv");

    expect(env.SMTP_PORT).toBe(465);
    expect(emailHabilitado).toBe(true);
  });

  it("habilita STARTTLS en el puerto 587", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("EMAIL_FROM", "Prop <account@example.com>");
    const { env, emailHabilitado } = await import("@/shared/lib/serverEnv");

    expect(env.SMTP_PORT).toBe(587);
    expect(emailHabilitado).toBe(true);
  });

  it("mantiene SMTP deshabilitado si falta una credencial o el remitente", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("EMAIL_FROM", "Prop <account@example.com>");
    vi.stubEnv("SMTP_PASSWORD", "");
    const { emailHabilitado } = await import("@/shared/lib/serverEnv");

    expect(emailHabilitado).toBe(false);
  });

  it("rechaza puertos fuera de TLS 465 y STARTTLS 587", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("SMTP_PORT", "2525");

    await expect(import("@/shared/lib/serverEnv")).rejects.toThrow(
      "Variables de entorno inválidas o faltantes",
    );
  });
});
