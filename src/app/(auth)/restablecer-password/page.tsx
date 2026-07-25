import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { FormularioRestablecerPassword } from "@/features/auth/components/FormularioRestablecerPassword";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = { title: "Elegir nueva contraseña" };

export default async function PaginaRestablecerPassword(
  props: PageProps<"/restablecer-password">,
) {
  const { token } = await props.searchParams;

  // Sin token no hay nada que hacer acá. La validez REAL del token no se chequea en el render
  // sino al enviar el formulario: hacerlo en el GET permitiría probar tokens de a uno sin
  // gastar un POST, y además el token podría vencer entre que se carga la página y se envía.
  if (typeof token !== "string" || token.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert variant="destructive">
            <AlertDescription>
              Este link no tiene el token de recuperación. Pedí uno nuevo.
            </AlertDescription>
          </Alert>
          <Link
            href={RUTAS.recuperarPassword}
            className="text-sm underline underline-offset-4"
          >
            Pedir un link nuevo
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elegí una nueva contraseña</CardTitle>
        <CardDescription>
          Después de guardarla vas a poder iniciar sesión con ella.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioRestablecerPassword token={token} />
      </CardContent>
    </Card>
  );
}
