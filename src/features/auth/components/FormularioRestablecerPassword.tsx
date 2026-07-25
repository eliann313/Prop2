"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { restablecerPassword } from "@/features/auth/actions/restablecerPassword";
import { RUTAS } from "@/shared/rutas";
import {
  schemaRestablecerPassword,
  type DatosRestablecerPassword,
} from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { Button } from "@/shared/components/ui/button";
import type { ResultadoAccion } from "@/shared/types/resultadoAccion";

type Props = {
  /** Token que viene en la query del link del email. */
  token: string;
};

export function FormularioRestablecerPassword({ token }: Props) {
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosRestablecerPassword>({
    resolver: zodResolver(schemaRestablecerPassword),
    // El token viaja como campo del formulario y no en un input visible: es parte del payload
    // que la action valida, pero el usuario no tiene nada que hacer con él.
    defaultValues: { token },
  });

  function onSubmit(datos: DatosRestablecerPassword) {
    iniciarEnvio(async () => setResultado(await restablecerPassword(datos)));
  }

  if (resultado?.ok) {
    return (
      <div className="grid gap-4">
        <AvisoDeAccion resultado={resultado} />
        <Link href={RUTAS.login} className="text-sm underline underline-offset-4">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <AvisoDeAccion resultado={resultado} />

      <input type="hidden" {...register("token")} />

      <CampoTexto
        etiqueta="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        ayuda="Al menos 10 caracteres, con una letra y un número."
        {...register("password")}
      />
      <CampoTexto
        etiqueta="Repetí la contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.confirmacion?.message}
        {...register("confirmacion")}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
