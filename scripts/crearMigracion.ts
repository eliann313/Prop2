import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// Crea una migración nueva SIN conectarse a la base.
//
// `prisma migrate dev` es el camino normal, pero necesita alcanzar Postgres por TCP en el 5432
// y en esta red eso falla por IPv6 (el detalle está en scripts/aplicarMigracionesNeonHttp.ts).
// `prisma migrate diff --from-migrations` tampoco sirve como alternativa: replaya el historial
// en una shadow database, o sea que también necesita la base.
//
// La solución es diffear contra un SNAPSHOT del schema: prisma/schema.snapshot.prisma guarda
// cómo era el schema en la última migración. El diff snapshot → schema actual es exactamente el
// SQL de la migración nueva, y se calcula 100% offline. Al terminar, el snapshot se actualiza.
//
// Uso: npm run db:migrate:new -- nombre_de_la_migracion

const RAIZ = process.cwd();
const SCHEMA = join(RAIZ, "prisma", "schema.prisma");
const SNAPSHOT = join(RAIZ, "prisma", "schema.snapshot.prisma");
const DIR_MIGRACIONES = join(RAIZ, "prisma", "migrations");

const nombreCrudo = process.argv[2];

if (!nombreCrudo) {
  console.error("Falta el nombre. Ejemplo:\n  npm run db:migrate:new -- agrega_campo_x");
  process.exit(1);
}

// Mismo saneado que aplica Prisma al nombre de la carpeta.
const nombre = nombreCrudo
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  // `_` y no `_+`: el replace de arriba colapsa cada corrida de caracteres no alfanuméricos en
  // UN solo guion bajo, así que después de esa línea es imposible tener dos seguidos. El
  // cuantificador no solo sobraba: hacía que la búsqueda del sufijo fuera cuadrática sobre una
  // cadena larga de guiones bajos (8.22).
  .replace(/^_|_$/g, "");

if (!nombre) {
  console.error("El nombre no tiene caracteres usables.");
  process.exit(1);
}

if (!existsSync(SNAPSHOT)) {
  console.error(
    `No existe ${SNAPSHOT}.\nDebería ser una copia del schema tal como quedó en la última migración.`,
  );
  process.exit(1);
}

const marca = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const carpeta = join(DIR_MIGRACIONES, `${marca}_${nombre}`);
const archivoSql = join(carpeta, "migration.sql");

mkdirSync(carpeta, { recursive: true });

/**
 * Borra la carpeta si quedó sin migration.sql adentro.
 *
 * Sin esto, cualquier salida por error deja una carpeta de migración vacía — y el aplicador
 * (`db:migrate:http`) recorre las carpetas asumiendo que todas tienen su SQL, así que revienta
 * con ENOENT en la siguiente corrida. El error aparece lejos de su causa y confunde.
 */
function limpiarSiQuedoVacia() {
  if (!existsSync(archivoSql)) rmSync(carpeta, { recursive: true, force: true });
}

process.on("exit", limpiarSiQuedoVacia);

// Se ejecuta el CLI de Prisma con node directamente, en vez de `npx`.
//
// Dos motivos, los dos de Windows: `npx` ahí es `npx.cmd`, y desde Node 20 `spawnSync` se
// niega a ejecutar archivos .cmd sin `shell: true` (falla con EINVAL). Y pasar por un shell
// traería el problema de siempre con las rutas que tienen espacios. Resolviendo el entrypoint
// del paquete y llamándolo con `process.execPath`, los argumentos viajan como arreglo y no los
// interpreta ningún shell.
const prismaCli = require.resolve("prisma/build/index.js");

execFileSync(
  process.execPath,
  [
    prismaCli,
    "migrate",
    "diff",
    "--from-schema",
    SNAPSHOT,
    "--to-schema",
    SCHEMA,
    "--script",
    "-o",
    archivoSql,
  ],
  { stdio: "inherit" },
);

const sql = readFileSync(archivoSql, "utf8").trim();

// Un diff vacío significa que el schema no cambió respecto del snapshot. Prisma escribe un
// comentario de "no difference" en ese caso, así que se detecta por ausencia de sentencias.
if (!sql || !/\b(CREATE|ALTER|DROP)\b/i.test(sql)) {
  // Acá el archivo SÍ existe (Prisma escribe un "no difference"), así que la limpieza del
  // handler de exit no alcanza: hay que borrar la carpeta a mano para no dejar una migración
  // que no migra nada.
  rmSync(carpeta, { recursive: true, force: true });
  console.error(
    "El schema no tiene cambios respecto del snapshot: no hay migración que crear.",
  );
  process.exit(1);
}

// El snapshot se actualiza recién ahora: si el diff hubiera fallado, seguiría reflejando el
// último estado migrado de verdad.
copyFileSync(SCHEMA, SNAPSHOT);

console.log(`Migración creada en ${carpeta}`);
console.log("Revisá el SQL y después aplicala con:  npm run db:migrate:http");
