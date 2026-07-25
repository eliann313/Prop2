import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { RUTAS } from "@/shared/rutas";

/**
 * 404 de toda la app. Cubre tanto una URL que no existe como los `notFound()` explícitos —
 * por ejemplo al editar una publicación que no es tuya (ver la página de edición).
 *
 * No lleva el encabezado del sitio a propósito: los layouts de los route groups no envuelven
 * a este archivo, así que renderizarlo acá significaría duplicar la navegación.
 */
export default function NoEncontrada() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="grid max-w-md gap-4 text-center">
        <p className="text-muted-foreground text-sm font-medium">Error 404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          No encontramos esta página
        </h1>
        <p className="text-muted-foreground">
          Puede que el inmueble ya no esté publicado, o que el link esté mal escrito.
        </p>
        <div className="mt-2 flex justify-center gap-3">
          <Button asChild>
            <Link href={RUTAS.home}>Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={RUTAS.dashboard}>Mis publicaciones</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
