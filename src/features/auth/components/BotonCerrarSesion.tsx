import { cerrarSesion } from "@/features/auth/actions/cerrarSesion";
import { Button } from "@/shared/components/ui/button";

/** Componente de servidor: el form dispara la Server Action por POST (ver cerrarSesion.ts). */
export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <Button type="submit" variant="ghost" size="sm">
        Cerrar sesión
      </Button>
    </form>
  );
}
