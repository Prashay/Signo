import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 7200,
    watch: {
      ignored: ['**/release/**', '**/dist/**']
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3900',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:3900',
        ws: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 7200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3900',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:3900',
        ws: true
      }
    }
  }
})
