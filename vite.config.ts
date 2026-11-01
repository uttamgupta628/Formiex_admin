import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // In development, /api requests go to the Express backend
    proxy: { '/api': 'http://localhost:5000' },
  },
})
