import { afterAll, beforeEach } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prismaClient";

import { TABLAS_A_LIMPIAR } from "./baseDeTest";

/**
 * Deja la base vacía antes de CADA test.
 *
 * Antes y no después: si un test falla a mitad de camino, lo que dejó tirado no puede
 * contaminar al siguiente. Limpiar al final depende de que el test termine, que es justo lo que
 * no pasa cuando falla — y el síntoma sería un segundo test que falla por culpa del primero.
 *
 * `TRUNCATE` y no `deleteMany`: es una sola sentencia para todas las tablas, no dispara
 * triggers ni recorre filas, y `RESTART IDENTITY` deja las secuencias como recién creadas para
 * que un test no dependa de qué ids quedaron libres en el anterior.
 */
beforeEach(async () => {
  const tablas = TABLAS_A_LIMPIAR.map((tabla) => Prisma.raw(`"${tabla}"`));

  await prisma.$executeRaw`TRUNCATE TABLE ${Prisma.join(tablas)} RESTART IDENTITY CASCADE`;
});

// Sin esto, Vitest queda colgado al terminar: el pool de `pg` mantiene conexiones abiertas y el
// proceso no tiene motivo para salir. En CI eso es un job que corre hasta el timeout.
afterAll(async () => {
  await prisma.$disconnect();
});
