import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolución nativa de los `paths` del tsconfig (el alias `@/`). Reemplaza al plugin
    // vite-tsconfig-paths, que Vite ya marca como innecesario en esta versión.
    tsconfigPaths: true,
    alias: {
      // `server-only` existe para ROMPER el build si un módulo de servidor se importa desde el
      // cliente, y lo hace lanzando al ser importado fuera del runtime react-server. Los tests
      // no corren en ese runtime, así que sin este stub cualquier test que toque un módulo de
      // shared/lib fallaría por el import, no por lo que se está testeando. Es el mismo
      // problema que los scripts fuera de Next resuelven con un tsconfig temporal.
      //
      // `fileURLToPath` y no `.pathname`: en Windows este último devuelve "/C:/..." con los
      // espacios de la ruta escapados como %20, y Vite no resuelve ninguna de las dos cosas.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/serverOnly.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Se mide cobertura sobre el código propio: el generado por Prisma y los primitivos de
      // shadcn/ui (que son código copiado de terceros) distorsionarían el número.
      include: ["src/features/**", "src/shared/utils/**"],
      exclude: ["src/generated/**", "src/shared/components/ui/**"],
    },
  },
});
