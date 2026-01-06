import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // SPA fallback - Vite handles this by default via index.html
  appType: 'spa',
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "worker_threads", replacement: path.resolve(__dirname, "./src/utils/empty-module.ts") },
      { find: "fs", replacement: path.resolve(__dirname, "./src/utils/empty-module.ts") },
      { find: "module", replacement: path.resolve(__dirname, "./src/utils/empty-module.ts") },
    ],
  },
  optimizeDeps: {
    exclude: ['worker_threads'],
  },
  build: {
    rollupOptions: {
      external: ['worker_threads'],
    },
  },
}));
