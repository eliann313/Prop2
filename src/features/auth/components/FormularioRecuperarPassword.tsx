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

type Props = {
  emailInicial?: string;
};

export function FormularioRecuperarPassword({ emailInicial = "" }: Props) {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosSolicitudRecuperacion>({
    resolver: zodResolver(schemaSolicitudRecuperacion),
    defaultValues: { email: emailInicial },
  });

  function onSubmit(datos: DatosSolicitudRecuperacion) {
    iniciarEnvio(async () => setResultado(await solicitarRecuperacionPassword(datos)));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <CampoTexto
        etiqueta="Email"
        type="email"
        autoComplete="email"
        className="login-input"
        error={errors.email?.message}
        ayuda="Te enviamos un link para elegir una contraseña nueva."
        {...register("email")}
      />

      <Button type="submit" disabled={enviando} className="login-submit-button">
        {enviando ? "Enviando…" : "Enviarme el link"}
      </Button>
    </form>
  );
}
