import { iniciarSesionConGoogle } from "@/features/auth/actions/iniciarSesion";
import { Button } from "@/shared/components/ui/button";

type Props = {
  volverA?: string;
};

/**
 * Componente de servidor: el `<form action={...}>` invoca la Server Action directamente, sin
 * necesidad de JavaScript en el cliente ni de un `'use client'` — que según 14.3 es la
 * excepción a justificar, no el default.
 */
export function BotonGoogle({ volverA }: Props) {
  return (
    <form
      action={async () => {
        "use server";
        await iniciarSesionConGoogle(volverA);
      }}
    >
      <Button type="submit" variant="outline" className="w-full">
        Continuar con Google
      </Button>
    </form>
  );
}
