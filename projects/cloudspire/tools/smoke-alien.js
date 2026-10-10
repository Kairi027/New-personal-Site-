const assert = require('assert');
const StageScene = require('../src/scenes/stage.js');

function makeAudio() {
  const methods = [
    'unlock','shoot','explosion','pickup','levelup','bomb','hit','bossWarning','bossPhase',
    'gameover','clear','startBgm','stopBgm','playTitleBgm','playStageBgm','playStage2Bgm',
    'playStage3Bgm','playStage4Bgm','playBoss4Bgm','playHeBgm','thunder','playLighting',
    'stopLighting','loadBgms',
  ];
  const audio = {};
  for (const method of methods) audio[method] = () => {};
  audio.boss4Played = false;
  audio.stopCalls = 0;
  audio.stopBgm = () => { audio.stopCalls += 1; };
  audio.playBoss4Bgm = () => { audio.boss4Played = true; };
  return audio;
}

function makeCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'canvas') return { width: 720, height: 1280 };
      if (!(prop in target)) return () => {};
      return target[prop];
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

const game = {
  audio: makeAudio(),
  input: { consumeTap: () => null, getMoveTarget: () => null, active: null },
  lastGo: null,
  go(name) { this.lastGo = name; },
};

const stage = new StageScene(game);
stage.enter({ mode: 'new', difficulty: 'insane', stage: 4 });
stage.player.x = 360;
stage.player.y = 900;
stage.player.invuln = 99999;
const ctx = makeCtx();

const seenTypes = new Set();
const origSpawn = stage.spawnBossEscorts.bind(stage);
stage.spawnBossEscorts = (types) => {
  for (const t of types) seenTypes.add(t);
  return origSpawn(types);
};

let frames = 0;
let bossSeen = 0;
let turretsBrokenAt = 0;
let diedAt = 0;
let lastState = '';
let maxPhase = 0;
let turretHitVerified = false;
let maxEnemies = 0;
while (frames < 300000 && game.lastGo !== 'trueending') {
  if (stage.state === 'waves') {
    for (const enemy of stage.enemies.slice()) stage.killEnemy(enemy, true);
    stage.enemies = [];
    stage.meteors = [];
  }
  stage.update(1 / 60);
  frames += 1;
  if (frames % 30 === 0) stage.render(ctx);
  if (stage.boss && stage.boss.custom === 'alienMothership' && stage.state === 'boss') {
    if (stage.enemies.length > maxEnemies) maxEnemies = stage.enemies.length;
    if (bossSeen === 0) bossSeen = frames;
    if (stage.boss.entering) {
      // wait for entry
    } else if (!turretHitVerified) {
      const left = stage.boss.alienTurretPoint('left');
      stage.bullets.player.push({ x: left.x, y: left.y, r: 10, damage: 1234, vx: 0, vy: 0, angle: 0, color: '#fff', life: 1, spin: 0 });
      stage.updateCollisions();
      const leftTurret = stage.boss.turrets.find((t) => t.side === 'left');
      turretHitVerified = leftTurret.hp < leftTurret.maxHp;
    } else if (stage.boss.turrets.some((t) => !t.broken)) {
      for (const t of stage.boss.turrets) {
        if (!t.broken) stage.boss.damageTurret(t.side, 100000);
      }
      if (turretsBrokenAt === 0 && stage.boss.turrets.every((t) => t.broken)) turretsBrokenAt = frames;
    } else {
      stage.boss.damage(60);
      if (stage.boss.phase > maxPhase) maxPhase = stage.boss.phase;
    }
    if (stage.boss.dead && diedAt === 0) diedAt = frames;
  }
  if (stage.state !== lastState) { lastState = stage.state; }
}

console.log('bossSeen', bossSeen);
console.log('turretsBrokenAt', turretsBrokenAt);
console.log('diedAt', diedAt);
console.log('lastState', lastState);
console.log('lastGo', game.lastGo);
console.log('maxPhase', maxPhase);
console.log('maxEnemies', maxEnemies);
console.log('seenTypes', [...seenTypes].join(','));
console.log('boss4Played', game.audio.boss4Played);
console.log('stopCalls', game.audio.stopCalls);
assert.ok(bossSeen > 0, 'alien mothership should appear');
assert.ok(turretsBrokenAt > 0, 'turrets should be breakable');
assert.ok(diedAt > 0, 'boss should die');
assert.ok(maxPhase === 4, 'boss should reach phase 4 (raging), got ' + maxPhase);
assert.ok(turretHitVerified, 'player bullet should damage left turret');
assert.ok(game.audio.boss4Played, 'boss4 music should play on entry');
assert.ok(game.audio.stopCalls >= 1, 'music should stop on boss death');
assert.ok(game.lastGo === 'trueending', 'should reach true ending, got ' + game.lastGo);
const erosionSeen = ['ES', 'EM', 'EH', 'ED'].some((t) => seenTypes.has(t));
const ufoSeen = ['U', 'UV', 'UG'].some((t) => seenTypes.has(t));
assert.ok(erosionSeen && ufoSeen, 'phase 3/4 should summon erosion + ufo, seen=' + [...seenTypes].join(','));
assert.ok(maxEnemies <= 6, 'enemy cap should be 6, got ' + maxEnemies);
console.log('SMOKE OK');
