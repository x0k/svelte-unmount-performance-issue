import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
