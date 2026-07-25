"use client";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

type Props = {
  resultado: ResultadoAccion<unknown> | null;
};

/** Muestra el mensaje general de una Server Action (los errores por campo los pinta CampoTexto). */
export function AvisoDeAccion({ resultado }: Props) {
  if (!resultado?.mensaje) return null;

  return (
    <Alert variant={resultado.ok ? "default" : "destructive"} role="status">
      <AlertDescription>{resultado.mensaje}</AlertDescription>
    </Alert>
  );
}
