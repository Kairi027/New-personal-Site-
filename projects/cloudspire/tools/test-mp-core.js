const assert = require('assert');
const { MultiplayerCore } = require('../tools/multiplayer-core.js');
const { mulberry32 } = require('../src/utils/rng.js');

function fakeConn() {
  const c = { sent: [] };
  c.send = (obj) => c.sent.push(typeof obj === 'string' ? JSON.parse(obj) : obj);
  return c;
}
const core = new MultiplayerCore();
const host = fakeConn();
core.create(host, 'Alice');
assert.strictEqual(host.sent[0].type, 'created');
assert.ok(/^\d{10}$/.test(host.sent[0].roomId));
const roomId = host.sent[0].roomId;

const guest = fakeConn();
core.join(guest, roomId, 'Bob');
assert.strictEqual(guest.sent[0].type, 'joined');
assert.strictEqual(host.sent[1].type, 'peerJoined');

core.start(host);
assert.strictEqual(host.sent[2].type, 'start');
assert.strictEqual(guest.sent[1].type, 'start');
assert.strictEqual(host.sent[2].seed, guest.sent[1].seed);
assert.strictEqual(typeof host.sent[2].startAt, 'number');

core.selectDifficulty(host, 'hard');
assert.strictEqual(host.sent[3].type, 'difficulty');
assert.strictEqual(guest.sent[2].type, 'difficulty');
assert.strictEqual(guest.sent[2].difficulty, 'hard');
assert.strictEqual(typeof guest.sent[2].startAt, 'number');

core.input(host, { type: 'input', frame: 17, move: { x: 300, y: 400 }, bomb: true, stage: 3 });
assert.deepStrictEqual(guest.sent[3].move, { x: 300, y: 400 });
assert.strictEqual(guest.sent[3].frame, 17);
assert.strictEqual(guest.sent[3].bomb, true);
assert.strictEqual(guest.sent[3].stage, 3);

core.gameover(host);
assert.strictEqual(guest.sent[4].type, 'gameover');

core.disconnect(host);
assert.strictEqual(guest.sent[5].type, 'peerLeft');
console.log('CORE OK');

// ---------- pk forfeit ----------
{
  const core2 = new MultiplayerCore();
  const h2 = fakeConn();
  core2.create(h2, 'Alice');
  const g2 = fakeConn();
  const roomId2 = h2.sent[0].roomId;
  core2.join(g2, roomId2, 'Bob');

  // 房主逃跑：对方提升为房主并收到 pkForfeit，逃跑者断线不再触发 peerLeft
  const before = g2.sent.length;
  core2.forfeit(h2);
  const forfeitMsg = g2.sent[g2.sent.length - 1];
  assert.strictEqual(forfeitMsg.type, 'pkForfeit');
  assert.strictEqual(forfeitMsg.name, 'Alice');
  assert.strictEqual(forfeitMsg.host, true);
  core2.disconnect(h2);
  assert.strictEqual(g2.sent.length, before + 1);

  // 幸存者现在就是房主，可以正常结束回房
  core2.gameover(g2);
  assert.strictEqual(g2.sent[g2.sent.length - 1].type, 'gameover');
}

const a = mulberry32(42);
const b = mulberry32(42);
for (let i = 0; i < 50; i += 1) assert.strictEqual(a(), b());
console.log('RNG OK');
