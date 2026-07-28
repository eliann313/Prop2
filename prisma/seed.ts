import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import type { CategoriaCaracteristica } from "../src/generated/prisma/enums";

// El catálogo de características de 3.1. Vive en el seed y no en una migración porque son
// datos de referencia, no estructura: agregar "apto crédito" mañana es re-correr el seed,
// no migrar el schema (que es justamente el motivo de modelarlo como catálogo, ver 3.4).
const CARACTERISTICAS: {
  nombre: string;
  slug: string;
  categoria: CategoriaCaracteristica;
}[] = [
  { nombre: "Gas natural", slug: "gas-natural", categoria: "servicio" },
  { nombre: "Agua corriente", slug: "agua-corriente", categoria: "servicio" },
  { nombre: "Cloacas", slug: "cloacas", categoria: "servicio" },
  { nombre: "Luz trifásica", slug: "luz-trifasica", categoria: "servicio" },
  { nombre: "Internet fibra", slug: "internet-fibra", categoria: "servicio" },
  { nombre: "Piscina", slug: "piscina", categoria: "comodidad" },
  { nombre: "Balcón", slug: "balcon", categoria: "comodidad" },
  { nombre: "Parrilla", slug: "parrilla", categoria: "comodidad" },
  { nombre: "Apto profesional", slug: "apto-profesional", categoria: "comodidad" },
  { nombre: "Acepta mascotas", slug: "acepta-mascotas", categoria: "comodidad" },
  { nombre: "Gimnasio", slug: "gimnasio", categoria: "comodidad" },
  { nombre: "Seguridad 24hs", slug: "seguridad-24hs", categoria: "comodidad" },
];

async function main() {
  // El seed corre por la conexión directa, igual que las migraciones: es un script puntual,
  // no se beneficia del pooler.
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  // Mismo criterio que shared/lib/prismaClient.ts: contra la base de tests (Postgres en Docker)
  // hay que usar el adapter de `pg`, porque el de Neon habla WebSocket y un Postgres común no
  // lo entiende. Sin esto el seed fallaba con un `ErrorEvent` vacío —el error de un WebSocket
  // que no conecta— que no dice absolutamente nada sobre la causa real.
  const adapter =
    process.env.DB_DRIVER === "pg"
      ? new PrismaPg({ connectionString })
      : new PrismaNeon({ connectionString });

  const prisma = new PrismaClient({ adapter });

  try {
    // upsert por slug y no createMany: el seed tiene que poder correrse muchas veces sobre
    // la misma base sin duplicar ni explotar por el unique.
    for (const caracteristica of CARACTERISTICAS) {
      await prisma.caracteristica.upsert({
        where: { slug: caracteristica.slug },
        update: {
          nombre: caracteristica.nombre,
          categoria: caracteristica.categoria,
        },
        create: caracteristica,
      });
    }

    const total = await prisma.caracteristica.count();
    console.log(`Seed OK — ${total} características en el catálogo.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed falló:", error);
  process.exit(1);
});
