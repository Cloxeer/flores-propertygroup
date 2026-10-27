import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Builds into ../public so Halite's static preview and GitHub Pages serve the compiled app.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  css: { postcss: {} }, // inline empty config: stops Vite from picking up the Halite repo-root postcss.config.mjs (Tailwind v3)
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "../public", emptyOutDir: true },
});
