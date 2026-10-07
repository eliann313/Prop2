import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { RUTAS } from "@/shared/rutas";
import { BotonCerrarSesion } from "@/features/auth/components/BotonCerrarSesion";
import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import {
  ETIQUETAS_TIPO_INMUEBLE,
  PROVINCIAS,
  TIPOS_INMUEBLE,
} from "@/shared/catalogoInmuebles";
import { Button } from "@/shared/components/ui/button";

const CLASES_SELECT_NAV =
  "bg-transparent border-0 text-xs text-foreground focus:ring-0 outline-none cursor-pointer py-1 px-2";

/**
 * Encabezado del layout público replicando exactamente la barra de navegación del diseño solicitado.
 */
export async function EncabezadoSitio() {
  const usuario = await obtenerUsuarioActual();

  return (
    <header className="w-full">
      {/* ─── BARRA SUPERIOR BORDEAUX DE MARCA ──────────────────────────── */}
      <div className="bg-bordeaux px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="m-0">
            <span className="text-mustard font-semibold">Prop²</span>
            <span className="hidden sm:inline"> · Bienes raíces sin intermediarios</span>
          </p>
          <Link
            href={RUTAS.publicaciones}
            className="hover:text-mustard inline-flex shrink-0 items-center gap-1 font-medium transition-colors"
          >
            Explorar propiedades
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── NAVBAR PRINCIPAL BLANCO ────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          {/* Logo claro: el navbar tiene fondo blanco y el SVG conserva su proporción 10:3. */}
          <Link href={RUTAS.home} className="flex shrink-0 items-center">
            <Image
              src="/images/prop2-logo-v2-light.svg"
              alt="Prop2"
              width={150}
              height={45}
              priority
              className="h-auto w-[120px] sm:w-[165px]"
            />
          </Link>

          {/* Buscador Integrado en la barra superior (form GET) */}
          <form
            method="GET"
            action={RUTAS.publicaciones}
            className="hidden items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs shadow-xs lg:flex"
          >
            <div className="flex items-center pl-2.5">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </div>

            <select
              name="operacion"
              className={CLASES_SELECT_NAV}
              aria-label="Buscar por operación"
            >
              <option value="">Venta y alquiler</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>

            <div className="h-4 w-[1px] bg-gray-200" />

            {/* Se utiliza "Buscar por tipo de inmueble" en el aria-label para describir con precisión que es un filtro
                de búsqueda y evitar colisiones de accesibilidad con el campo "Tipo de inmueble" del formulario de
                publicación (PasoBasicos.tsx), lo que causaba ambigüedad para lectores de pantalla y en tests E2E. */}
            <select
              name="tipo"
              className={CLASES_SELECT_NAV}
              aria-label="Buscar por tipo de inmueble"
            >
              <option value="">Cualquier tipo</option>
              {TIPOS_INMUEBLE.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_INMUEBLE[tipo]}
                </option>
              ))}
            </select>

            <div className="h-4 w-[1px] bg-gray-200" />

            <select
              name="provincia"
              className={CLASES_SELECT_NAV}
              aria-label="Buscar por provincia"
            >
              <option value="">Todas las provincias</option>
              {PROVINCIAS.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            <Button
              type="submit"
              size="sm"
              className="bg-bordeaux hover:bg-bordeaux/90 ml-1 flex h-8 items-center gap-1 rounded-lg px-3.5 py-1 text-xs font-medium text-white shadow-xs"
            >
              <Search className="h-3 w-3 text-white" />
              Buscar
            </Button>
          </form>

          {/* Acciones de Usuario / Botones Auth */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-bordeaux hover:bg-bordeaux/10 gap-1.5 lg:hidden"
            >
              <Link href={RUTAS.publicaciones} aria-label="Buscar publicaciones">
                <Search aria-hidden="true" />
                <span>Buscar</span>
              </Link>
            </Button>
            {usuario ? (
              <>
                <span className="text-muted-foreground hidden text-xs sm:inline">
                  {usuario.email}
                </span>
                <Button asChild variant="ghost" size="sm" className="text-bordeaux">
                  <Link href={RUTAS.favoritos}>Favoritos</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-bordeaux">
                  <Link href={RUTAS.dashboard}>Mis publicaciones</Link>
                </Button>
                {usuario.rol === "admin" && (
                  <Button asChild variant="ghost" size="sm" className="text-bordeaux">
                    <Link href={RUTAS.admin}>Admin</Link>
                  </Button>
                )}
                <BotonCerrarSesion />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-bordeaux hover:bg-bordeaux/10 font-medium"
                >
                  <Link href={RUTAS.login}>Iniciar sesión</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-bordeaux hover:bg-bordeaux/90 rounded-lg px-5 py-2 font-medium text-white shadow-sm"
                >
                  <Link href={RUTAS.registro}>Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
