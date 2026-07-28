import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";

/**
 * Sin cache, explícito (9.1). Hoy estas páginas ya se renderizan dinámicas porque leen la
 * sesión, pero eso es una consecuencia, no una decisión: si mañana alguien saca esa lectura de
 * una página, pasaría a servirse desde un cache COMPARTIDO — y acá se listan publicaciones y
 * usuarios ajenos. Declararlo deja la intención escrita y no dependiendo de un efecto lateral.
 */
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
