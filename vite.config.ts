import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// base = subcaminho do repositório no GitHub Pages (projeto pages, não user pages)
export default defineConfig({
  base: "/low-level-cpu-simulator/",
  plugins: [solid()],
});
