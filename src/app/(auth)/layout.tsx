import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RUTAS } from "@/shared/rutas";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-layout">
      <header className="auth-header">
        <Link
          href={RUTAS.home}
          aria-label="Prop², volver al inicio"
          className="auth-brand"
        >
          <span aria-hidden="true" className="auth-brand-mark">
            <span className="auth-brand-square auth-brand-square-light" />
            <span className="auth-brand-square auth-brand-square-gold" />
          </span>
          <span className="auth-brand-copy">
            <span className="auth-brand-name">
              PROP<sup>2</sup>
            </span>
            <span className="auth-brand-tagline">BIENES RAÍCES</span>
          </span>
        </Link>
      </header>
      <div className="auth-layout-content">
        <div className="auth-content-inner">
          {children}
          <Link href={RUTAS.home} className="auth-back-link">
            <ArrowLeft />
            Atrás
          </Link>
        </div>
      </div>
    </main>
  );
}
