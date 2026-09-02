import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      '../sdk-web/src/**/*.spec.ts',
      '../sdk-web/src/**/*.test.ts',
      '../sdk-web/test/**/*.spec.ts',
      '../sdk-web/test/**/*.test.ts',
      '../sdk-web/test/**/*.e2e.ts',
    ],
    exclude: ['tests/e2e/**', '.vscode/**', 'node_modules/**', 'dist/**'],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'cross-spawn': path.resolve('C:/Users/psn_l/harness-kit/sdk/node_modules/cross-spawn/index.js'),
      '@anthropic-ai/sdk': path.resolve('C:/Users/psn_l/harness-kit/sdk/node_modules/@anthropic-ai/sdk/index.js'),
    },
  },
});
