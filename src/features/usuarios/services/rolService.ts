import type { Rol } from "@/generated/prisma/enums";

// Capa de dominio del módulo de identidad (4.2): reglas puras sobre roles, sin Prisma.

/**
 * Un comprador pasa a vendedor al crear su primera publicación (3.4). No hay flujo de
 * "solicitar ser vendedor": sería fricción sin ningún control real detrás.
 *
 * La regla vive en `usuarios` y no en `publicaciones` aunque la dispare una publicación: quién
 * puede ser qué rol es una decisión del módulo de identidad. Si viviera del otro lado, cada
 * feature nueva que promueva usuarios tendría su propia copia de la regla.
 *
 * Un admin nunca se degrada: un admin que publica un inmueble sigue siendo admin.
 */
export function rolTrasPublicar(rolActual: Rol): Rol {
  return rolActual === "comprador" ? "vendedor" : rolActual;
}
