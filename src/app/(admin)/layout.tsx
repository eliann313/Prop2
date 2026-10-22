import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";
import "@/shared/components/shared-components.css";

export const dynamic = "force-dynamic";

/** Ninguna pantalla de administración tiene por qué aparecer en un buscador (9.1 / robots.ts). */
export const metadata = { robots: { index: false, follow: false } };

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoSitio />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
