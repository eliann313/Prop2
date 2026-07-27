import type { Metadata } from "next";
import Link from "next/link";

import {
  contarPorEstado,
  contarUsuariosBaneados,
} from "@/features/admin/adminRepository";
import { requerirRol } from "@/features/auth/sessionQueries";
import { ETIQUETAS_ESTADO_PUBLICACION } from "@/shared/catalogoInmuebles";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Administración" };

/**
 * Panel de moderación (6.7).
 *
 * No hay flujo de UI para volverse admin: se cambia el rol a mano en la base. Es a propósito —
 * un endpoint de "hacerme admin" es exactamente el tipo de escalada de privilegios que no
 * debería existir.
 */
export default async function PaginaAdmin() {
  const usuario = await requerirRol("admin");

  const [porEstado, baneados] = await Promise.all([
    contarPorEstado(),
    contarUsuariosBaneados(),
  ]);

  const conteo = new Map(
    porEstado.map((fila) => [fila.estadoPublicacion, fila._count._all]),
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sesión activa como {usuario.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publicaciones</CardTitle>
            <CardDescription>
              Pausar, reactivar o dar de baja cualquier publicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {(["activa", "pausada", "borrador", "eliminada"] as const).map((estado) => (
                <div key={estado} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">
                    {ETIQUETAS_ESTADO_PUBLICACION[estado]}
                  </dt>
                  <dd className="font-medium">{conteo.get(estado) ?? 0}</dd>
                </div>
              ))}
            </dl>
            <div>
              <Button asChild size="sm">
                <Link href="/admin/publicaciones">Moderar publicaciones</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Banear bloquea el login sin borrar publicaciones ni mensajes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Baneados: </span>
              <span className="font-medium">{baneados}</span>
            </p>
            <div>
              <Button asChild size="sm">
                <Link href="/admin/usuarios">Gestionar usuarios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        La bandeja de publicaciones reportadas es V1.1: en V1 la moderación es proactiva
        (6.7). Para dar de alta otro admin, cambiá el campo <code>rol</code> a{" "}
        <code>admin</code> con <code>npm run db:studio</code>.
      </p>
    </div>
  );
}
