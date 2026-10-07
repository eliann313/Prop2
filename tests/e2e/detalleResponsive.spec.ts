import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  agregarFotosDePrueba,
  crearCuentaVerificada,
  crearPublicacionActiva,
  limpiarBase,
} from "./ayudantes";

const TITULO = "Departamento luminoso con balcón en Palermo";
let publicacionId = "";

test.beforeAll(async () => {
  await limpiarBase();
  const email = "e2e-detalle@example.com";
  await crearCuentaVerificada(email, "ContraseniaDePrueba2026");
  publicacionId = await crearPublicacionActiva(email, {
    titulo: TITULO,
    ciudad: "Buenos Aires",
    precio: 135000,
    operacion: "venta",
  });
  await agregarFotosDePrueba(publicacionId);
});

test("la ficha se adapta al ancho y permite recorrer fotos por teclado", async ({
  page,
}, testInfo) => {
  const fotos = ["casa-belgrano.jpg", "hero-recoleta.jpg"].map((nombre) =>
    readFileSync(join(process.cwd(), "public", "images", nombre)),
  );
  await page.route("**/_next/image?*", async (ruta) => {
    const original = new URL(ruta.request().url()).searchParams.get("url") ?? "";
    if (!original.includes("/demo-e2e/image/upload/ui/")) return ruta.continue();
    return ruta.fulfill({
      status: 200,
      contentType: "image/jpeg",
      body: fotos[original.includes("foto-1") ? 1 : 0],
    });
  });

  for (const ancho of [320, 375, 768, 1024, 1440]) {
    await test.step(`ficha a ${ancho}px`, async () => {
      await page.setViewportSize({ width: ancho, height: 960 });
      await page.goto(`/publicaciones/${publicacionId}`);
      await expect(page.getByRole("heading", { name: TITULO })).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Cargando publicaciones similares" }),
      ).toHaveCount(0);
      const galeria = page.getByRole("group", { name: "Fotos de la publicación" });
      const foto = galeria.getByRole("img", { name: /imagen 1 de 2/ });
      await expect(foto).toBeVisible();
      await expect
        .poll(() => foto.evaluate((imagen) => (imagen as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      const columnaFoto = await galeria.boundingBox();
      const contacto = await page.locator("article aside").boundingBox();
      const descripcion = await page
        .getByRole("heading", { name: "Descripción", exact: true })
        .boundingBox();
      expect(columnaFoto!.x).toBeGreaterThanOrEqual(16);
      expect(columnaFoto!.x + columnaFoto!.width).toBeLessThanOrEqual(ancho - 16);
      if (ancho >= 1024) {
        expect(Math.abs(contacto!.y - columnaFoto!.y)).toBeLessThan(2);
        expect(contacto!.x).toBeGreaterThan(columnaFoto!.x + columnaFoto!.width);
        expect((await foto.boundingBox())!.height).toBeLessThan(540);
      } else {
        expect(contacto!.y).toBeGreaterThan(columnaFoto!.y + columnaFoto!.height);
        expect(descripcion!.y).toBeGreaterThan(contacto!.y + contacto!.height);
        await expect(
          page.getByRole("banner").getByRole("link", { name: "Buscar publicaciones" }),
        ).toBeVisible();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(ancho);
      // Dar tiempo a los tiles para la captura; la disponibilidad del proveedor externo
      // no forma parte de las aserciones sobre el diseño de la ficha.
      await page
        .waitForFunction(
          () => {
            const tiles = document.querySelectorAll<HTMLImageElement>(".leaflet-tile");
            return (
              tiles.length > 0 &&
              Array.from(tiles).every((tile) => tile.complete && tile.naturalWidth > 0)
            );
          },
          undefined,
          { timeout: 5_000 },
        )
        .catch(() => undefined);
      await page.screenshot({
        path: testInfo.outputPath(`detalle-${ancho}.png`),
        fullPage: true,
      });
    });
  }

  const galeria = page.getByRole("group", { name: "Fotos de la publicación" });
  await galeria.getByRole("button", { name: "Ver imagen siguiente" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(galeria.getByRole("img", { name: /imagen 2 de 2/ })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(galeria.getByRole("img", { name: /imagen 1 de 2/ })).toBeVisible();
});
