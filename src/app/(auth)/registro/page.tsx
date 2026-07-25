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
import { Separator } from "@/shared/components/ui/separator";
import { googleHabilitado } from "@/shared/lib/serverEnv";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function PaginaRegistro() {
  await redirigirSiYaHaySesion();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Es gratis. Vas a poder publicar inmuebles y guardar favoritos.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <FormularioRegistro />

        {googleHabilitado ? (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">o</span>
              <Separator className="flex-1" />
            </div>
            <BotonGoogle />
          </>
        ) : null}
      </CardContent>

      <CardFooter>
        <p className="text-muted-foreground text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link href={RUTAS.login} className="underline underline-offset-4">
            Iniciá sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
