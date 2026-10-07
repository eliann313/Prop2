import Image from "next/image";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";

export function PieDePagina() {
  const anio = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link href={RUTAS.home} className="site-footer-brand" aria-label="Prop², inicio">
          <Image
            src="/images/prop2-logo-v2-light.svg"
            alt="Prop2"
            width={150}
            height={45}
            className="site-footer-logo"
          />
          <span>Bienes raíces sin intermediarios</span>
        </Link>

        <nav className="site-footer-nav" aria-label="Navegación del pie de página">
          <Link href={RUTAS.publicaciones}>Buscar propiedades</Link>
          <Link href={`${RUTAS.dashboard}/publicaciones/nueva`}>Publicar inmueble</Link>
          <Link href={RUTAS.login}>Iniciar sesión</Link>
        </nav>

        <p className="site-footer-copy">
          © {anio} Prop² Bienes Raíces · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
