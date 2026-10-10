const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.argv[2]) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.css': 'text/css; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
};

const TEXT_EXT = new Set(['.html', '.js', '.json', '.css']);

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const normalized = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath;
  if (urlPath.startsWith('/assets/')) {
    filePath = path.join(PROJECT_ROOT, normalized);
  } else {
    filePath = path.join(ROOT, normalized);
  }
  const base = urlPath.startsWith('/assets/') ? path.join(PROJECT_ROOT, 'assets') : ROOT;
  if (!filePath.startsWith(base)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const lastModified = stat.mtime.toUTCString();
    const ext = path.extname(filePath).toLowerCase();
    const isAsset = urlPath.startsWith('/assets/');
    const cacheControl = isAsset ? 'public, max-age=604800' : 'no-cache';

    const ims = req.headers['if-modified-since'];
    if (ims) {
      const imsTime = new Date(ims).getTime();
      if (!isNaN(imsTime) && Math.floor(stat.mtime.getTime() / 1000) <= Math.floor(imsTime / 1000)) {
        res.writeHead(304, {
          'Cache-Control': cacheControl,
          'Last-Modified': lastModified,
        });
        res.end();
        return;
      }
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const baseHeaders = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': cacheControl,
        'Last-Modified': lastModified,
      };
      const acceptsGzip = TEXT_EXT.has(ext) && /gzip/i.test(req.headers['accept-encoding'] || '');
      if (acceptsGzip && data.length > 512) {
        zlib.gzip(data, (gzErr, gzData) => {
          if (gzErr) {
            res.writeHead(200, baseHeaders);
            res.end(data);
            return;
          }
          res.writeHead(200, Object.assign({}, baseHeaders, {
            'Content-Encoding': 'gzip',
            'Vary': 'Accept-Encoding',
            'Content-Length': gzData.length,
          }));
          res.end(gzData);
        });
        return;
      }
      res.writeHead(200, baseHeaders);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Cloudspire preview: http://localhost:${PORT}`);
});
