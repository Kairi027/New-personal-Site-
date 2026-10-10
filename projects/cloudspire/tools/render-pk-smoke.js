const assert = require('assert');
const StageScene = require('../src/scenes/stage.js');

function makeAudio() {
  const methods = ['unlock','shoot','explosion','pickup','levelup','bomb','hit','bossWarning','bossPhase','gameover','clear','startBgm','stopBgm','playTitleBgm','playStageBgm','playStage2Bgm','playStage3Bgm','playStage4Bgm','playBoss4Bgm','playHeBgm','thunder','playLighting','stopLighting','loadBgms'];
  const a = {};
  for (const m of methods) a[m] = () => {};
  return a;
}

function makeCtx() {
  const calls = [];
  const fn = (name) => (...args) => { calls.push([name, ...args]); };
  const ctx = {
    canvas: { width: 720, height: 1280, toDataURL: () => '' },
    save: fn('save'),
    restore: fn('restore'),
    beginPath: fn('beginPath'),
    moveTo: fn('moveTo'),
    lineTo: fn('lineTo'),
    arcTo: fn('arcTo'),
    closePath: fn('closePath'),
    fill: fn('fill'),
    stroke: fn('stroke'),
    fillRect: fn('fillRect'),
    fillText: fn('fillText'),
    drawImage: fn('drawImage'),
    translate: fn('translate'),
    scale: fn('scale'),
    rotate: fn('rotate'),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    calls,
  };
  return ctx;
}

function makeStage() {
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
  stage.enter({
    mode: 'new',
    difficulty: 'hard',
    stage: 1,
    coop: true,
    pk: true,
    roomId: '1234567890',
    playerIndex: 2,
    seed: 1,
    hostName: 'Alice',
    guestName: 'Bob',
  });
  stage._taps = taps;
  return stage;
}

const stage = makeStage();
stage.triggerGameOver();
stage._taps.push({ x: 495, y: 938 });
stage.handlePkTerminal(1 / 60);
assert.strictEqual(stage.pkChoice, 'wait');
stage._taps.push({ x: 84, y: 48 });
stage.handlePkTerminal(1 / 60);
assert.ok(stage.pkConfirm, '退出应先弹出确认框');

const ctx = makeCtx();
assert.doesNotThrow(() => {
  stage.renderPkOverlay(ctx);
  stage.renderPkConfirm(ctx);
});
const texts = ctx.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1]));
assert.ok(texts.some((t) => t.indexOf('是否退出房间') !== -1), '确认框应绘制问题文案');
assert.ok(texts.some((t) => t.indexOf('确认退出') !== -1) || texts.some((t) => t.indexOf('确认') !== -1), '确认按钮应绘制');
assert.ok(texts.some((t) => t.indexOf('Bob') !== -1) && texts.some((t) => t.indexOf('Alice') !== -1), '分数条应显示双方昵称');

// 观战界面：应绘制退出房间与等待结算按钮，分数条常驻
const watchStage = makeStage();
watchStage.triggerGameOver();
watchStage._taps.push({ x: 225, y: 938 });
watchStage.handlePkTerminal(1 / 60);
assert.strictEqual(watchStage.pkChoice, 'watch');
const wctx = makeCtx();
assert.doesNotThrow(() => {
  watchStage.renderPkOverlay(wctx);
});
const wtexts = wctx.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1]));
assert.ok(wtexts.some((t) => t.indexOf('退出房间') !== -1), '观战界面应绘制退出房间按钮');
assert.ok(wtexts.some((t) => t.indexOf('等待结算') !== -1), '观战界面应绘制等待结算按钮');
assert.ok(wtexts.some((t) => t.indexOf('Bob') !== -1) && wtexts.some((t) => t.indexOf('Alice') !== -1), '观战分数条应显示双方昵称');

// 等待结算界面：除退出房间外还应绘制观战按钮
const waitStage = makeStage();
waitStage.triggerGameOver();
waitStage._taps.push({ x: 495, y: 938 });
waitStage.handlePkTerminal(1 / 60);
assert.strictEqual(waitStage.pkChoice, 'wait');
const wtctx = makeCtx();
assert.doesNotThrow(() => {
  waitStage.renderPkOverlay(wtctx);
});
const wttexts = wtctx.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1]));
assert.ok(wttexts.some((t) => t.indexOf('退出房间') !== -1), '等待结算界面应绘制退出房间按钮');
assert.ok(wttexts.some((t) => t.indexOf('观战') !== -1), '等待结算界面应绘制观战按钮');
console.log('RENDER PK SMOKE OK');
