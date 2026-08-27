import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { BotonGoogle } from "@/features/auth/components/BotonGoogle";
import { FormularioRegistro } from "@/features/auth/components/FormularioRegistro";
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

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function PaginaRegistro() {
  await redirigirSiYaHaySesion();

  return (
    <Card className="login-card registration-card">
      <CardHeader className="login-card-header">
        <CardTitle className="login-card-title">Crear cuenta</CardTitle>
        <CardDescription className="login-card-description">
          Es gratis. Vas a poder publicar inmuebles y guardar favoritos.
        </CardDescription>
      </CardHeader>

      <CardContent className="login-card-content">
        {googleHabilitado ? (
          <>
            <BotonGoogle />
            <div className="login-divider">
              <span />
              <span>o</span>
              <span />
            </div>
          </>
        ) : null}
        <FormularioRegistro />
      </CardContent>

      <CardFooter className="login-card-footer">
        <p className="login-signup-text">
          ¿Ya tenés cuenta?{" "}
          <Link href={RUTAS.login} className="login-signup-link">
            Iniciá sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
