"use client";

import { CampoSelect } from "@/features/publicaciones/components/CampoSelect";
import { useCamposPublicacion } from "@/features/publicaciones/components/useCamposPublicacion";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_ORIENTACION,
} from "@/features/publicaciones/publicacionSchemas";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

export type CaracteristicaDisponible = {
  id: string;
  nombre: string;
  categoria: "servicio" | "comodidad";
};

type Props = {
  caracteristicas: CaracteristicaDisponible[];
};

export function PasoCaracteristicas({ caracteristicas }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useCamposPublicacion();

  const seleccionadas = watch("caracteristicaIds") ?? [];

  function alternar(id: string, marcada: boolean) {
    setValue(
      "caracteristicaIds",
      marcada ? [...seleccionadas, id] : seleccionadas.filter((x) => x !== id),
      { shouldDirty: true },
    );
  }

  const servicios = caracteristicas.filter((c) => c.categoria === "servicio");
  const comodidades = caracteristicas.filter((c) => c.categoria === "comodidad");

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Superficie cubierta (m²)"
          type="number"
          step="0.01"
          min="0"
          error={errors.superficieCubierta?.message}
          {...register("superficieCubierta")}
        />
        <CampoTexto
          etiqueta="Superficie total (m²)"
          type="number"
          step="0.01"
          min="0"
          error={errors.superficieTotal?.message}
          {...register("superficieTotal")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto
          etiqueta="Ambientes"
          type="number"
          min="0"
          error={errors.ambientes?.message}
          {...register("ambientes")}
        />
        <CampoTexto
          etiqueta="Dormitorios"
          type="number"
          min="0"
          error={errors.dormitorios?.message}
          {...register("dormitorios")}
        />
        <CampoTexto
          etiqueta="Baños"
          type="number"
          min="0"
          error={errors.banios?.message}
          {...register("banios")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto
          etiqueta="Piso"
          type="number"
          min="0"
          error={errors.piso?.message}
          ayuda="Solo departamentos, oficinas y cocheras."
          {...register("piso")}
        />
        <CampoTexto
          etiqueta="Antigüedad (años)"
          type="number"
          min="0"
          error={errors.antiguedadAnios?.message}
          {...register("antiguedadAnios")}
        />
        <CampoTexto
          etiqueta="Expensas"
          type="number"
          step="0.01"
          min="0"
          error={errors.expensas?.message}
          ayuda="Siempre en pesos, aunque el precio esté en USD."
          {...register("expensas")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          etiqueta="Estado del inmueble"
          placeholder="Sin especificar"
          opciones={Object.entries(ETIQUETAS_ESTADO_INMUEBLE).map(
            ([valor, etiqueta]) => ({
              valor,
              etiqueta,
            }),
          )}
          error={errors.estadoInmueble?.message}
          {...register("estadoInmueble")}
        />
        <CampoSelect
          etiqueta="Orientación"
          placeholder="Sin especificar"
          opciones={Object.entries(ETIQUETAS_ORIENTACION).map(([valor, etiqueta]) => ({
            valor,
            etiqueta,
          }))}
          error={errors.orientacion?.message}
          {...register("orientacion")}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="tieneCochera"
          checked={watch("tieneCochera") ?? false}
          onCheckedChange={(marcado) =>
            setValue("tieneCochera", marcado === true, { shouldDirty: true })
          }
        />
        <Label htmlFor="tieneCochera">Tiene cochera</Label>
      </div>

      <GrupoDeCaracteristicas
        titulo="Servicios"
        items={servicios}
        seleccionadas={seleccionadas}
        onAlternar={alternar}
      />
      <GrupoDeCaracteristicas
        titulo="Comodidades"
        items={comodidades}
        seleccionadas={seleccionadas}
        onAlternar={alternar}
      />
    </div>
  );
}

function GrupoDeCaracteristicas({
  titulo,
  items,
  seleccionadas,
  onAlternar,
}: {
  titulo: string;
  items: CaracteristicaDisponible[];
  seleccionadas: string[];
  onAlternar: (id: string, marcada: boolean) => void;
}) {
  if (items.length === 0) return null;

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">{titulo}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              id={`caracteristica-${item.id}`}
              checked={seleccionadas.includes(item.id)}
              onCheckedChange={(marcado) => onAlternar(item.id, marcado === true)}
            />
            <Label htmlFor={`caracteristica-${item.id}`} className="font-normal">
              {item.nombre}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
