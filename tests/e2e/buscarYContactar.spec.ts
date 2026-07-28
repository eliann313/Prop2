import { expect, test } from "@playwright/test";

import {
  crearCuentaVerificada,
  crearPublicacionActiva,
  limpiarBase,
  mensajesDePublicacion,
} from "./ayudantes";

/**
 * Flujo 3 de 12.3: buscar con filtros → abrir el detalle → contactar por el formulario.
 *
 * Es el circuito del COMPRADOR, y se recorre sin sesión a propósito: pedir cuenta para preguntar
 * por un inmueble agrega fricción real (3.4/6.6), así que que funcione anónimo es parte de lo que
 * hay que verificar, no un atajo del test.
 */

const VENDEDOR = "e2e-duenio@example.com";
const BUSCADA = "Departamento en Palermo con balcón";
const OTRA = "Casa quinta en Pilar";

let idBuscada = "";

test.beforeAll(async () => {
  await limpiarBase();
  await crearCuentaVerificada(VENDEDOR, "unaContraseniaE2E123");

  idBuscada = await crearPublicacionActiva(VENDEDOR, {
    titulo: BUSCADA,
    ciudad: "Buenos Aires",
    precio: 145000,
    operacion: "venta",
  });
  await crearPublicacionActiva(VENDEDOR, {
    titulo: OTRA,
    ciudad: "Pilar",
    precio: 320000,
    operacion: "alquiler",
  });
});

test("un visitante sin cuenta busca, filtra, abre el detalle y consulta", async ({
  page,
}) => {
  await test.step("el listado muestra las dos publicaciones activas", async () => {
    await page.goto("/publicaciones");

    await expect(
      page.getByRole("link", { name: new RegExp(BUSCADA, "i") }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(OTRA, "i") })).toBeVisible();
  });

  await test.step("el filtro por operación deja una sola", async () => {
    await page.goto("/publicaciones?operacion=venta");

    await expect(
      page.getByRole("link", { name: new RegExp(BUSCADA, "i") }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(OTRA, "i") })).toHaveCount(0);
  });

  await test.step("la búsqueda por texto ignora los acentos", async () => {
    // El índice full-text pasa por `sin_acentos()`: escribir "balcon" sin tilde tiene que
    // encontrar "balcón". Es la razón por la que la migración define esa función.
    await page.goto("/publicaciones?texto=balcon");

    await expect(
      page.getByRole("link", { name: new RegExp(BUSCADA, "i") }),
    ).toBeVisible();
  });

  await test.step("el detalle abre con la URL canónica", async () => {
    await page.goto("/publicaciones?texto=balcon");
    await page.getByRole("link", { name: new RegExp(BUSCADA, "i") }).click();

    // El slug tiene que estar en la URL y el uuid al final (9.1). Si el link llevara al uuid
    // pelado, cada visita desde el listado pagaría un 308 antes de ver nada.
    await expect(page).toHaveURL(
      new RegExp(`/publicaciones/departamento-en-palermo-con-balcon-${idBuscada}$`),
    );
    await expect(page.getByRole("heading", { name: BUSCADA })).toBeVisible();
  });

  await test.step("consulta al vendedor sin estar logueado", async () => {
    await page.getByLabel("Nombre").fill("Persona interesada");
    await page.getByLabel("Email").fill("interesada@example.com");
    await page
      .getByLabel(/mensaje/i)
      .fill("Hola, me interesa el departamento. ¿Se puede visitar el fin de semana?");
    await page.getByRole("button", { name: /enviar/i }).click();

    await expect(page.getByText(/consulta enviada/i)).toBeVisible();
  });

  await test.step("el mensaje quedó guardado, no solo mostrado", async () => {
    // Se guarda ANTES de intentar el email a propósito: si Resend falla, el vendedor igual ve
    // la consulta en su panel. Verificarlo en la base es la única forma de distinguir "se
    // guardó" de "el cartel de éxito apareció".
    const mensajes = await mensajesDePublicacion(idBuscada);

    expect(mensajes).toHaveLength(1);
    expect(mensajes[0]!.nombre_contacto).toBe("Persona interesada");
    expect(mensajes[0]!.mensaje).toContain("fin de semana");
  });
});
