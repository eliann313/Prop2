import type { Metadata } from "next";
import Link from "next/link";

import { listarPublicacionesParaModerar } from "@/features/admin/adminRepository";
import { AccionesDePublicacion } from "@/features/admin/components/AccionesDeModeracion";
import { requerirRol } from "@/features/auth/sessionQueries";
import { ETIQUETAS_ESTADO_PUBLICACION } from "@/shared/catalogoInmuebles";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";
import { formatearFecha } from "@/shared/utils/formato";
import { rutaDePublicacion } from "@/shared/utils/slug";

export const metadata: Metadata = { title: "Moderar publicaciones" };

const ESTADOS = ["borrador", "activa", "pausada", "eliminada"] as const;

const VARIANTE = {
  borrador: "secondary",
  activa: "default",
  pausada: "outline",
  eliminada: "destructive",
} as const;

export default async function PaginaModeracion(props: PageProps<"/admin/publicaciones">) {
  await requerirRol("admin");

  const { estado } = await props.searchParams;
  // Un estado inválido en la URL se ignora y muestra todo, en vez de reventar la página.
  const filtro = ESTADOS.find((valido) => valido === estado);
  const publicaciones = await listarPublicacionesParaModerar(filtro);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Publicaciones</h1>
        <Link href={RUTAS.admin} className="text-sm underline underline-offset-4">
          ← Panel
        </Link>
      </div>

      {/* Links y no un select con JavaScript: cada filtro es una URL, se puede compartir y
          el botón "atrás" funciona solo. Mismo criterio que la búsqueda pública. */}
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/publicaciones"
          className={!filtro ? "font-medium underline underline-offset-4" : "underline"}
        >
          Todas
        </Link>
        {ESTADOS.map((valor) => (
          <Link
            key={valor}
            href={`/admin/publicaciones?estado=${valor}`}
            className={
              filtro === valor ? "font-medium underline underline-offset-4" : "underline"
            }
          >
            {ETIQUETAS_ESTADO_PUBLICACION[valor]}
          </Link>
        ))}
      </nav>

      {publicaciones.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No hay publicaciones con este estado.
        </p>
      ) : (
        <div className="grid gap-3">
          {publicaciones.map((publicacion) => (
            <Card key={publicacion.id}>
              <CardContent className="grid gap-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-1">
                    <Link
                      href={`${RUTAS.publicaciones}/${rutaDePublicacion(publicacion.id, publicacion.titulo)}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {publicacion.titulo}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {publicacion.ciudad}, {publicacion.provincia} ·{" "}
                      {publicacion.usuario.email} · {publicacion.vistas} visitas ·{" "}
                      {formatearFecha(publicacion.createdAt)}
                    </p>
                  </div>
                  <Badge variant={VARIANTE[publicacion.estadoPublicacion]}>
                    {ETIQUETAS_ESTADO_PUBLICACION[publicacion.estadoPublicacion]}
                  </Badge>
                </div>

                <AccionesDePublicacion
                  publicacionId={publicacion.id}
                  estado={publicacion.estadoPublicacion}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
