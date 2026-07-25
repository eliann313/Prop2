import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
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
  .replace(/^_+|_+$/g, "");

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

execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "prisma",
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
