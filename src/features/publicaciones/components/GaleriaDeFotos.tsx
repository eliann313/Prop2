"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/shared/utils/cn";

// Cliente porque elegir una foto es estado de interfaz puro: no cambia la URL ni toca el
// servidor. Es el único pedazo interactivo del detalle.

type Foto = { id: string; url: string; urlThumbnail: string | null };

type Props = {
  fotos: Foto[];
  titulo: string;
};

export function GaleriaDeFotos({ fotos, titulo }: Props) {
  const [activa, setActiva] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[16/10] items-center justify-center rounded-lg text-sm">
        Esta publicación no tiene fotos
      </div>
    );
  }

  const principal = fotos[activa] ?? fotos[0];

  return (
    <div className="grid gap-3">
      <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-lg">
        <Image
          src={principal.url}
          // El alt describe el inmueble y no dice "foto de": el lector de pantalla ya anuncia
          // que es una imagen, y repetirlo solo alarga lo que la persona tiene que escuchar.
          alt={`${titulo} — imagen ${activa + 1} de ${fotos.length}`}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          // La portada es lo primero que se ve: se carga con prioridad para que no sea ella
          // la que retrase el LCP de la página.
          priority={activa === 0}
        />
      </div>

      {fotos.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
          {fotos.map((foto, indice) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setActiva(indice)}
              aria-label={`Ver imagen ${indice + 1}`}
              aria-current={indice === activa}
              className={cn(
                "bg-muted relative aspect-square overflow-hidden rounded-md",
                indice === activa
                  ? "ring-primary ring-2"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={foto.urlThumbnail ?? foto.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
