import type { Metadata } from "next";
import Link from "next/link";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { BotonFavorito } from "@/features/favoritos/components/BotonFavorito";
import { listarFavoritos } from "@/features/favoritos/favoritoRepository";
import { TarjetaDePublicacion } from "@/shared/components/TarjetaDePublicacion";
import { Button } from "@/shared/components/ui/button";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { RUTAS } from "@/shared/rutas";

export const metadata: Metadata = { title: "Mis favoritos" };

export default async function PaginaFavoritos() {
  // Exige sesión del lado del servidor, no solo en el proxy: el chequeo del proxy es optimista
  // sobre el JWT y no alcanza como autorización (ver sessionQueries).
  const usuario = await requerirUsuario(RUTAS.favoritos);

  const [favoritos, cotizacion] = await Promise.all([
    listarFavoritos(usuario.id),
    obtenerCotizacion(),
  ]);

  if (favoritos.length === 0) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Mis favoritos</h1>
        <div className="grid gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Todavía no guardaste ninguna publicación.
          </p>
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href={RUTAS.publicaciones}>Buscar inmuebles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Mis favoritos{" "}
        <span className="text-muted-foreground text-base font-normal">
          ({favoritos.length})
        </span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favoritos.map(({ publicacion }) => (
          <TarjetaDePublicacion
            key={publicacion.id}
            publicacion={{
              id: publicacion.id,
              titulo: publicacion.titulo,
              precio: Number(publicacion.precio),
              moneda: publicacion.moneda,
              operacion: publicacion.operacion,
              tipoInmueble: publicacion.tipoInmueble,
              provincia: publicacion.provincia,
              ciudad: publicacion.ciudad,
              barrio: publicacion.barrio,
              ambientes: publicacion.ambientes,
              dormitorios: publicacion.dormitorios,
              banios: publicacion.banios,
              superficieCubierta: publicacion.superficieCubierta
                ? Number(publicacion.superficieCubierta)
                : null,
              imagenUrl: publicacion.imagenes[0]?.url ?? null,
              imagenThumbnail: publicacion.imagenes[0]?.urlThumbnail ?? null,
            }}
            cotizacion={cotizacion}
            // Se muestran igual las que dejaron de estar activas, con el cartel: un favorito
            // que desaparece sin explicación se lee como un bug, no como un inmueble vendido.
            noDisponible={publicacion.estadoPublicacion !== "activa"}
            accion={
              <BotonFavorito
                publicacionId={publicacion.id}
                esFavorito
                volverA={RUTAS.favoritos}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
