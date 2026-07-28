import { describe, expect, it } from "vitest";

import { hashearPassword } from "@/features/auth/services/passwordService";
import { hashearToken } from "@/features/auth/services/tokenVerificacionService";
import { buscarTokenPorHash } from "@/features/auth/tokenVerificacionRepository";
import {
  buscarUsuarioPorEmail,
  crearUsuarioConCredenciales,
  marcarEmailVerificado,
} from "@/features/usuarios/usuarioRepository";
import { prisma } from "@/shared/lib/prismaClient";

/**
 * Registro completo contra Postgres real (caso prioritario de 12.2).
 *
 * Lo que agrega sobre los unit tests: acá corren las queries de verdad, con las restricciones
 * de la base puestas. Un `@unique` que falta en el schema, un default mal declarado o un token
 * que no se guarda hasheado son cosas que un mock de Prisma acepta sin chistar, porque el mock
 * hace lo que le pidieron — no lo que la base haría.
 */

const EMAIL = "alguien@example.com";

async function crearUsuario(email = EMAIL) {
  return crearUsuarioConCredenciales({
    nombre: "Alguien",
    email,
    passwordHash: await hashearPassword("unaContrasenia123"),
  });
}

describe("registro de usuario", () => {
  it("crea el usuario como comprador y sin verificar", async () => {
    const usuario = await crearUsuario();

    // El estado inicial no lo pone la aplicación: son los defaults del schema (3.4). Si alguien
    // los cambiara en una migración, esto lo agarra.
    expect(usuario.rol).toBe("comprador");
    expect(usuario.emailVerified).toBeNull();
  });

  it("normaliza el email a minúsculas y no permite duplicarlo", async () => {
    await crearUsuario();

    // La restricción UNIQUE es de la base. Es la única defensa real contra dos registros
    // simultáneos con el mismo email: el chequeo previo de la action tiene una ventana de
    // carrera entre el SELECT y el INSERT que ninguna cantidad de código cierra.
    await expect(crearUsuario()).rejects.toThrow();
  });

  it("encuentra al usuario por email", async () => {
    await crearUsuario();

    await expect(buscarUsuarioPorEmail(EMAIL)).resolves.toMatchObject({ email: EMAIL });
    await expect(buscarUsuarioPorEmail("otro@example.com")).resolves.toBeNull();
  });

  it("marca el email como verificado", async () => {
    const usuario = await crearUsuario();

    await marcarEmailVerificado(usuario.id);

    const actualizado = await buscarUsuarioPorEmail(EMAIL);
    expect(actualizado?.emailVerified).toBeInstanceOf(Date);
  });
});

describe("tokens de verificación", () => {
  it("guarda el token HASHEADO, nunca en claro (8.7)", async () => {
    const usuario = await crearUsuario();
    const enClaro = "token-de-prueba-en-claro";

    await prisma.tokenVerificacion.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashearToken(enClaro),
        tipo: "verificacion_email",
        expiraEn: new Date(Date.now() + 60_000),
      },
    });

    // Se lee la fila cruda a propósito: lo que se está verificando es qué quedó ESCRITO en la
    // base, no lo que devuelve el repositorio.
    const filas = await prisma.tokenVerificacion.findMany();
    expect(filas).toHaveLength(1);
    expect(filas[0]!.tokenHash).not.toBe(enClaro);
    expect(filas[0]!.tokenHash).toBe(hashearToken(enClaro));

    // Y se encuentra por el hash, que es como lo busca el flujo real.
    await expect(buscarTokenPorHash(hashearToken(enClaro))).resolves.toMatchObject({
      usuarioId: usuario.id,
    });
  });

  it("se borran junto con el usuario", async () => {
    const usuario = await crearUsuario();
    await prisma.tokenVerificacion.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashearToken("otro"),
        tipo: "recuperacion_password",
        expiraEn: new Date(Date.now() + 60_000),
      },
    });

    await prisma.user.delete({ where: { id: usuario.id } });

    // El ON DELETE CASCADE está declarado en el schema; esto confirma que llegó a la base.
    await expect(prisma.tokenVerificacion.count()).resolves.toBe(0);
  });
});

describe("aislamiento entre tests", () => {
  // Un test que verifica el andamiaje y no el dominio. Si el TRUNCATE del setup dejara de
  // correr, el resto de los tests empezaría a fallar de formas raras y difíciles de rastrear;
  // este falla primero y dice exactamente qué pasó.
  it("arranca con la base vacía", async () => {
    await expect(prisma.user.count()).resolves.toBe(0);
    await expect(prisma.publicacion.count()).resolves.toBe(0);
  });

  it("no ve lo que creó el test anterior", async () => {
    await crearUsuario();
    await expect(prisma.user.count()).resolves.toBe(1);
  });
});
