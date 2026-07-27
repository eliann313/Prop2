"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  cambiarEstadoDeUsuarioAction,
  moderarPublicacionAction,
} from "@/features/admin/actions/moderar";
import { Button } from "@/shared/components/ui/button";

// Botones del panel de moderación. Son de cliente solo por el `useTransition` que deshabilita
// mientras la action corre; toda la autorización pasa del lado del servidor.

type PropsPublicacion = {
  publicacionId: string;
  estado: "borrador" | "activa" | "pausada" | "eliminada";
};

export function AccionesDePublicacion({ publicacionId, estado }: PropsPublicacion) {
  const [pendiente, iniciarTransicion] = useTransition();

  function ejecutar(nuevoEstado: "activa" | "pausada" | "eliminada", confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;

    iniciarTransicion(async () => {
      const resultado = await moderarPublicacionAction({
        publicacionId,
        estado: nuevoEstado,
      });
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {estado === "activa" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pendiente}
          onClick={() => ejecutar("pausada")}
        >
          Pausar
        </Button>
      ) : null}

      {estado === "pausada" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pendiente}
          onClick={() => ejecutar("activa")}
        >
          Reactivar
        </Button>
      ) : null}

      {estado !== "eliminada" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={pendiente}
          onClick={() =>
            ejecutar(
              "eliminada",
              "Esto saca la publicación de la plataforma. ¿Confirmás?",
            )
          }
        >
          Eliminar
        </Button>
      ) : null}
    </div>
  );
}

type PropsUsuario = {
  usuarioId: string;
  estado: "activo" | "baneado";
  esUnoMismo: boolean;
};

export function AccionDeUsuario({ usuarioId, estado, esUnoMismo }: PropsUsuario) {
  const [pendiente, iniciarTransicion] = useTransition();

  if (esUnoMismo) {
    return <span className="text-muted-foreground text-xs">Sos vos</span>;
  }

  const banear = estado === "activo";

  return (
    <Button
      size="sm"
      variant={banear ? "destructive" : "outline"}
      disabled={pendiente}
      onClick={() => {
        if (
          banear &&
          !window.confirm("El usuario no va a poder iniciar sesión. ¿Confirmás?")
        ) {
          return;
        }

        iniciarTransicion(async () => {
          const resultado = await cambiarEstadoDeUsuarioAction({
            usuarioId,
            estado: banear ? "baneado" : "activo",
          });
          if (resultado.ok) toast.success(resultado.mensaje);
          else toast.error(resultado.mensaje);
        });
      }}
    >
      {banear ? "Banear" : "Reactivar"}
    </Button>
  );
}
