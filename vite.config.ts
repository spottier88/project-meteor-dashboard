
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Alias pour le package GitHub
      "@wamra/gantt-task-react": "gantt-task-react",
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['gantt-task-react'],
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
