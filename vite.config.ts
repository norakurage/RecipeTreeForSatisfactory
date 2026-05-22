import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/RecipeTreeForSatisfactory/',
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
})
