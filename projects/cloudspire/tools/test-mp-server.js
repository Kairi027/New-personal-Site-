const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, 'multiplayer-server.js');
const child = spawn(process.execPath, [serverPath, '5199'], { stdio: 'ignore' });

function getHealth() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5199/health', (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

let tries = 0;
function poll() {
  return getHealth().catch(() => {
    if (tries > 40) throw new Error('server did not start');
    tries += 1;
    return new Promise((r) => setTimeout(r, 100)).then(poll);
  });
}

(async () => {
  const body = await poll();
  assert.ok(body.includes('"ok":true'), body);
  child.kill();
  console.log('SERVER SMOKE OK');
})().catch((e) => { child.kill(); console.error(e); process.exit(1); });
