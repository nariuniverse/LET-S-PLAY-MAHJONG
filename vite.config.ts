import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { createVisitorStore, visitorMiddleware } from './src/server/visitors.js';
export default defineConfig({ root: 'web', base: './',
  plugins: [{ name: 'visitor-counter',
    configureServer(server) { server.middlewares.use(visitorMiddleware(createVisitorStore(resolve('.data/visitors-dev.json')))); },
    configurePreviewServer(server) { server.middlewares.use(visitorMiddleware(createVisitorStore(resolve('.data/visitors-preview.json')))); },
  }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, fs: { allow: [resolve('web'), resolve('src')] } },
  build: { outDir: '../web-dist', emptyOutDir: true, target: 'es2022' }, worker: { format: 'es' },
});
