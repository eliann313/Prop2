"use client";

import { useEffect } from "react";

/**
 * Avisa que se vio esta publicación (6.4).
 *
 * No renderiza nada: existe solo para mover el conteo fuera del render del servidor, que es lo
 * que permite cachear la página del detalle (9.1). El pedido sale una vez por montaje y el
 * resultado se ignora — si falla, se pierde una visita en un contador, y eso no justifica
 * mostrarle ningún error a quien está mirando un inmueble.
 */
export function RegistrarVista({ publicacionId }: { publicacionId: string }) {
  useEffect(() => {
    // `keepalive` para que el pedido sobreviva si la persona navega enseguida: sin él, salir
    // rápido del detalle cancela el fetch y esa visita no se cuenta nunca.
    void fetch(`/api/publicaciones/${publicacionId}/vista`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [publicacionId]);

  return null;
}
