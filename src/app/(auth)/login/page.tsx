import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { BotonGoogle } from "@/features/auth/components/BotonGoogle";
import { FormularioLogin } from "@/features/auth/components/FormularioLogin";
import { redirigirSiYaHaySesion } from "@/features/auth/sessionQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { googleHabilitado } from "@/shared/lib/serverEnv";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin(props: PageProps<"/login">) {
  // En Next 16 `searchParams` es una Promise: el acceso sincrónico se removió (breaking change
  // de la v15 que en la 16 dejó de tener compatibilidad temporal).
  const { volverA, error } = await props.searchParams;

  await redirigirSiYaHaySesion();

  const destino = typeof volverA === "string" ? volverA : undefined;
  const errorAuth = typeof error === "string" && error.length > 0;

  return (
    <Card className="login-card">
      <CardHeader className="login-card-header">
        <CardTitle className="login-card-title">Iniciar sesión</CardTitle>
        <CardDescription className="login-card-description">
          Entrá para publicar y guardar favoritos.
        </CardDescription>
      </CardHeader>

      <CardContent className="login-card-content">
        {googleHabilitado ? (
          <>
            <BotonGoogle volverA={destino} />
            <div className="login-divider" aria-hidden="true">
              <span />
              <span>o</span>
              <span />
            </div>
          </>
        ) : null}
        <FormularioLogin volverA={destino} errorAuth={errorAuth} />
      </CardContent>

      <CardFooter className="login-card-footer">
        <p className="login-signup-text">
          ¿No tenés cuenta?{" "}
          <Link href={RUTAS.registro} className="login-signup-link">
            Creá una
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
