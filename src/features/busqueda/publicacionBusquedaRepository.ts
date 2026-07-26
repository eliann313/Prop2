import type { CriteriosDeBusqueda } from "@/features/busqueda/services/criteriosDeBusqueda";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prismaClient";

// Capa de infraestructura (4.2). Es el único archivo de la búsqueda que toca la base.
//
// Va en SQL crudo y no con el query builder de Prisma por dos cosas que Prisma no sabe expresar:
// el operador `@@` contra la columna `busqueda` (el tsvector del índice GIN) y `ts_rank` para
// ordenar por relevancia. Armarlo mitad y mitad —filtros con Prisma, texto aparte— obligaría a
// traer los ids que matchean y filtrarlos después, que es exactamente lo que rompe la
// paginación y el conteo.

export type ResultadoDeBusqueda = {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  operacion: string;
  tipoInmueble: string;
  provincia: string;
  ciudad: string;
  barrio: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  superficieCubierta: number | null;
  imagenUrl: string | null;
  imagenThumbnail: string | null;
};

export type PaginaDeResultados = {
  resultados: ResultadoDeBusqueda[];
  total: number;
};

/** Una fila cruda, con los nombres de columna de Postgres. */
type FilaCruda = {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  operacion: string;
  tipo_inmueble: string;
  provincia: string;
  ciudad: string;
  barrio: string | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  superficie_cubierta: number | null;
  imagen_url: string | null;
  imagen_thumbnail: string | null;
  total: bigint;
};

/**
 * La consulta de texto libre, o `null` si la búsqueda no trae texto.
 *
 * `websearch_to_tsquery` y no `plainto_tsquery`: entiende comillas para frase exacta, `or` y
 * `-palabra` para excluir, y —lo que más importa acá— nunca lanza una excepción por más raro
 * que sea lo que el usuario haya tipeado. `plainto_tsquery` tampoco falla, pero trata todo como
 * un AND de palabras sueltas y desperdicia lo que la gente ya sabe escribir en un buscador.
 *
 * `sin_acentos` es el wrapper IMMUTABLE de `unaccent` que crea la migración del índice: tiene
 * que aplicarse acá igual que en la columna generada, o "nunez" no encontraría "Núñez".
 */
function consultaDeTexto(texto: string | undefined): Prisma.Sql | null {
  if (texto === undefined) return null;
  return Prisma.sql`websearch_to_tsquery('spanish', sin_acentos(${texto}))`;
}

function condiciones(
  criterios: CriteriosDeBusqueda,
  texto: Prisma.Sql | null,
): Prisma.Sql {
  // Solo se listan las publicaciones activas: los borradores, las pausadas y las eliminadas no
  // existen para el público (6.2). Va primero y sin condición porque es la única regla que no
  // depende de lo que pidió el usuario.
  const partes: Prisma.Sql[] = [Prisma.sql`p.estado_publicacion = 'activa'`];

  if (texto) partes.push(Prisma.sql`p.busqueda @@ ${texto}`);

  // Los valores de enum viajan como parámetro y se castean explícitamente: sin el cast, Postgres
  // los recibe como `text` y falla con "operator does not exist: tipo_inmueble = text".
  if (criterios.tipo)
    partes.push(Prisma.sql`p.tipo_inmueble = ${criterios.tipo}::tipo_inmueble`);
  if (criterios.operacion)
    partes.push(Prisma.sql`p.operacion = ${criterios.operacion}::operacion`);
  if (criterios.moneda) partes.push(Prisma.sql`p.moneda = ${criterios.moneda}::moneda`);

  if (criterios.provincia) partes.push(Prisma.sql`p.provincia = ${criterios.provincia}`);
  if (criterios.ciudad) partes.push(Prisma.sql`p.ciudad = ${criterios.ciudad}`);
  if (criterios.barrio) partes.push(Prisma.sql`p.barrio = ${criterios.barrio}`);

  if (criterios.precioMin !== undefined)
    partes.push(Prisma.sql`p.precio >= ${criterios.precioMin}`);
  if (criterios.precioMax !== undefined)
    partes.push(Prisma.sql`p.precio <= ${criterios.precioMax}`);

  if (criterios.ambientesMin !== undefined)
    partes.push(Prisma.sql`p.ambientes >= ${criterios.ambientesMin}`);
  if (criterios.dormitoriosMin !== undefined)
    partes.push(Prisma.sql`p.dormitorios >= ${criterios.dormitoriosMin}`);
  if (criterios.baniosMin !== undefined)
    partes.push(Prisma.sql`p.banios >= ${criterios.baniosMin}`);

  // Solo se filtra cuando se pide cochera. Ver el comentario del schema: un checkbox sin marcar
  // significa "me da igual".
  if (criterios.soloConCochera) partes.push(Prisma.sql`p.tiene_cochera = true`);

  if (criterios.superficieMin !== undefined)
    partes.push(Prisma.sql`p.superficie_cubierta >= ${criterios.superficieMin}`);
  if (criterios.superficieMax !== undefined)
    partes.push(Prisma.sql`p.superficie_cubierta <= ${criterios.superficieMax}`);

  return Prisma.join(partes, " AND ");
}

/**
 * El ORDER BY.
 *
 * Nunca interpola nada del usuario: `criterios.orden` ya pasó por un `z.enum`, y aun así lo que
 * se elige acá es un fragmento fijo escrito a mano, no un string armado con el valor recibido.
 *
 * `published_at` puede ser null en una publicación que nunca se activó, y en Postgres los NULL
 * ordenan primero en DESC: sin `NULLS LAST` encabezarían el listado las que no tienen fecha.
 *
 * Un desempate por `id` cierra todos los órdenes. Sin él, dos filas con el mismo precio pueden
 * salir en distinto orden en dos consultas, y con paginación eso hace que una publicación
 * aparezca dos veces o no aparezca nunca al pasar de página.
 */
function ordenamiento(
  criterios: CriteriosDeBusqueda,
  texto: Prisma.Sql | null,
): Prisma.Sql {
  switch (criterios.orden) {
    case "precio_asc":
      return Prisma.sql`ORDER BY p.precio ASC, p.id ASC`;
    case "precio_desc":
      return Prisma.sql`ORDER BY p.precio DESC, p.id ASC`;
    case "relevancia":
      // `texto` está garantizado por construirCriterios: sin texto, el orden nunca es
      // "relevancia". El fallback existe solo para que el tipo cierre.
      return texto
        ? Prisma.sql`ORDER BY ts_rank(p.busqueda, ${texto}) DESC, p.published_at DESC NULLS LAST, p.id ASC`
        : Prisma.sql`ORDER BY p.published_at DESC NULLS LAST, p.id ASC`;
    case "recientes":
      return Prisma.sql`ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC, p.id ASC`;
  }
}

/**
 * Busca publicaciones activas y devuelve la página pedida junto con el total.
 *
 * El total sale de `COUNT(*) OVER()` en la misma consulta y no de un `SELECT count(*)` aparte:
 * con dos consultas, entre una y otra puede publicarse un inmueble y el paginador termina
 * diciendo "página 1 de 3" sobre un conteo que ya no corresponde a estas filas.
 *
 * La portada se trae con un LATERAL en vez de un JOIN a `imagen_publicacion`: un join
 * multiplicaría las filas por la cantidad de imágenes y rompería el COUNT. El LATERAL corta en
 * la primera por `orden`, que es la portada por construcción (ver `filasDeImagenes`).
 */
export async function buscarPublicaciones(
  criterios: CriteriosDeBusqueda,
): Promise<PaginaDeResultados> {
  const texto = consultaDeTexto(criterios.texto);

  const filas = await prisma.$queryRaw<FilaCruda[]>`
    SELECT
      p.id,
      p.titulo,
      -- Los Decimal se castean a float8 acá: lo único que se hace con ellos aguas arriba es
      -- formatearlos para mostrar, y los topes del dominio (precio < 1e9, superficie < 1e5)
      -- quedan muy por debajo del entero exacto más grande de un float64. El valor exacto
      -- sigue viviendo en la base.
      p.precio::float8 AS precio,
      p.moneda::text AS moneda,
      p.operacion::text AS operacion,
      p.tipo_inmueble::text AS tipo_inmueble,
      p.provincia,
      p.ciudad,
      p.barrio,
      p.ambientes,
      p.dormitorios,
      p.banios,
      p.superficie_cubierta::float8 AS superficie_cubierta,
      i.url AS imagen_url,
      i.url_thumbnail AS imagen_thumbnail,
      COUNT(*) OVER() AS total
    FROM publicacion p
    LEFT JOIN LATERAL (
      SELECT url, url_thumbnail
      FROM imagen_publicacion
      WHERE publicacion_id = p.id
      ORDER BY orden ASC
      LIMIT 1
    ) i ON true
    WHERE ${condiciones(criterios, texto)}
    ${ordenamiento(criterios, texto)}
    LIMIT ${criterios.limite} OFFSET ${criterios.offset}
  `;

  return {
    resultados: filas.map((fila) => ({
      id: fila.id,
      titulo: fila.titulo,
      precio: fila.precio,
      moneda: fila.moneda,
      operacion: fila.operacion,
      tipoInmueble: fila.tipo_inmueble,
      provincia: fila.provincia,
      ciudad: fila.ciudad,
      barrio: fila.barrio,
      ambientes: fila.ambientes,
      dormitorios: fila.dormitorios,
      banios: fila.banios,
      superficieCubierta: fila.superficie_cubierta,
      imagenUrl: fila.imagen_url,
      imagenThumbnail: fila.imagen_thumbnail,
    })),
    // `COUNT(*) OVER()` es bigint en Postgres, y sin filas no viene ninguna: la página vacía
    // vale 0 resultados, no "no sé cuántos hay".
    total: filas.length > 0 ? Number(filas[0].total) : 0,
  };
}

/**
 * Ciudades y barrios que realmente tienen publicaciones activas, para poblar los selects.
 *
 * Se leen de la base en vez de tener un catálogo fijo: el filtro compara por igualdad exacta
 * para poder usar el índice `(provincia, ciudad)`, así que ofrecer una opción que nadie cargó
 * garantiza cero resultados. Ofreciendo solo lo que existe, todas las opciones devuelven algo.
 */
export async function ubicacionesDisponibles(provincia?: string) {
  const filas = await prisma.publicacion.findMany({
    where: {
      estadoPublicacion: "activa",
      ...(provincia ? { provincia } : {}),
    },
    select: { provincia: true, ciudad: true, barrio: true },
    distinct: ["provincia", "ciudad", "barrio"],
    orderBy: [{ provincia: "asc" }, { ciudad: "asc" }, { barrio: "asc" }],
  });

  return filas;
}
