import { hashearPassword } from "@/features/auth/services/passwordService";
import {
  crearPublicacionBorrador,
  type DatosParaGuardar,
} from "@/features/publicaciones/publicacionRepository";
import { crearUsuarioConCredenciales } from "@/features/usuarios/usuarioRepository";

/**
 * Fábricas para armar el escenario de cada test.
 *
 * Van por los repositorios reales y no con inserts a mano: si mañana `crearPublicacionBorrador`
 * empieza a escribir un campo nuevo, los tests siguen creando publicaciones válidas sin que haya
 * que acordarse de actualizar una copia paralela del INSERT.
 */

let contador = 0;

/** Emails únicos por test: la tabla tiene UNIQUE y los tests corren sobre la misma base. */
function emailUnico() {
  contador += 1;
  return `usuario${contador}@example.com`;
}

export async function crearUsuarioDePrueba(email = emailUnico()) {
  return crearUsuarioConCredenciales({
    nombre: "Usuario de prueba",
    email,
    passwordHash: await hashearPassword("unaContrasenia123"),
  });
}

/** Datos mínimos válidos. Cada test pisa solo lo que le importa. */
export function datosDePublicacion(
  cambios: Partial<DatosParaGuardar> = {},
): DatosParaGuardar {
  return {
    titulo: "Departamento 2 ambientes en Palermo",
    descripcion: "Luminoso, con balcón al frente y cocina integrada.",
    tipoInmueble: "departamento",
    operacion: "venta",
    precio: 120000,
    moneda: "USD",
    provincia: "CABA",
    ciudad: "Buenos Aires",
    barrio: "Palermo",
    latitud: -34.5889,
    longitud: -58.4306,
    tieneCochera: false,
    caracteristicaIds: [],
    imagenes: [],
    ...cambios,
  };
}

export async function crearPublicacionDePrueba(
  usuarioId: string,
  cambios: Partial<DatosParaGuardar> = {},
) {
  return crearPublicacionBorrador(usuarioId, datosDePublicacion(cambios));
}
