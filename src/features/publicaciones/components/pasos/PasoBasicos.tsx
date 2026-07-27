"use client";

import { BotonGenerarDescripcion } from "@/features/ia/publico";
import { CampoSelect } from "@/features/publicaciones/components/CampoSelect";
import { useCamposPublicacion } from "@/features/publicaciones/components/useCamposPublicacion";
import { ETIQUETAS_TIPO_INMUEBLE, TIPOS_INMUEBLE } from "@/shared/catalogoInmuebles";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

// Los pasos leen el formulario con useFormContext en vez de recibir `register` y `errors` por
// props: con ~25 campos repartidos en 4 pasos, pasarlos a mano convierte cada paso en una firma
// larga que hay que actualizar cada vez que se mueve un campo de lugar.

export function PasoBasicos() {
  const {
    register,
    getValues,
    setValue,
    watch,
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          {/* El botón se muestra siempre, aunque no haya proveedores configurados. El flag
              `iaHabilitada` vive en serverEnv, que es server-only: traerlo hasta acá obligaría
              a cablear una prop a través del wizard entero o a duplicar la config en una
              NEXT_PUBLIC_. Sale más barato que la action conteste "no está disponible en este
              entorno, escribila a mano", que es información igual de accionable. */}
          <BotonGenerarDescripcion
            hayDescripcion={Boolean(watch("descripcion"))}
            obtenerDatos={() => {
              const valores = getValues();
              // Solo se exige lo que ESTE paso tiene cargado. La ubicación se completa en el
              // paso 2, así que pedirla acá dejaba el botón inutilizable justo donde vive: el
              // vendedor tendría que ir al paso siguiente, volver, y recién ahí generar.
              // Lo que falte simplemente no entra al prompt.
              if (!valores.tipoInmueble || !valores.operacion) return null;
              return {
                tipoInmueble: valores.tipoInmueble,
                operacion: valores.operacion,
                ciudad: valores.ciudad,
                provincia: valores.provincia,
                barrio: valores.barrio,
                ambientes: valores.ambientes,
                dormitorios: valores.dormitorios,
                banios: valores.banios,
                superficieCubierta: valores.superficieCubierta,
                superficieTotal: valores.superficieTotal,
                antiguedadAnios: valores.antiguedadAnios,
                tieneCochera: valores.tieneCochera,
              };
            }}
            alGenerar={(descripcion) =>
              // shouldValidate: la descripción generada supera el mínimo de 40 caracteres,
              // así que corresponde limpiar el error que el usuario ya tenía en pantalla.
              setValue("descripcion", descripcion, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
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
