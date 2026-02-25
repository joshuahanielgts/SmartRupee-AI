import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173
  },
  build: {
    // Vercel/Netlify default output
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts', 'react-toastify'],
          'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'spline': ['@splinetool/react-spline', '@splinetool/runtime'],
        },
      },
    },
    chunkSizeWarningLimit: 2500,
  },
})
