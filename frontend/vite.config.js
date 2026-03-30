import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  // Use absolute paths for proper SPA routing; relative './' breaks nested routes
  // served by static servers (e.g., /patients/new resolves ./assets to /patients/assets/)
  base: '/',
  plugins: [react(), visualizer({ open: false, filename: 'dist/stats.html' })],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Existing splits
            if (id.includes('socket.io-client')) return 'socket-vendor';
            if (id.includes('recharts')) return 'chart-vendor';
            if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-')))
              return 'react-vendor';
            if (id.includes('react-router')) return 'react-vendor';

            // New splits — large vendors extracted from index chunk
            if (id.includes('lucide-react')) return 'icon-vendor';
            if (id.includes('@radix-ui')) return 'radix-vendor';
            if (id.includes('@tanstack')) return 'query-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            if (id.includes('@dnd-kit')) return 'dnd-vendor';
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod'))
              return 'form-vendor';
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
            if (id.includes('zustand')) return 'state-vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    pool: 'forks',
    teardownTimeout: 5000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
});
