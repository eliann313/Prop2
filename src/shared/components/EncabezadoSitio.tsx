import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { BotonCerrarSesion } from "@/features/auth/components/BotonCerrarSesion";
import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import { Button } from "@/shared/components/ui/button";

/**
 * Encabezado del layout público. Es un componente de servidor async: lee la sesión
 * directamente, sin necesidad de un provider de contexto ni de un fetch desde el cliente.
 */
export async function EncabezadoSitio() {
  const usuario = await obtenerUsuarioActual();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={RUTAS.home} className="font-semibold">
          ProyectoInmuebles
        </Link>

        <div className="flex items-center gap-2">
          {usuario ? (
            <>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {usuario.email}
              </span>
              {/* Visible para cualquier sesión: el dashboard es donde un comprador crea su
                  primera publicación y se convierte en vendedor (3.4). */}
              <Button asChild variant="ghost" size="sm">
                <Link href={RUTAS.dashboard}>Mis publicaciones</Link>
              </Button>
              {usuario.rol === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={RUTAS.admin}>Admin</Link>
                </Button>
              )}
              <BotonCerrarSesion />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={RUTAS.login}>Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={RUTAS.registro}>Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
