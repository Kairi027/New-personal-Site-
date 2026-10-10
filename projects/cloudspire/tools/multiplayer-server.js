const http = require('http');
const crypto = require('crypto');
const { MultiplayerCore } = require('./multiplayer-core.js');

const PORT = Number(process.argv[2]) || 5174;
const core = new MultiplayerCore();

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: core.rooms.size }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Cloudspire multiplayer relay running on port ' + PORT);
});

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function encodeFrame(payload, opcode) {
  const buf = Buffer.from(payload, 'utf8');
  const len = buf.length;
  let header;
  if (len < 126) {
    header = Buffer.from([opcode | 0x80, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = opcode | 0x80;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = opcode | 0x80;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  return Buffer.concat([header, buf]);
}

class ClientSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.fragments = '';
    socket.on('data', (d) => this.onData(d));
    socket.on('close', () => core.disconnect(this));
    socket.on('error', () => core.disconnect(this));
  }

  send(obj) {
    if (this.socket && this.socket.writable) {
      this.socket.write(encodeFrame(JSON.stringify(obj), 0x1));
    }
  }

  onData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.parse();
  }

  parse() {
    for (;;) {
      const frame = this.tryParseFrame();
      if (!frame) return;
      if (frame.opcode === 0x1) {
        this.handle(frame.payload);
      } else if (frame.opcode === 0x0) {
        this.fragments += frame.payload;
        if (frame.fin) {
          this.handle(this.fragments);
          this.fragments = '';
        }
      } else if (frame.opcode === 0x8) {
        try { this.socket.end(); } catch (e) {}
        return;
      } else if (frame.opcode === 0x9) {
        try { this.socket.write(encodeFrame(frame.payload, 0xA)); } catch (e) {}
      }
    }
  }

  tryParseFrame() {
    if (this.buffer.length < 2) return null;
    const b0 = this.buffer[0];
    const b1 = this.buffer[1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let offset = 2;
    if (len === 126) {
      if (this.buffer.length < 4) return null;
      len = this.buffer.readUInt16BE(2);
      offset = 4;
    } else if (len === 127) {
      if (this.buffer.length < 10) return null;
      len = Number(this.buffer.readBigUInt64BE(2));
      offset = 10;
    }
    if (!masked) {
      if (this.buffer.length < offset + len) return null;
      const payload = this.buffer.slice(offset, offset + len).toString('utf8');
      this.buffer = this.buffer.slice(offset + len);
      return { fin, opcode, payload };
    }
    if (this.buffer.length < offset + 4 + len) return null;
    const mask = this.buffer.slice(offset, offset + 4);
    const maskedData = this.buffer.slice(offset + 4, offset + 4 + len);
    const out = Buffer.alloc(len);
    for (let i = 0; i < len; i += 1) out[i] = maskedData[i] ^ mask[i % 4];
    this.buffer = this.buffer.slice(offset + 4 + len);
    return { fin, opcode, payload: out.toString('utf8') };
  }

  handle(text) {
    let msg;
    try { msg = JSON.parse(text); } catch (e) { return; }
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ping') {
      this.send({ type: 'pong', t: msg.t || 0, serverTime: Date.now() });
      return;
    }
    if (msg.type === 'create') core.create(this, String(msg.name || ''));
    else if (msg.type === 'join') core.join(this, String(msg.roomId || ''), String(msg.name || ''));
    else if (msg.type === 'start') core.start(this);
    else if (msg.type === 'selectDifficulty') core.selectDifficulty(this, String(msg.difficulty || ''));
    else if (msg.type === 'input' || msg.type === 'pkState' || msg.type === 'pkFinished' || msg.type === 'pkWatchOn' || msg.type === 'pkFrame') core.input(this, msg);
    else if (msg.type === 'pkForfeit') core.forfeit(this);
    else if (msg.type === 'gameover') core.gameover(this);
  }
}

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );
  new ClientSocket(socket);
  socket.resume();
});

server.listen(PORT, () => {
  console.log('Cloudspire multiplayer relay: ws://0.0.0.0:' + PORT);
  const os = require('os');
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info.family === 'IPv4' && !info.internal) {
        console.log('  LAN: ws://' + info.address + ':' + PORT);
      }
    }
  }
});
