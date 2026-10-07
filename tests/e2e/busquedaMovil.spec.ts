import { expect, test } from "@playwright/test";

import { crearCuentaVerificada, crearPublicacionActiva, limpiarBase } from "./ayudantes";

const VENTA = "Departamento con balcón en venta";
const ALQUILER = "Departamento con balcón en alquiler";

test.beforeAll(async () => {
  await limpiarBase();
  const email = "e2e-busqueda-movil@example.com";
  await crearCuentaVerificada(email, "ContraseniaBusquedaE2E2026");
  for (const [titulo, operacion] of [
    [VENTA, "venta"],
    [ALQUILER, "alquiler"],
  ] as const) {
    await crearPublicacionActiva(email, {
      titulo,
      ciudad: "Buenos Aires",
      precio: 135000,
      operacion,
    });
  }
});

test("los filtros móviles se despliegan y quitar uno conserva los demás", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/publicaciones?q=balcon&operacion=venta&pagina=1");
  const main = page.getByRole("main");
  const filtros = page.locator(".search-filters-disclosure");
  await expect(filtros).not.toHaveAttribute("open");
  await expect(main.getByLabel("Buscar", { exact: true })).toBeHidden();
  await expect(main.getByRole("link", { name: new RegExp(VENTA, "i") })).toBeVisible();
  await expect(main.getByRole("link", { name: new RegExp(ALQUILER, "i") })).toHaveCount(
    0,
  );
  await main.getByRole("link", { name: "Quitar filtro: Venta", exact: true }).click();
  await expect(page).toHaveURL(/\/publicaciones\?q=balcon$/);
  const parametros = new URL(page.url()).searchParams;
  expect(parametros.get("q")).toBe("balcon");
  expect(parametros.has("operacion")).toBe(false);
  expect(parametros.has("pagina")).toBe(false);
  await expect(main.getByRole("link", { name: new RegExp(ALQUILER, "i") })).toBeVisible();

  const abrir = filtros.locator("summary");
  await abrir.focus();
  await page.keyboard.press("Enter");
  await expect(main.getByLabel("Buscar", { exact: true })).toBeVisible();
  await main.getByLabel("Buscar", { exact: true }).fill("sin-coincidencias");
  await main.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(
    main.getByText("Ninguna publicación cumple con estos filtros."),
  ).toBeVisible();
  await main.getByRole("link", { name: "Quitar todos", exact: true }).click();
  await expect(page).toHaveURL(/\/publicaciones$/);
  await expect(main.getByRole("heading", { name: "2 publicaciones" })).toBeVisible();

  for (const ancho of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto("/publicaciones");
    if (ancho > 640) {
      await expect(main.getByLabel("Buscar", { exact: true })).toBeVisible();
    } else {
      await expect(main.getByLabel("Buscar", { exact: true })).toBeHidden();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(ancho);
    await page.screenshot({
      path: testInfo.outputPath(`busqueda-${ancho}.png`),
      fullPage: true,
    });
  }
});
