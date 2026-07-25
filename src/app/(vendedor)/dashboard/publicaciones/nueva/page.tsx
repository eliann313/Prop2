import type { Metadata } from "next";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { FormularioPublicacion } from "@/features/publicaciones/components/FormularioPublicacion";
import { listarCaracteristicas } from "@/features/publicaciones/publicacionRepository";
import { subidaDeImagenesHabilitada } from "@/shared/lib/serverEnv";

export const metadata: Metadata = { title: "Publicar un inmueble" };

export default async function PaginaNuevaPublicacion() {
  await requerirUsuario("/dashboard/publicaciones/nueva");
  const caracteristicas = await listarCaracteristicas();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publicar un inmueble</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Se guarda como borrador. Lo publicás cuando esté listo.
        </p>
      </div>

      <FormularioPublicacion
        caracteristicas={caracteristicas}
        subidaDeImagenesDisponible={subidaDeImagenesHabilitada}
      />
    </div>
  );
}
