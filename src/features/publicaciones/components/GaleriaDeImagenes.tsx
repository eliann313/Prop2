"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { firmarSubidaDeImagen } from "@/features/publicaciones/actions/firmarSubidaDeImagen";
import type { ImagenDePublicacion } from "@/features/publicaciones/publicacionSchemas";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

type Props = {
  imagenes: ImagenDePublicacion[];
  onCambio: (imagenes: ImagenDePublicacion[]) => void;
  maximo?: number;
};

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** 10 MB: una foto de celular moderna ronda los 3-5 MB. */
const TAMANO_MAXIMO = 10 * 1024 * 1024;

type RespuestaCloudinary = {
  public_id: string;
  secure_url: string;
};

/**
 * Galería del paso 4 del wizard.
 *
 * Los archivos van DIRECTO del navegador a Cloudinary, no a través de nuestro servidor. El
 * servidor solo emite una firma. Además de ahorrar una vuelta de red por foto, es lo que hace
 * que funcione en Vercel: las funciones serverless tienen un tope de ~4.5 MB de body, y una
 * sola foto de celular ya lo supera.
 *
 * La primera imagen del arreglo es la portada. No hay un flag por imagen: con un booleano
 * suelto se puede llegar a cero portadas o a dos, y habría que defenderse de eso en cada
 * lectura. Derivándola del orden, "hay exactamente una portada" no puede ser falso.
 */
export function GaleriaDeImagenes({ imagenes, onCambio, maximo = 20 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function subirArchivo(
    archivo: File,
    firma: Awaited<ReturnType<typeof firmarSubidaDeImagen>>,
  ): Promise<ImagenDePublicacion | null> {
    if (!firma.ok || !firma.datos) return null;

    const cuerpo = new FormData();
    cuerpo.append("file", archivo);
    cuerpo.append("api_key", firma.datos.apiKey);
    cuerpo.append("timestamp", String(firma.datos.timestamp));
    cuerpo.append("folder", firma.datos.carpeta);
    cuerpo.append("signature", firma.datos.firma);

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${firma.datos.cloudName}/image/upload`,
      { method: "POST", body: cuerpo },
    );

    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as RespuestaCloudinary;
    const base = `https://res.cloudinary.com/${firma.datos.cloudName}/image/upload`;

    return {
      publicId: datos.public_id,
      // Las URLs se arman con transformaciones en vez de usar secure_url tal cual: `f_auto`
      // sirve AVIF/WebP según el navegador y `q_auto` ajusta la compresión. Es la razón por la
      // que la sección 2.6 eligió Cloudinary sobre un storage que solo guarda archivos.
      url: `${base}/f_auto,q_auto,w_1200,c_limit/${datos.public_id}`,
      urlThumbnail: `${base}/f_auto,q_auto,w_400,h_300,c_fill/${datos.public_id}`,
    };
  }

  async function alElegirArchivos(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    // Se limpia el input enseguida: si no, volver a elegir el MISMO archivo no dispara change.
    evento.target.value = "";
    if (archivos.length === 0) return;

    setError(null);

    const invalido = archivos.find(
      (archivo) =>
        !TIPOS_ACEPTADOS.includes(archivo.type) || archivo.size > TAMANO_MAXIMO,
    );
    if (invalido) {
      setError(
        `"${invalido.name}" no se puede subir: se aceptan JPG, PNG, WebP o AVIF de hasta 10 MB.`,
      );
      return;
    }

    const disponibles = maximo - imagenes.length;
    if (archivos.length > disponibles) {
      setError(`Podés subir ${disponibles} foto(s) más (máximo ${maximo}).`);
      return;
    }

    setSubiendo(true);
    setProgreso({ hechas: 0, total: archivos.length });

    try {
      const subidas: ImagenDePublicacion[] = [];

      for (const archivo of archivos) {
        // Una firma por archivo: Cloudinary la valida contra el timestamp, y reutilizar una
        // sola para muchas subidas largas hace que las últimas se rechacen por vencida.
        const firma = await firmarSubidaDeImagen();
        if (!firma.ok) {
          setError(firma.mensaje);
          break;
        }

        const imagen = await subirArchivo(archivo, firma);
        if (!imagen) {
          setError(`No pudimos subir "${archivo.name}". Probá de nuevo.`);
          break;
        }

        subidas.push(imagen);
        setProgreso({ hechas: subidas.length, total: archivos.length });
      }

      // Se agregan las que sí se subieron aunque alguna haya fallado: perder las 5 fotos que
      // funcionaron porque la sexta falló sería peor.
      if (subidas.length > 0) onCambio([...imagenes, ...subidas]);
    } finally {
      setSubiendo(false);
      setProgreso(null);
    }
  }

  function quitar(publicId: string) {
    onCambio(imagenes.filter((imagen) => imagen.publicId !== publicId));
  }

  function mover(desde: number, hacia: number) {
    if (hacia < 0 || hacia >= imagenes.length) return;
    const copia = [...imagenes];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hacia, 0, movida);
    onCambio(copia);
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <Alert variant="destructive" role="status">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {imagenes.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imagenes.map((imagen, indice) => (
            <li key={imagen.publicId} className="grid gap-1">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-md border">
                <Image
                  src={imagen.urlThumbnail}
                  alt={indice === 0 ? "Foto de portada" : `Foto ${indice + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {indice === 0 ? (
                  <span className="bg-foreground text-background absolute top-1 left-1 rounded px-1.5 py-0.5 text-xs">
                    Portada
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-muted-foreground px-1 text-sm disabled:opacity-30"
                    onClick={() => mover(indice, indice - 1)}
                    disabled={indice === 0}
                    aria-label={`Mover la foto ${indice + 1} hacia adelante`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground px-1 text-sm disabled:opacity-30"
                    onClick={() => mover(indice, indice + 1)}
                    disabled={indice === imagenes.length - 1}
                    aria-label={`Mover la foto ${indice + 1} hacia atrás`}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  className="text-destructive text-sm underline underline-offset-2"
                  onClick={() => quitar(imagen.publicId)}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEPTADOS.join(",")}
        multiple
        className="hidden"
        onChange={alElegirArchivos}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo || imagenes.length >= maximo}
        >
          {subiendo ? "Subiendo…" : "Agregar fotos"}
        </Button>
        <p className="text-muted-foreground text-sm">
          {progreso
            ? `Subiendo ${progreso.hechas + 1} de ${progreso.total}…`
            : `${imagenes.length} de ${maximo}. La primera es la portada.`}
        </p>
      </div>
    </div>
  );
}
