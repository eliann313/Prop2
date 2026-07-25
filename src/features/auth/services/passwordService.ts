import { compare, hash } from "bcryptjs";

// Capa de dominio (4.2): reglas puras, sin Prisma ni HTTP. Es lo que hace que estas funciones
// se puedan testear aisladas (tests/unit).
//
// Se usa bcryptjs (JS puro) y no el paquete `bcrypt` nativo que menciona el flujo de 5.1: el
// nativo compila un binding de C++ contra la versión de Node del entorno, y en las funciones
// serverless de Vercel eso es una fuente conocida de builds que andan local y fallan en
// deploy. El algoritmo es el mismo; lo que cambia es cómo se distribuye.
const COSTO_BCRYPT = 12;

export function hashearPassword(passwordEnClaro: string): Promise<string> {
  return hash(passwordEnClaro, COSTO_BCRYPT);
}

/**
 * Verifica una contraseña contra su hash.
 *
 * `hashGuardado` puede ser null: es el caso del usuario que se registró solo con Google y no
 * tiene contraseña (3.1). Igual se corre una comparación descartable contra un hash dummy en
 * vez de devolver false de inmediato, para que el tiempo de respuesta sea el mismo con y sin
 * contraseña configurada — si no, medir la latencia del login permitiría descubrir qué
 * cuentas son de Google y cuáles de credenciales.
 */
export async function verificarPassword(
  passwordEnClaro: string,
  hashGuardado: string | null,
): Promise<boolean> {
  if (hashGuardado === null) {
    await compare(passwordEnClaro, HASH_DUMMY);
    return false;
  }
  return compare(passwordEnClaro, hashGuardado);
}

// Hash de una contraseña arbitraria, generado con el mismo costo que usa el sistema. Solo
// existe para gastar el mismo tiempo de CPU que una verificación real (ver arriba).
const HASH_DUMMY = "$2b$12$OMRXLKHOWJgWoJ9s8ucwgeFGNX0skA1rsB2ADVslTcFegUeKr.v3q";
