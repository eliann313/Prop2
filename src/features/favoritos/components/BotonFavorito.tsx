"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { alternarFavorito } from "@/features/favoritos/actions/alternarFavorito";
import { useFavoritos } from "@/features/favoritos/components/FavoritosProvider";
import { RUTAS } from "@/shared/rutas";
import { cn } from "@/shared/utils/cn";

// Toggle optimista (6.5): el corazón cambia al instante y se revierte si el servidor rechaza.
//
// Se usa `useOptimistic` de React 19 y no TanStack Query, que es lo que menciona 6.5. El
// comportamiento pedido —feedback inmediato con reversión ante error— es exactamente lo que
// hace este hook, y ya viene con React: sumar una librería de manejo de estado de servidor
// para un botón booleano es traer un cliente de caché entero para no usar la caché.

type Props = {
  publicacionId: string;
  /** A dónde volver después de loguearse, si el visitante no tiene sesión. */
  volverA: string;
  /** En la tarjeta va flotando sobre la foto; en el detalle, en línea. */
  variante?: "flotante" | "linea";
};

export function BotonFavorito({ publicacionId, volverA, variante = "flotante" }: Props) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  // El estado ya no llega como prop desde el servidor: lo resuelve el provider después de
  // montar, que es lo que permite cachear la home y el detalle (ver FavoritosProvider).
  const { favoritos, cargando, marcar } = useFavoritos();
  const esFavorito = favoritos.has(publicacionId);
  const [optimista, marcarOptimista] = useOptimistic(esFavorito);

  function alClickear() {
    iniciarTransicion(async () => {
      marcarOptimista(!optimista);
      const resultado = await alternarFavorito({ publicacionId });

      if (!resultado.ok) {
        // El corazón vuelve solo a su valor real: `useOptimistic` descarta el valor optimista
        // al terminar la transición, sin que haya que restaurarlo a mano.
        if (resultado.datos?.requiereSesion) {
          router.push(`${RUTAS.login}?volverA=${encodeURIComponent(volverA)}`);
          return;
        }
        toast.error(resultado.mensaje);
        return;
      }

      // El valor real lo dice el servidor, no el optimista: si dos pestañas tocan el mismo
      // corazón, gana lo que quedó en la base y no lo que suponía esta.
      marcar(publicacionId, resultado.datos?.esFavorito ?? !esFavorito);
    });
  }

  return (
    <button
      type="button"
      onClick={alClickear}
      // También mientras carga: dejar clickear antes de saber el estado real haría que el
      // primer click "guarde" algo que ya estaba guardado, y lo quite sin querer.
      disabled={pendiente || cargando}
      aria-pressed={optimista}
      aria-label={optimista ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={cn(
        "grid place-items-center rounded-full transition-colors disabled:opacity-60",
        variante === "flotante"
          ? "bg-background/90 hover:bg-background absolute top-2 right-2 z-10 size-9 shadow-sm"
          : "border-input size-10 border",
      )}
    >
      <Heart
        className={cn(
          "size-5",
          optimista ? "fill-red-500 text-red-500" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
