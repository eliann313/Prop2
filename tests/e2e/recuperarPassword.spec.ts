import { expect, test } from "@playwright/test";

import { crearCuentaVerificada, limpiarBase, linkDeRecuperacion } from "./ayudantes";

const EMAIL = "e2e-recuperacion@example.com";
const PASSWORD_ANTERIOR = "ContraseniaAnteriorE2E123";
const PASSWORD_NUEVA = "ContraseniaNuevaE2E2026";

test.beforeAll(async () => {
  await limpiarBase();
  await crearCuentaVerificada(EMAIL, PASSWORD_ANTERIOR);
});

test("recupera el acceso, revoca sesiones anteriores y no acepta el enlace usado", async ({
  page,
  browser,
}, testInfo) => {
  const contextoAnterior = await browser.newContext();
  const sesionAnterior = await contextoAnterior.newPage();
  try {
    await sesionAnterior.goto("/login");
    await sesionAnterior.getByLabel("Email").fill(EMAIL);
    await sesionAnterior
      .getByLabel("Contraseña", { exact: true })
      .fill(PASSWORD_ANTERIOR);
    await sesionAnterior.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(sesionAnterior.getByRole("banner").getByText(EMAIL)).toBeVisible();
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toHaveCount(
      0,
    );
    await page.getByLabel("Email").fill(EMAIL);
    for (const ancho of [375, 1440]) {
      await page.setViewportSize({ width: ancho, height: 960 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(ancho);
      await page.screenshot({
        path: testInfo.outputPath(`login-${ancho}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 375, height: 960 });
    await page.getByRole("link", { name: /olvid.*contraseña/i }).click();
    await expect(page.getByLabel("Email")).toHaveValue(EMAIL);
    await page.screenshot({
      path: testInfo.outputPath("recuperacion-375.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Enviarme el link" }).click();
    // La app de test es un build de producción SIN proveedor real: no debe prometer que envió un email.
    await expect(page.getByRole("status")).toContainText(
      "El servicio de emails no está disponible",
    );

    const link = await linkDeRecuperacion(EMAIL);
    await page.goto(link);
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(PASSWORD_NUEVA);
    await page.getByLabel("Repetí la contraseña", { exact: true }).fill(PASSWORD_NUEVA);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByRole("status")).toContainText("Contraseña actualizada");
    await sesionAnterior.goto("/dashboard");
    await expect(sesionAnterior).toHaveURL(/\/login(?:\?|$)/);
    await expect(
      sesionAnterior.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Ir a iniciar sesión" }).click();
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD_ANTERIOR);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Email o contraseña incorrectos",
    );
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD_NUEVA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      page.getByRole("banner").getByRole("button", { name: /cerrar sesión/i }),
    ).toBeVisible();
    for (const ancho of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width: ancho, height: 960 });
      await page.goto("/dashboard");
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Mis publicaciones" }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(ancho);
    }

    await page.goto(link);
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(PASSWORD_NUEVA);
    await page.getByLabel("Repetí la contraseña", { exact: true }).fill(PASSWORD_NUEVA);
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByRole("status")).toContainText("El link no es válido o venció");
    await expect(page.getByRole("link", { name: "Pedí uno nuevo" })).toBeVisible();
  } finally {
    await contextoAnterior.close();
  }
});
