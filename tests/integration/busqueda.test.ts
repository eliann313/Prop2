import { describe, expect, it } from "vitest";

import { construirCriterios } from "@/features/busqueda/services/criteriosDeBusqueda";
import { parsearFiltros } from "@/features/busqueda/busquedaSchemas";
import { buscarPublicaciones } from "@/features/busqueda/publicacionBusquedaRepository";
import { cambiarEstado } from "@/features/publicaciones/publicacionRepository";

import { crearPublicacionDePrueba, crearUsuarioDePrueba } from "./ayudantes";

describe("búsqueda paginada", () => {
  it("conserva el total al pedir una página vacía después de 1 a 12 coincidencias", async () => {
    const usuario = await crearUsuarioDePrueba();

    for (let indice = 0; indice < 7; indice++) {
      const publicacion = await crearPublicacionDePrueba(usuario.id, {
        titulo: `Departamento publicado ${indice}`,
      });
      await cambiarEstado(publicacion.id, usuario.id, "activa", true);
    }

    const paginaDos = await buscarPublicaciones(
      construirCriterios(parsearFiltros({ provincia: "CABA", pagina: "2" })),
    );
    const paginaUno = await buscarPublicaciones(
      construirCriterios(parsearFiltros({ provincia: "CABA", pagina: "1" })),
    );

    expect(paginaDos.resultados).toHaveLength(0);
    expect(paginaDos.total).toBe(7);
    expect(paginaUno.resultados).toHaveLength(7);
    expect(paginaUno.total).toBe(7);
  });

  it("devuelve cero cuando no hay coincidencias aunque se pida una página posterior", async () => {
    const resultado = await buscarPublicaciones(
      construirCriterios(
        parsearFiltros({ ciudad: "Ciudad sin publicaciones", pagina: "2" }),
      ),
    );

    expect(resultado.resultados).toHaveLength(0);
    expect(resultado.total).toBe(0);
  });
});
