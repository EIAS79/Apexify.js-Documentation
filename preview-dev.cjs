// The preview service supplies Vite-style flags; keep the existing Next app and APIs.
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const {gzip} = require('node:zlib');
const {promisify} = require('node:util');
const next = require('next');
const compress = promisify(gzip);
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : 4173);
const app = next({dev:true,hostname:'0.0.0.0',port});
const handle = app.getRequestHandler();
const staticRoot = path.resolve('.next/static') + path.sep;

app.prepare().then(() => {
  http.createServer(async (req,res) => {
    // Buffer development assets before sending them. Some preview proxies truncate
    // Next's large streamed chunks. Production continues to use `next start`.
    const pathname = new URL(req.url,'http://preview.local').pathname;
    if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/_next/static/')) {
      const file = path.resolve('.next',pathname.slice('/_next/'.length));
      if(file.startsWith(staticRoot) && /\.(js|css)$/.test(file)) {
        try {
          const source = await fs.readFile(file);
          const gzipped = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
          const body = gzipped ? await compress(source) : source;
          res.setHeader('content-type',file.endsWith('.js')?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
          res.setHeader('cache-control','no-store');
          res.setHeader('vary','Accept-Encoding');
          if(gzipped)res.setHeader('content-encoding','gzip');
          res.setHeader('content-length',body.length);
          res.end(req.method === 'HEAD' ? undefined : body);
          return;
        } catch {
          // Newly compiled chunks may not have reached disk yet; Next owns that case.
        }
      }
    }
    handle(req,res);
  }).listen(port,'0.0.0.0');
}).catch(error => { console.error(error); process.exit(1); });
