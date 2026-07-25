import type { Rol } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2): el único archivo de la feature de usuarios que importa el
// cliente de Prisma. Los services y las actions piden datos acá y no conocen el ORM.

/** Campos que se pueden exponer del usuario. Nunca incluye passwordHash. */
export const SELECT_USUARIO_PUBLICO = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  telefono: true,
  rol: true,
  estado: true,
} as const;

export function buscarUsuarioPorEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/** Lo mínimo que necesita el callback jwt para refrescar autorización sin traer todo el usuario. */
export function buscarRolYEstado(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { rol: true, estado: true },
  });
}

export function buscarUsuarioPublicoPorId(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: SELECT_USUARIO_PUBLICO,
  });
}

export function crearUsuarioConCredenciales(datos: {
  nombre: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name: datos.nombre,
      email: datos.email,
      passwordHash: datos.passwordHash,
      // emailVerified queda null: el usuario todavía no confirmó el email (5.1).
    },
    select: SELECT_USUARIO_PUBLICO,
  });
}

export function marcarEmailVerificado(usuarioId: string, cuando: Date = new Date()) {
  return prisma.user.update({
    where: { id: usuarioId },
    data: { emailVerified: cuando },
    select: SELECT_USUARIO_PUBLICO,
  });
}

// Whitelist explícito de campos en vez de pasar un objeto suelto desde la action: evita que
// un payload con `rol: "admin"` termine escribiéndose por mass assignment (tarjeta de 8.x).
export function actualizarPasswordHash(usuarioId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: usuarioId },
    data: { passwordHash },
    select: { id: true },
  });
}

export function actualizarRol(usuarioId: string, rol: Rol) {
  return prisma.user.update({
    where: { id: usuarioId },
    data: { rol },
    select: SELECT_USUARIO_PUBLICO,
  });
}
