import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 69,
      functions: 91,
      branches: 82,
      statements: 69,
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/tests/**',
        'src/index.ts',
        'src/types/index.ts',
        'vitest.config.ts'
      ],
      thresholds: {
        lines: 69,
        functions: 91,
        branches: 82,
        statements: 69
      }
    }
  }
})
