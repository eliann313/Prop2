import "server-only";

import { createHash } from "node:crypto";

// Validación contra la lista pública de contraseñas filtradas de Have I Been Pwned (8.17).
//
// Es la mitigación de credential stuffing, que es un ataque distinto de la fuerza bruta que ya
// cubre el rate limiting (8.4): acá no se prueban millones de combinaciones contra una cuenta,
// se prueban credenciales YA filtradas de otros sitios contra muchas cuentas. Un límite de
// intentos no lo frena, porque el atacante acierta en el primer intento; lo único que lo frena
// es que esa contraseña no exista en este sistema.
//
// Vive en shared/lib y no en services/ porque habla con un servicio externo: services/ es
// dominio puro (4.2). Y no vive en el schema de Zod porque los schemas corren también en el
// cliente (14.3) — mandar la contraseña a un tercero desde el navegador del usuario sería
// exactamente lo que este módulo evita.

const ENDPOINT = "https://api.pwnedpasswords.com/range";

/**
 * Cantidad de caracteres del hash que se envían. Cinco es lo que define el modelo de
 * k-anonymity de la API: se manda ese prefijo y el servidor devuelve TODOS los sufijos que
 * empiezan así (cientos), sin poder saber cuál se estaba buscando. La contraseña, y ni siquiera
 * su hash completo, nunca salen de este proceso.
 */
const LARGO_DEL_PREFIJO = 5;

/**
 * SHA-1 no está acá como primitiva de seguridad —la contraseña se guarda con bcrypt (8.7)—
 * sino porque es el índice con el que HIBP publica su lista. Cambiarlo por SHA-256 no la
 * haría "más segura": la haría no encontrar nada.
 */
function sha1EnMayusculas(texto: string): string {
  return createHash("sha1").update(texto, "utf8").digest("hex").toUpperCase();
}

/**
 * Indica si la contraseña aparece en alguna filtración pública conocida.
 *
 * Nunca lanza y ante cualquier problema devuelve `false`, es decir, deja pasar la contraseña.
 * Es deliberado y es el mismo criterio que el limitador de intentos (`rateLimiters.ts`): que un
 * servicio gratuito de terceros esté caído no puede impedir que alguien se registre. La
 * alternativa —fallar cerrado— convierte una caída de HIBP en una caída del registro entero.
 *
 * Se loguea con nivel error, no warn: quedarse sin este chequeo es una degradación real de
 * seguridad y tiene que verse en los logs.
 */
export async function estaEnFiltraciones(passwordEnClaro: string): Promise<boolean> {
  const hash = sha1EnMayusculas(passwordEnClaro);
  const prefijo = hash.slice(0, LARGO_DEL_PREFIJO);
  const sufijoBuscado = hash.slice(LARGO_DEL_PREFIJO);

  try {
    const respuesta = await fetch(`${ENDPOINT}/${prefijo}`, {
      headers: {
        // Hace que la respuesta traiga siempre la misma cantidad de sufijos, rellenando con
        // entradas falsas. Sin esto, el tamaño de la respuesta filtra cuántas coincidencias
        // reales tenía el prefijo, que es información sobre lo que se estaba consultando.
        "Add-Padding": "true",
      },
      // Tres segundos: esto corre en el camino crítico del registro, con la persona esperando.
      // Más que eso y conviene dejarla pasar antes que tenerla mirando un spinner.
      signal: AbortSignal.timeout(3_000),
      // El rango de un prefijo cambia solo cuando HIBP incorpora una filtración nueva, cosa que
      // pasa cada varios meses. Cachear un día ahorra la mayoría de las llamadas sin que el
      // dato quede viejo en ningún sentido práctico.
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!respuesta.ok) {
      console.error(`[hibp] respondió ${respuesta.status}; se deja pasar la contraseña.`);
      return false;
    }

    const cuerpo = await respuesta.text();

    // Cada línea viene como "SUFIJO:cantidad". Solo interesa si el sufijo está, no cuántas
    // veces apareció: una sola filtración ya la vuelve inutilizable.
    return cuerpo
      .split("\n")
      .some((linea) => linea.slice(0, sufijoBuscado.length) === sufijoBuscado);
  } catch (error) {
    console.error(
      "[hibp] no se pudo consultar la lista de contraseñas filtradas; se deja pasar.",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
