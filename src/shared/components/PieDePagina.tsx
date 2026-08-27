import Image from "next/image";
import { Camera, MessageCircle, Users } from "lucide-react";

export function PieDePagina() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Image
          src="/images/prop2-logo-v2-light.svg"
          alt="Prop2"
          width={150}
          height={45}
          className="site-footer-logo"
        />
        <p className="site-footer-copy">
          © 2025 PROP² Bienes Raíces · Todos los derechos reservados
        </p>
        <div className="site-footer-socials" aria-label="Redes sociales">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <Camera aria-hidden="true" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <Users aria-hidden="true" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter"
          >
            <MessageCircle aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
