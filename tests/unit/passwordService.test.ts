import { describe, expect, it } from "vitest";

import {
  hashearPassword,
  verificarPassword,
} from "@/features/auth/services/passwordService";

// La capa de dominio se testea sin base de datos ni servidor: es exactamente el beneficio de
// que services/ no importe Prisma (4.2).
describe("passwordService", () => {
  it("acepta la contraseña correcta contra su hash", async () => {
    const hash = await hashearPassword("Contrasena123");
    await expect(verificarPassword("Contrasena123", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashearPassword("Contrasena123");
    await expect(verificarPassword("Contrasena124", hash)).resolves.toBe(false);
  });

  it("genera hashes distintos para la misma contraseña", async () => {
    // bcrypt incluye un salt aleatorio en cada hash: dos usuarios con la misma contraseña no
    // comparten hash, así que un atacante no puede detectarlo mirando la tabla.
    const [uno, otro] = await Promise.all([
      hashearPassword("Contrasena123"),
      hashearPassword("Contrasena123"),
    ]);
    expect(uno).not.toBe(otro);
  });

  it("devuelve false cuando el usuario no tiene contraseña (cuenta solo de Google)", async () => {
    await expect(verificarPassword("cualquiera123", null)).resolves.toBe(false);
  });
});
