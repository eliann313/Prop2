"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  function alPresionarTecla(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (fotos.length < 2) return;

    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      setActiva((actual) => (actual - 1 + fotos.length) % fotos.length);
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      setActiva((actual) => (actual + 1) % fotos.length);
    }
  }

  if (fotos.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[16/9] items-center justify-center rounded-2xl border border-[#e9e4e0] text-sm">
        Esta publicación no tiene fotos
      </div>
    );
  }

  const principal = fotos[activa] ?? fotos[0];

  return (
    <div
      className="grid min-w-0 gap-3"
      role="group"
      aria-label="Fotos de la publicación"
      onKeyDown={alPresionarTecla}
    >
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#e9e4e0]">
        <Image
          src={principal.url}
          // El alt describe el inmueble y no dice "foto de": el lector de pantalla ya anuncia
          // que es una imagen, y repetirlo solo alarga lo que la persona tiene que escuchar.
          alt={`${titulo} — imagen ${activa + 1} de ${fotos.length}`}
          fill
          sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 65vw, 850px"
          className="object-cover"
          // La portada es lo primero que se ve: se carga con prioridad para que no sea ella
          // la que retrase el LCP de la página.
          preload={activa === 0}
        />
        {fotos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() =>
                setActiva((actual) => (actual - 1 + fotos.length) % fotos.length)
              }
              aria-label="Ver imagen anterior"
              className="text-bordeaux absolute top-1/2 left-3 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-md transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#ffc300] focus-visible:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiva((actual) => (actual + 1) % fotos.length)}
              aria-label="Ver imagen siguiente"
              className="text-bordeaux absolute top-1/2 right-3 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-md transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#ffc300] focus-visible:outline-none"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="absolute right-3 bottom-3 z-10 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white"
            >
              {activa + 1} / {fotos.length}
            </span>
          </>
        ) : null}
      </div>

      {fotos.length > 1 ? (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, indice) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setActiva(indice)}
              aria-label={`Ver imagen ${indice + 1}`}
              aria-current={indice === activa ? "true" : undefined}
              className={cn(
                "bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg sm:size-20",
                indice === activa
                  ? "ring-2 ring-[#581845] ring-offset-2 ring-offset-[#faf8f6]"
                  : "opacity-70 transition-opacity hover:opacity-100",
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
