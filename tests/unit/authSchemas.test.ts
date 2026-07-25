import { describe, expect, it } from "vitest";

import {
  schemaLogin,
  schemaRegistro,
  schemaRestablecerPassword,
} from "@/features/auth/authSchemas";

describe("schemaRegistro", () => {
  it("normaliza el email a minúsculas y sin espacios", () => {
    const resultado = schemaRegistro.parse({
      nombre: "Elian",
      email: "  ELIAN@Example.COM  ",
      password: "Contrasena123",
    });
    // Sin esta normalización, "A@x.com" y "a@x.com" crearían dos cuentas distintas pese al
    // unique de la columna, porque Postgres compara texto respetando mayúsculas.
    expect(resultado.email).toBe("elian@example.com");
  });

  it("exige al menos una letra y un número", () => {
    expect(
      schemaRegistro.safeParse({
        nombre: "Elian",
        email: "e@x.com",
        password: "1234567890",
      }).success,
    ).toBe(false);
    expect(
      schemaRegistro.safeParse({
        nombre: "Elian",
        email: "e@x.com",
        password: "contrasenia",
      }).success,
    ).toBe(false);
  });

  it("rechaza contraseñas de más de 72 bytes, que bcrypt truncaría en silencio", () => {
    expect(
      schemaRegistro.safeParse({
        nombre: "Elian",
        email: "e@x.com",
        password: "a1".repeat(37), // 74 bytes
      }).success,
    ).toBe(false);
  });

  it("cuenta bytes y no caracteres al medir el límite de bcrypt", () => {
    // 30 emojis de 4 bytes = 120 bytes, pero solo 30 caracteres: contar `.length` dejaría
    // pasar una contraseña que bcrypt igual va a truncar.
    expect(
      schemaRegistro.safeParse({
        nombre: "Elian",
        email: "e@x.com",
        password: `a1${"🏠".repeat(30)}`,
      }).success,
    ).toBe(false);
  });
});

describe("schemaLogin", () => {
  it("no aplica la política de contraseñas al entrar", () => {
    // Una cuenta vieja puede tener una contraseña que hoy no pasaría la política. Rechazarla
    // acá le confirmaría al atacante que ese email existe con una contraseña débil.
    expect(schemaLogin.safeParse({ email: "e@x.com", password: "abc" }).success).toBe(
      true,
    );
  });
});

describe("schemaRestablecerPassword", () => {
  it("señala el error de confirmación en el campo de confirmación", () => {
    const resultado = schemaRestablecerPassword.safeParse({
      token: "t",
      password: "Contrasena123",
      confirmacion: "Contrasena124",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.confirmacion).toBeDefined();
    }
  });
});
