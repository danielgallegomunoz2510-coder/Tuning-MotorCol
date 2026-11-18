import { defineConfig } from 'vite';

// Configuración de Vite para Tunning Motorcol.
// - base relativa para que el build funcione servido desde cualquier subruta.
// - assetsInlineLimit en 0 para no incrustar binarios grandes (modelos/texturas).
const SUPABASE_ORIGIN = 'https://fldpzahayuoskjkbumzb.supabase.co';

const supabaseProxy = {
  '/supabase-api': {
    target: SUPABASE_ORIGIN,
    changeOrigin: true,
    secure: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/supabase-api/, ''),
  },
};

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
    proxy: supabaseProxy,
  },
  preview: {
    proxy: supabaseProxy,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
  },
});
