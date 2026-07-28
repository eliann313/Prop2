import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";

/**
 * Layout del área de vendedor. El proxy ya filtra por rol antes de llegar acá, pero cada
 * página igual revalida con `requerirRol`: el proxy es una comprobación optimista sobre el
 * JWT, no la autorización real.
 */
/**
 * Sin cache, explícito (9.1): son datos privados de cada vendedor —sus publicaciones, sus
 * mensajes— y nunca pueden servirse desde un cache compartido. Ver el comentario equivalente en
 * el layout de admin.
 */
export const dynamic = "force-dynamic";

/** El dashboard no aporta nada en un resultado de búsqueda (9.1 / robots.ts). */
export const metadata = { robots: { index: false, follow: false } };

export default function LayoutVendedor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoSitio />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
