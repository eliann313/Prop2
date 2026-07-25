import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { FormularioPublicacion } from "@/features/publicaciones/components/FormularioPublicacion";
import {
  buscarPublicacionDelUsuario,
  listarCaracteristicas,
} from "@/features/publicaciones/publicacionRepository";
import type { EntradaPublicacion } from "@/features/publicaciones/publicacionSchemas";
import { subidaDeImagenesHabilitada } from "@/shared/lib/serverEnv";

export const metadata: Metadata = { title: "Editar publicación" };

/** Prisma devuelve los Decimal como objeto; el formulario los necesita como number. */
const aNumero = (valor: unknown) =>
  valor === null || valor === undefined ? undefined : Number(valor);

export default async function PaginaEditarPublicacion(
  props: PageProps<"/dashboard/publicaciones/[id]/editar">,
) {
  const { id } = await props.params;
  const usuario = await requerirUsuario(`/dashboard/publicaciones/${id}/editar`);

  // El repositorio filtra por dueño dentro del WHERE, así que una publicación ajena vuelve
  // null igual que una inexistente (8.19).
  const publicacion = await buscarPublicacionDelUsuario(id, usuario.id);
  if (!publicacion) notFound();

  const caracteristicas = await listarCaracteristicas();

  const valoresIniciales: Partial<EntradaPublicacion> = {
    tipoInmueble: publicacion.tipoInmueble,
    operacion: publicacion.operacion,
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    precio: Number(publicacion.precio),
    moneda: publicacion.moneda,
    provincia: publicacion.provincia as EntradaPublicacion["provincia"],
    ciudad: publicacion.ciudad,
    barrio: publicacion.barrio ?? undefined,
    codigoPostal: publicacion.codigoPostal ?? undefined,
    direccion: publicacion.direccion ?? undefined,
    latitud: Number(publicacion.latitud),
    longitud: Number(publicacion.longitud),
    superficieCubierta: aNumero(publicacion.superficieCubierta),
    superficieTotal: aNumero(publicacion.superficieTotal),
    ambientes: publicacion.ambientes ?? undefined,
    dormitorios: publicacion.dormitorios ?? undefined,
    banios: publicacion.banios ?? undefined,
    piso: publicacion.piso ?? undefined,
    orientacion: publicacion.orientacion ?? undefined,
    tieneCochera: publicacion.tieneCochera,
    antiguedadAnios: publicacion.antiguedadAnios ?? undefined,
    expensas: aNumero(publicacion.expensas),
    estadoInmueble: publicacion.estadoInmueble ?? undefined,
    videoUrl: publicacion.videoUrl ?? undefined,
    caracteristicaIds: publicacion.caracteristicas.map((c) => c.caracteristicaId),
    // El repositorio ya las trae ordenadas por `orden`, y la galería trata a la primera como
    // portada — el mismo criterio con el que se guardaron.
    imagenes: publicacion.imagenes.map((imagen) => ({
      publicId: imagen.publicId,
      url: imagen.url,
      urlThumbnail: imagen.urlThumbnail ?? imagen.url,
    })),
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar publicación</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Los cambios se aplican directo. Editar una publicación activa no la despublica.
        </p>
      </div>

      <FormularioPublicacion
        caracteristicas={caracteristicas}
        subidaDeImagenesDisponible={subidaDeImagenesHabilitada}
        publicacionId={publicacion.id}
        valoresIniciales={valoresIniciales}
      />
    </div>
  );
}
