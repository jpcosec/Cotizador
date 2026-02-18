import path from 'node:path';
import { fileURLToPath } from 'node:url';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const xstateNodeModules = path.resolve(workspaceRoot, 'claps_codelab_xstate/node_modules');

export default {
  input: 'bundling/entry.js',
  output: {
    file: 'dist/quotation-engine.iife.js',
    format: 'iife',
    name: 'QuotationEngine',
    sourcemap: true,
    exports: 'named',
  },
  plugins: [
    resolve({
      browser: true,
      moduleDirectories: ['node_modules'],
      modulePaths: [xstateNodeModules],
      preferBuiltins: false,
    }),
    commonjs(),
  ],
};
