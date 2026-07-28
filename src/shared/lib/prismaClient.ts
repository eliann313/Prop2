// El cliente de la base no debe poder entrar nunca al bundle del navegador.
import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 no trae más el motor nativo en el camino SQL: la conexión va por un driver
// adapter. Se usa el de Neon (sobre @neondatabase/serverless) y no el de `pg` genérico
// porque habla con Neon por HTTP/WebSocket, lo que evita el costo de abrir una conexión
// TCP nueva en cada invocación de función serverless en Vercel.
//
// Acá se usa la URL POOLED a propósito: el runtime abre muchas conexiones cortas y el
// pooler de Neon es lo que las absorbe. Las migraciones van por la directa (prisma.config.ts).
//
// La excepción son los tests (12.2/12.3): corren contra un Postgres común en Docker, que no
// entiende el protocolo de Neon. Ahí entra el adapter de `pg`. Es la única bifurcación de
// entorno en este archivo y va explícita —por una variable propia, no adivinando desde la
// connection string— para que no haya forma de que producción caiga en esta rama por accidente.
const connectionString = process.env.DATABASE_URL;

const adapter =
  process.env.DB_DRIVER === "pg"
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString });

// En desarrollo, el hot reload de Next re-evalúa los módulos en cada cambio. Sin este
// singleton cada recarga crearía un PrismaClient nuevo con su propio pool, y en pocos
// minutos se agota el límite de conexiones del proyecto de Neon.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
