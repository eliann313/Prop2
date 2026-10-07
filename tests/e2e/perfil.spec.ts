import { expect, test } from "@playwright/test";

import { crearCuentaVerificada, crearPublicacionActiva, limpiarBase } from "./ayudantes";

const EMAIL = "e2e-perfil@example.com";
const PASSWORD = "unaContraseniaE2E123";
const TITULO = "Casa de prueba para perfil";
let publicacionId = "";

test.beforeAll(async () => {
  await limpiarBase();
  await crearCuentaVerificada(EMAIL, PASSWORD);
  publicacionId = await crearPublicacionActiva(EMAIL, {
    titulo: TITULO,
    ciudad: "Buenos Aires",
    precio: 145000,
    operacion: "venta",
  });
});

test("el dueño actualiza y quita el teléfono de contacto", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await page
    .getByRole("navigation", { name: "Mi cuenta" })
    .getByRole("link", { name: "Mi perfil" })
    .click();
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("readonly", "");
  await page.getByLabel("Nombre", { exact: true }).fill("Vendedora E2E");
  await page.getByLabel("Teléfono para contacto (opcional)").fill("+54 9 11 2345-6789");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByRole("status")).toContainText("Perfil actualizado");
  await page.reload();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Vendedora E2E");
  await expect(page.getByLabel("Teléfono para contacto (opcional)")).toHaveValue(
    "+5491123456789",
  );
  for (const ancho of [320, 375, 1440]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(ancho);
    await page.screenshot({
      path: testInfo.outputPath(`perfil-${ancho}.png`),
      fullPage: true,
    });
  }
  await page.goto(`/publicaciones/${publicacionId}`);
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toBeVisible();

  await page.goto("/dashboard/perfil");
  await page.getByLabel("Teléfono para contacto (opcional)").fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil actualizado");
  await page.reload();
  await expect(page.getByLabel("Teléfono para contacto (opcional)")).toHaveValue("");

  await page.goto(`/publicaciones/${publicacionId}`);
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveCount(0);
});
