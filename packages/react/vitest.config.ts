import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // メモリ制限対策 - 直列実行でメモリ使用量を削減
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    maxConcurrency: 1,
    isolate: true,

    // タイムアウト延長（直列実行により時間がかかる）
    testTimeout: 10000,
    hookTimeout: 10000,

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
        'src/hooks/index.ts',
        'vitest.config.ts'
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
