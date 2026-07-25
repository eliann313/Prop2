"use client";

import type { ComponentProps } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type Props = ComponentProps<typeof Input> & {
  etiqueta: string;
  /** Mensaje de error del campo, si tiene uno. */
  error?: string;
  /** Texto de ayuda que se muestra cuando no hay error. */
  ayuda?: string;
};

/**
 * Campo etiquetado con su error. Existe para no repetir el cableado de accesibilidad en los
 * cuatro formularios de auth: `htmlFor`/`id`, `aria-invalid` y `aria-describedby` apuntando al
 * mensaje de error, que es lo que hace que un lector de pantalla anuncie el problema en vez de
 * dejar al usuario adivinando por qué no avanza.
 */
export function CampoTexto({ etiqueta, error, ayuda, id, ...props }: Props) {
  const idCampo = id ?? props.name;
  const idDescripcion = `${idCampo}-descripcion`;
  const descripcion = error ?? ayuda;

  return (
    <div className="grid gap-2">
      <Label htmlFor={idCampo}>{etiqueta}</Label>
      <Input
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion ? idDescripcion : undefined}
        {...props}
      />
      {descripcion ? (
        <p
          id={idDescripcion}
          className={error ? "text-destructive text-sm" : "text-muted-foreground text-sm"}
          // role="alert" solo cuando es un error: si estuviera siempre, el lector de pantalla
          // leería en voz alta los textos de ayuda al aparecer, interrumpiendo la navegación.
          role={error ? "alert" : undefined}
        >
          {descripcion}
        </p>
      ) : null}
    </div>
  );
}
