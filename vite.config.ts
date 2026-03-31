import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'glob',
      formats: ['es', 'cjs', 'iife'],
      fileName: 'main',
    },
  },
  plugins: [dts({ rollupTypes: true })],
})
