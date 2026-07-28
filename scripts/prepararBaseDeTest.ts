import { spawnSync } from "node:child_process";

import { URL_BASE_DE_TEST } from "../tests/integration/baseDeTest";

/**
 * Deja la base de tests lista: levanta el contenedor, espera a que Postgres acepte conexiones y
 * aplica las migraciones.
 *
 * Existe como script y no como una cadena de comandos en package.json por una razón práctica:
 * setear una variable de entorno delante de un comando (`DATABASE_URL=... prisma migrate`) es
 * sintaxis de shell POSIX y no funciona en PowerShell, que es donde se desarrolla este proyecto.
 * Acá se setea en `env` del proceso hijo y anda igual en las dos.
 */

/**
 * El comando va como UN string y no como (comando, args[]): Node avisa que combinar `shell: true`
 * con un array de argumentos es riesgoso, porque los concatena sin escapar. Acá no hay nada que
 * escapar —los comandos son constantes de este archivo, no entra ningún valor de afuera— pero
 * pasarlo ya concatenado evita el warning y deja claro que no hay interpolación.
 *
 * `shell: true` hace falta igual: en Windows `npx` es un .cmd y sin shell no se resuelve.
 */
function correr(comando: string, env?: Record<string, string>) {
  const resultado = spawnSync(comando, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });

  if (resultado.status !== 0) {
    console.error(`\nFalló: ${comando}`);
    process.exit(resultado.status ?? 1);
  }
}

console.log("Levantando Postgres de test…");
// `--wait` respeta el healthcheck del compose: sin esto, el `migrate deploy` de abajo saldría
// disparado contra un Postgres que todavía está inicializando y fallaría con "connection
// refused" — el clásico fallo intermitente que depende de lo rápida que sea la máquina.
correr("docker compose -f docker-compose.test.yml up -d --wait");

console.log("\nAplicando migraciones…");
correr("npx prisma migrate deploy", {
  DATABASE_URL: URL_BASE_DE_TEST,
  // La config de Prisma prefiere la URL directa si existe. En Docker no hay pooler ni conexión
  // aparte, así que se limpia para que no se cuele la de Neon leída del .env — aplicar las
  // migraciones de test sobre la base de desarrollo sería difícil de notar y caro de revertir.
  DATABASE_URL_UNPOOLED: URL_BASE_DE_TEST,
});

// El catálogo de características es dato de referencia: se carga una vez acá y NO se trunca
// entre tests (ver TABLAS_A_LIMPIAR). Sin esto, cualquier test que asocie una característica a
// una publicación fallaría por foreign key, con un error que no dice nada del caso que prueba.
console.log("\nCargando el catálogo de características…");
correr("npx tsx prisma/seed.ts", {
  DATABASE_URL: URL_BASE_DE_TEST,
  DATABASE_URL_UNPOOLED: URL_BASE_DE_TEST,
  DB_DRIVER: "pg",
});

console.log("\nBase de test lista en", URL_BASE_DE_TEST);
