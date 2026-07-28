import { cerrarBase } from "./ayudantes";

/**
 * Cierra el pool de conexiones UNA vez, cuando terminaron todos los archivos.
 *
 * Estaba en un `afterAll` por spec y era un bug: el pool es un módulo compartido entre todos los
 * archivos del mismo worker, así que el primero en terminar se lo cerraba a los que faltaban.
 * Corriendo un archivo por vez no se notaba; con la suite completa, el segundo spec fallaba
 * contra un pool ya cerrado.
 */
export default async function teardown() {
  await cerrarBase();
}
