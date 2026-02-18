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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@pricing': path.resolve(__dirname, '../claps_codelab_pricing/src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '../../Pricing/': path.resolve(__dirname, '../claps_codelab_pricing/src/Pricing/'),
      '../../RulesEngine/': path.resolve(__dirname, '../claps_codelab_pricing/src/RulesEngine/'),
      '../../DataStore/': path.resolve(__dirname, '../claps_codelab_pricing/src/DataStore/'),
    },
  },
});
