import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 95,
      functions: 100,
      branches: 90,
      statements: 95,
      thresholds: {
        lines: 95,
        functions: 100,
        branches: 90,
        statements: 95
      }
    }
  }
})
