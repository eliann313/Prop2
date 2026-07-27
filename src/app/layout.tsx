import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/shared/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prop² — Comprá, vendé y alquilá sin intermediarios",
    // Las páginas hijas solo declaran su parte y el sufijo se agrega solo.
    template: "%s | Prop²",
  },
  description:
    "Plataforma para publicar, vender y alquilar inmuebles en Argentina. Los propietarios publican directamente y los interesados contactan sin intermediarios.",
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
