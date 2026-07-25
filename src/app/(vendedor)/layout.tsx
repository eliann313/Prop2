import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";

/**
 * Layout del área de vendedor. El proxy ya filtra por rol antes de llegar acá, pero cada
 * página igual revalida con `requerirRol`: el proxy es una comprobación optimista sobre el
 * JWT, no la autorización real.
 */
export default function LayoutVendedor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoSitio />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
