import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const isCloudflareBuild = process.env.CLOUDFLARE_BUILD === "1";

export default defineConfig({
  root: "github-pages",
  base: isCloudflareBuild ? "/" : "/crimson-world/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "github-pages/index.html"),
        library: resolve(process.cwd(), "github-pages/library.html"),
      },
    },
  },
});
