import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import {
  ESTADOS_CONSULTA,
  ETIQUETAS_ESTADO_CONSULTA,
  ETIQUETAS_ESTADO_CONSULTA_PLURAL,
  parsearParametrosDeConsultas,
} from "@/features/contacto/consultasSchemas";
import { EstadoConsultaControl } from "@/features/contacto/components/EstadoConsultaControl";
import {
  contarMensajesPorEstadoDelVendedor,
  listarMensajesDelVendedor,
  listarPublicacionesConConsultasDelVendedor,
} from "@/features/contacto/mensajeContactoRepository";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { RUTAS } from "@/shared/rutas";
import { formatearFecha } from "@/shared/utils/formato";
import { rutaDePublicacion } from "@/shared/utils/slug";
import { construirQuery } from "@/features/busqueda/services/urlDeBusqueda";

export const metadata: Metadata = { title: "Consultas recibidas" };

const MENSAJES_POR_PAGINA = 10;

export default async function PaginaMensajes(props: PageProps<"/dashboard/mensajes">) {
  const usuario = await requerirUsuario(`${RUTAS.dashboard}/mensajes`);
  const searchParams = await props.searchParams;
  const parametros = parsearParametrosDeConsultas(searchParams);

  // El WHERE del repositorio fija el dueño autenticado y aplica ahí mismo el filtro opcional.
  const [pagina, publicaciones, gruposPorEstado] = await Promise.all([
    listarMensajesDelVendedor(usuario.id, parametros),
    listarPublicacionesConConsultasDelVendedor(usuario.id),
    contarMensajesPorEstadoDelVendedor(usuario.id, parametros.publicacionId),
  ]);
  const conteos = Object.fromEntries(
    ESTADOS_CONSULTA.map((estado) => [estado, 0]),
  ) as Record<(typeof ESTADOS_CONSULTA)[number], number>;
  for (const grupo of gruposPorEstado) conteos[grupo.estado] = grupo._count._all;
  const totalDePaginas = Math.max(1, Math.ceil(pagina.total / MENSAJES_POR_PAGINA));
  const queryActual = {
    ...(parametros.publicacionId ? { publicacionId: parametros.publicacionId } : {}),
    ...(parametros.estado ? { estado: parametros.estado } : {}),
  };

  if (pagina.total > 0 && parametros.pagina > totalDePaginas) {
    redirect(
      `${RUTAS.dashboard}/mensajes${construirQuery(queryActual, {
        pagina: String(totalDePaginas),
      })}`,
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Consultas recibidas</h1>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {pagina.total} {pagina.total === 1 ? "consulta" : "consultas"}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2" aria-label="Consultas por estado">
          {ESTADOS_CONSULTA.map((estado) => (
            <div key={estado} className="rounded-lg border border-[#e9e4e0] bg-white p-3">
              <dt className="text-muted-foreground text-xs sm:text-sm">
                {ETIQUETAS_ESTADO_CONSULTA_PLURAL[estado]}
              </dt>
              <dd className="mt-1 text-xl font-semibold text-[#5a1b48]">
                {conteos[estado]}
              </dd>
            </div>
          ))}
        </dl>

        <form
          method="GET"
          action={`${RUTAS.dashboard}/mensajes`}
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto_auto] sm:items-end"
        >
          <div className="grid gap-2">
            <Label htmlFor="publicacionId">Filtrar por publicación</Label>
            <select
              id="publicacionId"
              name="publicacionId"
              defaultValue={parametros.publicacionId ?? ""}
              className="border-input bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-2"
            >
              <option value="">Todas mis publicaciones</option>
              {publicaciones.map((publicacion) => (
                <option key={publicacion.id} value={publicacion.id}>
                  {publicacion.titulo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              name="estado"
              defaultValue={parametros.estado ?? ""}
              className="border-input bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-2"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_CONSULTA.map((estado) => (
                <option key={estado} value={estado}>
                  {ETIQUETAS_ESTADO_CONSULTA[estado]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="min-h-11">
            Filtrar
          </Button>
          {parametros.publicacionId || parametros.estado ? (
            <Button asChild type="button" variant="outline" className="min-h-11">
              <Link href={`${RUTAS.dashboard}/mensajes`}>Quitar filtro</Link>
            </Button>
          ) : null}
        </form>
      </div>

      {pagina.resultados.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {parametros.estado
              ? `No hay consultas con estado ${ETIQUETAS_ESTADO_CONSULTA[parametros.estado].toLowerCase()} para este filtro.`
              : parametros.publicacionId
                ? "Esta publicación todavía no recibió consultas."
                : "Todavía no recibiste consultas por tus publicaciones."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pagina.resultados.map((mensaje) => (
            <Card key={mensaje.id}>
              <CardHeader className="gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <CardTitle className="text-base">{mensaje.nombreContacto}</CardTitle>
                  <span className="text-muted-foreground text-xs">
                    {formatearFecha(mensaje.createdAt)}
                  </span>
                </div>
                <Link
                  href={`${RUTAS.publicaciones}/${rutaDePublicacion(mensaje.publicacion.id, mensaje.publicacion.titulo)}`}
                  className="text-muted-foreground text-sm underline underline-offset-4"
                >
                  {mensaje.publicacion.titulo}
                </Link>
              </CardHeader>

              <CardContent className="grid gap-3">
                <p className="text-sm whitespace-pre-line">{mensaje.mensaje}</p>

                <EstadoConsultaControl
                  mensajeId={mensaje.id}
                  nombreContacto={mensaje.nombreContacto}
                  estado={mensaje.estado}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    {/* Responder es un mailto y no un hilo dentro de la app: la conversación
                        real pasa por email o WhatsApp, y construir una mensajería propia para
                        V1 sería una feature entera que 6.6 no pide. */}
                    <a
                      href={`mailto:${mensaje.emailContacto}?subject=${encodeURIComponent(`Re: ${mensaje.publicacion.titulo}`)}`}
                    >
                      Responder por email
                    </a>
                  </Button>
                  {mensaje.telefonoContacto ? (
                    <span className="text-muted-foreground text-sm">
                      {mensaje.telefonoContacto}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagina.total > MENSAJES_POR_PAGINA ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3"
          aria-label="Paginación de consultas"
        >
          <Button asChild variant="outline" disabled={parametros.pagina <= 1}>
            <Link
              href={`${RUTAS.dashboard}/mensajes${construirQuery(queryActual, {
                pagina: String(parametros.pagina - 1),
              })}`}
              aria-disabled={parametros.pagina <= 1}
              tabIndex={parametros.pagina <= 1 ? -1 : undefined}
              className={
                parametros.pagina <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            >
              Anterior
            </Link>
          </Button>
          <p className="text-muted-foreground text-sm">
            Página {parametros.pagina} de {totalDePaginas}
          </p>
          <Button
            asChild
            variant="outline"
            disabled={parametros.pagina >= totalDePaginas}
          >
            <Link
              href={`${RUTAS.dashboard}/mensajes${construirQuery(queryActual, {
                pagina: String(parametros.pagina + 1),
              })}`}
              aria-disabled={parametros.pagina >= totalDePaginas}
              tabIndex={parametros.pagina >= totalDePaginas ? -1 : undefined}
              className={
                parametros.pagina >= totalDePaginas
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            >
              Siguiente
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
