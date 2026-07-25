/**
 * Forma única con la que las Server Actions le contestan a un formulario.
 *
 * Se devuelve un objeto en vez de lanzar excepciones porque un error de validación no es una
 * falla del sistema: es información que el formulario tiene que mostrar campo por campo. Las
 * excepciones quedan para lo inesperado, donde sí corresponde que salte el error boundary.
 */
export type ResultadoAccion<TDatos = undefined> =
  | { ok: true; mensaje?: string; datos?: TDatos }
  | {
      ok: false;
      mensaje: string;
      /** Errores por nombre de campo, con las claves del schema de Zod. */
      erroresPorCampo?: Record<string, string[]>;
      /**
       * El fallo también puede traer datos: la UI a veces necesita saber POR QUÉ falló para
       * ofrecer la salida correcta (ej. el código "email_sin_verificar" habilita el botón de
       * reenvío en el login), y eso no se puede deducir del mensaje sin compararlo por texto.
       */
      datos?: TDatos;
    };

export const exito = <TDatos>(
  mensaje?: string,
  datos?: TDatos,
): ResultadoAccion<TDatos> => ({ ok: true, mensaje, datos });

export const fallo = (
  mensaje: string,
  erroresPorCampo?: Record<string, string[]>,
): ResultadoAccion<never> => ({ ok: false, mensaje, erroresPorCampo });
