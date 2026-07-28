/**
 * Coordenadas de la base de tests. Un solo lugar, importado tanto por el script que la prepara
 * como por el setup de Vitest: si la URL viviera duplicada, cambiar el puerto en
 * docker-compose.test.yml rompería una de las dos y el síntoma sería un "connection refused"
 * sin pista de dónde mirar.
 *
 * Se puede pisar con DATABASE_URL_TEST. Es lo que usa CI, donde el Postgres lo levanta
 * `services:` de GitHub Actions y no este compose.
 */
export const URL_BASE_DE_TEST =
  process.env.DATABASE_URL_TEST ?? "postgresql://prop2:prop2@localhost:5433/prop2_test";

/**
 * Las tablas de DOMINIO, que se vacían antes de cada test.
 *
 * `caracteristica` queda deliberadamente afuera: es catálogo, no dato de negocio. Lo carga el
 * seed una sola vez y las publicaciones lo referencian. Truncarlo entre test y test obligaría a
 * re-seedearlo en cada uno, o —peor— dejaría los tests de características fallando con una
 * violación de foreign key que no tiene nada que ver con lo que se está probando.
 */
export const TABLAS_A_LIMPIAR = [
  "mensaje_contacto",
  "favorito",
  "publicacion_caracteristica",
  "imagen_publicacion",
  "publicacion",
  "token_verificacion",
  "token_verificacion_authjs",
  "sesion",
  "cuenta_oauth",
  "usuario",
] as const;
