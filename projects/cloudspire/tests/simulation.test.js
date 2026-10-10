const assert = require('assert');

const StageScene = require('../src/scenes/stage.js');

function makeAudio() {
  const methods = [
    'unlock',
    'shoot',
    'explosion',
    'pickup',
    'levelup',
    'bomb',
    'hit',
    'bossWarning',
    'bossPhase',
    'gameover',
    'clear',
    'startBgm',
    'stopBgm',
    'playTitleBgm',
    'playStageBgm',
    'playStage2Bgm',
    'playStage3Bgm',
    'playStage4Bgm',
    'playBoss4Bgm',
    'playHeBgm',
    'thunder',
    'playLighting',
    'stopLighting',
    'loadBgms',
  ];
  const audio = {};
  for (const method of methods) audio[method] = () => {};
  return audio;
}

function runStage(stageId) {
  const game = {
    audio: makeAudio(),
    input: {
      consumeTap: () => null,
      getMoveTarget: () => null,
      active: null,
    },
    lastGo: null,
    go(name) {
      this.lastGo = name;
    },
  };
  const stage = new StageScene(game);
  stage.enter({ mode: 'new', difficulty: 'easy', stage: stageId });
  stage.player.x = 360;
  stage.player.y = 1000;
  stage.player.invuln = 99999;

  let frames = 0;
  while (frames < 60000 && !stage.boss) {
    stage.update(1 / 60);
    frames += 1;
  }
  assert.ok(stage.boss !== null, `stage ${stageId} boss should appear`);

  while (frames < 180000 && !stage.clearSent) {
    if (stage.boss && stage.boss.custom === 'twinGuards' && (stage.state === 'miniBoss' || stage.state === 'miniBossDeath')) {
      const alive = stage.boss.parts.filter((part) => !part.dead);
      if (alive.length) {
        const target = alive[Math.floor(frames / 120) % alive.length];
        stage.player.x = target.x;
        stage.player.y = target.y + 70;
      }
    } else if (stage.boss && !stage.boss.dead && stage.state === 'boss') {
      stage.player.x = stage.boss.x;
      stage.player.y = stage.boss.y + 70;
    }
    stage.update(1 / 60);
    frames += 1;
  }
  assert.strictEqual(stage.clearSent, true);
  assert.strictEqual(game.lastGo, 'stageclear');
}

for (const id of [1, 2, 3]) runStage(id);

function runHardFakeEnding() {
  const game = {
    audio: makeAudio(),
    input: {
      consumeTap: () => null,
      getMoveTarget: () => null,
      active: null,
    },
    lastGo: null,
    go(name) {
      this.lastGo = name;
    },
  };
  const stage = new StageScene(game);
  stage.enter({ mode: 'new', difficulty: 'hard', stage: 3 });
  stage.state = 'boss';
  stage.ensureBoss();
  stage.boss.dead = true;
  stage.state = 'bossDeath';
  stage.bossDeathTimer = 0;
  stage.player.x = 360;
  stage.player.y = 1000;
  stage.player.invuln = 99999;

  let frames = 0;
  while (frames < 2000 && game.lastGo !== 'fakeending') {
    stage.update(1 / 60);
    frames += 1;
  }
  assert.strictEqual(game.lastGo, 'fakeending');
}

runHardFakeEnding();

console.log('Stage simulations passed');
