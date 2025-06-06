import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    fs: {
      // Allow serving files from the project root and the backend folder
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../backend')
      ]
    }
  }
});