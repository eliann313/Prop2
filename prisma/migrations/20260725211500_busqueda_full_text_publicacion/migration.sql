-- Búsqueda full-text sobre las publicaciones (Etapa 3, sección 3.3).
--
-- Esta migración está escrita a mano y no generada por `prisma migrate diff`: ni las columnas
-- generadas, ni los índices GIN sobre tsvector, ni las extensiones se pueden expresar en el
-- schema de Prisma. El schema declara la columna como `Unsupported("tsvector")` solo para que
-- Prisma sepa que existe y no proponga borrarla en la próxima migración.

-- unaccent es lo que hace que "nunez" encuentre "Núñez". La config `spanish` de Postgres
-- stemmea (departamentos → departament) pero NO saca acentos, y nadie escribe los acentos en
-- un buscador.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Un índice solo puede usar funciones IMMUTABLE, y `unaccent(text)` está declarada STABLE
-- porque resuelve el diccionario a través de search_path en cada llamada. Fijando el
-- diccionario con `'unaccent'::regdictionary` esa ambigüedad desaparece, y este wrapper puede
-- declararse IMMUTABLE con honestidad. Es la receta estándar; el detalle a no olvidar es que
-- si algún día se cambia el diccionario `unaccent`, hay que reindexar.
CREATE OR REPLACE FUNCTION sin_acentos(texto text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
RETURN unaccent('unaccent'::regdictionary, texto);

-- Columna generada y no un índice sobre la expresión: con la expresión, cada query tiene que
-- repetirla carácter por carácter para que el planner use el índice, y basta un `coalesce` de
-- más para que el índice deje de aplicarse en silencio y la búsqueda pase a scanear la tabla.
-- La columna materializa esa decisión en un solo lugar; el costo es el espacio del tsvector.
--
-- Pesos: el título pesa más que la descripción (`ts_rank` los pondera A=1.0, B=0.4), así que
-- "casa quinta" en el título rankea arriba de una descripción que menciona la casa quinta del
-- vecino. No entran ciudad ni barrio: esos ya se filtran por columna con su propio índice
-- (`@@index([provincia, ciudad])`), y meterlos acá haría que buscar "Palermo" trajera también
-- las publicaciones que solo nombran Palermo en el texto.
ALTER TABLE "publicacion" ADD COLUMN "busqueda" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('spanish', sin_acentos(coalesce("titulo", ''))), 'A') ||
  setweight(to_tsvector('spanish', sin_acentos(coalesce("descripcion", ''))), 'B')
) STORED;

CREATE INDEX "publicacion_busqueda_idx" ON "publicacion" USING GIN ("busqueda");
