"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ─── Lista de imágenes del slider ────────────────────────────────────────────
// Se definen las 3 imágenes que rotarán como fondo del hero.
// La primera es la imagen original que ya estaba en uso.
const IMAGENES_HERO = [
  {
    src: "/hero-bg.jpg",
    alt: "Calle de Recoleta en Buenos Aires",
  },
  {
    src: "/images/mendoza.jpg",
    alt: "Propiedad en Mendoza",
  },
  {
    src: "/images/casa-belgrano.jpg",
    alt: "Casa en Belgrano",
  },
];

// ─── Configuración del temporizador ──────────────────────────────────────────
// Intervalo entre cambios de imagen (en milisegundos)
const INTERVALO_AUTOPLAY = 6000; // 6 segundos

/**
 * HeroSlider – Componente que renderiza un carrusel de imágenes de fondo
 * con transición crossfade suave. Se usa como fondo del hero principal.
 *
 * Implementación:
 * - Todas las imágenes están apiladas con position absolute.
 * - Solo la imagen activa tiene opacity: 1, el resto opacity: 0.
 * - La transición de opacity (1.5s) produce el efecto crossfade.
 * - Un useEffect con setInterval rota el índice activo cada 6 segundos.
 */
export function HeroSlider() {
  // ─── Estado: índice de la imagen actualmente visible ─────────────────────
  const [indiceActivo, setIndiceActivo] = useState(0);

  // ─── Efecto: autoplay con setInterval ────────────────────────────────────
  // Cada 6 segundos, avanza al siguiente índice (vuelve a 0 al final = loop).
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActivo((prevIndice) =>
        prevIndice === IMAGENES_HERO.length - 1 ? 0 : prevIndice + 1,
      );
    }, INTERVALO_AUTOPLAY);

    // Limpieza: eliminar el intervalo al desmontar el componente
    return () => clearInterval(intervalo);
  }, []);

  return (
    <>
      {/* ─── Contenedor de imágenes apiladas ─────────────────────────────── */}
      {/* Cada imagen ocupa todo el contenedor (fill + object-cover).
          Solo la activa tiene opacity 1; las demás tienen opacity 0.
          La transición CSS de 1.5s genera el efecto crossfade suave. */}
      {IMAGENES_HERO.map((imagen, indice) => (
        <Image
          key={imagen.src}
          src={imagen.src}
          alt={imagen.alt}
          fill
          // La primera imagen se marca como priority para carga rápida (LCP)
          priority={indice === 0}
          sizes="100vw"
          className={`hero-slider-imagen object-cover object-[center_60%] ${indice > 0 ? "hero-slider-sin-zoom" : ""} ${indice === indiceActivo ? "hero-slider-activa" : ""} `}
        />
      ))}

      {/* ─── Overlay oscuro para legibilidad del texto ───────────────────── */}
      {/* Se posiciona encima de las imágenes (z-[1]) pero debajo del
          contenido de texto/botones que tiene z-10 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/85 via-black/55 to-black/35" />
    </>
  );
}
