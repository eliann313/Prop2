import { defineConfig, devices } from "@playwright/test";

import { URL_BASE_DE_TEST } from "./tests/integration/baseDeTest";

/**
 * E2E de los tres flujos críticos de 12.3.
 *
 * Corre contra la app levantada en local apuntando al Postgres de Docker, y NO contra el preview
 * deployment de Vercel como propone 12.3. El motivo es concreto: los previews de este proyecto
 * usan las mismas variables de entorno que producción, así que estos tests —que registran
 * usuarios y publican inmuebles— estarían escribiendo en la base real. La desviación es para
 * evitar eso, no por comodidad.
 */

const PUERTO = 3100;
const URL_BASE = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "./tests/e2e",

  // El pool de `pg` se cierra acá y no en un `afterAll` por spec: es un módulo compartido entre
  // todos los archivos del worker, así que cerrarlo por archivo se lo saca a los que faltan.
  globalTeardown: "./tests/e2e/teardown.ts",

  // En serie y con un solo worker: los tres flujos comparten la misma base y se pisarían entre
  // ellos. Paralelizar exigiría una base por worker, que para tres tests no se justifica.
  fullyParallel: false,
  workers: 1,

  // Prohibido `test.only` en CI: es la forma más común de mergear una suite que en realidad
  // corrió un solo test y pasó en verde.
  forbidOnly: Boolean(process.env.CI),

  // Un reintento en CI y ninguno en local. En CI el runner es compartido y un timeout por
  // lentitud momentánea no debería romper el pipeline; en local, un test que falla tiene que
  // fallar y verse.
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: URL_BASE,
    // Traza solo del reintento: guardar siempre infla el artefacto sin que nadie la mire cuando
    // el test pasó.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // Build de producción y no `next dev`: en dev, Next compila cada ruta la primera vez que se
    // visita, y esas demoras de varios segundos producen timeouts intermitentes que parecen
    // bugs de la app y no lo son.
    command: "npm run build && npm run start -- --port " + PUERTO,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: URL_BASE_DE_TEST,
      DB_DRIVER: "pg",
      AUTH_SECRET: "valor-dummy-solo-para-los-e2e-de-playwright",
      AUTH_URL: URL_BASE,

      // Se APAGAN explícitamente los servicios externos. No es paranoia: el proceso hereda las
      // variables del entorno y Next carga el .env, así que sin estas líneas los E2E usan las
      // credenciales REALES. Se descubrió porque Resend contestó 422 al intentar mandarle un
      // mail de verdad a un @example.com — o sea que estaba llamando a la API de producción y
      // gastando cuota en cada corrida.
      //
      // Con las vacías, cada servicio degrada con gracia por su cuenta (ver el README): los
      // links de verificación salen por consola en vez de por email.
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      // Además de aislar, evita que el limitador voltee la suite: son 5 intentos de login por
      // minuto, y un E2E que reintenta se los come enseguida.
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      // La IA no participa de ningún flujo de 12.3 y cada llamada gasta cuota del free tier.
      GOOGLE_GENERATIVE_AI_API_KEY: "",
      GROQ_API_KEY: "",
      OPENROUTER_API_KEY: "",
      // Cloudinary tiene que estar "configurado" o el paso de fotos del wizard se deshabilita
      // (ver README). Los valores son falsos a propósito: la subida real se intercepta en el
      // test, así que la firma nunca llega a Cloudinary.
      CLOUDINARY_CLOUD_NAME: "demo-e2e",
      CLOUDINARY_API_KEY: "000000000000000",
      CLOUDINARY_API_SECRET: "secreto-falso-para-e2e",
    },
  },
});
