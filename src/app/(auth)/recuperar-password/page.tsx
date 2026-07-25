import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { FormularioRecuperarPassword } from "@/features/auth/components/FormularioRecuperarPassword";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function PaginaRecuperarPassword() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormularioRecuperarPassword />
      </CardContent>

      <CardFooter>
        <Link
          href={RUTAS.login}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
