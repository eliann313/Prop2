import { describe, expect, it } from "vitest";

import {
  actualizarPerfilDeUsuario,
  buscarPerfilDeUsuario,
} from "@/features/usuarios/usuarioRepository";
import { prisma } from "@/shared/lib/prismaClient";

import { crearUsuarioDePrueba } from "./ayudantes";

describe("perfil de usuario", () => {
  it("actualiza solo el dueño identificado y conserva email, rol y credenciales", async () => {
    const dueña = await crearUsuarioDePrueba("perfil-dueña@example.com");
    const otra = await crearUsuarioDePrueba("perfil-otra@example.com");
    const passwordHashAntes = (
      await prisma.user.findUniqueOrThrow({
        where: { id: dueña.id },
        select: { passwordHash: true },
      })
    ).passwordHash;

    await actualizarPerfilDeUsuario(dueña.id, {
      nombre: "Ana Pérez",
      telefono: "+5491123456789",
    });

    await expect(buscarPerfilDeUsuario(dueña.id)).resolves.toEqual({
      name: "Ana Pérez",
      email: "perfil-dueña@example.com",
      telefono: "+5491123456789",
    });
    await expect(buscarPerfilDeUsuario(otra.id)).resolves.toEqual({
      name: "Usuario de prueba",
      email: "perfil-otra@example.com",
      telefono: null,
    });
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: dueña.id },
        select: { rol: true, passwordHash: true },
      }),
    ).resolves.toEqual({ rol: "comprador", passwordHash: passwordHashAntes });
  });
});
