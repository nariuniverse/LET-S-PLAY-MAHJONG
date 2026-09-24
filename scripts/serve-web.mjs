import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { createVisitorStore, visitorMiddleware } from '../dist/server/visitors.js';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = await realpath(resolve(project, 'web-dist'));
const counterFile = resolve(project, process.env.VISITOR_DATA_FILE || '.data/visitors.json');
const counter = visitorMiddleware(createVisitorStore(counterFile));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  counter(req, res, () => {
    void (async () => {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
      catch { res.writeHead(400); res.end(); return; }
      const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!target.startsWith(root + sep)) { res.writeHead(404); res.end(); return; }
      try {
        const actual = await realpath(target);
        if (!actual.startsWith(root + sep)) { res.writeHead(404); res.end(); return; }
        const data = await readFile(actual);
        res.writeHead(200, { 'Content-Type': types[extname(actual)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': extname(actual) === '.html' ? 'no-cache' : 'public, max-age=3600' });
        res.end(req.method === 'HEAD' ? undefined : data);
      } catch { res.writeHead(404); res.end('Not found'); }
    })().catch(() => { if (!res.headersSent) res.writeHead(500); res.end(); });
  });
});
const port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => console.log(`LET'S PLAY MAHJONG: http://${host}:${port}`));
