import type { Metadata } from "next";
import Link from "next/link";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { PublicacionCard } from "@/features/publicaciones/components/PublicacionCard";
import { listarPublicacionesDelUsuario } from "@/features/publicaciones/publicacionRepository";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Mis publicaciones" };

/**
 * Se exige sesión pero NO rol vendedor: todo usuario arranca como comprador y pasa a vendedor
 * al crear su primera publicación (3.4). Pedir el rol acá dejaría al recién registrado sin
 * poder entrar a crear justamente la publicación que se lo otorga.
 */
export default async function PaginaDashboard() {
  const usuario = await requerirUsuario("/dashboard");
  const publicaciones = await listarPublicacionesDelUsuario(usuario.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis publicaciones</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {usuario.email} · rol {usuario.rol}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/publicaciones/nueva">Publicar un inmueble</Link>
        </Button>
      </div>

      {publicaciones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Todavía no publicaste nada</CardTitle>
            <CardDescription>
              Cuando publiques tu primer inmueble, tu rol pasa automáticamente de
              comprador a vendedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/publicaciones/nueva">
                Crear mi primera publicación
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {publicaciones.map((publicacion) => (
            <PublicacionCard key={publicacion.id} publicacion={publicacion} />
          ))}
        </div>
      )}
    </div>
  );
}
