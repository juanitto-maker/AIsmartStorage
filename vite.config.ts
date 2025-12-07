import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

// Check if building for Tauri
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Externalize Tauri APIs for web builds
      external: isTauri ? [] : [
        '@tauri-apps/api/core',
        '@tauri-apps/api/event',
        '@tauri-apps/api',
      ],
    },
  },
  // Tauri expects a fixed port
  clearScreen: false,
});
