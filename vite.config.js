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
        manualChunks: {
          // Vendor chunk for external dependencies
          vendor: ['svelte', 'svelte/transition', 'svelte/easing'],
          // Tauri specific chunk
          tauri: ['@tauri-apps/api', '@tauri-apps/plugin-clipboard-manager', '@tauri-apps/plugin-opener', '@tauri-apps/plugin-store'],
          // UI components chunk
          ui: ['src/lib/components/UI/AnimatedModal.svelte', 'src/lib/components/UI/Toaster.svelte'],
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
