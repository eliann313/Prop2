import type { IAProvider } from "@/features/ia/providers/tipos";

// Capa de dominio (4.2): la lógica de la cascada de 7.1, con los proveedores entrando por
// parámetro. Así se testea con proveedores falsos —incluido el que falla— sin credenciales, sin
// red y sin gastar cuota de ningún free tier.
//
// Quién arma esa lista y en qué orden es una decisión de infraestructura, y vive en
// features/ia/cascadaDeProveedores.ts.

export type ResultadoIA =
  | { ok: true; texto: string; proveedor: string }
  | { ok: false; motivo: "sin-proveedores" | "todos-fallaron" };

/** Se inyecta para poder aseverar el logueo en los tests sin ensuciar la salida. */
export type Registro = {
  exito(proveedor: string, ms: number): void;
  fallo(proveedor: string, ms: number, error: unknown): void;
};

const REGISTRO_POR_DEFECTO: Registro = {
  // Se loguea quién contestó y cuánto tardó (7.3): es lo que permite detectar que un proveedor
  // empezó a fallar sistemáticamente antes de que se note en producción.
  exito: (proveedor, ms) => console.info(`[ia] proveedor=${proveedor} ok=true ms=${ms}`),
  fallo: (proveedor, ms, error) =>
    console.warn(
      `[ia] proveedor=${proveedor} ok=false ms=${ms}`,
      error instanceof Error ? error.message : error,
    ),
};

/**
 * Le pide el texto al primer proveedor que conteste.
 *
 * No lanza: que la IA no esté disponible no es un error del sistema, es un botón que esta vez
 * no funcionó. El vendedor sigue pudiendo escribir la descripción a mano (7.3, "IA nunca en el
 * camino crítico").
 *
 * Una respuesta vacía cuenta como fallo y pasa al siguiente. Un proveedor que devuelve "" por
 * un filtro de contenido o por cuota agotada no puede dejar al vendedor con un textarea vacío
 * y la sensación de que la función anduvo.
 */
export async function ejecutarConFallback(
  proveedores: IAProvider[],
  prompt: string,
  registro: Registro = REGISTRO_POR_DEFECTO,
): Promise<ResultadoIA> {
  const disponibles = proveedores.filter((proveedor) => proveedor.disponible);
  if (disponibles.length === 0) return { ok: false, motivo: "sin-proveedores" };

  for (const proveedor of disponibles) {
    const desde = Date.now();
    try {
      const texto = await proveedor.generarTexto(prompt);
      if (texto.trim() === "") throw new Error("respuesta vacía");

      registro.exito(proveedor.nombre, Date.now() - desde);
      return { ok: true, texto, proveedor: proveedor.nombre };
    } catch (error) {
      registro.fallo(proveedor.nombre, Date.now() - desde, error);
    }
  }

  return { ok: false, motivo: "todos-fallaron" };
}

/**
 * Ordena los proveedores según `IA_PROVIDER_ORDER` (7.1).
 *
 * Un nombre desconocido en la variable se ignora en vez de romper el arranque: una env var mal
 * tipeada no puede dejar sin publicar a nadie. Y los proveedores que no aparecen en la variable
 * se agregan al final, para que sumar un adaptador nuevo no obligue a acordarse de actualizar
 * también la env var de producción.
 */
export function ordenarProveedores(
  proveedores: IAProvider[],
  orden: string | undefined,
): IAProvider[] {
  const nombres = (orden ?? "")
    .split(",")
    .map((nombre) => nombre.trim().toLowerCase())
    .filter(Boolean);

  const porNombre = new Map(proveedores.map((p) => [p.nombre, p]));
  const elegidos = nombres
    .map((nombre) => porNombre.get(nombre))
    .filter((p): p is IAProvider => p !== undefined);

  const faltantes = proveedores.filter((p) => !elegidos.includes(p));
  return [...elegidos, ...faltantes];
}
