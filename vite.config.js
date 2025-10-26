import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using aliasing to route react/react-dom imports to preact/compat
// This is the conservative Option A approach: runtime is served by Preact
// while keeping existing code and plugin setup. If this works, we can
// later switch to @preact/preset-vite for a cleaner integration.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  }
})
