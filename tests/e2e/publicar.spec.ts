import { expect, test, type Page } from "@playwright/test";

import { crearCuentaVerificada, limpiarBase, publicacionesActivasDe } from "./ayudantes";

/**
 * Flujo 2 de 12.3: publicar un inmueble completo con el wizard → aparece en la búsqueda.
 *
 * El único punto que se simula es la subida a Cloudinary. Todo lo demás —los cuatro pasos, la
 * validación por paso, el guardado, la transición borrador → activa y la búsqueda pública— corre
 * de verdad contra Postgres.
 */

const EMAIL = "e2e-vendedor@example.com";
const PASSWORD = "unaContraseniaE2E123";
const TITULO = "Casa con patio en Villa Crespo";

test.beforeAll(async () => {
  await limpiarBase();
  await crearCuentaVerificada(EMAIL, PASSWORD);
});

/**
 * Intercepta la subida a Cloudinary y contesta lo que contestaría el servicio.
 *
 * Es el límite correcto para cortar: lo que se está probando es el circuito del vendedor, no la
 * API de un tercero. Pegarle de verdad haría que el test dependa de la red y de una cuenta, y
 * dejaría archivos basura en el Cloudinary del proyecto en cada corrida.
 */
async function simularSubidaDeImagen(page: Page) {
  await page.route("https://api.cloudinary.com/**", async (ruta) => {
    await ruta.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ public_id: "e2e/foto-de-prueba" }),
    });
  });
}

async function iniciarSesion(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("banner").getByText(EMAIL)).toBeVisible();
}

test("un vendedor publica un inmueble y aparece en la búsqueda", async ({ page }) => {
  await simularSubidaDeImagen(page);
  await iniciarSesion(page);

  await test.step("paso 1 — datos básicos", async () => {
    await page.goto("/dashboard/publicaciones/nueva");

    await page.getByLabel("Tipo de inmueble").selectOption("casa");
    await page.getByLabel("Operación").selectOption("venta");
    await page.getByLabel("Título").fill(TITULO);
    await page
      .getByLabel("Descripción")
      .fill(
        "Casa de tres ambientes con patio al fondo, cocina comedor y parrilla. " +
          "A cuatro cuadras de la estación.",
      );
    await page.getByLabel("Precio").fill("185000");
    await page.getByLabel("Moneda").selectOption("USD");
    await page.getByRole("button", { name: "Siguiente" }).click();
  });

  await test.step("paso 2 — ubicación", async () => {
    await page.getByLabel("Provincia").selectOption("CABA");
    await page.getByLabel("Ciudad").fill("Buenos Aires");
    await page.getByLabel("Barrio (opcional)").fill("Villa Crespo");

    // Se cargan las coordenadas a mano en vez de geocodificar: Nominatim admite 1 req/seg y es
    // un servicio externo gratuito. Que un test automatizado le pegue en cada corrida es
    // justamente el uso que su política pide evitar. El wizard ofrece esta salida por diseño —
    // la misma que usa quien tiene una dirección que Nominatim no encuentra.
    await page.getByRole("button", { name: /cargar las coordenadas a mano/i }).click();
    await page.getByLabel("Latitud").fill("-34.5998");
    await page.getByLabel("Longitud").fill("-58.4386");
    await page.getByRole("button", { name: "Siguiente" }).click();
  });

  await test.step("paso 3 — características", async () => {
    await page.getByLabel("Ambientes").fill("3");
    await page.getByLabel("Dormitorios").fill("2");
    await page.getByLabel("Baños").fill("1");
    await page.getByLabel("Superficie cubierta (m²)").fill("85");
    await page.getByRole("button", { name: "Siguiente" }).click();
  });

  await test.step("paso 4 — fotos y guardado", async () => {
    await page.setInputFiles('input[type="file"]', {
      name: "foto.jpg",
      mimeType: "image/jpeg",
      // Un JPEG mínimo real: el componente valida el tipo MIME, así que un buffer vacío no pasa.
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9]),
    });

    // La miniatura de portada aparece recién cuando la subida (simulada) terminó.
    await expect(page.getByRole("img", { name: "Foto de portada" })).toBeVisible();

    await page.getByRole("button", { name: "Guardar borrador" }).click();
  });

  await test.step("todavía no está en la búsqueda: nace como borrador", async () => {
    // 6.2: toda publicación nace borrador y se activa por una acción aparte. Si apareciera acá,
    // significaría que un inmueble a medio cargar ya es visible para cualquiera.
    await page.goto("/publicaciones");
    await expect(page.getByText(TITULO)).toHaveCount(0);
  });

  await test.step("se publica desde el dashboard", async () => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: /publicar/i })
      .first()
      .click();

    await expect(page.getByText(/activa/i).first()).toBeVisible();
    await expect(await publicacionesActivasDe(EMAIL)).toHaveLength(1);
  });

  await test.step("ahora sí aparece en la búsqueda pública", async () => {
    await page.goto("/publicaciones");

    await expect(page.getByRole("link", { name: new RegExp(TITULO, "i") })).toBeVisible();
  });

  await test.step("y se encuentra buscando por texto, sin acentos", async () => {
    // El índice full-text usa `sin_acentos()` sobre título y descripción: "villa crespo" tiene
    // que encontrar la publicación aunque se escriba distinto.
    await page.goto("/publicaciones?texto=villa+crespo");

    await expect(page.getByRole("link", { name: new RegExp(TITULO, "i") })).toBeVisible();
  });
});
