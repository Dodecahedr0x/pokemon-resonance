import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dev server only: injects client.js into the page and saves the snapshots it posts
// to .style-snapshots/<name>.json (git-ignored). See client.js for usage.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '../../.style-snapshots');

export default function styleSnapshot() {
  return {
    name: 'style-snapshot',
    apply: 'serve',
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { type: 'module', src: '/__style-snapshot/client.js' }, injectTo: 'body' }];
    },
    configureServer(server) {
      server.middlewares.use('/__style-snapshot', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'text/javascript');
          res.end(readFileSync(join(here, 'client.js')));
          return;
        }
        const name = new URL(req.url, 'http://x').searchParams.get('name') || '';
        if (req.method !== 'POST' || !/^[\w.-]+$/.test(name)) {
          res.statusCode = 400;
          res.end();
          return;
        }
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          mkdirSync(outDir, { recursive: true });
          writeFileSync(join(outDir, name + '.json'), body);
          res.end('ok');
        });
      });
    },
  };
}
