import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requerirUsuario } from "@/features/auth/sessionQueries";
import { FormularioPerfil } from "@/features/usuarios/components/FormularioPerfil";
import { buscarPerfilDeUsuario } from "@/features/usuarios/usuarioRepository";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PaginaPerfil() {
  // Perfil siempre desde la base por el id firmado de la sesión; el nombre del JWT puede haber
  // quedado anterior a una edición hecha desde otra pestaña.
  const usuario = await requerirUsuario("/dashboard/perfil");
  const perfil = await buscarPerfilDeUsuario(usuario.id);
  if (!perfil) notFound();

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <div>
        <p className="text-primary text-sm font-medium">Tu cuenta</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mi perfil</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Mantené actualizados los datos que compartís con quienes consultan tus
          inmuebles.
        </p>
      </div>
      <FormularioPerfil
        nombre={perfil.name ?? ""}
        telefono={perfil.telefono}
        email={perfil.email}
      />
    </div>
  );
}
