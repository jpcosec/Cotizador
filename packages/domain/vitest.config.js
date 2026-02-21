import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@pricing': path.resolve(__dirname, '../pricing/src'),
      '@database': path.resolve(__dirname, '../database/src'),
    },
  },
});
