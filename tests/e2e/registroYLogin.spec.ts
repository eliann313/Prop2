import { expect, test } from "@playwright/test";

import { limpiarBase, linkDeVerificacion } from "./ayudantes";

/**
 * Flujo 1 de 12.3: registro → verificación de email → login.
 *
 * Los selectores van por rol y nombre accesible (`getByLabel`, `getByRole`) y no por clase ni
 * por test-id. Es deliberado: así el test se rompe si un campo deja de tener label o un botón
 * deja de ser botón — que son bugs de accesibilidad reales— y no se rompe cuando alguien cambia
 * una clase de Tailwind, que no le importa a nadie.
 */

const EMAIL = "e2e-registro@example.com";
const PASSWORD = "unaContraseniaE2E123";

/** El link que se consume en el paso de verificación, para reusarlo en el último paso. */
let linkUsado = "";

test.beforeAll(limpiarBase);

test("una cuenta nueva se registra, verifica su email y entra", async ({ page }) => {
  await test.step("registro", async () => {
    await page.goto("/registro");

    await page.getByLabel("Nombre").fill("Persona de prueba");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // La respuesta es deliberadamente ambigua ("si el email es válido…"): el registro no puede
    // confirmar si una cuenta existe o no, o se vuelve un oráculo para enumerar emails (8.17).
    await expect(page.getByText(/te llega un mensaje para confirmar/i)).toBeVisible();
  });

  await test.step("no puede entrar sin verificar", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText(/no confirmaste tu email/i)).toBeVisible();
    // Sigue en el login: no hay sesión.
    await expect(page).toHaveURL(/\/login/);
  });

  await test.step("verificación por el link del email", async () => {
    // El token se inyecta porque en la base vive HASHEADO y el valor en claro solo existe dentro
    // del email: recuperarlo es imposible por diseño. Ver el porqué en ayudantes.ts.
    linkUsado = await linkDeVerificacion(EMAIL);
    await page.goto(linkUsado);

    await expect(page.getByText(/email confirmado/i).first()).toBeVisible();
  });

  await test.step("ahora sí entra", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // Se acota al encabezado (`banner`) porque el email también aparece en el cuerpo del
    // dashboard. Es la señal de que hay sesión de verdad y no un redirect suelto.
    const encabezado = page.getByRole("banner");
    await expect(encabezado.getByText(EMAIL)).toBeVisible();
    await expect(
      encabezado.getByRole("button", { name: /cerrar sesión/i }),
    ).toBeVisible();
  });

  await test.step("un token inventado se rechaza", async () => {
    await page.goto("/verificar-email?token=esto-no-existe");

    await expect(page.getByText(/no pudimos confirmarlo/i)).toBeVisible();
  });

  await test.step("volver a abrir el link ya usado no muestra un error", async () => {
    // Comportamiento deliberado y no un descuido: los escáneres de links de algunos clientes de
    // correo abren la URL antes que la persona, así que para cuando ella hace click el token ya
    // está consumido. Como el email QUEDÓ confirmado, el resultado que esperaba ya se cumplió y
    // mostrarle un error solo la confundiría. El token igual no se puede reutilizar para nada.
    await page.goto(linkUsado);

    await expect(page.getByText(/ya estaba confirmado/i)).toBeVisible();
  });
});
