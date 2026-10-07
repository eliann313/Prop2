"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { actualizarPerfil } from "@/features/usuarios/actions/actualizarPerfil";
import {
  schemaPerfilUsuario,
  type DatosPerfilUsuario,
  type EntradaPerfilUsuario,
} from "@/features/usuarios/usuarioSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

type Props = {
  nombre: string;
  telefono: string | null;
  email: string;
};

export function FormularioPerfil({ nombre, telefono, email }: Props) {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const [guardando, iniciarGuardado] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaPerfilUsuario, unknown, DatosPerfilUsuario>({
    resolver: zodResolver(schemaPerfilUsuario),
    mode: "onTouched",
    defaultValues: { nombre, telefono: telefono ?? "" },
  });

  function onSubmit(datos: DatosPerfilUsuario) {
    iniciarGuardado(async () => {
      // Zod transforma el input vacío a null; la Server Action vuelve a validar el valor de
      // entrada del formulario, que espera un string vacío para borrar el teléfono.
      const respuesta = await actualizarPerfil({
        nombre: datos.nombre,
        telefono: datos.telefono ?? "",
      });
      setResultado(respuesta);
      if (respuesta.ok) router.refresh();
    });
  }

  return (
    <Card className="border-primary/15">
      <CardHeader>
        <CardTitle>Datos de contacto</CardTitle>
        <CardDescription>
          El teléfono será visible como contacto en tus publicaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
          <AvisoDeAccion resultado={resultado} />

          <CampoTexto
            etiqueta="Nombre"
            autoComplete="name"
            maxLength={80}
            error={errors.nombre?.message}
            {...register("nombre")}
          />

          <CampoTexto
            etiqueta="Teléfono para contacto (opcional)"
            type="tel"
            autoComplete="tel"
            placeholder="+54 9 11 2345-6789"
            maxLength={40}
            error={errors.telefono?.message}
            ayuda="Usá + y el código del país. Móvil argentino: +54 9 11 2345-6789; fijo: +54 11 2345-6789."
            {...register("telefono")}
          />

          <div className="grid gap-2">
            <label htmlFor="email-perfil" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email-perfil"
              type="email"
              value={email}
              readOnly
              className="border-input bg-muted text-muted-foreground h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-sm"
            />
            <p className="text-muted-foreground text-sm">
              Es la dirección con la que iniciás sesión.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              El teléfono guardado se usa para el enlace de WhatsApp de tus publicaciones.
            </p>
            <Button type="submit" disabled={guardando} className="w-full sm:w-auto">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
