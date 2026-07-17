import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANTE: troque 'bolao-mega-pro' pelo nome exato do seu repositório no GitHub.
// Se o repositório se chamar diferente, o base tem que bater, senão os assets
// não carregam no GitHub Pages (tela branca).
export default defineConfig({
  plugins: [react()],
  base: '/bolao-mega-pro/',
  build: {
    outDir: 'dist',
  },
})
