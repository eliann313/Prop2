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

export default async function PaginaRecuperarPassword(
  props: PageProps<"/recuperar-password">,
) {
  const { email } = await props.searchParams;

  return (
    <Card className="login-card recovery-card">
      <CardHeader className="login-card-header">
        <CardTitle className="login-card-title">Recuperar contraseña</CardTitle>
        <CardDescription className="login-card-description">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </CardDescription>
      </CardHeader>

      <CardContent className="login-card-content">
        <FormularioRecuperarPassword
          emailInicial={typeof email === "string" ? email : ""}
        />
      </CardContent>

      <CardFooter className="login-card-footer recovery-card-footer">
        <Link href={RUTAS.login} className="recovery-login-link">
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
