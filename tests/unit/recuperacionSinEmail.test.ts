import { describe, expect, it, vi } from "vitest";

const buscar = vi.hoisted(() => vi.fn());
vi.mock("@/shared/lib/emailSender", () => ({
  emailDeAuthDisponible: false,
  enviarEmail: vi.fn(),
}));
vi.mock("@/features/usuarios/usuarioRepository", () => ({
  buscarUsuarioPorEmail: buscar,
}));
vi.mock("@/shared/lib/rateLimiters", () => ({ consumirIntento: vi.fn() }));
vi.mock("@/features/auth/emisionDeTokens", () => ({
  emitirYEnviarRecuperacionPassword: vi.fn(),
  emitirYEnviarVerificacionEmail: vi.fn(),
}));

import { reenviarVerificacion } from "@/features/auth/actions/reenviarVerificacion";
import { solicitarRecuperacionPassword } from "@/features/auth/actions/solicitarRecuperacionPassword";

describe("servicio de email sin configurar en producción", () => {
  it.each([solicitarRecuperacionPassword, reenviarVerificacion])(
    "avisa el fallo global sin consultar si existe la cuenta",
    async (accion) => {
      const existente = await accion({ email: "registrado@example.com" });
      const desconocido = await accion({ email: "desconocido@example.com" });
      expect(existente).toEqual(desconocido);
      expect(existente).toMatchObject({
        ok: false,
        mensaje: expect.stringContaining("emails no está disponible"),
      });
      expect(buscar).not.toHaveBeenCalled();
    },
  );
});
