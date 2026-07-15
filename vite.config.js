import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or vue(), etc.

export default defineConfig({
  plugins: [react()],
  base: '/your-repository-name/', // Must match your exact repository name with slashes
})