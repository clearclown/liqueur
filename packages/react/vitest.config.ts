import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 92,
      functions: 94,
      branches: 90,
      statements: 92,
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/tests/**',
        'src/index.ts',
        'src/hooks/index.ts'
      ],
      thresholds: {
        lines: 92,
        functions: 94,
        branches: 90,
        statements: 92
      }
    }
  }
})
