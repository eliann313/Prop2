import type { Metadata } from "next";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Mis publicaciones" };

/**
 * El dashboard todavía no lista publicaciones: el CRUD es Etapa 2. Existe en la Etapa 1 porque
 * es la pantalla contra la que se verifica el criterio de finalización — que un usuario pueda
 * registrarse, verificar, entrar y llegar a una ruta protegida.
 *
 * Se exige sesión pero NO rol vendedor: todo usuario arranca como comprador y pasa a vendedor
 * al crear su primera publicación (3.4). Si esta página pidiera rol vendedor, un usuario recién
 * registrado no podría entrar a crear la publicación que justamente le daría ese rol.
 */
export default async function PaginaDashboard() {
  const usuario = await requerirUsuario("/dashboard");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis publicaciones</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sesión activa como {usuario.email} · rol {usuario.rol}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todavía no hay publicaciones</CardTitle>
          <CardDescription>
            El alta y la edición de inmuebles llegan en la Etapa 2 del roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Cuando publiques tu primer inmueble, tu rol pasa automáticamente de comprador a
          vendedor.
        </CardContent>
      </Card>
    </div>
  );
}
