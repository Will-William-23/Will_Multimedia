import { defineConfig } from 'vite';

// Configuración optimizada para Tauri v2
export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Ignorar src-tauri para evitar bloqueos EBUSY en Windows durante compilación de Rust
      ignored: ['**/src-tauri/**'],
    },
  },
});
