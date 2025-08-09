import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: './',
  plugins: [sveltekit(), tailwindcss()],

  // Build optimizations
  build: {
    // Enable minification
    minify: true,
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('svelte')) {
              return 'svelte';
            }
            // Don't chunk Tauri modules as they're external
            if (id.includes('@tauri-apps')) {
              return null;
            }
            return 'vendor';
          }
          // UI components chunk
          if (id.includes('src/lib/components/UI/')) {
            return 'ui';
          }
          // Utils chunk
          if (id.includes('src/lib/utils/')) {
            return 'utils';
          }
        },
      },
    },
    // Target modern browsers for better optimization
    target: 'esnext',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // Performance optimizations
  optimizeDeps: {
    include: ['svelte', 'svelte/transition', 'svelte/easing'],
    exclude: ['@tauri-apps/api'],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
