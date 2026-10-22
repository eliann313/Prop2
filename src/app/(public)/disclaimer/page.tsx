import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertOctagon,
  BadgeAlert,
  Building,
  Coins,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";

export const metadata: Metadata = {
  title: "Aviso Legal y Descargo de Responsabilidad Inmobiliaria",
  description:
    "Aviso legal, descargo de responsabilidad y recomendaciones de seguridad para operaciones inmobiliarias en Prop². Prevención de fraudes y pautas de contratación.",
};

export default function PaginaDisclaimer() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="mb-10 text-center">
        <Badge
          variant="outline"
          className="mb-3 border-rose-600/30 bg-rose-50 text-rose-900"
        >
          <ShieldAlert className="mr-1.5 size-3.5" />
          Seguridad y Transparencia
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Aviso Legal y Descargo Inmobiliario
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Pautas indispensables de debida diligencia y seguridad para compradores,
          inquilinos y vendedores
        </p>
      </header>

      {/* Alerta Destacada Principal */}
      <div className="mb-10 rounded-xl border-2 border-red-300 bg-red-50/90 p-6 text-red-950 shadow-xs">
        <div className="flex items-start gap-4">
          <AlertOctagon className="mt-1 size-8 shrink-0 text-red-600" />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-red-900">
              Regla de Oro: NUNCA envíes dinero por adelantado sin visitar el inmueble
            </h2>
            <p className="text-sm leading-relaxed text-red-800">
              Jamás transfieras dinero, señas, reservas ni pagos de llaves por medios
              electrónicos (transferencia bancaria, billeteras virtuales o cripto) a
              personas que afirmen estar de viaje, en el exterior o que te prometan enviar
              las llaves por encomienda.
              <strong>
                {" "}
                Exigí siempre una visita presencial y la acreditación fehaciente de la
                titularidad del bien.
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de Verificación */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="border-stone-200 bg-stone-50/50 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="font-semibold text-stone-900">
                  Informe de Dominio e Inhibiciones
                </h3>
                <p className="mt-1 text-sm text-stone-700">
                  Antes de formalizar cualquier seña o boleto de compraventa, solicitá a
                  través de un Escribano Público los informes al Registro de la Propiedad
                  Inmueble (RPI) para comprobar que el inmueble esté libre de embargos o
                  hipotecas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-stone-50/50 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Building className="mt-0.5 size-5 shrink-0 text-blue-700" />
              <div>
                <h3 className="font-semibold text-stone-900">
                  Medidas y Superficies Referenciales
                </h3>
                <p className="mt-1 text-sm text-stone-700">
                  Las superficies informadas en los avisos son aproximadas y orientativas.
                  Las medidas exactas y legalmente vinculantes surgen de la escritura
                  pública y del plano de mensura catastral aprobado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-stone-50/50 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Coins className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="font-semibold text-stone-900">
                  Precios y Cotizaciones de Moneda
                </h3>
                <p className="mt-1 text-sm text-stone-700">
                  Los valores son fijados exclusivamente por los propietarios y pueden
                  variar. Los tipos de cambio y conversiones de moneda exhibidos en el
                  sitio son de carácter informativo y no contractual.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-stone-50/50 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <BadgeAlert className="mt-0.5 size-5 shrink-0 text-rose-700" />
              <div>
                <h3 className="font-semibold text-stone-900">
                  Deudas de Expensas y Servicios
                </h3>
                <p className="mt-1 text-sm text-stone-700">
                  Revisá el certificado de libre deuda de expensas emitido por la
                  Administración del Consorcio y las facturas de servicios e impuestos
                  locales (ABL, ARBA, AYSA, etc.).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articulado Detallado */}
      <article className="prose prose-stone max-w-none space-y-8 text-stone-800">
        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            1. Deslinde de Responsabilidad en la Contratación
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Prop² no es una inmobiliaria ni mandataria de ninguna de las partes. No
            interviene en la celebración de contratos, no garantiza la solvencia de las
            partes ni se responsabiliza por el estado constructivo, vicios ocultos o
            contingencias legales que puedan suscitarse con relación a los inmuebles
            anunciados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            2. Intervención Profesional Obligatoria
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            La adquisición, venta o locación de un bien raíz requiere la asistencia de
            profesionales idóneos:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>
              <strong>Escribano Público:</strong> Para el estudio de títulos, retenciones
              impositivas y la formalización de la escritura traslativa de dominio.
            </li>
            <li>
              <strong>Corredor Inmobiliario Matriculado:</strong> En caso de requerir
              intermediación o tasación formal con matrícula profesional habilitante de la
              jurisdicción.
            </li>
            <li>
              <strong>Agrimensor / Arquitecto:</strong> Para la verificación física de
              linderos, planos de obra y habilitaciones municipales en caso de
              corresponder.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            3. Canal de Denuncias y Seguridad
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Si detectás una publicación con indicios de falsedad, fotos duplicadas,
            precios ostensiblemente anormales o una solicitud sospechosa de pagos,
            envianos la denuncia de forma inmediata a:
          </p>
          <div className="rounded-lg bg-stone-100 p-4 font-mono text-sm text-stone-800">
            🚨 Correo de seguridad: <strong>prop2inmuebles@gmail.com</strong>
          </div>
        </section>
      </article>

      {/* Navegación complementaria */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6 text-sm text-stone-600">
        <div>Equipo de Seguridad y Moderación · Prop² Argentina</div>
        <div className="flex items-center gap-4">
          <Link href={RUTAS.terminos} className="underline hover:text-stone-900">
            Términos y Condiciones
          </Link>
          <Link href={RUTAS.privacidad} className="underline hover:text-stone-900">
            Política de Privacidad
          </Link>
        </div>
      </div>
    </div>
  );
}
