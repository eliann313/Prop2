import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env, subidaDeImagenesHabilitada } from "@/shared/lib/serverEnv";

// Único punto del proyecto que habla con Cloudinary (capa de infraestructura, 4.2).
//
// El API secret nunca sale del servidor. El navegador sube el archivo DIRECTO a Cloudinary
// —sin pasar por nuestro servidor— usando una firma que este módulo genera. Eso evita que cada
// foto viaje dos veces por la red y, sobre todo, evita chocar contra el límite de 4.5 MB de
// body que tienen las funciones serverless de Vercel: una foto de celular moderna lo supera
// sola, así que subirlas a través de nuestro backend fallaría en producción aunque ande local.

if (subidaDeImagenesHabilitada) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Carpeta donde se agrupan las imágenes de publicaciones dentro de la cuenta.
 *
 * Conserva el nombre viejo del proyecto a propósito: renombrarla no mueve los archivos ya
 * subidos, y el cron de huérfanas barre por este prefijo. Las fotos que quedaran fuera del
 * prefijo nuevo se verían como no referenciadas y se borrarían. Migrar la carpeta es un
 * `rename` masivo en Cloudinary más el cambio de las URLs guardadas, no una constante.
 */
const CARPETA = "proyecto-inmuebles/publicaciones";

export type FirmaDeSubida = {
  firma: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  carpeta: string;
};

/**
 * Firma los parámetros de una subida.
 *
 * Se usa subida FIRMADA y no un "unsigned upload preset": un preset sin firmar es una URL que
 * cualquiera puede copiar del bundle del navegador para subir archivos a la cuenta sin límite.
 * Con firma, cada subida necesita una autorización que solo emite el servidor, y solo a un
 * usuario con sesión.
 *
 * La firma vence: Cloudinary rechaza timestamps de más de una hora.
 */
export function firmarSubida(): FirmaDeSubida {
  const timestamp = Math.round(Date.now() / 1000);

  // Los parámetros firmados tienen que ser EXACTAMENTE los que el cliente después envía, y en
  // el mismo orden alfabético que usa Cloudinary. Si el cliente agrega uno que no está acá, la
  // subida se rechaza con "Invalid Signature".
  const firma = cloudinary.utils.api_sign_request(
    { timestamp, folder: CARPETA },
    env.CLOUDINARY_API_SECRET!,
  );

  return {
    firma,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY!,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    carpeta: CARPETA,
  };
}

/**
 * Borra una imagen de Cloudinary.
 *
 * No lanza si falla: que quede un archivo huérfano en Cloudinary es molesto, pero mucho menos
 * grave que dejar en la base la referencia a una imagen que el usuario ya quitó. De los
 * huérfanos se ocupa el cron de limpieza.
 */
export async function borrarImagen(publicId: string): Promise<void> {
  if (!subidaDeImagenesHabilitada) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`No se pudo borrar ${publicId} de Cloudinary:`, error);
  }
}

export type AssetEnCloudinary = {
  publicId: string;
  creadoEn: Date;
};

/** Tope de páginas a recorrer, como red de seguridad ante un cursor que no avanza. */
const MAX_PAGINAS = 20;
const POR_PAGINA = 500;

/**
 * Lista todos los assets subidos a la carpeta de publicaciones.
 *
 * Pagina con `next_cursor` porque la Admin API devuelve como mucho 500 por request y una cuenta
 * con varias publicaciones supera eso rápido. Sin paginar, la limpieza vería solo las primeras
 * 500 y consideraría "no huérfano" a todo lo demás por no haberlo mirado — o peor, al revés.
 *
 * Ojo con el consumo: la Admin API tiene un límite propio (bastante más bajo que el de subida),
 * y por eso esto lo llama un cron diario y no una request de usuario.
 */
export async function listarImagenesSubidas(): Promise<AssetEnCloudinary[]> {
  if (!subidaDeImagenesHabilitada) return [];

  const assets: AssetEnCloudinary[] = [];
  let cursor: string | undefined;
  let paginas = 0;

  do {
    const respuesta = await cloudinary.api.resources({
      type: "upload",
      prefix: CARPETA,
      max_results: POR_PAGINA,
      next_cursor: cursor,
    });

    for (const recurso of respuesta.resources as {
      public_id: string;
      created_at: string;
    }[]) {
      assets.push({
        publicId: recurso.public_id,
        creadoEn: new Date(recurso.created_at),
      });
    }

    cursor = respuesta.next_cursor as string | undefined;
    paginas++;
  } while (cursor && paginas < MAX_PAGINAS);

  if (cursor) {
    // Se avisa en vez de seguir en silencio: si la cuenta creció más allá de lo previsto, la
    // limpieza está viendo una foto parcial de la realidad y conviene saberlo.
    console.warn(
      `Se alcanzó el tope de ${MAX_PAGINAS} páginas listando Cloudinary; quedaron assets sin revisar.`,
    );
  }

  return assets;
}

/**
 * Arma la URL de una transformación a partir del public_id.
 *
 * `f_auto` deja que Cloudinary elija el formato según el navegador (AVIF/WebP donde se pueda) y
 * `q_auto` ajusta la compresión sin degradado visible. Son las dos que más pesan en el tiempo
 * de carga de una galería, y el motivo por el que la sección 2.6 eligió Cloudinary sobre
 * alternativas que solo almacenan archivos.
 */
export function urlDeImagen(
  publicId: string,
  opciones: { ancho: number; alto?: number },
): string {
  const transformaciones = [
    "f_auto",
    "q_auto",
    `w_${opciones.ancho}`,
    opciones.alto ? `h_${opciones.alto},c_fill` : "c_limit",
  ].join(",");

  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformaciones}/${publicId}`;
}

/** Ancho de la miniatura que se guarda en `url_thumbnail` (3.1). */
export const ANCHO_THUMBNAIL = 400;
/** Ancho de la imagen en la galería del detalle. */
export const ANCHO_GALERIA = 1200;
