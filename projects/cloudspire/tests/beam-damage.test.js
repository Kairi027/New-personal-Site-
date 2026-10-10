const assert = require('assert');
const StageScene = require('../src/scenes/stage.js');

// Locks in the laser balance: boss1 stays at 20 per hit / 0.4s (50 dps) while every
// mothership (boss4) beam deals 52 per hit / 0.4s (130 dps).
function makeAudio() {
  const methods = [
    'unlock', 'shoot', 'explosion', 'pickup', 'levelup', 'bomb', 'hit', 'bossWarning', 'bossPhase',
    'gameover', 'clear', 'startBgm', 'stopBgm', 'playTitleBgm', 'playStageBgm', 'playStage2Bgm',
    'playStage3Bgm', 'playStage4Bgm', 'playBoss4Bgm', 'playHeBgm', 'thunder', 'playLighting',
    'stopLighting', 'loadBgms',
  ];
  const audio = {};
  for (const method of methods) audio[method] = () => {};
  return audio;
}

function makeGame() {
  return {
    audio: makeAudio(),
    input: { consumeTap: () => null, getMoveTarget: () => null, active: null },
    lastGo: null,
    go(name) {
      this.lastGo = name;
    },
  };
}

const BIG_HP = 1e9;
const DT = 1 / 60;

function prepare(stage) {
  const p = stage.player;
  p.alive = true;
  p.invuln = 0;
  p.shield = 0;
  p.maxShield = 0;
  p.maxHp = BIG_HP;
  p.hp = BIG_HP;
  stage.enemies = [];
  stage.meteors = [];
  stage.bullets.beams.length = 0;
}

function instrument(stage) {
  const state = { hits: 0, perHit: 0 };
  const raw = StageScene.prototype.damagePlayer;
  stage.damagePlayer = function wrapped(amount) {
    state.hits += 1;
    state.perHit = amount;
    return raw.call(this, amount);
  };
  return state;
}

function pinToBeam(stage, beam) {
  if (!beam) return;
  const p = stage.player;
  p.x = beam.x;
  p.y = Math.max(beam.y + 120, 700);
}

function measureBoss1() {
  const stage = new StageScene(makeGame());
  stage.enter({ mode: 'new', difficulty: 'easy', stage: 1 });
  stage.state = 'boss';
  stage.ensureBoss();
  const boss = stage.boss;
  boss.entering = false;
  boss.y = boss.targetY;
  boss.skillIndex = boss.config.skills.findIndex((s) => s.id === 'laser');
  boss.skillPhase = 'active';
  boss.skillTimer = 0;
  boss.laserFired = false;
  prepare(stage);
  const state = instrument(stage);
  for (let i = 0; i < Math.round(4.2 / DT); i += 1) {
    stage.step(DT);
    pinToBeam(stage, stage.bullets.beams[0]);
  }
  return { label: 'boss1 B-03', hits: state.hits, perHit: state.perHit, total: BIG_HP - stage.player.hp };
}

function measureMothership(phase) {
  const stage = new StageScene(makeGame());
  stage.enter({ mode: 'new', difficulty: 'easy', stage: 4 });
  stage.state = 'boss';
  stage.ensureBoss();
  const boss = stage.boss;
  boss.entering = false;
  boss.x = 360;
  boss.y = 320;
  boss.phase = phase;
  boss.transitioning = false;
  boss.transitionIndex = phase - 1;
  for (const key of Object.keys(boss.attackTimers)) boss.attackTimers[key] = 9999;
  if (phase === 2) boss.attackTimers.beam = 0;
  if (phase === 3) boss.attackTimers.laser = 0;
  if (phase === 4) boss.attackTimers.p4Beam = 0;
  prepare(stage);
  const state = instrument(stage);
  const seconds = phase === 2 ? 2.6 : phase === 3 ? 1.5 : 5.2;
  let isolated = false;
  for (let i = 0; i < Math.round(seconds / DT); i += 1) {
    stage.step(DT);
    if (!isolated && stage.bullets.beams.length) {
      // phase 4 fires two beams at once; keep the vertical one for a clean reading
      if (phase === 4 && stage.bullets.beams.length > 1) {
        stage.bullets.beams = stage.bullets.beams.filter((b) => b.direction !== 'horizontal');
      }
      isolated = true;
    }
    pinToBeam(stage, stage.bullets.beams[0]);
  }
  return { label: `boss4 P${phase}`, hits: state.hits, perHit: state.perHit, total: BIG_HP - stage.player.hp };
}

function measureCoop() {
  const stage = new StageScene(makeGame());
  stage.enter({ mode: 'new', difficulty: 'easy', stage: 4 });
  stage.state = 'boss';
  stage.coop = true;
  const Player = stage.player.constructor;
  const p2 = new Player(360, 900);
  p2.alive = true;
  p2.invuln = 0;
  p2.shield = 0;
  p2.maxShield = 0;
  p2.maxHp = BIG_HP;
  p2.hp = BIG_HP;
  stage.player2 = p2;
  stage.enemies = [];
  stage.bullets.beams.length = 0;
  stage.bullets.fireLaser(360, 0, 85, 2.4, 'boss_laser', { charge: 1.0, damage: 52, hitInterval: 0.4 });
  let hits = 0;
  for (let i = 0; i < Math.round(2.6 / DT); i += 1) {
    stage.bullets.update(DT, stage.player);
    const before = p2.hp;
    stage.updatePlayer2Collisions();
    if (p2.hp < before) hits += 1;
    p2.x = 360;
    p2.y = 900;
  }
  return { label: 'coop P2', hits, perHit: (BIG_HP - p2.hp) / Math.max(1, hits), total: BIG_HP - p2.hp };
}

const boss1 = measureBoss1();
const p2Beam = measureMothership(2);
const p3Beam = measureMothership(3);
const p4Beam = measureMothership(4);
const coop = measureCoop();

assert.strictEqual(boss1.perHit, 20, `boss1 laser must stay at 20 per hit (got ${boss1.perHit})`);
assert.strictEqual(boss1.hits, 10, `boss1 laser should land 10 hits (got ${boss1.hits})`);
assert.strictEqual(boss1.total, 200, `boss1 laser should stay at 50 dps (got ${boss1.total})`);

for (const row of [p2Beam, p3Beam, p4Beam]) {
  assert.strictEqual(row.perHit, 52, `${row.label} beam should deal 52 per hit (got ${row.perHit})`);
  assert.strictEqual(row.total, row.hits * 52, `${row.label} beam should deal only 52 per hit`);
}
assert.strictEqual(p2Beam.hits, 4, `boss4 P2 beam should land 4 hits (got ${p2Beam.hits})`);
assert.strictEqual(p3Beam.hits, 2, `boss4 P3 beam should land 2 hits (got ${p3Beam.hits})`);
assert.ok(p4Beam.hits >= 9, `boss4 P4 beam should keep landing hits while pinned (got ${p4Beam.hits})`);
assert.strictEqual(coop.perHit, 52, `coop player 2 beam damage should also be 52 (got ${coop.perHit})`);

console.log(
  `Beam damage test passed (boss1 ${boss1.perHit}/hit = 50 dps; boss4 ${p2Beam.perHit}/hit = 130 dps)`
);
