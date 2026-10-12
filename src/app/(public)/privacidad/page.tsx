import type { Metadata } from "next";
import Link from "next/link";
import { Eye, KeyRound, Lock, ShieldCheck, UserCheck } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { RUTAS } from "@/shared/rutas";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos",
  description:
    "Política de privacidad de Prop² conforme a la Ley Nacional N° 25.326 de Protección de los Datos Personales de la República Argentina y disposiciones de la AAIP.",
};

export default function PaginaPrivacidad() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="mb-10 text-center">
        <Badge
          variant="outline"
          className="mb-3 border-emerald-600/30 bg-emerald-50 text-emerald-900"
        >
          <ShieldCheck className="mr-1.5 size-3.5" />
          Ley 25.326 · República Argentina
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Política de Privacidad y Protección de Datos
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Última actualización: 11 de octubre de 2026 · Cumplimiento AAIP
        </p>
      </header>

      {/* Puntos Clave */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 size-5 shrink-0 text-emerald-800" />
              <div>
                <h2 className="font-semibold text-stone-900">No vendemos tus datos</h2>
                <p className="mt-1 text-sm text-stone-700">
                  En Prop² <strong>no comercializamos ni cedemos</strong> bases de datos a
                  terceros publicitarios bajo ningún concepto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-5 shrink-0 text-blue-800" />
              <div>
                <h2 className="font-semibold text-stone-900">Seguridad y Criptografía</h2>
                <p className="mt-1 text-sm text-stone-700">
                  Tus contraseñas están hasheadas con <em>bcrypt</em> de alta seguridad,
                  las conexiones usan TLS 1.3 y las peticiones llevan políticas de
                  seguridad CSP estrictas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-5 shrink-0 text-purple-800" />
              <div>
                <h2 className="font-semibold text-stone-900">Derechos ARCO Gratuitos</h2>
                <p className="mt-1 text-sm text-stone-700">
                  Podés solicitar acceso, rectificación o supresión de tus datos
                  personales enviando un correo a <code>privacidad@prop2.com.ar</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 size-5 shrink-0 text-amber-800" />
              <div>
                <h2 className="font-semibold text-stone-900">
                  Analítica sin Cookies Invasivas
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  Utilizamos analítica web sin cookies de rastreo intersitio, protegiendo
                  tu privacidad en cada visita.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Legal Completo */}
      <article className="prose prose-stone max-w-none space-y-8 text-stone-800">
        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            1. Marco Normativo y Responsable del Tratamiento
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            La presente Política se rige por la{" "}
            <strong>Ley Nacional N° 25.326 de Protección de los Datos Personales</strong>,
            su Decreto Reglamentario N° 1558/2001 y las resoluciones de la Agencia de
            Acceso a la Información Pública (AAIP). El responsable del tratamiento de los
            datos es la plataforma <strong>Prop²</strong>, con contacto en{" "}
            <code>privacidad@prop2.com.ar</code>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            2. Datos Recopilados y Finalidades del Tratamiento
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Recopilamos únicamente aquellos datos necesarios para la prestación del
            servicio:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>
              <strong>Registro y Perfil:</strong> Nombre y apellido, correo electrónico,
              contraseña hasheada y teléfono de contacto. Finalidad: autenticación,
              seguridad y habilitación de contacto directo.
            </li>
            <li>
              <strong>Consultas y Contacto:</strong> Nombre, teléfono, correo electrónico
              y mensaje enviado por el interesado. Finalidad: transmitir la consulta al
              vendedor o publicante del aviso.
            </li>
            <li>
              <strong>Seguridad y Mitigación de Ataques:</strong> Dirección IP y registros
              técnicos de conexión tratados de forma efímera para protección contra
              ataques de fuerza bruta y abusos (*rate limiting*).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            3. Proveedores de Infraestructura y Modelos de IA
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Para la operativa técnica utilizamos proveedores de primera línea con
            estrictos estándares de seguridad:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>
              <strong>Base de datos y Caché:</strong> Neon (PostgreSQL con cifrado en
              reposo y en tránsito) y Upstash Redis.
            </li>
            <li>
              <strong>Multimedia:</strong> Cloudinary para el alojamiento seguro y
              optimizado de fotos de inmuebles.
            </li>
            <li>
              <strong>Envío de Correos:</strong> Resend / Servidores SMTP para
              notificaciones transaccionales.
            </li>
            <li>
              <strong>Inteligencia Artificial:</strong> Vercel AI SDK conectando con
              modelos de lenguaje para sugerencias de descripciones.{" "}
              <strong>
                Bajo ninguna circunstancia se comparten datos personales ni mensajes de
                compradores con los proveedores de IA.
              </strong>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            4. Ejercicio de Derechos de Acceso, Rectificación y Supresión (ARCO)
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Todo usuario puede ejercer en forma gratuita sus derechos previstos en los
            artículos 14, 15 y 16 de la Ley N° 25.326 enviando un correo a{" "}
            <code>privacidad@prop2.com.ar</code> adjuntando acreditación de identidad. Las
            solicitudes de acceso se responden en un plazo máximo de 10 días corridos, y
            las de rectificación o supresión en 5 días hábiles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-stone-200 pb-2 text-xl font-bold text-stone-900">
            5. Leyenda Reglamentaria Obligatoria de la AAIP (Resolución 14/2018)
          </h2>
          <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-950">
            <p className="font-semibold">
              &quot;El titular de los datos personales tiene la facultad de ejercer el
              derecho de acceso a los mismos en forma gratuita a intervalos no inferiores
              a seis meses, salvo que se acredite un interés legítimo al efecto conforme
              lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.&quot;
            </p>
            <p>
              &quot;La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, Órgano de Control de la
              Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que
              se interpongan con relación al incumplimiento de las normas sobre protección
              de datos personales.&quot;
            </p>
            <p className="text-emerald-800">
              Sede: Av. Pte. Gral. Julio A. Roca 710, Piso 3°, CABA · Web:{" "}
              <a
                href="https://www.argentina.gob.ar/aaip/datospersonales"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-900 underline"
              >
                www.argentina.gob.ar/aaip/datospersonales
              </a>
            </p>
          </div>
        </section>
      </article>

      {/* Navegación complementaria */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6 text-sm text-stone-600">
        <div>
          Canal directo de privacidad:{" "}
          <a
            href="mailto:privacidad@prop2.com.ar"
            className="font-medium text-stone-900 underline"
          >
            privacidad@prop2.com.ar
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link href={RUTAS.terminos} className="underline hover:text-stone-900">
            Términos y Condiciones
          </Link>
          <Link href={RUTAS.disclaimer} className="underline hover:text-stone-900">
            Aviso Legal Inmobiliario
          </Link>
        </div>
      </div>
    </div>
  );
}
