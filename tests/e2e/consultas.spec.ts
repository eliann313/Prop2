import { expect, test } from "@playwright/test";

import {
  crearConsultaDePrueba,
  crearCuentaVerificada,
  crearPublicacionActiva,
  limpiarBase,
} from "./ayudantes";

const EMAIL = "e2e-consultas@example.com";
const PASSWORD = "ContraseniaConsultasE2E2026";
let ajena = "";

test.beforeAll(async () => {
  await limpiarBase();
  await crearCuentaVerificada(EMAIL, PASSWORD);
  await crearCuentaVerificada("e2e-consultas-ajenas@example.com", PASSWORD);
  const propia = await crearPublicacionActiva(EMAIL, {
    titulo: "Casa con consultas",
    ciudad: "Buenos Aires",
    precio: 145000,
    operacion: "venta",
  });
  ajena = await crearPublicacionActiva("e2e-consultas-ajenas@example.com", {
    titulo: "Casa de otra cuenta",
    ciudad: "Buenos Aires",
    precio: 145000,
    operacion: "venta",
  });
  for (let indice = 0; indice < 11; indice++)
    await crearConsultaDePrueba(propia, `Contacto ${indice}`);
  await crearConsultaDePrueba(propia, "Persona principal");
  await crearConsultaDePrueba(ajena, "Consulta privada ajena");
});

test("el vendedor pagina sus consultas y cambia su estado sin acceder a las ajenas", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page
    .getByRole("navigation", { name: "Mi cuenta" })
    .getByRole("link", { name: "Consultas recibidas" })
    .click();
  const main = page.getByRole("main");
  await expect(main.getByText("12 consultas", { exact: true })).toBeVisible();
  await expect(main.getByText("Consulta privada ajena")).toHaveCount(0);
  await main.getByRole("button", { name: /Persona principal: leída/ }).click();
  await expect(
    main.getByRole("button", { name: /Persona principal: atendida/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    main.getByRole("button", { name: /Persona principal: atendida/ }),
  ).toBeVisible();
  await main.getByRole("button", { name: /Persona principal: atendida/ }).click();
  await expect(
    main.getByRole("button", { name: /Persona principal: nueva/ }),
  ).toBeVisible();

  await main.getByLabel("Estado", { exact: true }).selectOption("atendida");
  await main.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(main.getByText("1 consulta", { exact: true })).toBeVisible();
  await expect(main.getByText("Persona principal", { exact: true })).toBeVisible();
  await main.getByRole("link", { name: "Quitar filtro", exact: true }).click();
  await main
    .getByRole("navigation", { name: "Paginación de consultas" })
    .getByRole("link", { name: "Siguiente" })
    .click();
  await expect(main.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Responder por email" })).toHaveCount(2);

  for (const ancho of [320, 375, 1440]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(ancho);
    await page.screenshot({
      path: testInfo.outputPath(`consultas-${ancho}.png`),
      fullPage: true,
    });
  }
  await page.goto(`/dashboard/mensajes?publicacionId=${ajena}`);
  await expect(main.getByText("0 consultas", { exact: true })).toBeVisible();
  await expect(main.getByText("Consulta privada ajena")).toHaveCount(0);
});
