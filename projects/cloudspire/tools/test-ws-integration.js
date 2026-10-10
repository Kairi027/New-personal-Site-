const { spawn } = require('child_process');
const net = require('net');
const crypto = require('crypto');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, 'multiplayer-server.js');
const child = spawn(process.execPath, [serverPath, '5198'], { stdio: 'ignore' });

function connectWS(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('error', reject);
    let buffer = Buffer.alloc(0);
    socket.on('connect', () => {
      const key = crypto.randomBytes(16).toString('base64');
      socket.write(
        'GET / HTTP/1.1\r\n' +
        'Host: 127.0.0.1:' + port + '\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Key: ' + key + '\r\n' +
        'Sec-WebSocket-Version: 13\r\n\r\n'
      );
    });
    socket.on('data', (d) => {
      buffer = Buffer.concat([buffer, d]);
      if (buffer.indexOf('\r\n\r\n') >= 0) resolve(socket);
    });
  });
}

function sendText(socket, text) {
  const buf = Buffer.from(text, 'utf8');
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i += 1) masked[i] = buf[i] ^ mask[i % 4];
  let header;
  if (buf.length < 126) header = Buffer.from([0x81, 0x80 | buf.length]);
  else header = Buffer.alloc(4), header[0] = 0x81, header[1] = 0x80 | 126, header.writeUInt16BE(buf.length, 2);
  socket.write(Buffer.concat([header, mask, masked]));
}

function readMessages(socket, timeoutMs) {
  return new Promise((resolve) => {
    const messages = [];
    let buffer = Buffer.alloc(0);
    const timer = setTimeout(() => resolve(messages), timeoutMs);
    socket.on('data', (d) => {
      buffer = Buffer.concat([buffer, d]);
      for (;;) {
        if (buffer.length < 2) break;
        const opcode = buffer[0] & 0x0f;
        let len = buffer[1] & 0x7f;
        let off = 2;
        if (len === 126) { if (buffer.length < 4) break; len = buffer.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (buffer.length < 10) break; len = Number(buffer.readBigUInt64BE(2)); off = 10; }
        if (buffer.length < off + len) break;
        const payload = buffer.slice(off, off + len).toString('utf8');
        buffer = buffer.slice(off + len);
        messages.push({ opcode, payload });
        if (opcode === 8) { clearTimeout(timer); resolve(messages); return; }
      }
    });
    socket.on('close', () => { clearTimeout(timer); resolve(messages); });
  });
}

(async () => {
  let up = false;
  for (let i = 0; i < 40; i += 1) {
    try { const s = await connectWS(5198); s.destroy(); up = true; break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); }
  }
  assert.ok(up, 'server should accept ws');
  const c1 = await connectWS(5198);
  const m1 = readMessages(c1, 2000);
  sendText(c1, JSON.stringify({ type: 'create', name: 'Alice' }));
  const msgs = await m1;
  const created = msgs.find((m) => { try { return JSON.parse(m.payload).type === 'created'; } catch (e) { return false; } });
  assert.ok(created, 'should receive created, got ' + JSON.stringify(msgs));
  assert.ok(/^\d{10}$/.test(JSON.parse(created.payload).roomId));
  console.log('SERVER WS OK');
  c1.destroy();
  child.kill();
  process.exit(0);
})().catch((e) => { child.kill(); console.error(e); process.exit(1); });
