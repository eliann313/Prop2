"use client";

import { Sparkles } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { generarDescripcion } from "@/features/ia/actions/generarDescripcion";
import { Button } from "@/shared/components/ui/button";

// El botón de 5.4. Recibe los datos y devuelve el texto por callback en vez de escribir en el
// formulario por su cuenta: así no necesita conocer react-hook-form ni el schema del wizard, y
// se puede reusar tal cual el día que la IA sugiera también el título (7.2, V1.1).

type Props = {
  /** Se ejecuta al momento del click: el wizard es un formulario vivo y los datos cambian. */
  obtenerDatos: () => Record<string, unknown> | null;
  alGenerar: (descripcion: string) => void;
  hayDescripcion: boolean;
};

export function BotonGenerarDescripcion({
  obtenerDatos,
  alGenerar,
  hayDescripcion,
}: Props) {
  const [pendiente, iniciarTransicion] = useTransition();

  function alClickear() {
    const datos = obtenerDatos();
    if (!datos) {
      toast.error("Elegí el tipo de inmueble y la operación antes de generar.");
      return;
    }

    // Pisar una descripción ya escrita sin avisar es destruir trabajo del vendedor. El
    // confirm es feo pero es el lugar donde un modal lindo no cambia nada.
    if (
      hayDescripcion &&
      !window.confirm("Esto reemplaza la descripción actual. ¿Seguimos?")
    ) {
      return;
    }

    iniciarTransicion(async () => {
      const resultado = await generarDescripcion(datos);

      if (!resultado.ok) {
        toast.error(resultado.mensaje);
        return;
      }

      alGenerar(resultado.datos!.descripcion);
      toast.success("Descripción generada. Revisala y editá lo que quieras.");
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={alClickear}
      disabled={pendiente}
    >
      <Sparkles className="size-4" />
      {pendiente ? "Generando…" : "Generar con IA"}
    </Button>
  );
}
