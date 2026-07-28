"use client";

import { createContext, use, useEffect, useMemo, useState } from "react";

import { consultarFavoritos } from "@/features/favoritos/actions/consultarFavoritos";

/**
 * Estado de los favoritos de la página, resuelto en el CLIENTE.
 *
 * Es lo que permite que la home y el detalle se cacheen (9.1). Antes cada corazón recibía su
 * valor como prop desde el servidor, lo que obligaba a leer la sesión durante el render y
 * volvía dinámica toda la página. Ahora el HTML es idéntico para cualquier visitante y el
 * estado propio de cada usuario llega en un segundo momento.
 *
 * Se pide UNA vez por página y no una por corazón: con doce tarjetas en el listado, resolverlo
 * botón por botón serían doce round-trips para responder la misma pregunta.
 */

type EstadoFavoritos = {
  favoritos: ReadonlySet<string>;
  /** Mientras es true el corazón se muestra neutro: todavía no se sabe. */
  cargando: boolean;
  marcar: (publicacionId: string, esFavorito: boolean) => void;
};

const Contexto = createContext<EstadoFavoritos | null>(null);

export function FavoritosProvider({
  idsEnPagina,
  /**
   * Valor inicial para las pantallas donde ya se conoce sin preguntar: en /favoritos, todo lo
   * que se lista es favorito por definición. Ahí el fetch sobra y además la página es privada,
   * así que nunca se cachea.
   */
  favoritosIniciales,
  children,
}: {
  idsEnPagina: string[];
  favoritosIniciales?: string[];
  children: React.ReactNode;
}) {
  const [favoritos, setFavoritos] = useState<ReadonlySet<string>>(
    () => new Set(favoritosIniciales ?? []),
  );
  const [resuelto, setResuelto] = useState(false);

  // Los ids se serializan para la dependencia del efecto: el array llega nuevo en cada render
  // del padre, y compararlo por referencia dispararía el pedido una y otra vez.
  const claveDeIds = idsEnPagina.join(",");

  // Derivado y no un estado aparte: si "no hay nada que preguntar" fuera un `setState` dentro
  // del efecto, se estaría pidiendo un render extra para representar algo que ya se sabe en
  // este mismo render.
  const cargando = favoritosIniciales === undefined && claveDeIds !== "" && !resuelto;

  useEffect(() => {
    if (favoritosIniciales !== undefined) return;

    const ids = claveDeIds ? claveDeIds.split(",") : [];
    if (ids.length === 0) return;

    // Si el componente se desmonta —o cambia la página del listado— antes de que conteste, el
    // resultado viejo no debe pisar al nuevo.
    let vigente = true;

    void consultarFavoritos({ ids })
      .then((encontrados) => {
        if (!vigente) return;
        setFavoritos(new Set(encontrados));
      })
      // Un fallo acá no rompe nada: los corazones quedan neutros y el toggle sigue andando,
      // porque cada click consulta la sesión en el servidor de todas formas.
      .catch(() => {})
      .finally(() => {
        if (vigente) setResuelto(true);
      });

    return () => {
      vigente = false;
    };
  }, [claveDeIds, favoritosIniciales]);

  const valor = useMemo<EstadoFavoritos>(
    () => ({
      favoritos,
      cargando,
      marcar: (publicacionId, esFavorito) => {
        setFavoritos((actuales) => {
          const copia = new Set(actuales);
          if (esFavorito) copia.add(publicacionId);
          else copia.delete(publicacionId);
          return copia;
        });
      },
    }),
    [favoritos, cargando],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}

/**
 * Lanza si se usa fuera del provider, en vez de devolver un default vacío: un corazón que
 * siempre se ve apagado porque a alguien se le olvidó envolver la página es un bug silencioso
 * que solo se nota mirando, y solo estando logueado.
 */
export function useFavoritos(): EstadoFavoritos {
  const contexto = use(Contexto);
  if (!contexto) {
    throw new Error("BotonFavorito necesita estar dentro de <FavoritosProvider>.");
  }
  return contexto;
}
