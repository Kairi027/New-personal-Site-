const assert = require('assert');
const StageScene = require('../src/scenes/stage.js');

function makeAudio() {
  const methods = ['unlock','shoot','explosion','pickup','levelup','bomb','hit','bossWarning','bossPhase','gameover','clear','startBgm','stopBgm','playTitleBgm','playStageBgm','playStage2Bgm','playStage3Bgm','playStage4Bgm','playBoss4Bgm','playHeBgm','thunder','playLighting','stopLighting','loadBgms'];
  const a = {};
  for (const m of methods) a[m] = () => {};
  return a;
}

function makeStage(overrides) {
  let taps = [];
  const game = {
    audio: makeAudio(),
    input: {
      active: null,
      consumeTap() { return taps.shift() || null; },
      getMoveTarget: () => null,
    },
    artBank: { get: () => null },
    lastGo: null,
    go(name) { this.lastGo = name; },
  };
  const stage = new StageScene(game);
  stage.enter(Object.assign({
    mode: 'new',
    difficulty: 'hard',
    stage: 1,
    coop: true,
    pk: true,
    roomId: '1234567890',
    playerIndex: 1,
    seed: 1,
    hostName: 'Alice',
    guestName: 'Bob',
  }, overrides || {}));
  stage._taps = taps;
  return stage;
}

function drive(stage, frames) {
  for (let i = 0; i < frames; i += 1) stage.update(1 / 60);
}

// 1) 阵亡 → 等待/观战选项 → 对方完成 → 结算 → 回房间
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerGameOver();
  assert.strictEqual(stage.pkState, 'over');
  assert.strictEqual(stage.pkFinishedSent, true);

  stage._taps.push({ x: 225, y: 938 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'watch');

  stage.handlePkMessage({ type: 'pkFinished', score: 88000, stage: 2, cleared: true });
  assert.strictEqual(stage.pkState, 'settle');
  drive(stage, 210);
  assert.strictEqual(stage.game.lastGo, 'mproom');
}

// 2) 通关自动续关，最后一关通关视为结束
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerClear();
  assert.strictEqual(stage.state, 'pkNext');
  drive(stage, 220);
  assert.strictEqual(stage.stage.id, 2);
  assert.strictEqual(stage.pkState, 'play');
  stage.triggerClear();
  drive(stage, 220);
  assert.strictEqual(stage.stage.id, 3);
  stage.triggerClear();
  assert.strictEqual(stage.pkState, 'clear');
  assert.strictEqual(stage.pkFinishedSent, true);
}

// 3) 收到对方先完成的消息后，自己结束时立刻结算
{
  const stage = makeStage();
  drive(stage, 5);
  stage.handlePkMessage({ type: 'pkFinished', score: 30000, stage: 1, cleared: false });
  stage.triggerGameOver();
  assert.strictEqual(stage.pkState, 'settle');
}

// 4) 对方返回房间（gameover）时自己也回到房间
{
  const stage = makeStage();
  drive(stage, 5);
  stage.handlePkMessage({ type: 'gameover' });
  assert.strictEqual(stage.game.lastGo, 'mproom');
}

// 5) 等待结算：对方分数实时更新，对方结束后进结算
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerGameOver();
  stage._taps.push({ x: 495, y: 938 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'wait');
  stage.handlePkMessage({ type: 'pkState', score: 4321, stage: 1, lives: 2, hp: 55, maxHp: 100, over: false });
  assert.strictEqual(stage.pkOpp.score, 4321);
  stage.handlePkMessage({ type: 'pkFinished', score: 4321, stage: 1, cleared: false });
  assert.strictEqual(stage.pkState, 'settle');
}

// 6) 等待中点退出 = 先弹确认框，确认后逃跑判负回标题
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerGameOver();
  stage._taps.push({ x: 495, y: 938 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'wait');
  stage._taps.push({ x: 84, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.ok(stage.pkConfirm, '点击退出应先弹出确认框');
  assert.strictEqual(stage.game.lastGo, null);
  stage._taps.push({ x: 260, y: 728 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkConfirm, null);
  assert.strictEqual(stage.game.lastGo, 'title');
}

// 6b) 确认框点取消：不退出也不判负
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerGameOver();
  stage._taps.push({ x: 495, y: 938 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'wait');
  stage._taps.push({ x: 84, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.ok(stage.pkConfirm);
  stage._taps.push({ x: 460, y: 728 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkConfirm, null);
  assert.strictEqual(stage.game.lastGo, null);
}

// 6c) 等待结算与观战可互相切换；观战中点退出同样弹窗+判负
{
  const stage = makeStage();
  drive(stage, 5);
  stage.triggerGameOver();
  stage._taps.push({ x: 495, y: 938 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'wait');
  stage._taps.push({ x: 636, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'watch');
  stage._taps.push({ x: 636, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'wait');
  stage._taps.push({ x: 84, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.ok(stage.pkConfirm, '等待结算界面点退出应弹出确认框');
  stage._taps.push({ x: 460, y: 728 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkConfirm, null);
  stage._taps.push({ x: 636, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.pkChoice, 'watch');
  stage._taps.push({ x: 84, y: 48 });
  stage.handlePkTerminal(1 / 60);
  assert.ok(stage.pkConfirm, '观战界面点退出房间应弹出确认框');
  stage._taps.push({ x: 260, y: 728 });
  stage.handlePkTerminal(1 / 60);
  assert.strictEqual(stage.game.lastGo, 'title');
}

// 7) 收到对方逃跑：进入“对方逃跑·你胜出”结算，结算结束不再回房间，直接回标题
{
  const stage = makeStage();
  drive(stage, 5);
  stage.handlePkMessage({ type: 'pkForfeit', name: 'Alice', host: false });
  assert.strictEqual(stage.pkState, 'forfeit');
  drive(stage, 130);
  assert.strictEqual(stage.pkState, 'settle');
  assert.strictEqual(stage.pkSettleForfeit, 'Alice');
  drive(stage, 200);
  assert.strictEqual(stage.game.lastGo, 'title');
}

// 8) PK 暂停 Escape：自机坠毁；对方已结束则直接结算
{
  const stage = makeStage();
  drive(stage, 5);
  stage.paused = true;
  stage._taps.push({ x: 360, y: 621 });
  stage.update(1 / 60);
  assert.strictEqual(stage.paused, false);
  assert.strictEqual(stage.pkState, 'over');
  assert.strictEqual(stage.pkFinishedSent, true);
}

// 9) 非 PK 暂停仍返回 exit，PK 返回 escape
{
  const PauseScene = require('../src/scenes/pause.js');
  const fakeInput = { taps: [], consumeTap() { return this.taps.shift() || null; } };
  const pause = new PauseScene({});
  // 普通模式：Exit 在下方位置可退出
  fakeInput.taps = [{ x: 360, y: 711 }];
  assert.strictEqual(pause.update(fakeInput, false, false, false), 'exit');
  // 无存档/无敌模式：Exit 画在上方位置，点击下方无效区域不应返回 exit
  fakeInput.taps = [{ x: 360, y: 621 }];
  assert.strictEqual(pause.update(fakeInput, false, true, false), 'exit');
  fakeInput.taps = [{ x: 360, y: 711 }];
  assert.strictEqual(pause.update(fakeInput, false, true, false), null);
  // PK 暂停：上方位置为 Escape
  fakeInput.taps = [{ x: 360, y: 621 }];
  assert.strictEqual(pause.update(fakeInput, false, true, true), 'escape');
}

console.log('PK FLOW OK');
