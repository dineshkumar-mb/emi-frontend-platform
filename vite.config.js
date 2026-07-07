import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('xlsx') || id.includes('lucide-react')) return 'utils';
            return 'vendor'; // all other node_modules
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
