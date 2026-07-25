import type {
  EstadoInmueble,
  EstadoPublicacion,
  Moneda,
  Operacion,
  Orientacion,
  TipoInmueble,
} from "@/generated/prisma/enums";
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
};

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

  // Las características son N–M: se reemplaza el conjunto completo en vez de calcular el
  // diff, que para una decena de filas no aporta nada y sí agrega lugares donde equivocarse.
  await prisma.$transaction([
    prisma.publicacionCaracteristica.deleteMany({ where: { publicacionId: id } }),
    prisma.publicacionCaracteristica.createMany({
      data: datos.caracteristicaIds.map((caracteristicaId) => ({
        publicacionId: id,
        caracteristicaId,
      })),
    }),
  ]);

  return { id };
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

export function listarCaracteristicas() {
  return prisma.caracteristica.findMany({
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, slug: true, categoria: true },
  });
}
