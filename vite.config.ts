import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for deployment (change if deploying to subdirectory)
  base: './',
  
  // Path aliases matching tsconfig
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@config': resolve(__dirname, './src/config'),
      '@scenes': resolve(__dirname, './src/scenes'),
      '@entities': resolve(__dirname, './src/entities'),
      '@systems': resolve(__dirname, './src/systems'),
      '@managers': resolve(__dirname, './src/managers'),
      '@services': resolve(__dirname, './src/services'),
      '@ui': resolve(__dirname, './src/ui'),
      '@utils': resolve(__dirname, './src/utils'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
  
  // Development server config
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: true,
  },
  
  // Build config
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    target: 'es2022',
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['phaser'],
    esbuildOptions: {
      target: 'es2022',
    },
  },
});
