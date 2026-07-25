"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cambiarEstadoPublicacion } from "@/features/publicaciones/actions/cambiarEstadoPublicacion";
import type { EstadoPublicacion } from "@/generated/prisma/enums";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

type Props = {
  publicacionId: string;
  estado: EstadoPublicacion;
};

/** Acciones de estado de una tarjeta del dashboard (6.2). */
export function AccionesDePublicacion({ publicacionId, estado }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [aplicando, iniciarCambio] = useTransition();

  function cambiar(nuevoEstado: EstadoPublicacion) {
    // Eliminar es lo único que se confirma: pausar o reactivar se deshace con un click, pero
    // el soft delete saca la publicación del dashboard y no hay botón para traerla de vuelta.
    if (nuevoEstado === "eliminada") {
      const confirmado = window.confirm(
        "¿Eliminar esta publicación? No vas a poder recuperarla desde el panel.",
      );
      if (!confirmado) return;
    }

    iniciarCambio(async () => {
      const respuesta = await cambiarEstadoPublicacion({
        id: publicacionId,
        nuevoEstado,
      });
      setError(respuesta.ok ? null : respuesta.mensaje);
      if (respuesta.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      {error ? (
        <Alert variant="destructive" role="status">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(estado === "borrador" || estado === "pausada") && (
          <Button size="sm" onClick={() => cambiar("activa")} disabled={aplicando}>
            {estado === "borrador" ? "Publicar" : "Reactivar"}
          </Button>
        )}

        {estado === "activa" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cambiar("pausada")}
            disabled={aplicando}
          >
            Pausar
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => cambiar("eliminada")}
          disabled={aplicando}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
