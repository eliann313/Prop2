import { describe, expect, it } from "vitest";

import {
  actualizarEstadoMensajeDelVendedor,
  contarMensajesPorEstadoDelVendedor,
  crearMensaje,
  listarMensajesDelVendedor,
} from "@/features/contacto/mensajeContactoRepository";

import { crearPublicacionDePrueba, crearUsuarioDePrueba } from "./ayudantes";

async function enviarConsulta(
  publicacionId: string,
  mensaje = "Quisiera coordinar una visita.",
) {
  return crearMensaje({
    publicacionId,
    usuarioId: null,
    nombreContacto: "Persona interesada",
    emailContacto: "interesada@example.com",
    mensaje,
    medioContacto: "formulario",
  });
}

describe("bandeja de consultas del vendedor", () => {
  it("lista solo mensajes propios y rechaza una mutación con dueño ajeno", async () => {
    const dueno = await crearUsuarioDePrueba();
    const intruso = await crearUsuarioDePrueba();
    const publicacion = await crearPublicacionDePrueba(dueno.id);
    const consulta = await enviarConsulta(publicacion.id);

    await expect(
      listarMensajesDelVendedor(intruso.id, { pagina: 1 }),
    ).resolves.toMatchObject({ total: 0, resultados: [] });
    await expect(
      actualizarEstadoMensajeDelVendedor(intruso.id, consulta.id, "atendida"),
    ).resolves.toBe(false);

    await expect(
      listarMensajesDelVendedor(dueno.id, { pagina: 1 }),
    ).resolves.toMatchObject({
      total: 1,
      resultados: [{ id: consulta.id, estado: "nueva" }],
    });
  });

  it("persiste las transiciones de estado y cuenta por estado", async () => {
    const vendedor = await crearUsuarioDePrueba();
    const publicacion = await crearPublicacionDePrueba(vendedor.id);
    const consulta = await enviarConsulta(publicacion.id);

    await expect(
      actualizarEstadoMensajeDelVendedor(vendedor.id, consulta.id, "leida"),
    ).resolves.toBe(true);
    await expect(
      listarMensajesDelVendedor(vendedor.id, { estado: "leida", pagina: 1 }),
    ).resolves.toMatchObject({
      total: 1,
      resultados: [{ id: consulta.id, estado: "leida" }],
    });

    await actualizarEstadoMensajeDelVendedor(vendedor.id, consulta.id, "atendida");
    await expect(
      contarMensajesPorEstadoDelVendedor(vendedor.id, publicacion.id),
    ).resolves.toEqual([{ estado: "atendida", _count: { _all: 1 } }]);
  });

  it("conserva owner y filtro de publicación mientras recorre páginas", async () => {
    const vendedor = await crearUsuarioDePrueba();
    const otraPersona = await crearUsuarioDePrueba();
    const publicacion = await crearPublicacionDePrueba(vendedor.id);
    const otraPublicacion = await crearPublicacionDePrueba(vendedor.id, {
      titulo: "Casa de prueba con patio",
    });
    const ajena = await crearPublicacionDePrueba(otraPersona.id);

    for (let indice = 0; indice < 12; indice++) {
      await enviarConsulta(publicacion.id, `Consulta ${indice}`);
    }
    await enviarConsulta(otraPublicacion.id, "Consulta de otra publicación propia");
    await enviarConsulta(ajena.id, "Consulta completamente ajena");

    const primera = await listarMensajesDelVendedor(vendedor.id, {
      publicacionId: publicacion.id,
      pagina: 1,
    });
    const segunda = await listarMensajesDelVendedor(vendedor.id, {
      publicacionId: publicacion.id,
      pagina: 2,
    });

    expect(primera.total).toBe(12);
    expect(primera.resultados).toHaveLength(10);
    expect(segunda.total).toBe(12);
    expect(segunda.resultados).toHaveLength(2);
    const resultados = [...primera.resultados, ...segunda.resultados];
    expect(new Set(resultados.map(({ id }) => id)).size).toBe(12);
    expect(
      resultados.every(
        ({ publicacion: relacionada }) => relacionada.id === publicacion.id,
      ),
    ).toBe(true);
    expect(
      resultados.every((mensaje, indice) => {
        const siguiente = resultados[indice + 1];
        if (!siguiente) return true;
        return mensaje.createdAt >= siguiente.createdAt;
      }),
    ).toBe(true);
  });
});
