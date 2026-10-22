import { describe, expect, it } from "vitest";

import {
  coincideHuellaDePassword,
  crearHuellaDePassword,
} from "@/features/auth/services/huellaDePassword";

describe("crearHuellaDePassword", () => {
  it("es estable para el mismo usuario y hash", () => {
    expect(crearHuellaDePassword("usuario-1", "bcrypt-hash")).toBe(
      crearHuellaDePassword("usuario-1", "bcrypt-hash"),
    );
  });

  it("cambia si cambia el usuario o el hash de contraseña", () => {
    const original = crearHuellaDePassword("usuario-1", "bcrypt-hash-a");

    expect(crearHuellaDePassword("usuario-2", "bcrypt-hash-a")).not.toBe(original);
    expect(crearHuellaDePassword("usuario-1", "bcrypt-hash-b")).not.toBe(original);
  });

  it("solo devuelve una huella opaca para hash y cuentas OAuth", () => {
    const passwordHash = "bcrypt-hash-que-no-debe-quedar-en-el-token";
    const huella = crearHuellaDePassword("usuario-1", passwordHash);
    const huellaOAuth = crearHuellaDePassword("usuario-google", null);

    expect(huella).toMatch(/^[a-f0-9]{64}$/);
    expect(huella).not.toContain(passwordHash);
    expect(huellaOAuth).not.toContain("sin-password");
    expect(huellaOAuth).not.toBe(crearHuellaDePassword("usuario-google", ""));
  });

  it("rechaza una huella ausente de sesiones anteriores a la versión actual", () => {
    const actual = crearHuellaDePassword("usuario-1", "bcrypt-hash");

    expect(coincideHuellaDePassword(undefined, actual)).toBe(false);
    expect(coincideHuellaDePassword("", actual)).toBe(false);
    expect(coincideHuellaDePassword(actual, actual)).toBe(true);
    expect(coincideHuellaDePassword("otra-huella", actual)).toBe(false);
  });
});
