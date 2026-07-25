"use client";

import { CampoSelect } from "@/features/publicaciones/components/CampoSelect";
import { useCamposPublicacion } from "@/features/publicaciones/components/useCamposPublicacion";
import {
  ETIQUETAS_TIPO_INMUEBLE,
  TIPOS_INMUEBLE,
} from "@/features/publicaciones/publicacionSchemas";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

// Los pasos leen el formulario con useFormContext en vez de recibir `register` y `errors` por
// props: con ~25 campos repartidos en 4 pasos, pasarlos a mano convierte cada paso en una firma
// larga que hay que actualizar cada vez que se mueve un campo de lugar.

export function PasoBasicos() {
  const {
    register,
    formState: { errors },
  } = useCamposPublicacion();

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          etiqueta="Tipo de inmueble"
          placeholder="Elegí una opción"
          opciones={TIPOS_INMUEBLE.map((tipo) => ({
            valor: tipo,
            etiqueta: ETIQUETAS_TIPO_INMUEBLE[tipo],
          }))}
          error={errors.tipoInmueble?.message}
          {...register("tipoInmueble")}
        />
        <CampoSelect
          etiqueta="Operación"
          placeholder="Elegí una opción"
          opciones={[
            { valor: "venta", etiqueta: "Venta" },
            { valor: "alquiler", etiqueta: "Alquiler" },
          ]}
          error={errors.operacion?.message}
          {...register("operacion")}
        />
      </div>

      <CampoTexto
        etiqueta="Título"
        error={errors.titulo?.message}
        ayuda="Lo primero que se ve en los resultados. Ej: “Departamento 2 ambientes con balcón en Palermo”."
        {...register("titulo")}
      />

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          rows={6}
          aria-invalid={errors.descripcion ? true : undefined}
          {...register("descripcion")}
        />
        {errors.descripcion ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.descripcion.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Contá lo que no se ve en las fotos: el barrio, la luz, los gastos, qué tiene
            cerca.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <CampoTexto
          etiqueta="Precio"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          error={errors.precio?.message}
          {...register("precio")}
        />
        <CampoSelect
          etiqueta="Moneda"
          opciones={[
            { valor: "USD", etiqueta: "USD" },
            { valor: "ARS", etiqueta: "ARS" },
          ]}
          error={errors.moneda?.message}
          ayuda="En Argentina se usan las dos."
          {...register("moneda")}
        />
      </div>
    </div>
  );
}
