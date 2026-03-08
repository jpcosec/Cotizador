import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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
      preferBuiltins: false,
    }),
    commonjs(),
  ],
};
