import type { DefaultSession } from "next-auth";

import type { EstadoUsuario, Rol } from "@/generated/prisma/enums";

// Auth.js expone `session.user` con nombre/email/imagen y nada más. El rol y el estado son
// campos propios del dominio (3.1) que este proyecto mete en el JWT, así que hay que
// declararlos para que el resto del código los vea tipados y no haya que castear en cada uso.
//
// Por qué se augmentan los módulos "@auth/core/*" y no solo "next-auth", que es lo que muestra
// la documentación: los paquetes `next-auth/jwt` y `next-auth/adapters` son puros re-exports
// (`export * from "@auth/core/jwt"`), y augmentar un re-export no toca el interface original.
// El detalle que lo vuelve difícil de detectar es que `JWT extends Record<string, unknown>`:
// con la augmentación en el módulo equivocado, `token.rol` no da error de "no existe" sino que
// resuelve a `unknown` por el índice, y el error aparece recién al asignarlo a otra variable.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
      estado: EstadoUsuario;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface User {
    rol: Rol;
    estado: EstadoUsuario;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    rol: Rol;
    estado: EstadoUsuario;
  }
}
