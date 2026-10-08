import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Vendor bundles are split out so that shipping a copy-text change does not
 * invalidate the React and Firebase payloads in every visitor's cache.
 */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('@firebase') || id.includes('firebase')) return 'firebase'
  if (id.includes('react')) return 'react'
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    // The Firebase SDK is ~166 KB gzipped and is deliberately kept in its own
    // long-lived chunk so shipping a UI change does not invalidate it. Raising
    // the limit here documents that the size is understood rather than ignored.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})