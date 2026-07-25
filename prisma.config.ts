import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Las migraciones van por la conexión DIRECTA de Neon, no por el pooler: el pooler
    // (PgBouncer en modo transaction) no soporta las sentencias de sesión que usa el motor
    // de migraciones, y falla de formas confusas. El runtime sí usa el pooler — ver
    // src/shared/lib/prisma.ts.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
