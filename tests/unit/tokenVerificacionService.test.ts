import { describe, expect, it } from "vitest";

import {
  estaVencido,
  generarToken,
  hashearToken,
  VIGENCIA_MS,
} from "@/features/auth/services/tokenVerificacionService";

describe("tokenVerificacionService", () => {
  it("nunca devuelve el mismo token dos veces", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generarToken("verificacion_email").tokenEnClaro),
    );
    expect(tokens.size).toBe(50);
  });

  it("el token en claro no aparece dentro del hash que se persiste", () => {
    const { tokenEnClaro, tokenHash } = generarToken("verificacion_email");
    expect(tokenHash).not.toContain(tokenEnClaro);
    expect(tokenHash).toHaveLength(64);
  });

  it("hashea de forma determinística, para poder buscar por hash", () => {
    const { tokenEnClaro, tokenHash } = generarToken("recuperacion_password");
    expect(hashearToken(tokenEnClaro)).toBe(tokenHash);
  });

  it("usa base64url, así el token entra en una URL sin escapes", () => {
    const { tokenEnClaro } = generarToken("verificacion_email");
    expect(tokenEnClaro).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("da 24 horas para verificar el email y 1 hora para resetear la contraseña", () => {
    const ahora = new Date("2026-01-01T00:00:00.000Z");

    expect(generarToken("verificacion_email", ahora).expiraEn.toISOString()).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(generarToken("recuperacion_password", ahora).expiraEn.toISOString()).toBe(
      "2026-01-01T01:00:00.000Z",
    );
    expect(VIGENCIA_MS.recuperacion_password).toBeLessThan(
      VIGENCIA_MS.verificacion_email,
    );
  });

  it("trata el instante exacto del vencimiento como vencido", () => {
    const limite = new Date("2026-01-01T00:00:00.000Z");
    expect(estaVencido(limite, limite)).toBe(true);
    expect(estaVencido(limite, new Date("2025-12-31T23:59:59.000Z"))).toBe(false);
  });
});
