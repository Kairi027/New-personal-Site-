const assert = require('assert');
const StageScene = require('../src/scenes/stage.js');

function makeAudio() {
  const methods = ['unlock','shoot','explosion','pickup','levelup','bomb','hit','bossWarning','bossPhase','gameover','clear','startBgm','stopBgm','playTitleBgm','playStageBgm','playStage2Bgm','playStage3Bgm','playStage4Bgm','playBoss4Bgm','playHeBgm','thunder','playLighting','stopLighting','loadBgms'];
  const a = {};
  for (const m of methods) a[m] = () => {};
  return a;
}

function makeGame() {
  return {
    audio: makeAudio(),
    input: { active: null, consumeTap: () => null, getMoveTarget: () => null },
    artBank: { get: () => null },
    lastGo: null,
    go(name) { this.lastGo = name; },
  };
}

const now = { t: 0 };
let frame = 0;

function sampleP1() {
  const f = frame;
  if (f === 80) return { move: null, bomb: true };
  if (f % 60 < 40) {
    return { move: { x: 300 + (f % 30), y: 800 + ((f * 7) % 120) }, bomb: false };
  }
  return { move: null, bomb: false };
}

function sampleP2() {
  const f = frame;
  if (f % 50 < 30) {
    return { move: { x: 420 - (f % 25), y: 900 + ((f * 5) % 90) }, bomb: false };
  }
  return { move: null, bomb: false };
}

function makeStage(playerIndex, sample) {
  const stage = new StageScene(makeGame());
  stage.enter({
    mode: 'new',
    difficulty: 'insane',
    stage: 1,
    coop: true,
    coopLocalSim: false,
    roomId: '1234567890',
    playerIndex,
    seed: 777,
    hostName: 'A',
    guestName: 'B',
    startAtLocal: 0,
    coopNowMs: () => now.t,
  });
  stage.sampleCoopIntent = sample;
  stage.state = 'boss';
  stage.ensureBoss();
  return stage;
}

const s1 = makeStage(1, sampleP1);
const s2 = makeStage(2, sampleP2);

function advanceBoth() {
  frame += 1;
  now.t += 16.7;
  s1.update(1 / 60);
  s2.update(1 / 60);
  const upto = Math.max(s1.coopSample, s2.coopSample);
  for (let f = 0; f < upto; f += 1) {
    if (s1.localIntents[f]) s2.remoteIntents[f] = s1.localIntents[f];
    if (s2.localIntents[f]) s1.remoteIntents[f] = s2.localIntents[f];
  }
}

for (let i = 0; i < 240; i += 1) {
  advanceBoth();
  if (i % 20 !== 0 && i !== 239) continue;
  assert.ok(Math.abs(s1.player.x - s2.player.x) < 0.001, 'p1 x');
  assert.ok(Math.abs(s1.player.y - s2.player.y) < 0.001, 'p1 y');
  assert.ok(Math.abs(s1.player2.x - s2.player2.x) < 0.001, 'p2 x');
  assert.ok(Math.abs(s1.player2.y - s2.player2.y) < 0.001, 'p2 y');
  assert.strictEqual(s1.bullets.enemy.length, s2.bullets.enemy.length, 'enemy bullets');
  assert.strictEqual(s1.enemies.length, s2.enemies.length, 'enemies');
  assert.strictEqual(s1.boss && s1.boss.dead ? 1 : 0, s2.boss && s2.boss.dead ? 1 : 0, 'boss death');
  assert.strictEqual(s1.player.lives, s2.player.lives, 'p1 lives');
  assert.strictEqual(s1.player2.lives, s2.player2.lives, 'p2 lives');
  assert.strictEqual(s1.player.spectating, s2.player.spectating, 'p1 spectating');
  assert.strictEqual(s1.player2.spectating, s2.player2.spectating, 'p2 spectating');
}

assert.strictEqual(s1.player.lives, 3);
assert.strictEqual(s1.player2.lives, 3);
assert.strictEqual(s1.player2.red, true);
console.log('DETERMINISM OK');
