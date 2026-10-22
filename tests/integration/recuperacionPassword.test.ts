import { describe, expect, it, vi } from "vitest";

const enviarEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ enviado: true }));
vi.mock("@/shared/lib/emailSender", () => ({ emailDeAuthDisponible: true, enviarEmail }));
vi.mock("@/shared/lib/passwordsFiltradas", () => ({
  estaEnFiltraciones: vi.fn().mockResolvedValue(false),
}));

import { restablecerPassword } from "@/features/auth/actions/restablecerPassword";
import { solicitarRecuperacionPassword } from "@/features/auth/actions/solicitarRecuperacionPassword";
import { verificarPassword } from "@/features/auth/services/passwordService";
import {
  generarToken,
  hashearToken,
} from "@/features/auth/services/tokenVerificacionService";
import { crearToken } from "@/features/auth/tokenVerificacionRepository";
import { buscarUsuarioPorEmail } from "@/features/usuarios/usuarioRepository";
import { prisma } from "@/shared/lib/prismaClient";

import { crearUsuarioDePrueba } from "./ayudantes";

const EMAIL = "recuperacion@example.com";
const PASSWORD = "NuevaContraseniaSegura2026";
const datosReset = (token: string, password = PASSWORD) => ({
  token,
  password,
  confirmacion: password,
});

async function tokenPara(
  usuarioId: string,
  expiraEn?: Date,
  tipo: "recuperacion_password" | "verificacion_email" = "recuperacion_password",
) {
  const token = generarToken(tipo);
  await crearToken({
    usuarioId,
    tokenHash: token.tokenHash,
    tipo,
    expiraEn: expiraEn ?? token.expiraEn,
  });
  return token.tokenEnClaro;
}

describe("recuperación de contraseña contra Postgres", () => {
  it("dos solicitudes simultáneas dejan un solo enlace vigente", async () => {
    const usuario = await crearUsuarioDePrueba(EMAIL);
    await Promise.all([
      solicitarRecuperacionPassword({ email: EMAIL }),
      solicitarRecuperacionPassword({ email: EMAIL }),
    ]);
    expect(
      await prisma.tokenVerificacion.count({
        where: { usuarioId: usuario.id, usadoEn: null },
      }),
    ).toBe(1);
    expect(
      await prisma.tokenVerificacion.count({ where: { usuarioId: usuario.id } }),
    ).toBe(2);
  });
  it("responde igual para un email registrado y uno desconocido, guardando solo el hash del link enviado", async () => {
    enviarEmail.mockClear();
    await crearUsuarioDePrueba(EMAIL);
    const respuesta = await solicitarRecuperacionPassword({ email: EMAIL });
    expect(
      await solicitarRecuperacionPassword({ email: "desconocido@example.com" }),
    ).toEqual(respuesta);
    expect(enviarEmail).toHaveBeenCalledTimes(1);
    const url = new URL(enviarEmail.mock.calls[0]![0].urlDeFallback);
    const token = url.searchParams.get("token")!;
    expect(url.pathname).toBe("/restablecer-password");
    const registro = await prisma.tokenVerificacion.findUnique({
      where: { tokenHash: hashearToken(token) },
    });
    expect(registro?.tokenHash).not.toBe(token);
    expect(registro?.tipo).toBe("recuperacion_password");
    expect(registro!.expiraEn.getTime() - Date.now()).toBeGreaterThan(50 * 60_000);
  });

  it("actualiza la contraseña y confirma una cuenta pendiente, rechazando el enlace usado", async () => {
    const usuario = await crearUsuarioDePrueba(EMAIL);
    const token = await tokenPara(usuario.id);
    expect(await restablecerPassword(datosReset(token))).toMatchObject({ ok: true });
    const actualizado = await buscarUsuarioPorEmail(EMAIL);
    expect(actualizado?.emailVerified).toBeInstanceOf(Date);
    expect(await verificarPassword(PASSWORD, actualizado!.passwordHash)).toBe(true);
    expect(await verificarPassword("unaContrasenia123", actualizado!.passwordHash)).toBe(
      false,
    );
    expect(
      await restablecerPassword(datosReset(token, "OtraContraseniaSegura2026")),
    ).toMatchObject({ ok: false });
  });

  it("rechaza links vencidos, inventados y de verificación sin cambiar la contraseña", async () => {
    const usuario = await crearUsuarioDePrueba(EMAIL);
    const vencido = await tokenPara(usuario.id, new Date(Date.now() - 60_000));
    const verificacion = await tokenPara(usuario.id, undefined, "verificacion_email");
    for (const token of [vencido, verificacion, "token-inventado"]) {
      expect(await restablecerPassword(datosReset(token))).toMatchObject({ ok: false });
    }
    const sinCambios = await buscarUsuarioPorEmail(EMAIL);
    expect(await verificarPassword("unaContrasenia123", sinCambios!.passwordHash)).toBe(
      true,
    );
    expect(sinCambios?.emailVerified).toBeNull();
  });

  it("solo acepta uno de dos cambios concurrentes e invalida el resto de links", async () => {
    const usuario = await crearUsuarioDePrueba(EMAIL);
    const token1 = await tokenPara(usuario.id);
    const token2 = await tokenPara(usuario.id);
    const resultados = await Promise.all([
      restablecerPassword(datosReset(token1)),
      restablecerPassword(datosReset(token2, "OtraContraseniaSegura2026")),
    ]);
    expect(resultados.filter((resultado) => resultado.ok)).toHaveLength(1);
    expect(
      await prisma.tokenVerificacion.count({
        where: { usuarioId: usuario.id, usadoEn: null },
      }),
    ).toBe(0);
  });

  it("no cambia ni consume el link de una cuenta suspendida", async () => {
    const usuario = await crearUsuarioDePrueba(EMAIL);
    const token = await tokenPara(usuario.id);
    await prisma.user.update({ where: { id: usuario.id }, data: { estado: "baneado" } });
    expect(await restablecerPassword(datosReset(token))).toMatchObject({ ok: false });
    expect(
      await prisma.tokenVerificacion.count({
        where: { usuarioId: usuario.id, usadoEn: null },
      }),
    ).toBe(1);
  });
});
