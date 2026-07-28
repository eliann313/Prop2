import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/shared/components/ui/sonner";
import { urlAbsoluta } from "@/shared/lib/urlBase";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = "Prop² — Comprá, vendé y alquilá sin intermediarios";
const DESCRIPCION =
  "Plataforma para publicar, vender y alquilar inmuebles en Argentina. Los propietarios publican directamente y los interesados contactan sin intermediarios.";

export const metadata: Metadata = {
  // Base para resolver las URLs relativas de metadata (canónicas, Open Graph). Sin esto Next
  // avisa en el build y las canónicas salen relativas, que en un `<link rel="canonical">` no
  // sirve: tiene que ser absoluta para que el buscador la interprete.
  metadataBase: new URL(urlAbsoluta("/")),
  title: {
    default: TITULO,
    // Las páginas hijas solo declaran su parte y el sufijo se agrega solo.
    template: "%s | Prop²",
  },
  description: DESCRIPCION,
  // Valores por defecto: cada página pública los pisa con los suyos (el detalle lo hace en su
  // `generateMetadata`). Definirlos acá evita que una página nueva salga sin ninguno.
  openGraph: {
    type: "website",
    siteName: "Prop²",
    locale: "es_AR",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: { card: "summary", title: TITULO, description: DESCRIPCION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
        {/* Vercel Web Analytics. Es sin cookies y no guarda datos personales, así que no
            necesita banner de consentimiento — que es justamente por lo que se elige antes que
            Google Analytics para un sitio público con tráfico argentino.
            Reemplaza a la PR generada por el bot de Vercel, que venía armada contra la
            estructura vieja del proyecto (app/, .eslintrc.json, tailwind.config.ts). */}
        <Analytics />
      </body>
    </html>
  );
}
