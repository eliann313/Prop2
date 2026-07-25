import { refrescarRolEnSesion } from "@/features/auth/refrescoDeSesion";
import { rolTrasPublicar } from "@/features/usuarios/services/rolService";
import { actualizarRol } from "@/features/usuarios/usuarioRepository";

/**
 * Operación pública del módulo de identidad: promueve a vendedor a quien todavía sea comprador.
 *
 * Existe para que otras features pidan el cambio sin tocar el repositorio de usuarios. La
 * diferencia importa: si `publicaciones` llamara directo a `actualizarRol`, tendría en sus
 * manos la capacidad de escribir cualquier rol —incluido `admin`— y la regla de negocio
 * quedaría repartida entre dos features. Acá el llamador no elige el rol, solo avisa que hubo
 * una publicación.
 */
export async function promoverAVendedorSiCorresponde(usuario: {
  id: string;
  rol: "comprador" | "vendedor" | "admin";
}): Promise<void> {
  const nuevoRol = rolTrasPublicar(usuario.rol);
  if (nuevoRol === usuario.rol) return;

  await actualizarRol(usuario.id, nuevoRol);

  // La sesión es un JWT firmado: sin reemitirlo, el usuario seguiría viéndose como comprador
  // hasta cerrar sesión, justo en la pantalla que le acaba de decir que ahora es vendedor.
  await refrescarRolEnSesion();
}
