import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import localizeJsx from './build/localize-jsx.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [localizeJsx(), react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
