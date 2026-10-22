import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authJsOptions } from "@/features/auth/authJsOptions";
import {
  CredencialesInvalidas,
  CuentaSuspendida,
  DemasiadosIntentos,
  EmailSinVerificar,
} from "@/features/auth/erroresDeLogin";
import {
  coincideHuellaDePassword,
  crearHuellaDePassword,
} from "@/features/auth/services/huellaDePassword";
import { verificarPassword } from "@/features/auth/services/passwordService";
import {
  buscarUsuarioParaValidarSesion,
  buscarUsuarioPorEmail,
} from "@/features/usuarios/usuarioRepository";
import { prisma } from "@/shared/lib/prismaClient";
import { consumirIntento } from "@/shared/lib/rateLimiters";
import { env, googleHabilitado } from "@/shared/lib/serverEnv";

/**
 * Instancia completa de Auth.js: providers + adapter de Prisma.
 *
 * Exporta `handlers` (los consume el Route Handler de /api/auth), `auth` (para leer la sesión
 * en el servidor), y `signIn`/`signOut` (para las Server Actions).
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: refrescarSesion,
} = NextAuth({
  ...authJsOptions,

  // El adapter se usa para el flujo de OAuth (crear el usuario de Google y su fila en
  // cuenta_oauth). El Credentials provider no lo toca: valida a mano contra la base.
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credenciales) {
        const email = String(credenciales?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credenciales?.password ?? "");
        if (!email || !password) throw new CredencialesInvalidas();

        // Rate limiting por email y no por IP: detrás de un NAT o un proxy compartido, muchos
        // usuarios legítimos comparten IP, y limitar por IP los castigaría a todos. El límite
        // por IP para ataques distribuidos queda para la tarjeta de Etapa 5 (8.4).
        const limite = await consumirIntento("login", email);
        if (!limite.permitido) throw new DemasiadosIntentos();

        const usuario = await buscarUsuarioPorEmail(email);

        // verificarPassword tolera hash null (cuenta solo de Google) y gasta el mismo tiempo
        // igual, para no filtrar por latencia qué cuentas tienen contraseña.
        const passwordCorrecta = await verificarPassword(
          password,
          usuario?.passwordHash ?? null,
        );

        // Un solo error para "no existe" y "contraseña incorrecta": distinguirlos convierte
        // el login en un enumerador de emails registrados (8.17).
        if (!usuario || !passwordCorrecta) throw new CredencialesInvalidas();

        if (usuario.estado === "baneado") throw new CuentaSuspendida();

        // El flujo de 5.1 exige email verificado para entrar con credenciales. Acá sí se puede
        // ser específico: en este punto ya se probó que quien pide es el dueño de la cuenta.
        if (!usuario.emailVerified) throw new EmailSinVerificar();

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          image: usuario.image,
          rol: usuario.rol,
          estado: usuario.estado,
          huellaPassword: crearHuellaDePassword(usuario.id, usuario.passwordHash),
        };
      },
    }),

    // Google solo se registra si hay credenciales configuradas: así el proyecto arranca sin
    // obligar a crear un proyecto en Google Cloud (ver serverEnv.ts).
    ...(googleHabilitado
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID!,
            clientSecret: env.AUTH_GOOGLE_SECRET!,

            // Sin esto, si un usuario ya se registró con email+contraseña y después entra con
            // Google usando el mismo email, Auth.js corta con OAuthAccountNotLinked en vez de
            // vincular las cuentas — que es justo lo que pide el flujo de 5.1.
            //
            // Se llama "dangerous" porque con un proveedor que NO verifique emails permitiría
            // tomar una cuenta ajena declarando su email. Con Google no aplica: verifica el
            // email antes de emitirlo, y el callback signIn de abajo rechaza igual cualquier
            // perfil que llegue sin email_verified.
            allowDangerousEmailAccountLinking: true,

            profile(perfil) {
              return {
                id: perfil.sub,
                email: perfil.email,
                name: perfil.name,
                image: perfil.picture,
                // Quien entra por Google arranca como comprador, igual que en el registro por
                // credenciales; pasa a vendedor al crear su primera publicación (3.4).
                rol: "comprador" as const,
                estado: "activo" as const,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    ...authJsOptions.callbacks,

    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        // Red de seguridad de allowDangerousEmailAccountLinking (ver arriba): si el perfil no
        // trae el email verificado por Google, no se vincula ni se crea nada.
        if (profile?.email_verified !== true) return false;
      }

      // Un usuario baneado no entra por ningún provider. Para credenciales ya se cortó en
      // authorize; esto cubre el camino de OAuth, donde authorize no corre.
      if (user?.email) {
        const existente = await buscarUsuarioPorEmail(user.email);
        if (existente?.estado === "baneado") return false;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Al iniciar sesión, `user` trae el id; al revalidar solo queda `token.sub`. El lookup
      // reducido confirma que el usuario sigue activo y permite revocar JWT tras cambio de clave.
      // Es una consulta pequeña por lectura de sesión; React cache la comparte entre componentes
      // de una misma pasada de render.
      const conDatosDeLogin = authJsOptions.callbacks.jwt({ token, user });
      const usuarioId = token.sub ?? (user ? user.id : undefined);
      if (!usuarioId) return null;

      const actual = await buscarUsuarioParaValidarSesion(usuarioId);
      if (!actual || actual.estado !== "activo") return null;

      const huellaActual = crearHuellaDePassword(actual.id, actual.passwordHash);
      if (user) {
        // Si hubo un reset mientras bcrypt validaba la clave anterior, esa autenticación
        // no puede crear una sesión vinculada a la clave nueva.
        if (
          account?.provider === "credentials" &&
          !coincideHuellaDePassword(user.huellaPassword, huellaActual)
        ) {
          return null;
        }
        // La sesión recién creada recibe solo la huella; nunca copiamos el hash bcrypt al JWT.
        conDatosDeLogin.sub = actual.id;
        conDatosDeLogin.huellaPassword = huellaActual;
      } else if (
        !coincideHuellaDePassword(conDatosDeLogin.huellaPassword, huellaActual)
      ) {
        // También revoca JWT legacy, que todavía no traen la versión/huella.
        return null;
      }

      // Rol y estado son datos vivos del usuario; no se acepta la copia vieja del JWT.
      conDatosDeLogin.rol = actual.rol;
      conDatosDeLogin.estado = actual.estado;
      conDatosDeLogin.name = actual.name;
      return conDatosDeLogin;
    },
  },
});
