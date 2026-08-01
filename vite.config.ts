import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANTE: troque 'bolao-mega-pro' pelo nome exato do seu repositório no GitHub.
export default defineConfig({
  plugins: [react()],
  base: '/bolao-mega-pro/',
  build: {
    outDir: 'dist',
  },
})
