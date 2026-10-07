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

/** Datos mínimos para validar/revocar un JWT sin cargar el resto del perfil. */
export function buscarUsuarioParaValidarSesion(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, rol: true, estado: true, passwordHash: true },
  });
}

export function buscarUsuarioPublicoPorId(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: SELECT_USUARIO_PUBLICO,
  });
}

/** Datos que el dueño puede revisar y editar desde su perfil. */
export function buscarPerfilDeUsuario(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, telefono: true },
  });
}

/** Actualiza exclusivamente campos editables del perfil; email, rol y credenciales quedan fuera. */
export function actualizarPerfilDeUsuario(
  id: string,
  datos: { nombre: string; telefono: string | null },
) {
  return prisma.user.update({
    where: { id },
    data: { name: datos.nombre, telefono: datos.telefono },
    select: { name: true, email: true, telefono: true },
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
