import Link from "next/link";

import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { Button } from "@/shared/components/ui/button";
import { RUTAS } from "@/shared/rutas";

/**
 * Home. Placeholder deliberado: el listado y la búsqueda son Etapa 3, y adelantarlos acá
 * sería trabajo que hay que rehacer cuando exista el modelo de búsqueda real.
 */
export default async function PaginaHome() {
  const usuario = await obtenerUsuarioActual();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Publicá tu inmueble sin intermediarios
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Propietarios que publican directo, compradores e inquilinos que contactan sin
          comisiones en el medio.
        </p>
        <div className="flex flex-wrap gap-3">
          {/* Ofrecerle "Crear cuenta" a alguien que ya inició sesión es ruido: con sesión
              activa, el llamado a la acción es ir a publicar. */}
          {usuario ? (
            <Button asChild>
              <Link href={RUTAS.dashboard}>Ir a mis publicaciones</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href={RUTAS.registro}>Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={RUTAS.login}>Iniciar sesión</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="border-t pt-6">
        <h2 className="text-muted-foreground text-sm font-medium">Estado del proyecto</h2>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Etapas 0 y 1 completas: infraestructura, modelo de datos y autenticación. El
          alta y la búsqueda de publicaciones llegan en las etapas 2 y 3.
        </p>
      </section>
    </div>
  );
}
