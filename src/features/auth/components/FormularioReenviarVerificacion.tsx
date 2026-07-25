"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { reenviarVerificacion } from "@/features/auth/actions/reenviarVerificacion";
import {
  schemaReenviarVerificacion,
  type DatosReenviarVerificacion,
} from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/features/auth/components/AvisoDeAccion";
import { CampoTexto } from "@/features/auth/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

type Props = {
  /** Email precargado cuando se llega desde el login con el aviso de "falta verificar". */
  emailInicial?: string;
};

export function FormularioReenviarVerificacion({ emailInicial }: Props) {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosReenviarVerificacion>({
    resolver: zodResolver(schemaReenviarVerificacion),
    defaultValues: { email: emailInicial ?? "" },
  });

  function onSubmit(datos: DatosReenviarVerificacion) {
    iniciarEnvio(async () => setResultado(await reenviarVerificacion(datos)));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <CampoTexto
        etiqueta="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Reenviarme el link"}
      </Button>
    </form>
  );
}
