"use client";

import { Label } from "@/shared/components/ui/label";

type Opcion = { valor: string; etiqueta: string };

type Props = React.ComponentProps<"select"> & {
  etiqueta: string;
  opciones: readonly Opcion[];
  /** Texto de la opción vacía. Si no se pasa, el campo no admite vacío. */
  placeholder?: string;
  error?: string;
  ayuda?: string;
};

/**
 * Select nativo, no el de Radix.
 *
 * El de shadcn/ui es un combobox construido con divs: se ve mejor, pero no se registra con el
 * `{...register()}` de React Hook Form (necesita un Controller por campo) y no aporta nada en
 * mobile, donde el navegador ya muestra su propio selector. Con ~8 selects en este wizard, el
 * nativo es menos código y mejor accesibilidad por defecto.
 */
export function CampoSelect({
  etiqueta,
  opciones,
  placeholder,
  error,
  ayuda,
  id,
  ...props
}: Props) {
  const idCampo = id ?? props.name;
  const idDescripcion = `${idCampo}-descripcion`;
  const descripcion = error ?? ayuda;

  return (
    <div className="grid gap-2">
      <Label htmlFor={idCampo}>{etiqueta}</Label>
      <select
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className="border-input dark:bg-input/30 aria-invalid:border-destructive h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {descripcion ? (
        <p
          id={idDescripcion}
          className={error ? "text-destructive text-sm" : "text-muted-foreground text-sm"}
          role={error ? "alert" : undefined}
        >
          {descripcion}
        </p>
      ) : null}
    </div>
  );
}
