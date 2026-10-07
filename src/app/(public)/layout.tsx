import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";
import { PieDePagina } from "@/shared/components/PieDePagina";
import "@/shared/components/shared-components.css";
import "./busqueda.css";

/**
 * Layout del route group público. Los paréntesis del nombre hacen que "(public)" NO aparezca
 * en la URL: sirve para agrupar rutas que comparten layout sin agregar un segmento (4.3).
 */
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-foreground flex min-h-screen flex-col bg-white">
      <EncabezadoSitio />
      <main className="w-full flex-1">{children}</main>
      <PieDePagina />
    </div>
  );
}
