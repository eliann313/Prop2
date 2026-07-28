import type { Metadata } from "next";
import Link from "next/link";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { listarMensajesDelVendedor } from "@/features/contacto/mensajeContactoRepository";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";
import { formatearFecha } from "@/shared/utils/formato";
import { rutaDePublicacion } from "@/shared/utils/slug";

export const metadata: Metadata = { title: "Consultas recibidas" };

export default async function PaginaMensajes() {
  const usuario = await requerirUsuario(`${RUTAS.dashboard}/mensajes`);
  // El filtro por dueño va en el WHERE del repositorio (`publicacion: { usuarioId }`), no acá:
  // así no existe la posibilidad de que una consulta ajena llegue a esta página.
  const mensajes = await listarMensajesDelVendedor(usuario.id);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Consultas recibidas</h1>

      {mensajes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Todavía no recibiste consultas por tus publicaciones.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {mensajes.map((mensaje) => (
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
    </div>
  );
}
