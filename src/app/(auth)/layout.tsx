import Link from "next/link";

import { RUTAS } from "@/shared/rutas";

/**
 * Layout de las pantallas de auth: centrado, sin la navegación completa del sitio (4.3).
 * Quitar el navbar acá es deliberado — en un formulario de login o registro, cada link extra
 * es una oportunidad de abandonar el flujo.
 */
export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href={RUTAS.home}
          className="text-muted-foreground mb-8 block text-center text-sm"
        >
          ProyectoInmuebles
        </Link>
        {children}
      </div>
    </main>
  );
}
