import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '3000'; // قيمة افتراضية
const port = Number(rawPort);
const basePath = process.env.BASE_PATH || '/'; // قيمة افتراضية

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay() as unknown as PluginOption,
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }) as unknown as PluginOption,
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner() as unknown as PluginOption,
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    target: 'esnext', // ⬅️ هادي هي اللي كتحل مشكل البناء
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext', // ⬅️ وهادي كتحل مشكل pre-bundling فـ dev
    },
  },
 server: {
  port,
  strictPort: true,
  host: '0.0.0.0',
  allowedHosts: true,
  fs: {
    strict: true,
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
},
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});