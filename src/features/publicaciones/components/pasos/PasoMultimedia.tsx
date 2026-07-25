"use client";

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
    formState: { errors },
  } = useCamposPublicacion();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium">Fotos</p>

        {subidaDeImagenesDisponible ? (
          // La galería con reordenamiento y portada entra acá cuando haya credenciales de
          // Cloudinary. El paso ya existe en el wizard para que sumarla no obligue a
          // reestructurar el formulario ni a renumerar los pasos.
          <p className="text-muted-foreground text-sm">
            La galería de imágenes se habilita en el siguiente incremento.
          </p>
        ) : (
          <Alert>
            <AlertDescription>
              La subida de fotos necesita credenciales de Cloudinary (
              <code>CLOUDINARY_*</code> en el <code>.env</code>). Mientras tanto podés
              guardar la publicación como borrador: para pasarla a activa hace falta al
              menos una foto.
            </AlertDescription>
          </Alert>
        )}
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
