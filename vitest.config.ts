import { defineConfig } from 'vitest/config';
import * as path from 'path';
export default defineConfig({
  resolve: {
    alias: {
      '@gcrp/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@gcrp/db': path.resolve(__dirname, 'packages/db/src/store.ts'),
      '@gcrp/compliance': path.resolve(__dirname, 'packages/compliance/src/index.ts'),
      '@gcrp/extraction': path.resolve(__dirname, 'packages/extraction/src/index.ts'),
    },
  },
  test: { include: ['packages/**/tests/**/*.test.ts', 'tests/**/*.test.ts'] },
});
