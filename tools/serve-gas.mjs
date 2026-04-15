#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gasDir = path.join(root, 'gas');
const port = parseInt(process.argv[2] ?? '8082', 10);

function processIncludes(html) {
  return html.replace(/\<\?!=\s*include\('([\w_-]+)'\);\s*\?>/g, (_, name) => {
    const file = path.join(gasDir, `${name}.html`);
    if (!fs.existsSync(file)) return `<!-- missing include: ${name} -->`;
    return processIncludes(fs.readFileSync(file, 'utf8'));
  });
}

function buildPage() {
  const indexPath = path.join(gasDir, 'Index.html');
  const shimPath = path.join(gasDir, 'Local_GAS_Shim.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing GAS Index.html. Run: npm run build`);
  }
  const index = fs.readFileSync(indexPath, 'utf8');
  const page = processIncludes(index);
  const shim = fs.existsSync(shimPath) ? fs.readFileSync(shimPath, 'utf8') : '';
  return shim ? page.replace('</body>', `${shim}
</body>`) : page;
}

const page = buildPage();

http
  .createServer((req, res) => {
    const requestPath = String(req.url || '/').split('?')[0];
    if (requestPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, mode: 'gas-preview' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
  })
  .listen(port, () => {
    console.log(`GAS preview -> http://localhost:${port}`);
  });
