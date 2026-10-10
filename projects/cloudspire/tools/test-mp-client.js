const assert = require('assert');
const net = require('../src/net/multiplayer.js');
const MpRoomScene = require('../src/scenes/mproom.js');
const DifficultyScene = require('../src/scenes/difficulty.js');

class FakeWebSocket {
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    setTimeout(() => { if (this.onopen) this.onopen(); }, 0);
  }
  send(text) { this.sent.push(JSON.parse(text)); }
  close() { if (this.onclose) this.onclose(); }
}
global.WebSocket = FakeWebSocket;

function makeGame() {
  const methods = ['unlock','shoot','explosion','pickup','levelup','bomb','hit','bossWarning','bossPhase','gameover','clear','startBgm','stopBgm','playTitleBgm','playStageBgm','playStage2Bgm','playStage3Bgm','playStage4Bgm','playBoss4Bgm','playHeBgm','thunder','playLighting','stopLighting','loadBgms'];
  const audio = {};
  for (const m of methods) audio[m] = () => {};
  return {
    audio,
    input: { consumeTap: () => null },
    artBank: { get: () => null },
    lastGo: null,
    lastParams: null,
    go(name, params) { this.lastGo = name; this.lastParams = params; },
  };
}

function sentOf(type) {
  const msg = net.conn.sent.find((m) => m.type === type);
  assert.ok(msg, 'expected outgoing ' + type + ', got ' + JSON.stringify(net.conn.sent));
  return msg;
}

(async () => {
  await net.connect('ws://test:5174');
  assert.strictEqual(net.conn.sent[0].type, 'ping');
  net.dispatch(JSON.stringify({ type: 'pong', t: net.conn.sent[0].t, serverTime: Date.now() }));
  assert.strictEqual(typeof net.clockOffsetMs, 'number');

  net.create('Alice');
  const createMsg = sentOf('create');
  assert.strictEqual(createMsg.name, 'Alice');

  let msgSeen = null;
  net.onMessage = (m) => { msgSeen = m; };
  net.dispatch('{"type":"created","roomId":"1234567890","playerIndex":1}');
  assert.strictEqual(msgSeen.type, 'created');
  assert.strictEqual(net.roomId, '1234567890');
  assert.strictEqual(net.playerIndex, 1);

  const game = makeGame();
  const room = new MpRoomScene(game);
  room.enter({ name: 'Alice' });
  net.dispatch('{"type":"created","roomId":"1234567890","playerIndex":1}');
  assert.strictEqual(room.view, 'room');
  net.dispatch('{"type":"peerJoined","name":"Bob"}');
  assert.strictEqual(room.guestName, 'Bob');
  net.dispatch('{"type":"start","seed":99,"hostName":"Alice","guestName":"Bob"}');
  assert.strictEqual(room.countdown > 0, true);
  for (let i = 0; i < 200; i += 1) room.update(1 / 60);
  assert.strictEqual(game.lastGo, 'difficulty');
  assert.strictEqual(game.lastParams.coop, true);
  assert.strictEqual(game.lastParams.playerIndex, 1);
  assert.strictEqual(game.lastParams.seed, 99);

  const game2 = makeGame();
  const diff = new DifficultyScene(game2);
  diff.enter({ coop: true });
  game2.input.consumeTap = () => ({ x: 360, y: 380 });
  diff.update(1 / 60);
  const diffMsg = sentOf('selectDifficulty');
  assert.strictEqual(diffMsg.type, 'selectDifficulty');
  assert.strictEqual(diff.waiting, true);

  const startAt = Date.now() - 100;
  net.dispatch(JSON.stringify({ type: 'difficulty', difficulty: 'hard', seed: 99, startAt, hostName: 'Alice', guestName: 'Bob' }));
  assert.strictEqual(diff.pendingStart, true);
  for (let i = 0; i < 20 && game2.lastGo !== 'stage'; i += 1) diff.update(1 / 60);
  assert.strictEqual(game2.lastGo, 'stage');
  assert.strictEqual(game2.lastParams.coop, true);
  assert.strictEqual(game2.lastParams.difficulty, 'hard');
  assert.strictEqual(game2.lastParams.seed, 99);
  assert.strictEqual(typeof game2.lastParams.startAtLocal, 'number');

  console.log('CLIENT+FLOW OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
