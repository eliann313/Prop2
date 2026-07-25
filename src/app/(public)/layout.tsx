import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";

/**
 * Layout del route group público. Los paréntesis del nombre hacen que "(public)" NO aparezca
 * en la URL: sirve para agrupar rutas que comparten layout sin agregar un segmento (4.3).
 */
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoSitio />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
