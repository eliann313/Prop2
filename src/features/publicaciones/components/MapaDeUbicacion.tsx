"use client";

import "leaflet/dist/leaflet.css";

import type { Map as MapaLeaflet } from "leaflet";
import { useEffect, useRef } from "react";

// Se usa Leaflet directo y no react-leaflet, por el mismo criterio con el que se descartó
// next-cloudinary: react-leaflet declara peers de React que hay que verificar en cada major, y
// de esa librería solo usaríamos un wrapper de tres llamadas. Acá el ciclo de vida del mapa son
// las 20 líneas de abajo.
//
// Componente de cliente por obligación: Leaflet toca `window` al construirse. La página lo
// importa con `ssr: false` para que ni siquiera se intente renderizar en el servidor.

type Props = {
  latitud: number;
  longitud: number;
  /** Con dirección exacta se marca el punto; sin ella, solo la zona (3.4). */
  exacta: boolean;
  etiqueta: string;
};

/** Radio de la zona aproximada, en metros. Cubre unas tres manzanas. */
const RADIO_APROXIMADO = 300;

export function MapaDeUbicacion({ latitud, longitud, exacta, etiqueta }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contenedor.current) return;

    let cancelado = false;
    // Import dinámico: Leaflet se evalúa recién en el navegador, y así no entra al bundle de
    // ninguna página que no tenga mapa.
    // `import type` arriba: es solo el tipo, se borra en el build y no arrastra Leaflet.
    let mapa: MapaLeaflet | undefined;

    void import("leaflet").then((L) => {
      if (cancelado || !contenedor.current) return;

      mapa = L.map(contenedor.current, {
        center: [latitud, longitud],
        zoom: exacta ? 16 : 14,
        // El scroll del mouse mueve la página, no el zoom: un mapa que captura el scroll en el
        // medio de una página larga secuestra la navegación. Se hace zoom con los botones.
        scrollWheelZoom: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; colaboradores de OpenStreetMap",
        maxZoom: 19,
      }).addTo(mapa);

      // Sin dirección exacta se dibuja un círculo y no un pin: un pin afirma una precisión que
      // el vendedor eligió no dar, y sobre un domicilio ajeno esa diferencia importa.
      if (exacta) {
        L.circleMarker([latitud, longitud], {
          radius: 9,
          weight: 2,
          color: "#171717",
          fillColor: "#171717",
          fillOpacity: 0.9,
        })
          .addTo(mapa)
          .bindPopup(etiqueta);
      } else {
        L.circle([latitud, longitud], {
          radius: RADIO_APROXIMADO,
          weight: 2,
          color: "#171717",
          fillOpacity: 0.12,
        })
          .addTo(mapa)
          .bindPopup(`${etiqueta} (ubicación aproximada)`);
      }
    });

    return () => {
      cancelado = true;
      // Sin esto, el hot reload y cada navegación dejan el mapa viejo atado al div y Leaflet
      // falla con "Map container is already initialized".
      mapa?.remove();
    };
  }, [latitud, longitud, exacta, etiqueta]);

  return (
    <div
      ref={contenedor}
      role="application"
      aria-label={`Mapa de ${etiqueta}`}
      className="h-72 w-full overflow-hidden rounded-lg border"
    />
  );
}
