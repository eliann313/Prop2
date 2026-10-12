import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Building2,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso",
  description:
    "Términos y condiciones de uso de la plataforma Prop². Deslinde de actividad inmobiliaria, condiciones de publicación y limitación de responsabilidad en Argentina.",
};

export default function PaginaTerminos() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="mb-10 text-center">
        <Badge
          variant="outline"
          className="mb-3 border-amber-600/30 bg-amber-50 text-amber-900"
        >
          <Scale className="mr-1.5 size-3.5" />
          Marco Legal y Regulatorio
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Términos y Condiciones de Uso
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Última actualización: 11 de octubre de 2026 · Ámbito: República Argentina
        </p>
      </header>

      {/* Resumen ejecutivo / Puntos críticos de blindaje */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 shrink-0 text-amber-800" />
              <div>
                <h2 className="font-semibold text-stone-900">
                  Deslinde de Corretaje Inmobiliario
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  Prop² es exclusivamente un portal tecnológico y publicitario de
                  clasificados.
                  <strong> No es inmobiliaria ni martillero público</strong>, no
                  intermedia en las operaciones ni percibe comisiones sobre las
                  transacciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-rose-800" />
              <div>
                <h2 className="font-semibold text-stone-900">
                  Prevención de Estafas y Pagos
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  Prop² no custodia fondos ni valida títulos de propiedad.
                  <strong> Nunca transfiera señas ni reservas</strong> sin visitar el
                  inmueble y verificar el estado dominial con un Escribano Público
                  matriculado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Bot className="mt-0.5 size-5 shrink-0 text-blue-800" />
              <div>
                <h2 className="font-semibold text-stone-900">
                  Contenido Generado por IA
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  Las sugerencias de descripción por Inteligencia Artificial son
                  borradores asistenciales. El anunciante es el único y exclusivo
                  responsable legal de su revisión y veracidad.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-800" />
              <div>
                <h2 className="font-semibold text-stone-900">Indemnidad y Moderación</h2>
                <p className="mt-1 text-sm text-stone-700">
                  El usuario asume la obligación de mantener indemne a la plataforma
                  frente a reclamos de terceros y Prop² se reserva la potestad de remover
                  publicaciones sospechosas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articulado Completo */}
      <article className="prose prose-stone max-w-none space-y-8 text-stone-800">
        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            1. Naturaleza Jurídica del Servicio — Deslinde de Actividad Inmobiliaria
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            <strong>1.1. Portal Tecnológico y Publicitario:</strong> Prop² es una
            plataforma de software y clasificados digitales destinada a facilitar la
            publicación y el contacto directo entre propietarios, compradores y
            locatarios.
          </p>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/70 p-4 text-sm text-stone-800">
            <strong>
              1.2. Declaración de No Intermediación (Leyes 20.266 y 25.028):
            </strong>
            <br />
            PROP² NO ES UNA AGENCIA INMOBILIARIA, NO ES CORREDOR INMOBILIARIO NI
            MARTILLERO PÚBLICO MATRICULADO, NI EJERCE EL CORRETAJE O MARTILLEO
            INMOBILIARIO BAJO NINGUNA MODALIDAD. Prop² no se encuentra matriculada en
            colegios profesionales (CUCICBA, colegios departamentales de la Provincia de
            Buenos Aires u otras provincias), no realiza tasaciones periciales oficiales,
            no interviene en la negociación de precios ni percibe honorarios o comisiones
            arancelarias sobre los montos de compraventa o locación.
          </div>
          <p className="text-sm leading-relaxed text-stone-700">
            <strong>1.3. Profesionales Matriculados:</strong> En caso de que un usuario
            actúe en carácter de profesional inmobiliario, tiene la obligación legal de
            consignar expresamente en su perfil y en sus avisos su nombre completo, número
            de matrícula habilitante y el Colegio profesional correspondiente.
          </p>
          <p className="text-sm leading-relaxed text-stone-700">
            <strong>1.4. Inexistencia de Vínculo Contractual:</strong> Prop² no es parte
            en ningún contrato, preacuerdo, reserva, seña o boleto de compraventa
            formalizado entre los usuarios. Las partes negocian y contratan bajo su
            exclusiva y directa responsabilidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            2. Capacidad Legal y Registro de Usuarios
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Para utilizar los servicios de registro y publicación en Prop², el usuario
            debe ser mayor de 18 años y contar con plena capacidad jurídica para contratar
            conforme al Código Civil y Comercial de la Nación Argentina. El usuario es
            responsable de brindar información verídica y de la estricta custodia de sus
            credenciales de acceso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            3. Obligaciones y Declaraciones del Anunciante
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Al publicar un inmueble en la Plataforma, el anunciante declara y garantiza:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>
              Ser el titular legítimo del dominio o contar con autorización expresa,
              vigente e irrevocable del propietario para ofrecer la propiedad.
            </li>
            <li>
              Proveer información veraz, exacta y actualizada sobre superficies (m²
              cubiertos y totales), estado constructivo, expensas, deudas, gravámenes y
              aptitud crediticia o profesional.
            </li>
            <li>No publicar anuncios engañosos, simulados o con precios ficticios.</li>
            <li>
              Pausar o dar de baja el aviso dentro de las 24 horas siguientes a
              concretarse una seña, reserva, venta o alquiler del inmueble.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            4. Generación de Contenidos Asistida por Inteligencia Artificial (IA)
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Prop² pone a disposición utilidades basadas en Inteligencia Artificial que
            generan propuestas y sugerencias para la redacción de títulos y descripciones
            de inmuebles.
          </p>
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50/70 p-4 text-sm text-stone-800">
            <strong>Exención Específica sobre IA:</strong> El texto generado por modelos
            de IA constituye una mera propuesta orientativa. La Inteligencia Artificial
            puede incurrir en errores o interpretaciones inexactas.
            <strong>
              {" "}
              El usuario anunciante tiene la obligación inexcusable de revisar, verificar
              y corregir personalmente el contenido antes de publicar.
            </strong>{" "}
            Al confirmar la publicación, el usuario asume la autoría legal exclusiva,
            eximiendo a Prop² de cualquier reclamo por publicidad engañosa (Ley 24.240) o
            discrepancias con la realidad material del inmueble.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            5. Fotografías y Propiedad Intelectual
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            El anunciante garantiza ser titular de los derechos de autor de las imágenes
            cargadas o contar con autorización expresa del titular conforme a la Ley
            Nacional N° 11.723. Queda prohibida la carga de fotografías de terceros,
            imágenes con marcas de agua de plataformas competidoras o imágenes protegidas.
            Prop² se reserva el derecho de retirar de inmediato cualquier imagen reclamada
            mediante nuestro procedimiento de aviso y baja (*Notice and Take Down*).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            6. Limitación de Responsabilidad y Advertencia de Seguridad
          </h2>
          <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm text-red-950">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <AlertTriangle className="size-4 text-red-700" />
              ADVERTENCIA INDISPENSABLE PARA COMPRADORES E INQUILINOS:
            </div>
            Prop² no realiza constataciones físicas ni estudios de títulos dominiales.
            Recomendamos categóricamente a todo usuario NO transferir dinero, señas ni
            depósitos bancarios sin visitar personalmente el inmueble y solicitar
            previamente un Certificado de Dominio e Inhibiciones expedido por el Registro
            de la Propiedad Inmueble con la debida asistencia de un Escribano Público
            matriculado.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            7. Usos Prohibidos y Conductas Infraccionales
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Queda estrictamente prohibido utilizar la plataforma para conductas
            fraudulentas, actos discriminatorios (Ley N° 23.592), scraping no autorizado,
            envío de spam a través de los formularios o enlaces de WhatsApp, o cualquier
            acción que atente contra la seguridad del sistema.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            8. Cláusula de Indemnidad
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            El usuario se compromete a mantener indemne a Prop², sus administradores,
            socios y colaboradores frente a cualquier reclamo, demanda prejudicial o
            judicial, sumario administrativo de defensa del consumidor o colegial, costos
            y honorarios legales motivados por el incumplimiento de estos Términos o la
            infracción de derechos de terceros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            9. Ley Aplicable y Jurisdicción
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Estos Términos se rigen exclusivamente por las leyes de la República
            Argentina. Cualquier controversia será sometida a los Tribunales Ordinarios en
            lo Comercial de la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier
            otro fuero o jurisdicción.
          </p>
        </section>
      </article>

      {/* Navegación complementaria */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6 text-sm text-stone-600">
        <div>
          ¿Consultas sobre estos términos? Escribinos a{" "}
          <a
            href="mailto:prop2inmuebles@gmail.com"
            className="font-medium text-stone-900 underline"
          >
            prop2inmuebles@gmail.com
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link href={RUTAS.privacidad} className="underline hover:text-stone-900">
            Política de Privacidad
          </Link>
          <Link href={RUTAS.disclaimer} className="underline hover:text-stone-900">
            Aviso Legal Inmobiliario
          </Link>
        </div>
      </div>
    </div>
  );
}
