"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { guardarPublicacion } from "@/features/publicaciones/actions/guardarPublicacion";
import {
  PasoCaracteristicas,
  type CaracteristicaDisponible,
} from "@/features/publicaciones/components/pasos/PasoCaracteristicas";
import { PasoBasicos } from "@/features/publicaciones/components/pasos/PasoBasicos";
import { PasoMultimedia } from "@/features/publicaciones/components/pasos/PasoMultimedia";
import { PasoUbicacion } from "@/features/publicaciones/components/pasos/PasoUbicacion";
import {
  CAMPOS_POR_PASO,
  PASOS_WIZARD,
  schemaPublicacion,
  type DatosPublicacion,
  type EntradaPublicacion,
} from "@/features/publicaciones/publicacionSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { Button } from "@/shared/components/ui/button";
import { RUTAS } from "@/shared/rutas";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

type Props = {
  caracteristicas: CaracteristicaDisponible[];
  subidaDeImagenesDisponible: boolean;
  /** Si viene, el wizard edita esa publicación en vez de crear una nueva. */
  publicacionId?: string;
  valoresIniciales?: Partial<EntradaPublicacion>;
};

export function FormularioPublicacion({
  caracteristicas,
  subidaDeImagenesDisponible,
  publicacionId,
  valoresIniciales,
}: Props) {
  const router = useRouter();
  const [pasoActual, setPasoActual] = useState(0);
  const [resultado, setResultado] = useState<ResultadoAccion<{ id: string }> | null>(
    null,
  );
  const [guardando, iniciarGuardado] = useTransition();

  // Tres genéricos: el formulario guarda lo que el usuario tipea (EntradaPublicacion, con
  // strings en los campos numéricos) y handleSubmit entrega lo ya convertido por Zod
  // (DatosPublicacion). Con un solo tipo, el resolver no cierra contra useForm.
  const metodos = useForm<EntradaPublicacion, unknown, DatosPublicacion>({
    resolver: zodResolver(schemaPublicacion),
    // onTouched y no onChange: validar en cada tecla marca en rojo un campo que el usuario
    // todavía está completando, que es de las cosas más molestas de un formulario largo.
    mode: "onTouched",
    defaultValues: {
      moneda: "USD",
      tieneCochera: false,
      caracteristicaIds: [],
      ...valoresIniciales,
    },
  });

  const esUltimoPaso = pasoActual === PASOS_WIZARD.length - 1;
  const paso = PASOS_WIZARD[pasoActual];

  /**
   * Valida SOLO los campos del paso actual antes de avanzar.
   *
   * La lista de campos sale de las claves del schema de cada paso, no escrita a mano: mover un
   * campo de un paso a otro es tocar el schema y nada más (ver CAMPOS_POR_PASO).
   */
  async function siguiente() {
    const campos = CAMPOS_POR_PASO[paso.id] as (keyof EntradaPublicacion)[];
    const valido = await metodos.trigger(campos, { shouldFocus: true });
    if (valido) setPasoActual((actual) => actual + 1);
  }

  function onSubmit(datos: DatosPublicacion) {
    iniciarGuardado(async () => {
      const respuesta = await guardarPublicacion(datos, publicacionId);
      setResultado(respuesta);

      if (respuesta.ok) {
        // refresh() antes de navegar: el listado del dashboard es un componente de servidor y
        // sin esto muestra los datos cacheados de antes de guardar.
        router.refresh();
        router.push(RUTAS.dashboard);
      }
    });
  }

  return (
    <FormProvider {...metodos}>
      <form onSubmit={metodos.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        <ol className="flex flex-wrap gap-2" aria-label="Pasos">
          {PASOS_WIZARD.map((item, indice) => (
            <li key={item.id}>
              <button
                type="button"
                // Se puede volver a un paso anterior pero no saltar hacia adelante sin
                // validar: si no, se llega al final con pasos vacíos y el error aparece
                // recién al enviar, lejos del campo que lo causó.
                disabled={indice > pasoActual}
                onClick={() => setPasoActual(indice)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  indice === pasoActual
                    ? "bg-foreground text-background"
                    : "text-muted-foreground"
                } disabled:opacity-50`}
              >
                {indice + 1}. {item.titulo}
              </button>
            </li>
          ))}
        </ol>

        <AvisoDeAccion resultado={resultado} />

        {paso.id === "basicos" && <PasoBasicos />}
        {paso.id === "ubicacion" && <PasoUbicacion />}
        {paso.id === "caracteristicas" && (
          <PasoCaracteristicas caracteristicas={caracteristicas} />
        )}
        {paso.id === "multimedia" && (
          <PasoMultimedia subidaDeImagenesDisponible={subidaDeImagenesDisponible} />
        )}

        <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPasoActual((actual) => actual - 1)}
            disabled={pasoActual === 0 || guardando}
          >
            Atrás
          </Button>

          {esUltimoPaso ? (
            <Button type="submit" disabled={guardando}>
              {guardando
                ? "Guardando…"
                : publicacionId
                  ? "Guardar cambios"
                  : "Guardar borrador"}
            </Button>
          ) : (
            <Button type="button" onClick={siguiente}>
              Siguiente
            </Button>
          )}
        </div>

        {!esUltimoPaso ? (
          <p className="text-muted-foreground text-sm">
            Podés cerrar en cualquier momento: hasta que no llegues al final no se guarda
            nada.
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
