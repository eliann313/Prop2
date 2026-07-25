"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { solicitarRecuperacionPassword } from "@/features/auth/actions/solicitarRecuperacionPassword";
import {
  schemaSolicitudRecuperacion,
  type DatosSolicitudRecuperacion,
} from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

export function FormularioRecuperarPassword() {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosSolicitudRecuperacion>({
    resolver: zodResolver(schemaSolicitudRecuperacion),
  });

  function onSubmit(datos: DatosSolicitudRecuperacion) {
    iniciarEnvio(async () => setResultado(await solicitarRecuperacionPassword(datos)));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <CampoTexto
        etiqueta="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        ayuda="Te enviamos un link para elegir una contraseña nueva."
        {...register("email")}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviarme el link"}
      </Button>
    </form>
  );
}
