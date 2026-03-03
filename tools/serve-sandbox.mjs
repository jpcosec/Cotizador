#!/usr/bin/env node

/**
 * @file Lightweight development server for the sandbox application.
 * Serves HTML routes and package assets with correct MIME types.
 * Usage: `node tools/serve-sandbox.mjs` (default port 8090, override with PORT env).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sandboxDir = path.join(rootDir, 'apps', 'sandbox');
const demoDir = path.join(rootDir, 'apps', 'demo');
const routesDir = path.join(sandboxDir, 'routes');
const port = Number(process.env.PORT || 8090);

/** @type {Record<string, string>} Extension-to-MIME mapping for served files. */
const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

/**
 * Strip query string and hash fragment from a URL path.
 * @param {string} rawPath
 * @returns {string}
 */
function normalizePath(rawPath) {
  return String(rawPath || '/').split('?')[0].split('#')[0];
}

/**
 * Safely join a base directory and a relative path, preventing directory traversal.
 * @param {string} base - Absolute base directory.
 * @param {string} rel - Relative path to join.
 * @returns {string|null} Resolved path, or null if it escapes the base.
 */
function safeJoin(base, rel) {
  const resolved = path.normalize(path.join(base, rel));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

/**
 * Map a request path to a filesystem target.
 * Known routes resolve to their index.html; `/packages/` paths resolve
 * against the project root.
 * @param {string} reqPath - Normalized request path.
 * @returns {string|null} Absolute file path, or null if no route matches.
 */
function resolveTarget(reqPath) {
  if (reqPath === '/' || reqPath === '/index.html') {
    return path.join(sandboxDir, 'index.html');
  }

  if (reqPath === '/step-01-counter' || reqPath === '/step-01-counter/') {
    return path.join(routesDir, 'step-01-counter', 'index.html');
  }

  if (reqPath === '/step-02-counter-composed' || reqPath === '/step-02-counter-composed/') {
    return path.join(routesDir, 'step-02-counter-composed', 'index.html');
  }

  if (reqPath === '/step-03-item' || reqPath === '/step-03-item/') {
    return path.join(routesDir, 'step-03-item', 'index.html');
  }

  if (reqPath === '/step-03b' || reqPath === '/step-03b/') {
    return path.join(routesDir, 'step-03b', 'index.html');
  }

  if (reqPath === '/step-04-quotation' || reqPath === '/step-04-quotation/') {
    return path.join(routesDir, 'step-04-quotation', 'index.html');
  }

  if (reqPath === '/step-I1-database' || reqPath === '/step-I1-database/') {
    return path.join(routesDir, 'step-I1-database', 'index.html');
  }

  if (reqPath === '/step-I3-category-01' || reqPath === '/step-I3-category-01/') {
    return path.join(routesDir, 'step-I3-category-01', 'index.html');
  }

  if (reqPath.startsWith('/data/')) {
    return safeJoin(rootDir, reqPath.slice(1));
  }

  if (reqPath.startsWith('/packages/')) {
    return safeJoin(rootDir, reqPath.slice(1));
  }

  if (reqPath.startsWith('/node_modules/')) {
    return safeJoin(rootDir, reqPath.slice(1));
  }

  return null;
}

/**
 * Send an HTTP response with the given status, body, and content type.
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {string|Buffer} body
 * @param {string} [contentType='text/plain; charset=utf-8']
 */
function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const reqPath = normalizePath(req.url);
  const target = resolveTarget(reqPath);

  if (!target) {
    send(res, 404, `Not found: ${reqPath}`);
    return;
  }

  if (!fs.existsSync(target)) {
    send(res, 404, `Missing file: ${target}`);
    return;
  }

  const ext = path.extname(target).toLowerCase();
  const contentType = mimeByExt[ext] || 'application/octet-stream';

  fs.readFile(target, (err, data) => {
    if (err) {
      send(res, 500, `Read error: ${err.message}`);
      return;
    }
    send(res, 200, data, contentType);
  });
});

server.listen(port, () => {
  console.log(`Sandbox server: http://localhost:${port}`);
  console.log('Routes:');
  console.log('  /step-01-counter');
  console.log('  /step-02-counter-composed');
  console.log('  /step-03-item');
  console.log('  /step-03b (multi-item view)');
  console.log('  /step-I1-database');
  console.log('  /step-I3-category-01');
  console.log('  /step-04-quotation');
});
