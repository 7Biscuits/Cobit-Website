#!/usr/bin/env node

/**
 * CoBit Local Development Server
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateClientEnv } from './scripts/generate-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

// Generate/refresh client configuration on startup
const clientConfig = generateClientEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Security check: Block path traversal attacks
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');

  // Security check: Strictly block access to sensitive dotfiles or secrets
  const forbiddenPatterns = [
    /^\/\./,              // Any file/folder starting with . (.env, .git, .DS_Store)
    /\/\./,               // Subfolder dotfiles
    /node_modules/,
    /scripts/,
    /server\.js/,
    /package\.json/,
    /package-lock\.json/
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(pathname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden: Access to sensitive or server-only files is restricted.');
      return;
    }
  }

  // Dynamic route: /js/env-config.js
  if (pathname === '/js/env-config.js') {
    const configScript = `/**
 * Client Environment Configuration (Public & Safe for Browser)
 * Generated dynamically by server.js
 */
(function() {
  window.__ENV__ = Object.freeze(${JSON.stringify(clientConfig, null, 2)});
})();
`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(configScript);
    return;
  }

  // Dynamic route: /api/config
  if (pathname === '/api/config') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify(clientConfig, null, 2));
    return;
  }

  // Clean URLs & directory mappings
  let filePath = path.join(ROOT_DIR, safePath);

  // If path is a directory, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath)) {
    // Check clean route mappings
    if (pathname === '/admin' || pathname === '/admin/') {
      filePath = path.join(ROOT_DIR, 'admin', 'index.html');
    } else if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1><p>The requested resource could not be found.</p>');
    return;
  }

  // Determine MIME type
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Serve static file
  try {
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m===================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[32m🚀 CoBit Showcase Server running at:\x1b[0m`);
  console.log(`   - Public Showcase:  \x1b[34mhttp://localhost:${PORT}/\x1b[0m`);
  console.log(`   - Admin Dashboard:  \x1b[34mhttp://localhost:${PORT}/admin\x1b[0m`);
  console.log(`   - Config Status:    \x1b[32mLoaded from .env (Client-Safe)\x1b[0m`);
  console.log(`\x1b[36m===================================================\x1b[0m\n`);
});
