import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerUsuarioActual, actualizarPerfilDeUsuario } = vi.hoisted(() => ({
  obtenerUsuarioActual: vi.fn(),
  actualizarPerfilDeUsuario: vi.fn(),
}));

vi.mock("@/features/auth/sessionQueries", () => ({ obtenerUsuarioActual }));
vi.mock("@/features/usuarios/usuarioRepository", () => ({ actualizarPerfilDeUsuario }));

import { actualizarPerfil } from "@/features/usuarios/actions/actualizarPerfil";

describe("actualizarPerfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actualizarPerfilDeUsuario.mockResolvedValue({});
  });

  it("rechaza una sesión vencida sin modificar la base", async () => {
    obtenerUsuarioActual.mockResolvedValue(null);

    await expect(
      actualizarPerfil({ nombre: "Ana Pérez", telefono: "+54 9 11 2345-6789" }),
    ).resolves.toMatchObject({ ok: false });
    expect(actualizarPerfilDeUsuario).not.toHaveBeenCalled();
  });

  it("usa el id de la sesión y solo escribe campos editables", async () => {
    obtenerUsuarioActual.mockResolvedValue({
      id: "dueña-actual",
      email: "ana@example.com",
    });

    await expect(
      actualizarPerfil({ nombre: "Ana Pérez", telefono: "+54 9 11 2345-6789" }),
    ).resolves.toMatchObject({ ok: true });

    expect(actualizarPerfilDeUsuario).toHaveBeenCalledOnce();
    expect(actualizarPerfilDeUsuario).toHaveBeenCalledWith("dueña-actual", {
      nombre: "Ana Pérez",
      telefono: "+5491123456789",
    });
  });

  it("permite borrar el teléfono con el campo vacío", async () => {
    obtenerUsuarioActual.mockResolvedValue({ id: "dueña-actual" });

    await expect(
      actualizarPerfil({ nombre: "Ana Pérez", telefono: "" }),
    ).resolves.toMatchObject({ ok: true });

    expect(actualizarPerfilDeUsuario).toHaveBeenCalledWith("dueña-actual", {
      nombre: "Ana Pérez",
      telefono: null,
    });
  });

  it("rechaza un intento de inyectar id, rol o email en el payload", async () => {
    obtenerUsuarioActual.mockResolvedValue({ id: "dueña-actual" });

    await expect(
      actualizarPerfil({
        nombre: "Ana Pérez",
        telefono: "+54 9 11 2345-6789",
        id: "otra-persona",
        rol: "admin",
        email: "atacante@example.com",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(actualizarPerfilDeUsuario).not.toHaveBeenCalled();
  });
});
