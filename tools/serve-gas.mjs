/**
 * Local GAS preview server.
 *
 * Processes <?!= include('Name'); ?> directives the same way GAS does,
 * then serves the result as a single HTML page backed by the local seeded
 * store — no Google Sheets required.
 *
 * Usage:  node tools/serve-gas.mjs [port]
 * Default port: 8082
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gasDir = path.join(root, 'gas');
const port = parseInt(process.argv[2] ?? '8082', 10);

function processIncludes(html) {
  return html.replace(/\<\?!=\s*include\('(\w+)'\);\s*\?>/g, (_, name) => {
    const file = path.join(gasDir, `${name}.html`);
    if (!fs.existsSync(file)) return `<!-- missing include: ${name} -->`;
    return processIncludes(fs.readFileSync(file, 'utf8'));
  });
}

function buildPage() {
  const index = fs.readFileSync(path.join(gasDir, 'Index.html'), 'utf8');
  return processIncludes(index);
}

const page = buildPage();

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
}).listen(port, () => {
  console.log(`GAS preview → http://localhost:${port}`);
  console.log('Uses: seeded InMemoryStore + Local_GAS_Shim (no Sheets needed)');
});
