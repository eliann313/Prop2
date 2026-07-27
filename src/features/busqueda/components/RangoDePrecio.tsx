"use client";

import { useId, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { formatearPrecio } from "@/shared/utils/formato";

// Único componente de cliente de los filtros. El resto del formulario es HTML nativo y anda sin
// JavaScript; acá hace falta cliente porque un slider de dos manijas no existe en HTML.
//
// Por eso la fuente de verdad son los DOS INPUTS numéricos, no el slider: son los que el
// formulario envía, y sin JavaScript siguen siendo dos campos donde escribir el rango a mano.
// El slider los escribe, no los reemplaza.

type Props = {
  /** Extremos reales de la base para la moneda y operación actuales. */
  minimo: number;
  maximo: number;
  moneda: "ARS" | "USD";
  valorInicialMin?: number;
  valorInicialMax?: number;
};

export function RangoDePrecio({
  minimo,
  maximo,
  moneda,
  valorInicialMin,
  valorInicialMax,
}: Props) {
  const idMin = useId();
  const idMax = useId();

  const [rango, setRango] = useState<[number, number]>([
    valorInicialMin ?? minimo,
    valorInicialMax ?? maximo,
  ]);

  // Cien pasos a lo largo del rango: suficiente para arrastrar con precisión útil y evitando
  // que el paso sea 1 peso sobre un rango de 200 millones, donde el slider no se movería.
  const paso = Math.max(1, Math.round((maximo - minimo) / 100));

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Precio</span>
        <span className="text-muted-foreground">
          {formatearPrecio(rango[0], moneda)} – {formatearPrecio(rango[1], moneda)}
        </span>
      </div>

      <Slider
        value={rango}
        min={minimo}
        max={maximo}
        step={paso}
        onValueChange={(valores) => setRango([valores[0], valores[1]])}
        aria-label="Rango de precio"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label htmlFor={idMin} className="text-muted-foreground text-xs">
            Desde
          </Label>
          <Input
            id={idMin}
            name="precioMin"
            type="number"
            inputMode="numeric"
            min={minimo}
            max={maximo}
            value={rango[0]}
            onChange={(evento) => setRango([Number(evento.target.value), rango[1]])}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={idMax} className="text-muted-foreground text-xs">
            Hasta
          </Label>
          <Input
            id={idMax}
            name="precioMax"
            type="number"
            inputMode="numeric"
            min={minimo}
            max={maximo}
            value={rango[1]}
            onChange={(evento) => setRango([rango[0], Number(evento.target.value)])}
          />
        </div>
      </div>
    </div>
  );
}
