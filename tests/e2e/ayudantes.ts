import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { hashearPassword } from "../../src/features/auth/services/passwordService";
import { generarToken } from "../../src/features/auth/services/tokenVerificacionService";
import { TABLAS_A_LIMPIAR, URL_BASE_DE_TEST } from "../integration/baseDeTest";

/**
 * Acceso a la base desde los E2E, con `pg` a secas y no con Prisma.
 *
 * No es una preferencia: Playwright transpila los tests a CommonJS, y el cliente que genera
 * Prisma 7 usa `import.meta`, que en CJS es un error de sintaxis. Poner el proyecto en
 * `"type": "module"` para arreglarlo movería el piso de todo lo demás por un puñado de
 * consultas de andamiaje.
 *
 * Se usa lo mínimo indispensable: limpiar entre corridas y producir o leer lo que la UI no puede
 * por sí sola. Todo lo demás pasa por el navegador, que es el punto de un E2E.
 */
const pool = new Pool({ connectionString: URL_BASE_DE_TEST });

export async function limpiarBase() {
  const tablas = TABLAS_A_LIMPIAR.map((tabla) => `"${tabla}"`).join(", ");
  await pool.query(`TRUNCATE TABLE ${tablas} RESTART IDENTITY CASCADE`);
}

export async function cerrarBase() {
  await pool.end();
}

async function idDeUsuario(email: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    'SELECT id FROM "usuario" WHERE email = $1',
    [email],
  );
  const usuario = rows[0];
  if (!usuario) throw new Error(`No existe el usuario ${email}`);
  return usuario.id;
}

/**
 * Crea un token de verificación válido para ese email y devuelve el link.
 *
 * Por qué se inyecta en vez de leer el que emitió el registro: el token se guarda **hasheado**
 * (8.7) y el valor en claro solo existe dentro del email. Recuperarlo de la base es imposible
 * por diseño — y que lo sea es justamente lo que hace segura esa tabla.
 *
 * Lo que este atajo NO cubre está cubierto en otro lado: que el registro emita un token con la
 * vigencia correcta y lo guarde hasheado lo verifican los tests de integración. Acá se prueba lo
 * que solo se puede probar por el navegador — que la página del link consuma el token, marque la
 * cuenta como verificada y habilite el login.
 */
export async function linkDeVerificacion(email: string): Promise<string> {
  const usuarioId = await idDeUsuario(email);
  const { tokenEnClaro, tokenHash, expiraEn } = generarToken("verificacion_email");

  await pool.query(
    `INSERT INTO "token_verificacion" (id, usuario_id, token_hash, tipo, expira_en)
     VALUES ($1, $2, $3, 'verificacion_email', $4)`,
    [randomUUID(), usuarioId, tokenHash, expiraEn],
  );

  return `/verificar-email?token=${encodeURIComponent(tokenEnClaro)}`;
}

/**
 * Crea una cuenta ya verificada, lista para loguearse.
 *
 * Los flujos 2 y 3 de 12.3 no prueban el registro —eso es el flujo 1— y hacerles repetir esos
 * cuatro pasos por UI solo agregaría medio minuto y un punto más donde pueden romperse por algo
 * que no están probando.
 */
export async function crearCuentaVerificada(email: string, password: string) {
  // `updated_at` va explícito: lo mantiene Prisma con `@updatedAt`, no un default de Postgres,
  // así que un INSERT crudo tiene que ponerlo o la columna NOT NULL rechaza la fila.
  await pool.query(
    `INSERT INTO "usuario"
       (id, name, email, password_hash, rol, email_verificado_en, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'comprador', now(), now(), now())`,
    [randomUUID(), "Vendedor de prueba", email, await hashearPassword(password)],
  );
}

/** Deja una cuenta lista para loguearse, salteando el circuito de verificación. */
export async function marcarVerificado(email: string) {
  await pool.query('UPDATE "usuario" SET email_verificado_en = now() WHERE email = $1', [
    email,
  ]);
}

/**
 * Deja una publicación ya activa, sin pasar por el wizard.
 *
 * El flujo 3 prueba el circuito del COMPRADOR —buscar, ver el detalle, consultar— y necesita
 * inventario existente. Cargarlo por UI sería repetir el flujo 2 entero antes de empezar: dos
 * minutos más de corrida y un segundo lugar donde el test puede romperse por algo que no está
 * probando.
 */
export async function crearPublicacionActiva(
  emailDelVendedor: string,
  datos: {
    titulo: string;
    ciudad: string;
    precio: number;
    operacion: "venta" | "alquiler";
  },
) {
  const usuarioId = await idDeUsuario(emailDelVendedor);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO "publicacion"
       (id, usuario_id, titulo, descripcion, tipo_inmueble, operacion, precio, moneda,
        provincia, ciudad, barrio, latitud, longitud, ambientes, dormitorios, banios,
        superficie_cubierta, tiene_cochera, estado_publicacion, vistas,
        created_at, updated_at, published_at)
     VALUES ($1, $2, $3, $4, 'departamento', $5, $6, 'USD',
             'CABA', $7, 'Palermo', -34.5889, -58.4306, 3, 2, 1,
             75, false, 'activa', 0,
             now(), now(), now())`,
    [
      id,
      usuarioId,
      datos.titulo,
      "Departamento luminoso con balcón al frente, cocina integrada y placares empotrados.",
      datos.operacion,
      datos.precio,
      datos.ciudad,
    ],
  );

  return id;
}

export async function publicacionesActivasDe(email: string) {
  const { rows } = await pool.query<{ id: string; titulo: string }>(
    `SELECT p.id, p.titulo
     FROM "publicacion" p
     JOIN "usuario" u ON u.id = p.usuario_id
     WHERE u.email = $1 AND p.estado_publicacion = 'activa'`,
    [email],
  );
  return rows;
}

export async function mensajesDePublicacion(publicacionId: string) {
  const { rows } = await pool.query<{ nombre_contacto: string; mensaje: string }>(
    'SELECT nombre_contacto, mensaje FROM "mensaje_contacto" WHERE publicacion_id = $1',
    [publicacionId],
  );
  return rows;
}
