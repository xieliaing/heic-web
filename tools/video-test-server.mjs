import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('.');
const origin = 'http://127.0.0.1:8790';
createServer(async (req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cache-Control', 'no-store');
  try {
    let path = decodeURIComponent(new URL(req.url, origin).pathname);
    if (path === '/harness') {
      const html = (await readFile('video.html', 'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      res.setHeader('Content-Type', 'text/html');
      res.end(html + '<script src="/video-convert.js"></script><script>window.converter = initVideoConverter({root: document.querySelector("[data-video-converter]")});</script>');
      return;
    }
    if (path === '/video-worker.js') {
      // Keep tests offline/repeatable after preparing the pinned dependencies.
      res.setHeader('Content-Type', 'text/javascript');
      const fault = new URL(req.url, origin).searchParams.get('fault');
      const inject = fault === 'quota' ? "FileSystemSyncAccessHandle.prototype.write = function () { throw new DOMException('Injected disk quota exhaustion', 'QuotaExceededError'); };\n" : '';
      res.end(inject + (await readFile('video-worker.js', 'utf8')).replaceAll('https://cdn.jsdelivr.net/npm', origin + '/.tmp-video/vendor'));
      return;
    }
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) throw new Error('Outside test root');
    const info = await stat(file);
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.css': 'text/css' })[extname(file)] || 'application/octet-stream');
    res.setHeader('Content-Length', info.size);
    createReadStream(file).pipe(res);
  } catch (_) { res.writeHead(404); res.end(); }
}).listen(8790, '127.0.0.1');
