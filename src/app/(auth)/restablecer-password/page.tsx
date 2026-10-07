import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { FormularioRestablecerPassword } from "@/features/auth/components/FormularioRestablecerPassword";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
      <Card className="login-card recovery-card password-reset-card">
        <CardHeader className="login-card-header">
          <CardTitle className="login-card-title">Link inválido</CardTitle>
        </CardHeader>
        <CardContent className="login-card-content">
          <Alert variant="destructive">
            <AlertDescription>
              Este enlace no tiene un token de recuperación válido. Pedí uno nuevo para
              continuar.
            </AlertDescription>
          </Alert>
          <Link href={RUTAS.recuperarPassword} className="recovery-login-link">
            Pedir un link nuevo
          </Link>
        </CardContent>
        <CardFooter className="login-card-footer recovery-card-footer">
          <Link href={RUTAS.login} className="recovery-login-link">
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="login-card recovery-card password-reset-card">
      <CardHeader className="login-card-header">
        <CardTitle className="login-card-title">Elegí una nueva contraseña</CardTitle>
        <CardDescription className="login-card-description">
          Después de guardarla vas a poder iniciar sesión con ella.
        </CardDescription>
      </CardHeader>
      <CardContent className="login-card-content">
        <FormularioRestablecerPassword token={token} />
      </CardContent>
      <CardFooter className="login-card-footer recovery-card-footer">
        <Link href={RUTAS.login} className="recovery-login-link">
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
