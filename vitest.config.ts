import { defineConfig } from "vitest/config";

// separado do vite.config.ts para o vitest não carregar o plugin Solid
export default defineConfig({
  test: {
    environment: "node",
  },
});
