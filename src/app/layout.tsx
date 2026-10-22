import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";

import { Toaster } from "@/shared/components/ui/sonner";
import { urlAbsoluta } from "@/shared/lib/urlBase";

import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const TITULO = "Prop² — Comprá, vendé y alquilá sin intermediarios";
const DESCRIPCION =
  "Plataforma para publicar, vender y alquilar inmuebles en Argentina. Los propietarios publican directamente y los interesados contactan sin intermediarios.";

export const metadata: Metadata = {
  metadataBase: new URL(urlAbsoluta("/")),
  title: {
    default: TITULO,
    template: "%s | Prop²",
  },
  description: DESCRIPCION,
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
      className={`${playfair.variable} ${poppins.variable} h-full antialiased`}
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
