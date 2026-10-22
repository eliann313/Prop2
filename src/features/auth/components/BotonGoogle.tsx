import { iniciarSesionConGoogle } from "@/features/auth/actions/iniciarSesion";
import { Button } from "@/shared/components/ui/button";
import { googleHabilitado } from "@/shared/lib/serverEnv";

type Props = {
  volverA?: string;
};

/**
 * Componente de servidor: el `<form action={...}>` invoca la Server Action directamente, sin
 * necesidad de JavaScript en el cliente ni de un `'use client'` — que según 14.3 es la
 * excepción a justificar, no el default.
 */
export function BotonGoogle({ volverA }: Props) {
  if (!googleHabilitado) return null;

  return (
    <form
      action={async () => {
        "use server";
        await iniciarSesionConGoogle(volverA);
      }}
    >
      <Button type="submit" variant="outline" className="login-google-button">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
          <path
            fill="#4285F4"
            d="M21.35 12.23c0-.72-.06-1.24-.2-1.78H12v3.37h5.37a4.58 4.58 0 0 1-1.99 3.01v2.52h3.23c1.89-1.74 2.74-4.3 2.74-7.12Z"
          />
          <path
            fill="#34A853"
            d="M12 21.99c2.7 0 4.97-.89 6.62-2.42l-3.23-2.52c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.13H3.07v2.6A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.28.31-1.88v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.48l3.34-2.6Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.99c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 3.02 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z"
          />
        </svg>
        Continuar con Google
      </Button>
    </form>
  );
}
