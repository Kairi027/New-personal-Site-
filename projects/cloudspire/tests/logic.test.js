const assert = require('assert');

const memoryStore = {};
global.wx = {
  getStorageSync(key) {
    return memoryStore[key] === undefined ? '' : memoryStore[key];
  },
  setStorageSync(key, value) {
    memoryStore[key] = value;
  },
  removeStorageSync(key) {
    delete memoryStore[key];
  },
};

const idcard = require('../src/utils/idcard.js');
const { DIFFICULTIES } = require('../src/config/difficulty.js');
const { STAGE_1, getStage } = require('../src/config/stages.js');
const storage = require('../src/core/storage.js');
const Player = require('../src/entities/player.js');
const StoryScene = require('../src/scenes/story.js');
const FakeEndingScene = require('../src/scenes/fakeending.js');
const LoadingScene = require('../src/scenes/loading.js');
const ArtBank = require('../src/core/artbank.js');
const AudioManager = require('../src/core/audio.js');

function makeTestId(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0');
  const base = `110105${year}${pad(month)}${pad(day)}123`;
  return base + idcard.checksumOf(base);
}

const now = new Date(2026, 7, 29);

assert.strictEqual(idcard.validateAuth('测试者', makeTestId(1990, 5, 20), now).ok, true);
assert.strictEqual(idcard.validateAuth('', makeTestId(1990, 5, 20), now).ok, false);
assert.strictEqual(idcard.validateAuth('测试者', makeTestId(2010, 1, 1), now).ok, false);
assert.strictEqual(idcard.validateAuth('测试者', '11010519900520123X', now).ok, false);
assert.strictEqual(idcard.validateAuth('测试者', '123', now).ok, false);

assert.strictEqual(DIFFICULTIES.easy.enemyHp, 0.7);
assert.strictEqual(DIFFICULTIES.normal.enemySpeed, 1.25);
assert.strictEqual(DIFFICULTIES.hard.bossHp, 1.75);
assert.strictEqual(DIFFICULTIES.insane.bulletSpeed, 1.9);
assert.strictEqual(DIFFICULTIES.insane.enemyHp > DIFFICULTIES.hard.enemyHp, true);
assert.strictEqual(DIFFICULTIES.easy.stageCount, 1);
assert.strictEqual(DIFFICULTIES.insane.stageCount, 4);
assert.strictEqual(DIFFICULTIES.easy.enemyCount, 0.7);
assert.strictEqual(DIFFICULTIES.easy.enemyInterval, 1.35);
assert.strictEqual(DIFFICULTIES.normal.enemyCount, 1.0);
assert.strictEqual(DIFFICULTIES.normal.enemyInterval, 1.0);
assert.strictEqual(DIFFICULTIES.hard.enemyCount, 1.25);
assert.strictEqual(DIFFICULTIES.hard.enemyInterval, 0.85);
assert.strictEqual(DIFFICULTIES.insane.enemyCount, 1.5);
assert.strictEqual(DIFFICULTIES.insane.enemyInterval, 0.75);

const player = new Player(360, 1000);
assert.strictEqual(player.invincible, false);
const extraPlayer = new Player(360, 1000);
extraPlayer.addScore(50000);
assert.strictEqual(extraPlayer.lives, 4);
assert.strictEqual(extraPlayer.lifeFlash > 0, true);
extraPlayer.invincible = true;
extraPlayer.miss();
assert.strictEqual(extraPlayer.lives, 4);
const invincibleState = extraPlayer.toState();
assert.strictEqual(invincibleState.invincible, true);
assert.strictEqual(Player.fromState(invincibleState).invincible, true);
player.addExp(200);
assert.strictEqual(player.level, 2);
assert.strictEqual(player.exp, 100);
assert.strictEqual(player.expTotal, 200);
assert.strictEqual(player.expToNext(), 160);
const damageAt2 = player.attack;
player.addExp(300);
assert.strictEqual(player.level, 4);
assert.strictEqual(player.attack > damageAt2, true);
for (let i = 0; i < 20; i += 1) player.addExp(1000);
assert.strictEqual(player.level, 20);
assert.strictEqual(player.bombs, 3);
player.addBomb(2);
assert.strictEqual(player.bombs, 5);
player.addBomb(2);
assert.strictEqual(player.bombs, 5);

const save = {
  difficulty: 'normal',
  stage: 1,
  waveIndex: 3,
  bossPhase: 0,
  hp: 80,
  maxHp: 100,
  lives: 3,
  level: 2,
  exp: 120,
  expTotal: 320,
  bombs: 4,
  score: 12345,
};
storage.saveSave(save);
const loaded = storage.loadSave();
assert.strictEqual(loaded.difficulty, 'normal');
assert.strictEqual(loaded.waveIndex, 3);
assert.strictEqual(loaded.expTotal, 320);
storage.clearSave();
assert.strictEqual(storage.loadSave(), null);

assert.strictEqual(STAGE_1.episodes.length, 7);
assert.strictEqual(STAGE_1.episodes[0].type, 'burst');
assert.strictEqual(STAGE_1.episodes[0].spawns[0].count, 10);
assert.strictEqual(STAGE_1.episodes[1].type, 'formation');
assert.strictEqual(STAGE_1.boss.hp, 4500);
assert.strictEqual(STAGE_1.boss.skills.length, 6);
assert.strictEqual(STAGE_1.boss.summon.types.length, 3);
assert.strictEqual(Object.keys(STAGE_1.enemyDefs).length, 3);
assert.strictEqual(STAGE_1.enemyDefs.M.bulletSpeed, 260);

const stage2 = getStage(2);
const stage3 = getStage(3);
assert.strictEqual(stage2.enabled, true);
assert.strictEqual(stage2.episodes.length, 6);
assert.strictEqual(!!stage2.enemyDefs.K, true);
assert.strictEqual(stage2.boss.custom, 'stormEye');
assert.strictEqual(stage2.boss.hp, 8000);
assert.strictEqual(stage3.enabled, true);
assert.strictEqual(stage3.episodes.length, 20);
assert.strictEqual(stage3.miniBoss.parts.length, 2);
assert.strictEqual(stage3.miniBoss.parts[0].hp, 5000);
assert.strictEqual(stage3.miniBoss.parts[1].hp, 6000);
assert.strictEqual(stage3.enemyDefs.D.shieldHp, 600);
assert.strictEqual(stage3.enemyDefs.S.pattern, 'fan3');
assert.strictEqual(stage3.boss.hp, 12000);
assert.strictEqual(stage3.boss.custom, 'finalLord');
assert.strictEqual(stage3.boss.phases.length, 3);
assert.strictEqual(stage3.boss.turrets.length, 2);
assert.strictEqual(stage3.boss.bulletPrefix, 'boss3_bullet_');
assert.strictEqual(stage3.boss.skills.length, 6);
assert.deepStrictEqual(Object.keys(StoryScene.BOOKS).map(Number).sort((a, b) => a - b), [1, 2, 3]);
assert.strictEqual(FakeEndingScene.PAGES.length, 4);
assert.deepStrictEqual(FakeEndingScene.PAGES.map((page) => page.key), ['be01', 'be02', 'be03', 'be04']);
assert.ok(FakeEndingScene.PAGES.every((page) => page.text && page.text.length > 10));
assert.strictEqual(typeof LoadingScene.prototype.enter, 'function');
assert.strictEqual(typeof LoadingScene.prototype.update, 'function');
assert.strictEqual(typeof LoadingScene.prototype.render, 'function');

(async () => {
  const art = new ArtBank();
  await art.load();
  assert.strictEqual(art.ready, true);
  const audio = new AudioManager();
  audio.loadBgms();
  await audio.loadAll();
  console.log('All logic tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
