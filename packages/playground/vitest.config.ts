import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        '**/*.config.{ts,js}',
        '**/types/**',
      ],
      thresholds: {
        lines: 92,
        functions: 95,
        branches: 90,
        statements: 92,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@liqueur/protocol': path.resolve(__dirname, '../protocol/src'),
      '@liqueur/react': path.resolve(__dirname, '../react/src'),
    },
  },
});
