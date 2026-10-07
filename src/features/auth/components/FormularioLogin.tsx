"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  iniciarSesionConCredenciales,
  type ResultadoLogin,
} from "@/features/auth/actions/iniciarSesion";
import { RUTAS } from "@/shared/rutas";
import { schemaLogin, type DatosLogin } from "@/features/auth/authSchemas";
import { AvisoDeAccion } from "@/shared/components/AvisoDeAccion";
import { CampoTexto } from "@/shared/components/CampoTexto";
import { esEmailSinVerificar } from "@/features/auth/erroresDeLogin";
import { Button } from "@/shared/components/ui/button";

type Props = {
  /** Ruta interna a la que volver después de entrar (la pone el proxy en la query). */
  volverA?: string;
  /** Auth.js devuelve errores OAuth en la URL; el detalle nunca se expone en pantalla. */
  errorAuth?: boolean;
};

export function FormularioLogin({ volverA, errorAuth = false }: Props) {
  const [resultado, setResultado] = useState<ResultadoLogin | null>(() =>
    errorAuth
      ? {
          ok: false,
          mensaje: "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.",
        }
      : null,
  );
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
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
  const emailIngresado = useWatch({ control, name: "email", defaultValue: "" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
      <AvisoDeAccion resultado={resultado} />

      {faltaVerificar ? (
        <Link
          href={{
            pathname: RUTAS.verificarEmail,
            query: { email: emailIngresado },
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
        className="login-input"
        error={errors.email?.message}
        {...register("email")}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        className="login-input"
        error={errors.password?.message}
        {...register("password")}
      />

      <Link
        href={{ pathname: RUTAS.recuperarPassword, query: { email: emailIngresado } }}
        className="login-forgot-link"
      >
        Olvidé mi contraseña
      </Link>

      <Button type="submit" disabled={enviando} className="login-submit-button">
        {enviando ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
