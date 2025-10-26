import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Option C: Full Preact replacement with @preact/preset-vite
// React and react-dom completely removed for smallest bundle size
export default defineConfig({
  plugins: [preact()]
})
