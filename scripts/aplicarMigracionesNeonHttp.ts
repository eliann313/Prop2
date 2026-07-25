import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import "dotenv/config";

import { neon } from "@neondatabase/serverless";

// Equivalente a `prisma migrate deploy`, pero ejecutando el SQL por el driver HTTP de Neon
// (puerto 443) en vez del schema engine de Prisma (puerto 5432, TCP).
//
// ¿Por qué existe este script? El schema engine resuelve el host de Neon y prueba el
// registro AAAA (IPv6) primero. En redes donde IPv6 no tiene salida real —el caso de la
// conexión desde la que se armó la Etapa 1, y probablemente el de cualquier ISP argentino
// sin IPv6— ese intento no falla rápido, se queda esperando, y Prisma lo reporta como
// "P1001: Can't reach database server" aunque la base esté perfectamente accesible por IPv4.
//
// Cuándo usar cada cosa:
//   - En Vercel y en GitHub Actions IPv6 funciona: ahí corre `prisma migrate deploy` normal
//     y este script no se usa.
//   - En una máquina local sin IPv6 funcional: `npm run db:migrate:http`.
//
// Las migraciones se siguen creando con `prisma migrate diff` (ver README), así que los
// archivos de prisma/migrations/ son exactamente los mismos que generaría `migrate dev`
// y quedan compatibles con `migrate deploy`.

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Falta DATABASE_URL_UNPOOLED (o DATABASE_URL) en el entorno.");
  process.exit(1);
}

const sql = neon(connectionString);

// Misma DDL que crea Prisma Migrate. Si la tabla ya existe (porque en algún momento se
// corrió `migrate deploy` desde CI), este CREATE no la toca.
const DDL_TABLA_MIGRACIONES = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
)`;

/**
 * Parte el SQL de una migración en sentencias individuales. El endpoint HTTP de Neon acepta
 * una sentencia por request, así que no se puede mandar el archivo entero de una.
 *
 * Se recorre carácter por carácter en vez de hacer `split(";")` porque un `;` dentro de un
 * literal de texto (por ejemplo un DEFAULT 'a;b') partiría la sentencia al medio.
 */
function separarSentencias(sqlTexto: string): string[] {
  const sentencias: string[] = [];
  let actual = "";
  let enTextoLiteral = false;
  let enComentarioDeLinea = false;

  for (let i = 0; i < sqlTexto.length; i++) {
    const char = sqlTexto[i];

    if (enComentarioDeLinea) {
      if (char === "\n") enComentarioDeLinea = false;
      actual += char;
      continue;
    }

    if (!enTextoLiteral && char === "-" && sqlTexto[i + 1] === "-") {
      enComentarioDeLinea = true;
      actual += char;
      continue;
    }

    if (char === "'") {
      // '' escapa una comilla dentro de un literal: se consume de una para no creer que
      // el literal se cerró.
      if (enTextoLiteral && sqlTexto[i + 1] === "'") {
        actual += "''";
        i++;
        continue;
      }
      enTextoLiteral = !enTextoLiteral;
      actual += char;
      continue;
    }

    if (char === ";" && !enTextoLiteral) {
      sentencias.push(actual);
      actual = "";
      continue;
    }

    actual += char;
  }

  sentencias.push(actual);

  // Descarta lo que quedó vacío o es solo comentarios/espacios.
  return sentencias
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) =>
      s
        .split("\n")
        .some((linea) => !linea.trim().startsWith("--") && linea.trim() !== ""),
    );
}

async function main() {
  await sql.query(DDL_TABLA_MIGRACIONES);

  const yaAplicadas = new Set(
    (
      (await sql.query(
        `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`,
      )) as { migration_name: string }[]
    ).map((fila) => fila.migration_name),
  );

  const carpetas = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    // El prefijo de timestamp hace que el orden alfabético sea el orden cronológico.
    .map((entrada) => entrada.name)
    .sort();

  let aplicadasAhora = 0;

  for (const nombre of carpetas) {
    if (yaAplicadas.has(nombre)) {
      console.log(`= ${nombre} (ya aplicada)`);
      continue;
    }

    const rutaSql = join(MIGRATIONS_DIR, nombre, "migration.sql");
    const contenido = readFileSync(rutaSql, "utf8");
    // Prisma valida el checksum como el SHA-256 del archivo, en hex.
    const checksum = createHash("sha256").update(contenido).digest("hex");
    const sentencias = separarSentencias(contenido);

    console.log(`> ${nombre} (${sentencias.length} sentencias)`);

    // Todas las sentencias de una migración van en una sola transacción: si una falla, no
    // queda la base a medio migrar y el nombre no se registra como aplicado.
    await sql.transaction(sentencias.map((sentencia) => sql.query(sentencia)));

    await sql.query(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
       VALUES ($1, $2, $3, now(), now(), $4)`,
      [randomUUID(), checksum, nombre, sentencias.length],
    );

    aplicadasAhora++;
  }

  console.log(
    aplicadasAhora === 0
      ? "La base ya estaba al día."
      : `Listo: ${aplicadasAhora} migración(es) aplicada(s).`,
  );
}

main().catch((error) => {
  console.error("Falló la aplicación de migraciones:", error);
  process.exit(1);
});
