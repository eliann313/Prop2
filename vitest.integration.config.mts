import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { URL_BASE_DE_TEST } from "./tests/integration/baseDeTest";

/**
 * Config separada de la de unit tests (12.2 vs 12.1), y no un `include` más en la misma.
 *
 * Los dos tipos de test tienen requisitos incompatibles: los unitarios corren en jsdom, sin
 * base y en paralelo; estos corren en node, contra un Postgres real y en serie. Meterlos en una
 * sola config obligaría a que `npm test` —lo que se corre veinte veces por día— dependa de
 * tener Docker levantado.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Mismo stub que en la config de unit tests: `server-only` lanza al importarse fuera del
      // runtime react-server, y acá se importan repositorios que lo traen.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/serverOnly.ts", import.meta.url),
      ),
    },
  },
  test: {
    // node y no jsdom: acá no se renderiza nada, y jsdom solo agregaría medio segundo de setup
    // por archivo.
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],

    // Las variables se setean ACÁ y no en el setup file porque `prismaClient.ts` construye el
    // adapter al importarse, leyendo process.env en ese momento. Si se setearan más tarde, el
    // cliente ya estaría apuntando a la base equivocada — la de desarrollo.
    env: {
      DATABASE_URL: URL_BASE_DE_TEST,
      DB_DRIVER: "pg",
      // serverEnv valida el entorno al importarse y AUTH_SECRET es obligatoria. Un valor
      // cualquiera alcanza: en estos tests no se firma ni se verifica ningún JWT.
      AUTH_SECRET: "valor-dummy-solo-para-los-tests-de-integracion",
      NODE_ENV: "test",
    },

    // Una sola base compartida: dos archivos corriendo a la vez se pisarían los TRUNCATE entre
    // test y test. Aislar por schema o por base permitiría paralelizar, pero con esta cantidad
    // de tests el costo de coordinarlo supera lo que se ahorra.
    fileParallelism: false,

    // Más que el default de 5s: la primera consulta paga el arranque del pool, y en CI el
    // contenedor puede estar recién levantado.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
