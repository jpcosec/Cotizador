#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const bundlePath = path.join(root, 'dist', 'quotation-engine.iife.js');
const outPath = path.join(root, 'gas', 'Bundle_Runtime.html');

if (!fs.existsSync(bundlePath)) {
  console.error(`Bundle file not found: ${bundlePath}`);
  process.exit(1);
}

const js = fs.readFileSync(bundlePath, 'utf8');
const wrapped = `<script>\n${js}\n</script>\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, wrapped, 'utf8');

console.log(`Generated GAS runtime include: ${outPath}`);
