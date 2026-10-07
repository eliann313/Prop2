"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Inbox, UserRound } from "lucide-react";

import { RUTAS } from "@/shared/rutas";
import { cn } from "@/shared/utils/cn";

const enlaces = [
  { href: RUTAS.dashboard, etiqueta: "Mis publicaciones", Icono: Building2 },
  { href: RUTAS.mensajes, etiqueta: "Consultas recibidas", Icono: Inbox },
  { href: RUTAS.perfil, etiqueta: "Mi perfil", Icono: UserRound },
];

export function NavegacionDashboard() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mi cuenta" className="mb-8 flex flex-wrap gap-2 border-b pb-4">
      {enlaces.map(({ href, etiqueta, Icono }) => {
        const activo =
          href === RUTAS.dashboard
            ? pathname === href || pathname.startsWith(`${href}/publicaciones/`)
            : pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd9a55]",
              activo ? "bg-[#581845] text-white" : "text-[#581845] hover:bg-[#581845]/10",
            )}
          >
            <Icono aria-hidden="true" className="size-4 shrink-0" />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
