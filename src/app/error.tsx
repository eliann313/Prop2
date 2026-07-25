"use client";

import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  /**
   * Reintenta renderizando de nuevo el segmento, re-ejecutando su carga de datos.
   *
   * En Next 16.2 el prop se llama `unstable_retry`; el `reset` que aparece en casi toda la
   * documentación y los ejemplos de internet sigue existiendo pero NO vuelve a pedir los
   * datos, solo limpia el estado del boundary. Para un error de base de datos —el caso
   * realista acá— `reset` volvería a fallar al instante.
   */
  unstable_retry: () => void;
};

/**
 * Boundary de errores de toda la app: cualquier excepción no capturada en una página o en un
 * componente de servidor cae acá en vez de mostrar la pantalla default de Next.
 *
 * No envuelve al layout raíz — de eso se ocupa global-error.tsx.
 */
export default function ErrorDeAplicacion({ error, unstable_retry }: Props) {
  useEffect(() => {
    // En producción, Next NO manda el mensaje real al cliente para no filtrar detalles del
    // servidor: llega un texto genérico y un `digest`. Ese digest es lo que permite encontrar
    // el error concreto en los logs de Vercel, así que es lo importante para loguear.
    console.error("Error de aplicación:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="grid max-w-md gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="text-muted-foreground">
          No pudimos cargar esta página. Suele ser temporal: probá de nuevo en unos
          segundos.
        </p>

        {error.digest ? (
          // Se muestra el digest para que quien reporte el problema pueda pasarlo; es un hash,
          // no contiene datos del error.
          <p className="text-muted-foreground font-mono text-xs">
            Referencia: {error.digest}
          </p>
        ) : null}

        <div className="mt-2 flex justify-center">
          <Button onClick={() => unstable_retry()}>Reintentar</Button>
        </div>
      </div>
    </main>
  );
}
