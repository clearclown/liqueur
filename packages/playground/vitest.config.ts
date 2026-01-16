import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'app/api/**/*.ts',
        'components/**/*.{ts,tsx}',
        'lib/**/*.ts',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        '**/*.config.{ts,js}',
        '**/types/**',
        'app/**/layout.tsx',
        'app/**/page.tsx',
        'tests/**',
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
      '@': path.resolve(__dirname, './'),
      '@liqueur/protocol': path.resolve(__dirname, '../protocol/src'),
      '@liqueur/react': path.resolve(__dirname, '../react/src'),
    },
  },
});
