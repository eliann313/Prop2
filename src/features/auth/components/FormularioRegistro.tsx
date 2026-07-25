"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { registrarUsuario } from "@/features/auth/actions/registrarUsuario";
import { schemaRegistro, type DatosRegistro } from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/features/auth/components/AvisoDeAccion";
import { CampoTexto } from "@/features/auth/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

export function FormularioRegistro() {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  // useTransition y no un useState de "cargando": mantiene el botón deshabilitado durante toda
  // la transición, incluido el re-render que la action provoca al terminar.
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DatosRegistro>({
    // El mismo schema que revalida la action en el servidor (14.3).
    resolver: zodResolver(schemaRegistro),
  });

  function onSubmit(datos: DatosRegistro) {
    iniciarEnvio(async () => {
      const respuesta = await registrarUsuario(datos);
      setResultado(respuesta);
      // Solo se limpia si salió bien: ante un error, rehacer el formulario entero es peor que
      // corregir el campo que falló.
      if (respuesta.ok) reset();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <CampoTexto
        etiqueta="Nombre"
        autoComplete="name"
        error={errors.nombre?.message}
        {...register("nombre")}
      />
      <CampoTexto
        etiqueta="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        // "new-password" y no "current-password": es lo que hace que el gestor de contraseñas
        // ofrezca generar una, en vez de autocompletar una vieja.
        autoComplete="new-password"
        error={errors.password?.message}
        ayuda="Al menos 10 caracteres, con una letra y un número."
        {...register("password")}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
