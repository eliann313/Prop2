import type { Metadata } from "next";
import Link from "next/link";

import { listarUsuarios } from "@/features/admin/adminRepository";
import { AccionDeUsuario } from "@/features/admin/components/AccionesDeModeracion";
import { requerirRol } from "@/features/auth/sessionQueries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { RUTAS } from "@/shared/rutas";
import { formatearFecha } from "@/shared/utils/formato";

export const metadata: Metadata = { title: "Usuarios" };

export default async function PaginaUsuarios(props: PageProps<"/admin/usuarios">) {
  const admin = await requerirRol("admin");

  const { q } = await props.searchParams;
  const busqueda = typeof q === "string" && q.trim() !== "" ? q.trim() : undefined;
  const usuarios = await listarUsuarios(busqueda);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <Link href={RUTAS.admin} className="text-sm underline underline-offset-4">
          ← Panel
        </Link>
      </div>

      <form method="GET" action="/admin/usuarios" className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="Buscar por email o nombre"
          defaultValue={busqueda ?? ""}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {usuarios.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No hay usuarios que coincidan.
        </p>
      ) : (
        <div className="grid gap-3">
          {usuarios.map((usuario) => (
            <Card key={usuario.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{usuario.name ?? "Sin nombre"}</span>
                    <Badge variant="outline">{usuario.rol}</Badge>
                    {usuario.estado === "baneado" ? (
                      <Badge variant="destructive">Baneado</Badge>
                    ) : null}
                    {/* Sin verificar significa que nunca confirmó el email: es información
                        útil al moderar, porque una cuenta así puede ser descartable. */}
                    {usuario.emailVerified === null ? (
                      <Badge variant="secondary">Sin verificar</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {usuario.email} · {usuario._count.publicaciones} publicaciones · alta{" "}
                    {formatearFecha(usuario.createdAt)}
                  </p>
                </div>

                <AccionDeUsuario
                  usuarioId={usuario.id}
                  estado={usuario.estado}
                  esUnoMismo={usuario.id === admin.id}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
