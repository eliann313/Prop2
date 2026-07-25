import type { Metadata } from "next";

import { requerirRol } from "@/features/auth/sessionQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Administración" };

/**
 * Panel de admin. La moderación de publicaciones y la gestión de usuarios son Etapa 4; esta
 * página existe en la Etapa 1 para verificar que el filtro por rol funciona de punta a punta.
 *
 * No hay flujo de UI para volverse admin: se cambia el rol a mano en la base. Es a propósito —
 * un endpoint de "hacerme admin" es exactamente el tipo de escalada de privilegios que no
 * debería existir.
 */
export default async function PaginaAdmin() {
  const usuario = await requerirRol("admin");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sesión activa como {usuario.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderación y usuarios</CardTitle>
          <CardDescription>
            La moderación de publicaciones y la gestión de usuarios llegan en la Etapa 4.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Para dar de alta un admin, cambiá el campo <code>rol</code> del usuario a{" "}
          <code>admin</code> con <code>npm run db:studio</code>.
        </CardContent>
      </Card>
    </div>
  );
}
