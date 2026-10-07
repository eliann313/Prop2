import { Mail, Phone, Search } from "lucide-react";
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
      {/* ─── BARRA SUPERIOR BORDEAUX DE CONTACTO ───────────────────────── */}
      <div className="bg-bordeaux px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="hover:text-mustard flex items-center gap-1.5 transition-colors">
              <Phone className="text-mustard h-3.5 w-3.5" />
              <a href="tel:+541140000000">+54 11 4000 0000</a>
            </span>
            <span className="hover:text-mustard hidden items-center gap-1.5 transition-colors sm:flex">
              <Mail className="text-mustard h-3.5 w-3.5" />
              <a href="mailto:hola@prop2.com.ar">hola@prop2.com.ar</a>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-mustard transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-mustard transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ─── NAVBAR PRINCIPAL BLANCO ────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
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

            <select name="operacion" className={CLASES_SELECT_NAV} aria-label="Operación">
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

            <select name="provincia" className={CLASES_SELECT_NAV} aria-label="Provincia">
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
          <div className="flex items-center gap-2">
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
                  className="text-bordeaux hover:bg-bordeaux/10 hidden font-medium sm:inline-flex"
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
