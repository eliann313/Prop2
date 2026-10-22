"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { registrarUsuario } from "@/features/auth/actions/registrarUsuario";
import { schemaRegistro } from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

// Schema extendido para el cliente con confirmación de contraseña (validación UX)
const schemaFormularioRegistro = schemaRegistro
  .extend({
    confirmarPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type DatosFormularioRegistro = z.infer<typeof schemaFormularioRegistro>;

export function FormularioRegistro() {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  // useTransition mantiene el botón deshabilitado durante toda la transición
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DatosFormularioRegistro>({
    // El mismo schema base del servidor refinado para el frontend
    resolver: zodResolver(schemaFormularioRegistro),
  });

  function onSubmit(datos: DatosFormularioRegistro) {
    iniciarEnvio(async () => {
      const respuesta = await registrarUsuario({
        nombre: datos.nombre,
        email: datos.email,
        password: datos.password,
      });
      setResultado(respuesta);
      if (respuesta.ok) reset();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <CampoTexto
        etiqueta="Nombre"
        autoComplete="name"
        className="login-input"
        error={errors.nombre?.message}
        {...register("nombre")}
      />
      <CampoTexto
        etiqueta="Email"
        type="email"
        autoComplete="email"
        className="login-input"
        error={errors.email?.message}
        {...register("email")}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        className="login-input"
        error={errors.password?.message}
        ayuda="Al menos 10 caracteres, con una letra y un número."
        {...register("password")}
      />
      <CampoTexto
        etiqueta="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        className="login-input"
        error={errors.confirmarPassword?.message}
        {...register("confirmarPassword")}
      />

      <Button type="submit" disabled={enviando} className="login-submit-button">
        {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
