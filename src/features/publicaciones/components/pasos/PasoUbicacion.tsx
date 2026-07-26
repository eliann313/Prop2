"use client";

import { useState, useTransition } from "react";

import { geocodificarDireccion } from "@/features/publicaciones/actions/geocodificarDireccion";
import { CampoSelect } from "@/features/publicaciones/components/CampoSelect";
import { useCamposPublicacion } from "@/features/publicaciones/components/useCamposPublicacion";
import { PROVINCIAS } from "@/shared/catalogoInmuebles";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

export function PasoUbicacion() {
  const {
    register,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useCamposPublicacion();

  const [resultado, setResultado] = useState<ResultadoAccion<unknown> | null>(null);
  const [buscando, iniciarBusqueda] = useTransition();
  // Las coordenadas se muestran solo si el usuario las pide: en el 95% de los casos las
  // completa el geocoding y mostrarlas de entrada es ruido en un formulario que ya es largo.
  const [mostrarCoordenadas, setMostrarCoordenadas] = useState(false);

  const latitud = watch("latitud");
  const longitud = watch("longitud");
  const tieneCoordenadas = Number.isFinite(latitud) && Number.isFinite(longitud);

  function buscarEnElMapa() {
    iniciarBusqueda(async () => {
      const respuesta = await geocodificarDireccion({
        direccion: getValues("direccion"),
        ciudad: getValues("ciudad"),
        provincia: getValues("provincia"),
      });

      setResultado(respuesta);

      if (respuesta.ok && respuesta.datos) {
        // shouldValidate limpia el error de "falta la ubicación" apenas se completan, sin
        // esperar a que el usuario intente avanzar de paso.
        setValue("latitud", respuesta.datos.latitud, { shouldValidate: true });
        setValue("longitud", respuesta.datos.longitud, { shouldValidate: true });
      } else {
        // Si falló, se abren los campos manuales: es la salida que ofrece el flujo de 5.2
        // cuando Nominatim no encuentra la dirección.
        setMostrarCoordenadas(true);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          etiqueta="Provincia"
          placeholder="Elegí una opción"
          opciones={PROVINCIAS.map((provincia) => ({
            valor: provincia,
            etiqueta: provincia,
          }))}
          error={errors.provincia?.message}
          {...register("provincia")}
        />
        <CampoTexto
          etiqueta="Ciudad"
          autoComplete="address-level2"
          error={errors.ciudad?.message}
          {...register("ciudad")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Barrio (opcional)"
          error={errors.barrio?.message}
          ayuda="En CABA y GBA pesa más que la ciudad."
          {...register("barrio")}
        />
        <CampoTexto
          etiqueta="Código postal (opcional)"
          error={errors.codigoPostal?.message}
          {...register("codigoPostal")}
        />
      </div>

      <CampoTexto
        etiqueta="Dirección (opcional)"
        autoComplete="street-address"
        error={errors.direccion?.message}
        ayuda="Mejora la precisión del mapa. Podés elegir después si se muestra en el aviso público."
        {...register("direccion")}
      />

      <div className="grid gap-3 rounded-md border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Ubicación en el mapa</p>
            <p className="text-muted-foreground text-sm">
              {tieneCoordenadas
                ? `Lat ${Number(latitud).toFixed(5)}, Lng ${Number(longitud).toFixed(5)}`
                : "Todavía sin definir."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={buscarEnElMapa}
            disabled={buscando}
          >
            {buscando ? "Buscando…" : "Buscar en el mapa"}
          </Button>
        </div>

        <AvisoDeAccion resultado={resultado} />

        {errors.latitud || errors.longitud ? (
          <p className="text-destructive text-sm" role="alert">
            Falta la ubicación. Buscala en el mapa o cargala a mano.
          </p>
        ) : null}

        {mostrarCoordenadas ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              etiqueta="Latitud"
              type="number"
              step="any"
              error={errors.latitud?.message}
              {...register("latitud")}
            />
            <CampoTexto
              etiqueta="Longitud"
              type="number"
              step="any"
              error={errors.longitud?.message}
              {...register("longitud")}
            />
          </div>
        ) : (
          <button
            type="button"
            className="text-muted-foreground justify-self-start text-sm underline underline-offset-4"
            onClick={() => setMostrarCoordenadas(true)}
          >
            Cargar las coordenadas a mano
          </button>
        )}
      </div>
    </div>
  );
}
