// Capa de dominio (4.2): decide QUÉ imágenes hay que borrar. Sin Cloudinary, sin Prisma y sin
// HTTP, así la regla más peligrosa del proyecto —la única que borra archivos sin que haya una
// persona mirando— se puede testear a fondo sin tocar nada real.

export type AssetCandidato = {
  publicId: string;
  creadoEn: Date;
};

/**
 * Margen antes de considerar huérfano un archivo.
 *
 * Las fotos se suben a Cloudinary ANTES de que exista la publicación: durante todo el rato que
 * alguien tarda en completar el wizard, sus imágenes están subidas y sin referenciar. Sin este
 * margen, el cron le borraría las fotos a un usuario que está llenando el formulario en ese
 * momento. 24 horas cubre incluso el caso de dejar el borrador abierto de un día para el otro.
 */
export const HORAS_DE_GRACIA = 24;

/**
 * Tope de borrados por corrida.
 *
 * No es una optimización, es contención de daño. El modo de falla que importa es que la lista
 * de referencias venga vacía o incompleta por un bug: ahí TODO parecería huérfano. Con el tope,
 * el peor caso de un día malo son 100 archivos y un warning en los logs, en vez de la cuenta
 * entera. Como el cron corre a diario, una limpieza legítimamente grande igual se completa en
 * unos días.
 */
export const MAXIMO_POR_CORRIDA = 100;

export type ResultadoSeleccion = {
  aBorrar: string[];
  /** Candidatos que superaron el tope y quedaron para la próxima corrida. */
  postergados: number;
  /** Assets que todavía están dentro del período de gracia. */
  enGracia: number;
};

type Parametros = {
  assets: AssetCandidato[];
  /** public_ids que SÍ están referenciados por alguna publicación. */
  referenciados: Iterable<string>;
  ahora?: Date;
  horasDeGracia?: number;
  maximo?: number;
};

/**
 * Selecciona los assets a borrar: los que no están referenciados por ninguna publicación Y ya
 * superaron el período de gracia.
 */
export function seleccionarHuerfanas({
  assets,
  referenciados,
  ahora = new Date(),
  horasDeGracia = HORAS_DE_GRACIA,
  maximo = MAXIMO_POR_CORRIDA,
}: Parametros): ResultadoSeleccion {
  const referenciadosSet = new Set(referenciados);
  const limite = ahora.getTime() - horasDeGracia * 60 * 60 * 1000;

  let enGracia = 0;
  const candidatos: AssetCandidato[] = [];

  for (const asset of assets) {
    if (referenciadosSet.has(asset.publicId)) continue;

    if (asset.creadoEn.getTime() > limite) {
      enGracia++;
      continue;
    }

    candidatos.push(asset);
  }

  // Se borran primero los más viejos: son los que con más certeza quedaron abandonados, y así
  // el tope por corrida no deja huérfanos antiguos dando vueltas indefinidamente.
  candidatos.sort((uno, otro) => uno.creadoEn.getTime() - otro.creadoEn.getTime());

  return {
    aBorrar: candidatos.slice(0, maximo).map((asset) => asset.publicId),
    postergados: Math.max(0, candidatos.length - maximo),
    enGracia,
  };
}
