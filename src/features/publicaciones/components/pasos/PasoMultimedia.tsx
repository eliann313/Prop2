"use client";

import { GaleriaDeImagenes } from "@/features/publicaciones/components/GaleriaDeImagenes";
import { useCamposPublicacion } from "@/features/publicaciones/components/useCamposPublicacion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

type Props = {
  /** Si Cloudinary está configurado. Lo resuelve el servidor y baja como prop. */
  subidaDeImagenesDisponible: boolean;
};

export function PasoMultimedia({ subidaDeImagenesDisponible }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useCamposPublicacion();

  const imagenes = watch("imagenes") ?? [];

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium">Fotos</p>

        {subidaDeImagenesDisponible ? (
          <GaleriaDeImagenes
            imagenes={imagenes}
            onCambio={(nuevas) =>
              setValue("imagenes", nuevas, { shouldDirty: true, shouldValidate: true })
            }
          />
        ) : (
          <Alert>
            <AlertDescription>
              La subida de fotos necesita credenciales de Cloudinary (
              <code>CLOUDINARY_*</code> en el <code>.env</code>). Podés guardar la
              publicación como borrador: para pasarla a activa hace falta al menos una
              foto.
            </AlertDescription>
          </Alert>
        )}

        {errors.imagenes ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.imagenes.message}
          </p>
        ) : null}
      </div>

      <CampoTexto
        etiqueta="Video (opcional)"
        type="url"
        placeholder="https://youtube.com/watch?v=…"
        error={errors.videoUrl?.message}
        ayuda="Un link de YouTube o Vimeo."
        {...register("videoUrl")}
      />
    </div>
  );
}
