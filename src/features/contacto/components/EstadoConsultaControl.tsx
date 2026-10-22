"use client";

import { Check, CheckCheck, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { actualizarEstadoConsulta } from "@/features/contacto/actions/actualizarEstadoConsulta";
import {
  ETIQUETAS_ESTADO_CONSULTA,
  type ESTADOS_CONSULTA,
} from "@/features/contacto/consultasSchemas";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type EstadoConsulta = (typeof ESTADOS_CONSULTA)[number];

const SIGUIENTE_ESTADO: Record<EstadoConsulta, EstadoConsulta> = {
  nueva: "leida",
  leida: "atendida",
  atendida: "nueva",
};

const ICONOS = {
  nueva: Check,
  leida: CheckCheck,
  atendida: RotateCcw,
} satisfies Record<EstadoConsulta, typeof Check>;

type Props = {
  mensajeId: string;
  nombreContacto: string;
  estado: EstadoConsulta;
};

export function EstadoConsultaControl({ mensajeId, nombreContacto, estado }: Props) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const nuevoEstado = SIGUIENTE_ESTADO[estado];
  const Icono = ICONOS[estado];

  function cambiarEstado() {
    iniciarTransicion(async () => {
      const resultado = await actualizarEstadoConsulta({
        mensajeId,
        estado: nuevoEstado,
      });
      if (!resultado.ok) {
        toast.error(resultado.mensaje);
        return;
      }

      toast.success(resultado.mensaje);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={cn(
          "inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-medium",
          estado === "nueva" && "border-amber-300 bg-amber-50 text-amber-900",
          estado === "leida" && "border-slate-300 bg-slate-50 text-slate-700",
          estado === "atendida" && "border-emerald-300 bg-emerald-50 text-emerald-900",
        )}
      >
        {ETIQUETAS_ESTADO_CONSULTA[estado]}
      </span>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={pendiente}
        onClick={cambiarEstado}
        aria-label={`${nuevoEstado === "nueva" ? "Reabrir" : "Marcar como"} la consulta de ${nombreContacto}: ${ETIQUETAS_ESTADO_CONSULTA[nuevoEstado].toLowerCase()}`}
      >
        <Icono aria-hidden="true" />
        {nuevoEstado === "nueva"
          ? "Reabrir consulta"
          : `Marcar como ${ETIQUETAS_ESTADO_CONSULTA[nuevoEstado].toLowerCase()}`}
      </Button>
    </div>
  );
}
