import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolución nativa de los `paths` del tsconfig (el alias `@/`). Reemplaza al plugin
    // vite-tsconfig-paths, que Vite ya marca como innecesario en esta versión.
    tsconfigPaths: true,
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
