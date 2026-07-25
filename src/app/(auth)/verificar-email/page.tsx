import type { Metadata } from "next";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";
import { FormularioReenviarVerificacion } from "@/features/auth/components/FormularioReenviarVerificacion";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { verificarEmail } from "@/features/auth/verificacionDeEmail";

export const metadata: Metadata = { title: "Confirmar email" };

/**
 * Cumple dos funciones según cómo se llegue:
 *  - con `?token=...` (el link del email): consume el token y muestra el resultado.
 *  - sin token: muestra el formulario para pedir el reenvío del link.
 */
export default async function PaginaVerificarEmail(props: PageProps<"/verificar-email">) {
  const { token, email } = await props.searchParams;

  if (typeof token !== "string" || token.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmá tu email</CardTitle>
          <CardDescription>
            Te enviamos un link a tu casilla. Si no llegó, pedí uno nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioReenviarVerificacion
            emailInicial={typeof email === "string" ? email : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  const resultado = await verificarEmail(token);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {resultado.ok ? "Email confirmado" : "No pudimos confirmarlo"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert variant={resultado.ok ? "default" : "destructive"} role="status">
          <AlertDescription>{resultado.mensaje}</AlertDescription>
        </Alert>

        {resultado.ok ? (
          <Button asChild>
            <Link href={RUTAS.login}>Iniciar sesión</Link>
          </Button>
        ) : (
          // El reenvío se ofrece solo si el link venció o ya se usó. Ante un token inventado no
          // tiene sentido: no hay ninguna cuenta a la que reenviarle nada.
          resultado.datos?.motivo !== "invalido" && <FormularioReenviarVerificacion />
        )}
      </CardContent>
    </Card>
  );
}
