import type {
  EstadoInmueble,
  EstadoPublicacion,
  Moneda,
  Operacion,
  Orientacion,
  TipoInmueble,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2): el único archivo de la feature que importa Prisma.

/** Campos de la publicación tal como los necesita una tarjeta del listado. */
const SELECT_TARJETA = {
  id: true,
  titulo: true,
  precio: true,
  moneda: true,
  operacion: true,
  tipoInmueble: true,
  provincia: true,
  ciudad: true,
  barrio: true,
  ambientes: true,
  dormitorios: true,
  banios: true,
  superficieCubierta: true,
  estadoPublicacion: true,
  vistas: true,
  createdAt: true,
  publishedAt: true,
  imagenes: {
    where: { esPortada: true },
    select: { url: true, urlThumbnail: true },
    take: 1,
  },
} as const;

export type PublicacionParaTarjeta = Awaited<
  ReturnType<typeof listarPublicacionesDelUsuario>
>[number];

/**
 * Publicaciones del dashboard del vendedor.
 *
 * Excluye las eliminadas: el soft delete conserva la fila para no romper las referencias de
 * Favorito y MensajeContacto (3.4), pero para el vendedor la publicación ya no existe.
 */
export function listarPublicacionesDelUsuario(usuarioId: string) {
  return prisma.publicacion.findMany({
    where: { usuarioId, estadoPublicacion: { not: "eliminada" } },
    select: SELECT_TARJETA,
    orderBy: [{ updatedAt: "desc" }],
  });
}

export function contarPublicacionesDelUsuario(usuarioId: string) {
  return prisma.publicacion.count({
    where: { usuarioId, estadoPublicacion: { not: "eliminada" } },
  });
}

/**
 * Trae una publicación SOLO si pertenece al usuario indicado.
 *
 * El usuarioId va en el WHERE y no se compara después de traer la fila: así una publicación
 * ajena devuelve null en vez de llegar a memoria y depender de que quien llama se acuerde de
 * chequear el dueño. Es la defensa contra IDOR (8.19) puesta en el único lugar donde no se
 * puede olvidar.
 */
export function buscarPublicacionDelUsuario(id: string, usuarioId: string) {
  return prisma.publicacion.findFirst({
    where: { id, usuarioId, estadoPublicacion: { not: "eliminada" } },
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      caracteristicas: { select: { caracteristicaId: true } },
    },
  });
}

/** Estado actual de una publicación, para validar la transición antes de aplicarla. */
export function buscarEstadoDePublicacion(id: string, usuarioId: string) {
  return prisma.publicacion.findFirst({
    where: { id, usuarioId },
    select: {
      id: true,
      estadoPublicacion: true,
      titulo: true,
      descripcion: true,
      precio: true,
      provincia: true,
      ciudad: true,
      latitud: true,
      longitud: true,
      _count: { select: { imagenes: true } },
    },
  });
}

export type DatosParaGuardar = {
  titulo: string;
  descripcion: string;
  tipoInmueble: TipoInmueble;
  operacion: Operacion;
  precio: number;
  moneda: Moneda;
  provincia: string;
  ciudad: string;
  barrio?: string;
  codigoPostal?: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  superficieCubierta?: number;
  superficieTotal?: number;
  ambientes?: number;
  dormitorios?: number;
  banios?: number;
  piso?: number;
  orientacion?: Orientacion;
  tieneCochera: boolean;
  antiguedadAnios?: number;
  expensas?: number;
  estadoInmueble?: EstadoInmueble;
  videoUrl?: string;
  caracteristicaIds: string[];
  imagenes: { publicId: string; url: string; urlThumbnail: string }[];
};

/**
 * Traduce el arreglo ordenado del formulario a filas de imagen_publicacion.
 *
 * `orden` es el índice y `esPortada` es "soy el primero": así la base no puede terminar con dos
 * portadas ni con ninguna, sin necesidad de una restricción extra ni de validarlo al leer.
 */
function filasDeImagenes(imagenes: DatosParaGuardar["imagenes"]) {
  return imagenes.map((imagen, indice) => ({
    publicId: imagen.publicId,
    url: imagen.url,
    urlThumbnail: imagen.urlThumbnail,
    orden: indice,
    esPortada: indice === 0,
  }));
}

/**
 * Los campos se listan uno por uno en vez de hacer spread del objeto que llega del formulario.
 * Es deliberado: un spread deja pasar cualquier clave extra del payload —`estadoPublicacion`,
 * `usuarioId`, `vistas`— y convierte el formulario en una vía para escribir columnas que el
 * usuario no debería poder tocar (mass assignment).
 */
function camposEscribibles(datos: DatosParaGuardar) {
  return {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    tipoInmueble: datos.tipoInmueble,
    operacion: datos.operacion,
    precio: datos.precio,
    moneda: datos.moneda,
    provincia: datos.provincia,
    ciudad: datos.ciudad,
    barrio: datos.barrio ?? null,
    codigoPostal: datos.codigoPostal ?? null,
    direccion: datos.direccion ?? null,
    latitud: datos.latitud,
    longitud: datos.longitud,
    superficieCubierta: datos.superficieCubierta ?? null,
    superficieTotal: datos.superficieTotal ?? null,
    ambientes: datos.ambientes ?? null,
    dormitorios: datos.dormitorios ?? null,
    banios: datos.banios ?? null,
    piso: datos.piso ?? null,
    orientacion: datos.orientacion ?? null,
    tieneCochera: datos.tieneCochera,
    antiguedadAnios: datos.antiguedadAnios ?? null,
    expensas: datos.expensas ?? null,
    estadoInmueble: datos.estadoInmueble ?? null,
    videoUrl: datos.videoUrl ?? null,
  };
}

export function crearPublicacionBorrador(usuarioId: string, datos: DatosParaGuardar) {
  return prisma.publicacion.create({
    data: {
      ...camposEscribibles(datos),
      usuarioId,
      // Toda publicación nace como borrador y se activa por una acción aparte (6.2).
      estadoPublicacion: "borrador",
      caracteristicas: {
        create: datos.caracteristicaIds.map((caracteristicaId) => ({ caracteristicaId })),
      },
      imagenes: { create: filasDeImagenes(datos.imagenes) },
    },
    select: { id: true },
  });
}

/**
 * Actualiza una publicación del usuario. Devuelve null si no le pertenece.
 *
 * No cambia `estadoPublicacion`: editar una publicación activa NO la vuelve a borrador (6.2).
 * Corregir una errata no debería sacar el inmueble de los resultados de búsqueda.
 */
export async function actualizarPublicacion(
  id: string,
  usuarioId: string,
  datos: DatosParaGuardar,
) {
  // updateMany y no update: `update` busca solo por id (la PK) y no acepta filtrar por dueño,
  // así que habría que leer primero y comparar — dos consultas y una ventana de carrera. Con
  // updateMany el usuarioId entra en el WHERE y una publicación ajena simplemente afecta 0 filas.
  const { count } = await prisma.publicacion.updateMany({
    where: { id, usuarioId, estadoPublicacion: { not: "eliminada" } },
    data: camposEscribibles(datos),
  });

  if (count === 0) return null;

  // Características e imágenes se reemplazan por completo en vez de calcular el diff: para una
  // decena de filas el diff no aporta nada y sí agrega lugares donde equivocarse. Va en una
  // transacción para que no exista un instante en que la publicación quedó sin imágenes.
  await prisma.$transaction([
    prisma.publicacionCaracteristica.deleteMany({ where: { publicacionId: id } }),
    prisma.publicacionCaracteristica.createMany({
      data: datos.caracteristicaIds.map((caracteristicaId) => ({
        publicacionId: id,
        caracteristicaId,
      })),
    }),
    prisma.imagenPublicacion.deleteMany({ where: { publicacionId: id } }),
    prisma.imagenPublicacion.createMany({
      data: filasDeImagenes(datos.imagenes).map((imagen) => ({
        ...imagen,
        publicacionId: id,
      })),
    }),
  ]);

  return { id };
}

/**
 * public_ids de las imágenes de una publicación que ya NO están en la lista nueva.
 *
 * Sirve para borrar de Cloudinary lo que el usuario quitó al editar. Se consulta ANTES de
 * guardar, porque después las filas viejas ya no existen.
 */
export async function publicIdsAEliminar(
  publicacionId: string,
  publicIdsQueQuedan: string[],
): Promise<string[]> {
  const actuales = await prisma.imagenPublicacion.findMany({
    where: { publicacionId },
    select: { publicId: true },
  });

  const quedan = new Set(publicIdsQueQuedan);
  return actuales.map((i) => i.publicId).filter((publicId) => !quedan.has(publicId));
}

/**
 * Cambia el estado de una publicación del usuario. Devuelve false si no le pertenece.
 *
 * `publishedAt` se setea la primera vez que pasa a activa y no se vuelve a tocar: es la fecha
 * de publicación original, la que se usa para ordenar por "más recientes". Si se pisara en cada
 * reactivación, pausar y reactivar sería una forma de saltar al principio del listado.
 */
export async function cambiarEstado(
  id: string,
  usuarioId: string,
  nuevoEstado: EstadoPublicacion,
  publicadaPorPrimeraVez: boolean,
) {
  const { count } = await prisma.publicacion.updateMany({
    where: { id, usuarioId },
    data: {
      estadoPublicacion: nuevoEstado,
      ...(publicadaPorPrimeraVez ? { publishedAt: new Date() } : {}),
    },
  });
  return count === 1;
}

/**
 * Todos los public_id referenciados por alguna publicación, sin importar su estado.
 *
 * Incluye a propósito las publicaciones `eliminada`: el soft delete conserva la fila para no
 * romper las referencias de Favorito y MensajeContacto (3.4), así que sus imágenes siguen
 * siendo parte de un registro vivo. Filtrarlas acá haría que el cron borre las fotos de una
 * publicación que un admin todavía puede necesitar moderar.
 */
export async function obtenerPublicIdsReferenciados(): Promise<string[]> {
  const filas = await prisma.imagenPublicacion.findMany({
    select: { publicId: true },
  });
  return filas.map((fila) => fila.publicId);
}

/**
 * Una publicación para su página pública. Devuelve null si no existe o no está activa.
 *
 * El estado va en el WHERE y no se chequea después: una publicación pausada, en borrador o
 * eliminada tiene que ser un 404 para cualquiera que tenga el link, no una fila que llega a
 * memoria y depende de que quien llama se acuerde de mirar el estado.
 */
export function buscarPublicacionPublica(id: string) {
  return prisma.publicacion.findFirst({
    where: { id, estadoPublicacion: "activa" },
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      caracteristicas: {
        select: { caracteristica: { select: { nombre: true, categoria: true } } },
      },
      // Del vendedor solo lo que se muestra. El email NO entra: el contacto va por el
      // formulario (6.6), y publicar la dirección de correo de cada vendedor en el HTML es
      // regalarle la base de emails a cualquier scraper.
      usuario: { select: { id: true, name: true, telefono: true } },
    },
  });
}

export type PublicacionPublica = NonNullable<
  Awaited<ReturnType<typeof buscarPublicacionPublica>>
>;

/**
 * Publicaciones que entran al sitemap (9.1).
 *
 * SOLO las activas, y el estado va en el WHERE por el mismo motivo que en la query de arriba:
 * un sitemap que liste borradores o pausadas le está entregando a Google URLs que devuelven
 * 404, y de paso filtra que esos ids existen.
 *
 * `select` acotado a lo que el sitemap necesita —el id para armar la URL y updatedAt para el
 * `lastModified`— en vez del registro completo con sus 25+ campos: esto se recorre entero cada
 * vez que se regenera.
 */
export function listarPublicacionesParaSitemap() {
  return prisma.publicacion.findMany({
    where: { estadoPublicacion: "activa" },
    select: { id: true, titulo: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** Cuántas similares se muestran: 6 llena dos filas de tres sin dejar huecos. */
const SIMILARES = 6;

/**
 * Publicaciones parecidas a la que se está viendo (6.4).
 *
 * Mismo tipo, misma operación, misma ciudad y precio dentro de ±20%. La moneda también tiene
 * que coincidir, aunque 6.4 no lo diga: un ±20% calculado entre un precio en dólares y otro en
 * pesos no compara nada, y traería como "similar" cualquier cosa.
 */
export function publicacionesSimilares(publicacion: {
  id: string;
  tipoInmueble: TipoInmueble;
  operacion: Operacion;
  ciudad: string;
  moneda: Moneda;
  precio: Prisma.Decimal;
}) {
  const precio = Number(publicacion.precio);

  return prisma.publicacion.findMany({
    where: {
      id: { not: publicacion.id },
      estadoPublicacion: "activa",
      tipoInmueble: publicacion.tipoInmueble,
      operacion: publicacion.operacion,
      ciudad: publicacion.ciudad,
      moneda: publicacion.moneda,
      precio: { gte: precio * 0.8, lte: precio * 1.2 },
    },
    select: SELECT_TARJETA,
    orderBy: [{ publishedAt: "desc" }],
    take: SIMILARES,
  });
}

/**
 * Suma una visita.
 *
 * Va sin `await` desde la página: el contador es un dato de conveniencia para el vendedor y no
 * tiene por qué demorar el render del inmueble. Si la escritura falla, se pierde una visita —
 * que es exactamente lo que corresponde perder ante un error de base.
 */
export function incrementarVistas(id: string) {
  return prisma.publicacion.update({
    where: { id },
    data: { vistas: { increment: 1 } },
    select: { id: true },
  });
}

export function listarCaracteristicas() {
  return prisma.caracteristica.findMany({
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, slug: true, categoria: true },
  });
}
