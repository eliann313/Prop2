import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Handshake,
  MapPin,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { HeroSlider } from "@/shared/components/HeroSlider";

import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { buscarPublicaciones } from "@/features/busqueda/publicacionBusquedaRepository";
import { construirCriterios } from "@/features/busqueda/services/criteriosDeBusqueda";
import { obtenerUsuarioActual } from "@/features/auth/sessionQueries";
import {
  TarjetaDePublicacion,
  type PublicacionEnTarjeta,
} from "@/shared/components/TarjetaDePublicacion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { obtenerCotizacion } from "@/shared/lib/cotizacionDolar";
import { RUTAS } from "@/shared/rutas";

const ZONAS_DESTACADAS = [
  {
    nombre: "Palermo",
    descripcion:
      "Monoambientes y departamentos de categoría cerca de áreas verdes y gastronomía.",
    query: "Palermo",
  },
  {
    nombre: "Recoleta",
    descripcion:
      "Arquitectura clásica de estilo francés, pisos amplios y excelente ubicación.",
    query: "Recoleta",
  },
  {
    nombre: "Belgrano",
    descripcion: "Casas residenciales, PHs con terraza y torres modernas con amenities.",
    query: "Belgrano",
  },
  {
    nombre: "Puerto Madero",
    descripcion:
      "Vistas panorámicas al río, máxima seguridad y emprendimientos exclusivos.",
    query: "Puerto Madero",
  },
  {
    nombre: "Rosario",
    descripcion:
      "Oportunidades frente al Paraná y desarrollo urbano en constante crecimiento.",
    query: "Rosario",
  },
  {
    nombre: "Córdoba",
    descripcion: "Inmuebles en centros universitarios y residenciales en las sierras.",
    query: "Córdoba",
  },
];

export default async function PaginaHome() {
  const criteriosGenerales = {
    ...construirCriterios(parsearFiltros({})),
    limite: 6,
  };

  const criteriosAlquiler = {
    ...construirCriterios(parsearFiltros({ operacion: "alquiler" })),
    limite: 3,
  };

  const [usuario, ultimas, alquileres, cotizacion] = await Promise.all([
    obtenerUsuarioActual(),
    buscarPublicaciones(criteriosGenerales),
    buscarPublicaciones(criteriosAlquiler),
    obtenerCotizacion(),
  ]);

  const publicacionesDemo: PublicacionEnTarjeta[] = [
    {
      id: "demo-1",
      titulo: "Departamento amplio con balcón en Palermo",
      precio: 135000,
      moneda: "USD",
      operacion: "venta",
      tipoInmueble: "departamento",
      provincia: "Buenos Aires",
      ciudad: "CABA",
      barrio: "Palermo",
      ambientes: 3,
      dormitorios: 2,
      banios: 2,
      superficieCubierta: 82,
      imagenUrl: "/hero-bg.jpg",
      imagenThumbnail: "/hero-bg.jpg",
    },
    {
      id: "demo-2",
      titulo: "Casa moderna con patio y jardín",
      precio: 210000,
      moneda: "USD",
      operacion: "venta",
      tipoInmueble: "casa",
      provincia: "Buenos Aires",
      ciudad: "Belgrano",
      barrio: "Belgrano",
      ambientes: 4,
      dormitorios: 3,
      banios: 2,
      superficieCubierta: 145,
      imagenUrl: "/images/casa-belgrano.jpg",
      imagenThumbnail: "/images/casa-belgrano.jpg",
    },
    {
      id: "demo-3",
      titulo: "Monoambiente luminoso en Recoleta",
      precio: 95000,
      moneda: "USD",
      operacion: "alquiler",
      tipoInmueble: "departamento",
      provincia: "Buenos Aires",
      ciudad: "CABA",
      barrio: "Recoleta",
      ambientes: 1,
      dormitorios: 1,
      banios: 1,
      superficieCubierta: 42,
      imagenUrl: "/images/mendoza.jpg",
      imagenThumbnail: "/images/mendoza.jpg",
    },
    {
      id: "demo-4",
      titulo: "PH con terraza y vista panorámica",
      precio: 280000,
      moneda: "USD",
      operacion: "venta",
      tipoInmueble: "ph",
      provincia: "Buenos Aires",
      ciudad: "CABA",
      barrio: "Villa Crespo",
      ambientes: 4,
      dormitorios: 3,
      banios: 2,
      superficieCubierta: 120,
      imagenUrl: "/hero-bg.jpg",
      imagenThumbnail: "/hero-bg.jpg",
    },
    {
      id: "demo-5",
      titulo: "Departamento con cochera en Nordelta",
      precio: 175000,
      moneda: "USD",
      operacion: "venta",
      tipoInmueble: "departamento",
      provincia: "Buenos Aires",
      ciudad: "Nordelta",
      barrio: "Nordelta",
      ambientes: 3,
      dormitorios: 2,
      banios: 2,
      superficieCubierta: 96,
      imagenUrl: "/images/casa-belgrano.jpg",
      imagenThumbnail: "/images/casa-belgrano.jpg",
    },
    {
      id: "demo-6",
      titulo: "Alquiler familiar en zona tranquila",
      precio: 110000,
      moneda: "ARS",
      operacion: "alquiler",
      tipoInmueble: "casa",
      provincia: "Buenos Aires",
      ciudad: "La Plata",
      barrio: "City Bell",
      ambientes: 4,
      dormitorios: 3,
      banios: 2,
      superficieCubierta: 130,
      imagenUrl: "/images/mendoza.jpg",
      imagenThumbnail: "/images/mendoza.jpg",
    },
  ];

  const publicacionesAMostrar =
    ultimas.resultados.length >= 6
      ? ultimas.resultados.slice(0, 6)
      : [...ultimas.resultados, ...publicacionesDemo].slice(0, 6);

  return (
    <div className="w-full">
      {/* ─── 1. HERO SECTION FULL BLEED (REPLICADO DE LA CAPTURA DEL USUARIO) ── */}
      <section className="relative flex min-h-[560px] w-full items-center overflow-hidden sm:min-h-[640px] md:min-h-[700px]">
        {/* Slider de fondo con crossfade automático entre 3 imágenes */}
        <HeroSlider />

        {/* Contenido sobrepuesto alineado a la izquierda */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-16 sm:px-12 md:py-24">
          <div className="max-w-[540px] text-left">
            {/* Eyebrow chico en amarillo mostaza */}
            <div className="mb-4 flex items-center gap-2">
              <span className="bg-mustard inline-block h-[2px] w-6" />
              <span className="text-mustard text-xs font-semibold tracking-widest uppercase sm:text-sm">
                PROP² — INMUEBLES EN ARGENTINA
              </span>
            </div>

            {/* Título serif grande con la tipografía de lujo refinada */}
            <h1 className="font-serif text-4xl leading-[1.1] font-light tracking-wide text-white drop-shadow-md sm:text-6xl sm:font-normal lg:text-7xl">
              Comprá, vendé y alquilá sin intermediarios
            </h1>

            {/* Subtítulo descriptivo */}
            <p className="mt-4 text-base leading-relaxed font-light text-gray-100 drop-shadow-sm sm:text-lg">
              Los propietarios publican directo y vos contactás sin comisiones en el
              medio.
            </p>

            {/* DOS BOTONES EN COLOR BORDEAUX */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-bordeaux hover:bg-bordeaux/90 border-mustard/30 rounded-lg border px-7 py-3.5 font-medium text-white shadow-lg transition-all hover:scale-[1.02]"
              >
                <Link href={`${RUTAS.publicaciones}?operacion=venta`}>
                  Propiedades en venta
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-bordeaux/50 rounded-lg border-2 border-white px-7 py-3.5 font-medium text-white backdrop-blur-xs transition-all hover:scale-[1.02] hover:bg-white/20"
              >
                <Link href={`${RUTAS.publicaciones}?operacion=alquiler`}>
                  Propiedades en alquiler
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. SECCIONES RESTANTES EN CAJA ESTÁNDAR ────────────────────── */}
      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-12 sm:gap-20 sm:px-6 sm:py-16 lg:px-8">
        {/* ÚLTIMAS PUBLICACIONES */}
        <section className="grid gap-6">
          <div className="border-mustard/30 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-bordeaux text-2xl font-bold tracking-tight sm:text-3xl">
                Últimas publicaciones
              </h2>
              <p className="text-muted-foreground text-sm">
                Propiedades agregadas recientemente directamente por sus dueños
              </p>
            </div>
            <Link
              href={RUTAS.publicaciones}
              className="text-bordeaux hover:text-bordeaux/80 flex items-center text-sm font-semibold"
            >
              Ver catálogo completo <ArrowRight className="text-mustard ml-1 h-4 w-4" />
            </Link>
          </div>

          {publicacionesAMostrar.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicacionesAMostrar.map((publicacion) => (
                <TarjetaDePublicacion
                  key={publicacion.id}
                  publicacion={publicacion}
                  cotizacion={cotizacion}
                />
              ))}
            </div>
          ) : (
            <Card className="border-mustard/40 bg-card flex flex-col items-center justify-center border-dashed p-10 text-center sm:p-14">
              <div className="bg-bordeaux/10 text-bordeaux rounded-full p-4">
                <Building2 className="text-bordeaux h-8 w-8" />
              </div>
              <h3 className="text-bordeaux mt-4 text-lg font-semibold">
                No hay publicaciones activas por el momento
              </h3>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Aún no hay propiedades cargadas en el catálogo. Sé el primero en publicar
                la tuya sin pagar comisiones.
              </p>
              <Button
                asChild
                className="bg-bordeaux border-mustard/30 hover:bg-bordeaux/90 mt-6 border text-white"
              >
                <Link href={usuario ? RUTAS.dashboard : RUTAS.registro}>
                  Publicar propiedad ahora
                </Link>
              </Button>
            </Card>
          )}
        </section>

        {/* BANNER DIFERENCIAL */}
        <section className="bg-bordeaux relative overflow-hidden rounded-3xl p-8 text-white shadow-xl sm:p-12 lg:p-14">
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-3">
              <Badge
                variant="outline"
                className="border-mustard text-mustard bg-bordeaux/50 px-3 py-1 text-xs tracking-wider uppercase"
              >
                Ventaja Prop²
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Publicá gratis, sin comisiones ni intermediarios
              </h2>
              <p className="text-creamy/90 text-sm leading-relaxed sm:text-base">
                A diferencia de las inmobiliarias tradicionales, los interesados te
                contactan directo a vos por WhatsApp o formulario. Ahorrá miles de dólares
                en comisiones de compra y venta.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-mustard text-bordeaux hover:bg-mustard/90 px-8 py-6 text-base font-bold whitespace-nowrap shadow-md"
            >
              <Link href={RUTAS.registro}>
                Crear cuenta gratis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ZONAS DESTACADAS */}
        <section className="grid gap-6">
          <div className="border-mustard/30 border-b pb-4">
            <h2 className="text-bordeaux text-2xl font-bold tracking-tight sm:text-3xl">
              Explorá por zona
            </h2>
            <p className="text-muted-foreground text-sm">
              Encontrá inmuebles en las principales ubicaciones del país
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ZONAS_DESTACADAS.map((zona) => (
              <Link
                key={zona.nombre}
                href={`${RUTAS.publicaciones}?q=${encodeURIComponent(zona.query)}`}
                className="group"
              >
                <Card className="border-mustard/20 bg-card hover:border-mustard h-full border transition-all duration-200 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-bordeaux group-hover:text-bordeaux/90 flex items-center gap-2 text-lg font-bold">
                      <MapPin className="text-mustard h-4 w-4" />
                      {zona.nombre}
                    </CardTitle>
                    <ArrowRight className="text-muted-foreground group-hover:text-mustard h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {zona.descripcion}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* BENEFICIOS / CÓMO FUNCIONA */}
        <section
          id="como-funciona"
          className="border-mustard/30 bg-card rounded-2xl border p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icono: Building2,
                titulo: "1. Publicás vos",
                texto: "Fotos y ubicación exacta en 4 simples pasos.",
              },
              {
                icono: ShieldCheck,
                titulo: "2. Sin comisión",
                texto: "Cero porcentaje de intermediación en la venta.",
              },
              {
                icono: Handshake,
                titulo: "3. Contacto directo",
                texto: "Mensajes por WhatsApp o formulario directo al vendedor.",
              },
              {
                icono: UserPlus,
                titulo: "4. Tu cuenta gratis",
                texto: "Registro instantáneo sin costos ni tarjetas.",
              },
            ].map((item) => (
              <div key={item.titulo} className="flex items-start gap-3">
                <div className="bg-bordeaux/10 text-bordeaux shrink-0 rounded-lg p-2.5">
                  <item.icono className="text-bordeaux h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-bordeaux text-sm font-semibold">{item.titulo}</h3>
                  <p className="text-muted-foreground text-xs leading-snug">
                    {item.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ALQUILERES */}
        <section className="grid gap-6">
          <div className="border-mustard/30 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-bordeaux text-2xl font-bold tracking-tight sm:text-3xl">
                Propiedades en Alquiler
              </h2>
              <p className="text-muted-foreground text-sm">
                Alquilá directamente con los propietarios sin comisiones inmobiliarias
              </p>
            </div>
            <Link
              href={`${RUTAS.publicaciones}?operacion=alquiler`}
              className="text-bordeaux hover:text-bordeaux/80 flex items-center text-sm font-semibold"
            >
              Ver todos los alquileres{" "}
              <ArrowRight className="text-mustard ml-1 h-4 w-4" />
            </Link>
          </div>

          {alquileres.resultados.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {alquileres.resultados.map((publicacion) => (
                <TarjetaDePublicacion
                  key={publicacion.id}
                  publicacion={publicacion}
                  cotizacion={cotizacion}
                />
              ))}
            </div>
          ) : (
            <Card className="border-mustard/40 bg-card flex flex-col items-center justify-center border-dashed p-8 text-center sm:p-10">
              <CheckCircle2 className="text-mustard h-8 w-8" />
              <h3 className="text-bordeaux mt-3 text-base font-semibold">
                No hay alquileres disponibles en este momento
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Revisá más tarde o explorá el catálogo completo de propiedades.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
