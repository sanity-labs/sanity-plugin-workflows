import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
    passWithNoTests: true,
    setupFiles: [resolve(__dirname, '../shared/studio/__tests__/setup.ts')],
  },
})
