"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  iniciarSesionConCredenciales,
  type ResultadoLogin,
} from "@/features/auth/actions/iniciarSesion";
import { RUTAS } from "@/shared/rutas";
import { schemaLogin, type DatosLogin } from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/features/auth/components/AvisoDeAccion";
import { CampoTexto } from "@/features/auth/components/CampoTexto";
import { esEmailSinVerificar } from "@/features/auth/erroresDeLogin";
import { Button } from "@/shared/components/ui/button";

type Props = {
  /** Ruta interna a la que volver después de entrar (la pone el proxy en la query). */
  volverA?: string;
};

export function FormularioLogin({ volverA }: Props) {
  const [resultado, setResultado] = useState<ResultadoLogin | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DatosLogin>({ resolver: zodResolver(schemaLogin) });

  function onSubmit(datos: DatosLogin) {
    iniciarEnvio(async () => {
      // Si sale bien, la action redirige y este setResultado nunca corre.
      const respuesta = await iniciarSesionConCredenciales(datos, volverA);
      setResultado(respuesta);
    });
  }

  // El aviso de "falta verificar tu email" es el único caso donde conviene ofrecer una salida
  // concreta en vez de solo el error. Se decide por el código que devuelve la action, no
  // comparando el texto del mensaje: reescribir un mensaje no debería romper este botón.
  const faltaVerificar =
    resultado?.ok === false && esEmailSinVerificar(resultado.datos?.codigo);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <AvisoDeAccion resultado={resultado} />

      {faltaVerificar ? (
        <Link
          href={{
            pathname: RUTAS.verificarEmail,
            query: { email: getValues("email") },
          }}
          className="text-sm underline underline-offset-4"
        >
          Reenviar el link de confirmación
        </Link>
      ) : null}

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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Iniciar sesión"}
      </Button>

      <Link
        href={RUTAS.recuperarPassword}
        className="text-muted-foreground text-sm underline underline-offset-4"
      >
        Olvidé mi contraseña
      </Link>
    </form>
  );
}
