#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LOCAL_DB_PATH,
  executeLocalGasMethod,
  readLocalDbState,
} from './localPersistenceStore.js';

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
    throw new Error('Missing GAS Index.html. Run: npm run build');
  }

  const index = fs.readFileSync(indexPath, 'utf8');
  const page = processIncludes(index);
  const shim = fs.existsSync(shimPath) ? fs.readFileSync(shimPath, 'utf8') : '';
  return shim ? page.replace('</body>', `${shim}\n</body>`) : page;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const page = buildPage();
readLocalDbState({ dbFilePath: DEFAULT_LOCAL_DB_PATH });

http
  .createServer(async (req, res) => {
    const requestPath = String(req.url || '/').split('?')[0];

    if (requestPath === '/health') {
      writeJson(res, 200, { ok: true, mode: 'local-gas', dbFilePath: DEFAULT_LOCAL_DB_PATH });
      return;
    }

    if (req.method === 'POST' && requestPath === '/api/google-script-run') {
      try {
        const body = await readJsonBody(req);
        const method = String(body.method || '').trim();
        const args = Array.isArray(body.args) ? body.args : [];

        if (!method) {
          writeJson(res, 400, { ok: false, error: { code: 'INVALID_ARGUMENT', message: 'method is required' } });
          return;
        }

        const result = await executeLocalGasMethod(method, args, { dbFilePath: DEFAULT_LOCAL_DB_PATH });
        writeJson(res, 200, result);
      } catch (error) {
        writeJson(res, 500, {
          ok: false,
          error: {
            code: 'STORAGE_ERROR',
            message: error?.message || 'Local GAS request failed',
          },
        });
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
  })
  .listen(port, () => {
    console.log(`Local GAS app -> http://localhost:${port}`);
    console.log(`Disk persistence -> ${DEFAULT_LOCAL_DB_PATH}`);
  });
