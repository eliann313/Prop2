"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { enviarConsulta } from "@/features/contacto/actions/enviarConsulta";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

type Props = {
  publicacionId: string;
  tituloPublicacion: string;
  /** Datos del usuario logueado, para precargar. Siguen siendo editables (6.6). */
  usuario?: { nombre: string; email: string } | null;
};

export function FormularioDeConsulta({
  publicacionId,
  tituloPublicacion,
  usuario,
}: Props) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [enviada, setEnviada] = useState(false);
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  if (enviada) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm font-medium">Consulta enviada</p>
        <p className="text-muted-foreground mt-1 text-sm">
          El vendedor te va a responder por email.
        </p>
      </div>
    );
  }

  function alEnviar(datosDelFormulario: FormData) {
    iniciarTransicion(async () => {
      const resultado = await enviarConsulta({
        publicacionId,
        nombre: datosDelFormulario.get("nombre"),
        email: datosDelFormulario.get("email"),
        telefono: datosDelFormulario.get("telefono"),
        mensaje: datosDelFormulario.get("mensaje"),
        sitioWeb: datosDelFormulario.get("sitioWeb"),
      });

      if (!resultado.ok) {
        setErrores(resultado.erroresPorCampo ?? {});
        toast.error(resultado.mensaje);
        return;
      }

      setErrores({});
      setEnviada(true);
    });
  }

  return (
    <form action={alEnviar} className="grid gap-3">
      {/* Honeypot: invisible para una persona, irresistible para un bot que llena todos los
          inputs. No usa `type="hidden"` porque muchos bots saltean esos; este es un campo de
          texto normal escondido con CSS, y además queda fuera del orden de tabulación y del
          árbol de accesibilidad para que nadie lo complete por accidente. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="sitioWeb">No completar</label>
        <input
          id="sitioWeb"
          name="sitioWeb"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={usuario?.nombre ?? ""}
          required
          aria-invalid={Boolean(errores.nombre)}
        />
        {errores.nombre ? (
          <p className="text-destructive text-xs">{errores.nombre[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={usuario?.email ?? ""}
          required
          aria-invalid={Boolean(errores.email)}
        />
        {errores.email ? (
          <p className="text-destructive text-xs">{errores.email[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="telefono">
          Teléfono <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input id="telefono" name="telefono" type="tel" />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea
          id="mensaje"
          name="mensaje"
          rows={4}
          required
          defaultValue={`Hola, me interesa "${tituloPublicacion}". ¿Sigue disponible?`}
          aria-invalid={Boolean(errores.mensaje)}
        />
        {errores.mensaje ? (
          <p className="text-destructive text-xs">{errores.mensaje[0]}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Enviar consulta"}
      </Button>
    </form>
  );
}
