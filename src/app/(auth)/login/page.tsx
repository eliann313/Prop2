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
import { Separator } from "@/shared/components/ui/separator";
import { googleHabilitado } from "@/shared/lib/serverEnv";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin(props: PageProps<"/login">) {
  // En Next 16 `searchParams` es una Promise: el acceso sincrónico se removió (breaking change
  // de la v15 que en la 16 dejó de tener compatibilidad temporal).
  const { volverA } = await props.searchParams;

  await redirigirSiYaHaySesion();

  const destino = typeof volverA === "string" ? volverA : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Entrá para publicar y guardar favoritos.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <FormularioLogin volverA={destino} />

        {googleHabilitado ? (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">o</span>
              <Separator className="flex-1" />
            </div>
            <BotonGoogle volverA={destino} />
          </>
        ) : null}
      </CardContent>

      <CardFooter>
        <p className="text-muted-foreground text-sm">
          ¿No tenés cuenta?{" "}
          <Link href={RUTAS.registro} className="underline underline-offset-4">
            Creá una
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
