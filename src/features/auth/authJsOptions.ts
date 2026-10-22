import type { NextAuthConfig } from "next-auth";

import { env } from "@/shared/lib/serverEnv";
import { RUTAS } from "@/shared/rutas";

/**
 * Opciones de Auth.js que NO dependen de Prisma ni de los providers.
 *
 * Está separado de `authJsInstance.ts` a propósito: `proxy.ts` corre en cada request que
 * matchea, y solo necesita leer el JWT para decisiones optimistas de routing. La revocación por
 * cambios de credencial se valida en la instancia completa, cerca de las páginas/datos. Si
 * importara esa instancia acá se arrastraría Prisma y el adapter a ese camino caliente.
 */
export const authJsOptions = {
  secret: env.AUTH_SECRET,

  // JWT y no sesiones en base de datos: el Credentials provider de Auth.js solo funciona con
  // estrategia JWT. Queda documentado acá porque es una restricción de la librería, no una
  // preferencia — y explica por qué la tabla `sesion` del schema no se escribe.
  session: { strategy: "jwt" },

  pages: {
    signIn: RUTAS.login,
    error: RUTAS.login,
  },

  callbacks: {
    // Corre al iniciar sesión (con `user`) y en cada request que revalida el token (sin él).
    jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
        token.estado = user.estado;
      }
      return token;
    },

    // Traslada al objeto `session` lo que se guardó en el token. Sin esto, `session.user.rol`
    // llega undefined en los componentes de servidor y en el proxy.
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.rol = token.rol;
      session.user.estado = token.estado;
      return session;
    },
  },

  // Los providers se agregan en authJsInstance.ts: acá quedan vacíos porque el proxy no
  // necesita saber con qué se inició sesión, solo si hay sesión válida.
  providers: [],
} satisfies NextAuthConfig;
