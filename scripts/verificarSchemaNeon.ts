import "dotenv/config";

import { neon } from "@neondatabase/serverless";

// Chequeo de humo del schema migrado: lista tablas, enums e índices reales de la base.
// Sirve para confirmar que la migración quedó aplicada tal como la describe la sección 3,
// sin abrir Prisma Studio ni el dashboard de Neon.
async function main() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);

  const tablas = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `) as { table_name: string }[];

  const enums = (await sql`
    SELECT t.typname, count(e.enumlabel) AS valores
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    GROUP BY t.typname ORDER BY t.typname
  `) as { typname: string; valores: string }[];

  const indices = (await sql`
    SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname = 'public' ORDER BY tablename, indexname
  `) as { tablename: string; indexname: string }[];

  console.log(`Tablas (${tablas.length}):`);
  for (const t of tablas) console.log(`  - ${t.table_name}`);

  console.log(`\nEnums (${enums.length}):`);
  for (const e of enums) console.log(`  - ${e.typname} (${e.valores} valores)`);

  console.log(`\nÍndices de publicacion:`);
  for (const i of indices.filter((x) => x.tablename === "publicacion")) {
    console.log(`  - ${i.indexname}`);
  }
  console.log(`\nTotal de índices en el schema: ${indices.length}`);
}

main().catch((error) => {
  console.error("Verificación falló:", error);
  process.exit(1);
});
