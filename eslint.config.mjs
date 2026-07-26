import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/**
 * Límites de arquitectura como reglas de lint.
 *
 * La estructura por feature (Screaming Architecture) resuelve DÓNDE va cada archivo; estas
 * reglas resuelven QUÉ PUEDE IMPORTAR cada capa, que es lo que realmente evita que en tres
 * meses un componente le pegue directo a la base de datos. Un acuerdo escrito en un documento
 * no frena eso; un check que falla en CI, sí.
 *
 * CUIDADO al editar: `no-restricted-imports` es UNA sola clave de reglas, así que un bloque
 * posterior que la declare REEMPLAZA por completo lo que declararon los anteriores para los
 * mismos archivos — no se acumulan. Por eso cada bloque de abajo repite todos los patrones que
 * le corresponden, en vez de dividirlos en bloques que se pisarían entre sí.
 */

// Prisma 7 genera el cliente en src/generated (no en node_modules).
const IMPORTS_PRISMA = {
  group: [
    "@/generated/prisma/client",
    "**/generated/prisma/client",
    "@prisma/client",
    "@/shared/lib/prismaClient",
  ],
  message:
    "Solo shared/lib/prismaClient.ts importa el cliente, y solo los *Repository.ts lo usan. Si necesitás un dato nuevo, agregá una función al repositorio.",
};

const IMPORTS_INFRA_EN_DOMINIO = {
  group: [
    "**/*Repository",
    "next/server",
    "next/navigation",
    "next/headers",
    "server-only",
  ],
  message:
    "services/ es la capa de dominio: sin repositorios y sin APIs de Next. Los datos entran por parámetro, así el service se testea sin base ni servidor.",
};

const IMPORT_NEXTAUTH_DEFAULT = {
  name: "next-auth",
  importNames: ["default"],
  message:
    "No instancies NextAuth por tu cuenta: usá `auth`/`signIn`/`signOut` de features/auth/authJsInstance.ts.",
};

/**
 * Grupos de features que sí pueden importarse entre sí. Cada grupo es un módulo del dominio:
 * auth y usuarios están genuinamente acoplados (el login valida contra el usuario), así que
 * separarlos con una regla solo obligaría a inventar indirecciones.
 *
 * Todo lo que dos grupos distintos necesiten compartir se sube a shared/ (regla de oro de 4.3).
 */
const GRUPOS_DE_FEATURES = [
  ["auth", "usuarios"],
  ["publicaciones"],
  ["busqueda"],
  ["favoritos"],
  ["contacto"],
  ["ia"],
  ["admin"],
];

/**
 * Excepciones al aislamiento entre features: el kernel de identidad.
 *
 * "Quién está logueado" y "promover a alguien a vendedor" los necesita cualquier feature, y no
 * pueden vivir en shared/ porque dependen del cliente de la base y de la config de Auth.js.
 * En vez de dejar la regla sin efecto por eso, se declara una superficie pública mínima: estos
 * dos módulos son importables desde cualquier lado, y todo el resto de auth/ y usuarios/ no.
 *
 * Es lo que evita que otra feature termine llamando a `actualizarRol` y pudiendo escribir
 * `admin`: `promocionDeRol` no recibe el rol como parámetro, lo decide adentro.
 */
const KERNEL_DE_IDENTIDAD = [
  "@/features/auth/sessionQueries",
  "@/features/usuarios/promocionDeRol",
];

/** Prohíbe importar features que no estén en el grupo del archivo. */
function importsDeOtrasFeatures(grupo) {
  const ajenas = GRUPOS_DE_FEATURES.flat().filter((f) => !grupo.includes(f));
  return {
    group: [
      ...ajenas.map((f) => `@/features/${f}/**`),
      // El `!` excluye del patrón anterior: estos quedan permitidos.
      ...KERNEL_DE_IDENTIDAD.map((modulo) => `!${modulo}`),
    ],
    message:
      "No se importa entre features. Si dos features necesitan lo mismo, ese código se sube a shared/ — o se expone como parte del kernel de identidad (ver KERNEL_DE_IDENTIDAD).",
  };
}

/** Un bloque por grupo de features, con los patrones que le corresponden a cada capa. */
const bloquesDeFeatures = GRUPOS_DE_FEATURES.flatMap((grupo) => {
  const archivosDelGrupo = grupo.map((f) => `src/features/${f}/**/*.{ts,tsx}`);
  const cruzadas = importsDeOtrasFeatures(grupo);

  return [
    {
      name: `prop2/features/${grupo.join("+")}/dominio`,
      // La capa de dominio: lo más restringida de todas.
      files: grupo.map((f) => `src/features/${f}/services/**/*.ts`),
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [IMPORT_NEXTAUTH_DEFAULT],
            patterns: [IMPORTS_PRISMA, IMPORTS_INFRA_EN_DOMINIO, cruzadas],
          },
        ],
      },
    },
    {
      name: `prop2/features/${grupo.join("+")}/aplicacion-y-presentacion`,
      files: archivosDelGrupo,
      ignores: [
        // Los repositorios son la capa de infraestructura: ahí Prisma sí va.
        ...grupo.map((f) => `src/features/${f}/**/*Repository.ts`),
        // Bloque propio (arriba), con restricciones más fuertes.
        ...grupo.map((f) => `src/features/${f}/services/**`),
        // El PrismaAdapter de Auth.js necesita la instancia del cliente: es cableado de
        // infraestructura, no acceso a datos de una feature.
        "src/features/auth/authJsInstance.ts",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          { paths: [IMPORT_NEXTAUTH_DEFAULT], patterns: [IMPORTS_PRISMA, cruzadas] },
        ],
      },
    },
    {
      name: `prop2/features/${grupo.join("+")}/infraestructura`,
      // Los repositorios pueden usar Prisma, pero siguen sin poder importar otras features.
      files: grupo.map((f) => `src/features/${f}/**/*Repository.ts`),
      rules: {
        "no-restricted-imports": ["error", { patterns: [cruzadas] }],
      },
    },
    // authJsInstance.ts es el único que puede instanciar NextAuth y tocar el cliente, porque es
    // donde se cablea el adapter. Este bloque se emite SOLO en el grupo de auth: si se emitiera
    // en todos, el último grupo del arreglo sería el que gana (los bloques se reemplazan, no se
    // acumulan) y terminaría prohibiéndole a auth importar sus propios archivos.
    ...(grupo.includes("auth")
      ? [
          {
            name: `prop2/features/${grupo.join("+")}/instancia-authjs`,
            files: ["src/features/auth/authJsInstance.ts"],
            rules: { "no-restricted-imports": ["error", { patterns: [cruzadas] }] },
          },
        ]
      : []),
  ];
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Código generado por Prisma: no se lintea.
    "src/generated/**",
  ]),

  {
    name: "prop2/reglas-generales",
    rules: {
      // Warning y no error: hay casos genuinamente difíciles de tipar con librerías de
      // terceros. Pero todo `any` que quede tiene que llevar el comentario que lo justifique
      // (14.3).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Prohibido sin excepción explícita: es la vía principal de XSS almacenado en React (8.1).
      "react/no-danger": "error",
      // Un `console.log` olvidado en una Server Action puede terminar imprimiendo datos de un
      // usuario en los logs de Vercel. warn/error/info sí se usan a propósito.
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  {
    name: "prop2/app-y-shared",
    files: ["src/app/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    // El singleton ES la importación del cliente.
    ignores: ["src/shared/lib/prismaClient.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [IMPORT_NEXTAUTH_DEFAULT], patterns: [IMPORTS_PRISMA] },
      ],
    },
  },

  ...bloquesDeFeatures,

  {
    name: "prop2/scripts-de-node",
    // Los scripts de línea de comandos y el seed no son parte de la app: su salida ES la
    // consola, y crean su propio cliente de Prisma porque corren fuera del proceso de Next.
    files: ["scripts/**/*.ts", "prisma/**/*.ts", "*.config.{ts,mts,mjs}"],
    rules: {
      "no-console": "off",
      "no-restricted-imports": "off",
    },
  },

  // Prettier va último: apaga las reglas de formato de las configs anteriores para que las dos
  // herramientas no se peleen por el mismo archivo (14.1).
  prettier,
]);

export default eslintConfig;
