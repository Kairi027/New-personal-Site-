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

function makeStage(nowRef, overrides) {
  const game = makeGame();
  const stage = new StageScene(game);
  stage.enter(Object.assign({
    mode: 'new',
    difficulty: 'hard',
    stage: 1,
    coop: true,
    coopLocalSim: true,
    roomId: '1234567890',
    playerIndex: 1,
    seed: 777,
    hostName: 'A',
    guestName: 'B',
    startAtLocal: 0,
    coopNowMs: () => nowRef.t,
  }, overrides || {}));
  return stage;
}

function drive(stage, nowRef, frames) {
  for (let i = 0; i < frames; i += 1) {
    nowRef.t += 16.7;
    stage.update(1 / 60);
  }
}

// 1) 残机各自扣减：3 机扣完进入观战，队友不受影响。
{
  const now = { t: 0 };
  const stage = makeStage(now);
  drive(stage, now, 5);
  assert.strictEqual(stage.player.lives, 3);
  assert.strictEqual(stage.player2.lives, 3);

  for (let death = 0; death < 3; death += 1) {
    stage.player.damage(999);
    drive(stage, now, 200);
  }
  assert.strictEqual(stage.player.lives, 0);
  assert.strictEqual(stage.player.spectating, true);
  assert.strictEqual(stage.player2.spectating, false);
  assert.strictEqual(stage.player2.lives, 3);
  assert.notStrictEqual(stage.game.lastGo, 'mproom');

  // 2) 观战者被奖命后返场，存活者也 +1。
  stage.addTeamScore(50000);
  assert.strictEqual(stage.player.spectating, false);
  assert.strictEqual(stage.player.alive, true);
  assert.strictEqual(stage.player.lives, 1);
  assert.strictEqual(stage.player2.lives, 4);
}

// 3) 共享计分每到一个阈值双方各 +1，且每个阈值只生效一次。
{
  const now = { t: 0 };
  const stage = makeStage(now);
  drive(stage, now, 5);
  stage.addTeamScore(50000);
  assert.strictEqual(stage.player.lives, 4);
  assert.strictEqual(stage.player2.lives, 4);
  stage.addTeamScore(100000);
  assert.strictEqual(stage.player.score, 150000);
  assert.strictEqual(stage.player.lives, 5);
  assert.strictEqual(stage.player2.lives, 5);
  assert.strictEqual(stage.coopClaimedExtras.length, 2);
}

// 4) 双方都出局时本局结束回房间。
{
  const now = { t: 0 };
  const stage = makeStage(now);
  drive(stage, now, 5);
  for (let death = 0; death < 3; death += 1) {
    stage.player.damage(999);
    drive(stage, now, 200);
  }
  assert.strictEqual(stage.player.spectating, true);
  for (let death = 0; death < 3; death += 1) {
    stage.player2.damage(999);
    drive(stage, now, 200);
  }
  assert.strictEqual(stage.player2.spectating, true);
  assert.strictEqual(stage.game.lastGo, 'mproom');
}

// 5) 仅一人存活时通关：进入下一关；最后一关通关回房间。
{
  const now = { t: 0 };
  const stage = makeStage(now, { difficulty: 'hard' });
  drive(stage, now, 5);
  stage.triggerClear();
  assert.strictEqual(stage.state, 'coopNext');
  drive(stage, now, 230);
  assert.strictEqual(stage.stage.id, 2);
  assert.strictEqual(stage.state, 'intro');

  stage.triggerClear();
  drive(stage, now, 230);
  assert.strictEqual(stage.stage.id, 3);

  stage.triggerClear();
  drive(stage, now, 230);
  assert.strictEqual(stage.game.lastGo, 'mproom');
}

console.log('MP RULES OK');
