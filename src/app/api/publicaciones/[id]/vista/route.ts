import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { incrementarVistas } from "@/features/publicaciones/publicacionRepository";
import { esVisitaNueva } from "@/shared/lib/contadorDeVistas";

/**
 * Registra una visita al detalle de una publicación (6.4).
 *
 * Existe como endpoint porque contar visitas necesita la IP, y leer cabeceras durante el render
 * volvía dinámica la página del detalle — justo la que 9.1 quiere cacheada. Sacando esto del
 * render, el HTML es igual para todos y la visita se registra después, desde el cliente.
 *
 * No exige sesión: la mayoría de las visitas a un aviso son de gente sin cuenta, que es
 * exactamente el tráfico que al vendedor le interesa medir.
 */

const schema = z.uuid();

export async function POST(
  request: NextRequest,
  contexto: { params: Promise<{ id: string }> },
) {
  const { id } = await contexto.params;

  // Se valida el formato antes de tocar la base: Prisma lanza si le llega algo que no es un
  // uuid, y un endpoint público no puede convertir cualquier string en una excepción.
  const validacion = schema.safeParse(id);
  if (!validacion.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonimo";

  // La deduplicación por IP+publicación (media hora) es también lo que impide inflar el
  // contador desde afuera: sin ella este endpoint sería un botón de "sumar una visita".
  if (await esVisitaNueva(validacion.data, ip)) {
    // Un id que no existe o una publicación pausada afectan 0 filas y no son un error para
    // quien llama: el contador es telemetría, no una operación que el visitante haya pedido.
    await incrementarVistas(validacion.data).catch(() => {});
  }

  // 204: no hay nada que devolverle al cliente, que además ni mira la respuesta.
  return new NextResponse(null, { status: 204 });
}
