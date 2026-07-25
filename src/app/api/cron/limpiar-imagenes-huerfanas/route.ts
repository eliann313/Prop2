import { NextResponse } from "next/server";

import { obtenerPublicIdsReferenciados } from "@/features/publicaciones/publicacionRepository";
import {
  HORAS_DE_GRACIA,
  seleccionarHuerfanas,
} from "@/features/publicaciones/services/limpiezaDeImagenesService";
import { cronAutorizado } from "@/shared/lib/autorizacionDeCron";
import { borrarImagen, listarImagenesSubidas } from "@/shared/lib/cloudinaryClient";
import { subidaDeImagenesHabilitada } from "@/shared/lib/serverEnv";

/**
 * Borra de Cloudinary las imágenes que no pertenecen a ninguna publicación.
 *
 * Existen porque las fotos se suben ANTES de que la publicación exista: quien abandona el
 * wizard a mitad de camino deja archivos sin ninguna fila que los referencie, y en el free
 * tier eso se acumula.
 *
 * Lo dispara el cron declarado en vercel.json, una vez por día. Es un Route Handler y no una
 * Server Action porque el scheduler de Vercel invoca una URL por HTTP.
 *
 * Con `?simular=1` reporta qué borraría sin borrar nada. Vale la pena usarlo la primera vez:
 * es la única tarea del sistema que destruye datos sin una persona mirando.
 */
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    // 401 escueto: no se aclara si falta el secreto o si está mal, para no darle pistas a
    // quien esté probando.
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!subidaDeImagenesHabilitada) {
    return NextResponse.json({ omitido: "Cloudinary no está configurado" });
  }

  const simular = new URL(request.url).searchParams.get("simular") === "1";

  const [assets, referenciados] = await Promise.all([
    listarImagenesSubidas(),
    obtenerPublicIdsReferenciados(),
  ]);

  const { aBorrar, postergados, enGracia } = seleccionarHuerfanas({
    assets,
    referenciados,
  });

  let borradas = 0;
  if (!simular) {
    // Secuencial y no en paralelo: la Admin API de Cloudinary tiene un límite de requests por
    // hora bastante más bajo que el de subida, y disparar 100 destroy simultáneos es la forma
    // más rápida de que corte a mitad de camino.
    for (const publicId of aBorrar) {
      await borrarImagen(publicId);
      borradas++;
    }
  }

  const resumen = {
    simulacion: simular,
    assetsEnCloudinary: assets.length,
    referenciadosEnLaBase: referenciados.length,
    dentroDelPeriodoDeGracia: enGracia,
    horasDeGracia: HORAS_DE_GRACIA,
    huerfanasDetectadas: aBorrar.length + postergados,
    borradas,
    postergadasPorElTope: postergados,
  };

  // Queda en los logs de Vercel: es el único registro de qué borró una tarea que corre sola.
  console.info("Limpieza de imágenes huérfanas:", JSON.stringify(resumen));

  if (postergados > 0) {
    console.warn(
      `Quedaron ${postergados} huérfanas sin borrar por el tope de la corrida. Si el número no baja en los próximos días, revisar que obtenerPublicIdsReferenciados esté devolviendo bien.`,
    );
  }

  return NextResponse.json(resumen);
}
