(function () {
  const modules = {};
  const cache = {};

  function register(id, factory) {
    modules[id] = factory;
  }

  function resolve(from, request) {
    if (!request.startsWith('.')) return request;
    const base = from.split('/').slice(0, -1);
    const parts = request.split('/');
    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        base.pop();
      } else {
        base.push(part);
      }
    }
    return base.join('/');
  }

  function makeRequire(from) {
    return function (request) {
      const id = resolve(from, request);
      if (cache[id]) return cache[id].exports;
      const factory = modules[id];
      if (!factory) throw new Error('Cannot find module: ' + id);
      const module = { exports: {} };
      cache[id] = module;
      factory(module, module.exports, makeRequire(id));
      return module.exports;
    };
  }

  register("game.js", function (module, exports, require) {
if (!String.prototype.padStart) {
  String.prototype.padStart = function (targetLength, padString) {
    const str = String(this);
    const pad = padString || ' ';
    if (str.length >= targetLength) return str;
    const needed = targetLength - str.length;
    return pad.repeat(Math.ceil(needed / pad.length)).slice(0, needed) + str;
  };
}

const { Game } = require('./src/main.js');

const game = new Game();
game.start();

  });
  register("src/config/difficulty.js", function (module, exports, require) {
const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    rangeLabel: '1关',
    stageCount: 1,
    enemyHp: 0.7,
    enemySpeed: 1.0,
    bulletSpeed: 1.0,
    bossHp: 1.0,
    enemyCount: 0.7,
    enemyInterval: 1.35,
    hidden: false,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    rangeLabel: '1-2关',
    stageCount: 2,
    enemyHp: 1.0,
    enemySpeed: 1.25,
    bulletSpeed: 1.35,
    bossHp: 1.35,
    enemyCount: 1.0,
    enemyInterval: 1.0,
    hidden: false,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    rangeLabel: '1-3关',
    stageCount: 3,
    enemyHp: 1.5,
    enemySpeed: 1.45,
    bulletSpeed: 1.7,
    bossHp: 1.75,
    enemyCount: 1.25,
    enemyInterval: 0.85,
    hidden: false,
  },
  insane: {
    id: 'insane',
    label: 'Insane',
    rangeLabel: '1-3关+???',
    stageCount: 4,
    enemyHp: 2.0,
    enemySpeed: 1.55,
    bulletSpeed: 1.9,
    bossHp: 2.0,
    enemyCount: 1.5,
    enemyInterval: 0.75,
    hidden: true,
  },
};

const ORDER = ['easy', 'normal', 'hard', 'insane'];

function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.easy;
}

function getVisibleStages(difficulty) {
  const config = getDifficulty(difficulty);
  return Math.min(config.stageCount, 1);
}

module.exports = {
  DIFFICULTIES,
  ORDER,
  getDifficulty,
  getVisibleStages,
};

  });
  register("src/config/stages.js", function (module, exports, require) {
const STAGE_1 = {
  id: 1,
  title: 'Stage1 黄土天穹',
  subtitle: '钢铁机群',
  enemyDefs: {
    S: {
      type: 'S',
      hp: 10,
      speed: 230,
      exp: 8,
      score: 100,
      radius: 16,
      heartChance: 0.02,
    },
    M: {
      type: 'M',
      hp: 45,
      speed: 150,
      exp: 18,
      score: 300,
      radius: 24,
      heartChance: 0.06,
      fireInterval: 1.6,
      bulletSpeed: 260,
      pattern: 'fan3',
    },
    H: {
      type: 'H',
      hp: 100,
      speed: 110,
      exp: 35,
      score: 600,
      radius: 34,
      heartChance: 0.2,
      fireInterval: 1.9,
      bulletSpeed: 220,
      pattern: 'spread5',
    },
  },
  episodes: [
    {
      type: 'burst',
      duration: 4.5,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'top', count: 10, interval: 0.42, path: 'dive', formation: 'V' },
      ],
    },
    {
      type: 'formation',
      enemyType: 'M',
      pauseAfter: 2.4,
      groups: [
        { side: 'left', count: 5, spacing: 76, centerX: 250, radius: 72, loopDuration: 2.8 },
        { side: 'right', count: 5, spacing: 76, centerX: 470, radius: 72, loopDuration: 2.8 },
      ],
    },
    {
      type: 'burst',
      duration: 5.0,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'top', count: 6, interval: 0.55, path: 'dive' },
        { type: 'S', side: 'topLeft', count: 5, interval: 0.72, path: 'dive' },
        { type: 'S', side: 'topRight', count: 5, interval: 0.72, path: 'dive' },
      ],
    },
    {
      type: 'burst',
      duration: 4.2,
      pauseAfter: 1.8,
      spawns: [
        { type: 'S', side: 'top', count: 4, interval: 0.6, path: 'dive' },
        { type: 'M', side: 'top', count: 3, interval: 1.3, path: 'dive' },
      ],
    },
    {
      type: 'formation',
      enemyType: 'M',
      pauseAfter: 2.2,
      includeBombCarrier: true,
      groups: [
        { side: 'left', count: 4, spacing: 78, centerX: 240, radius: 66, loopDuration: 2.6 },
        { side: 'right', count: 4, spacing: 78, centerX: 480, radius: 66, loopDuration: 2.6 },
      ],
    },
    {
      type: 'burst',
      duration: 5.5,
      pauseAfter: 2.2,
      spawns: [
        { type: 'M', side: 'top', count: 5, interval: 0.95, path: 'dive' },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', flashing: true },
        { type: 'S', side: 'topLeft', count: 4, interval: 0.7, path: 'dive' },
      ],
    },
    {
      type: 'burst',
      duration: 6.0,
      pauseAfter: 2.0,
      spawns: [
        { type: 'M', side: 'top', count: 6, interval: 0.8, path: 'dive' },
        { type: 'M', side: 'left', count: 3, interval: 0.9, path: 'strafe' },
        { type: 'M', side: 'right', count: 3, interval: 0.9, path: 'strafe' },
        { type: 'H', side: 'top', count: 2, interval: 2.2, path: 'dive' },
      ],
    },
  ],
  boss: {
    name: '荒原之矛',
    title: '重型突击轰炸机',
    hp: 4500,
    radius: 90,
    skills: [
      { id: 'rotate', label: 'B-01 旋转花弹' },
      { id: 'radial', label: 'B-02 放射弹' },
      { id: 'laser', label: 'B-03 广域激光' },
      { id: 'track', label: 'B-04 追踪弹' },
      { id: 'array', label: 'B-05 弹幕阵列' },
      { id: 'summon', label: 'B-06 召唤敌机' },
    ],
    summon: { types: ['S', 'S', 'M'], count: 3 },
  },
};

const STAGE_2 = {
  id: 2,
  title: 'Stage2 雷暴云海',
  subtitle: '沉云遗迹',
  enabled: true,
  enemyDefs: {
    S: {
      type: 'S',
      hp: 20,
      speed: 250,
      exp: 10,
      score: 150,
      radius: 16,
      heartChance: 0.02,
      fireInterval: 1.8,
      bulletSpeed: 240,
      pattern: 'single',
    },
    M: {
      type: 'M',
      hp: 90,
      speed: 165,
      exp: 22,
      score: 400,
      radius: 24,
      heartChance: 0.06,
      fireInterval: 1.4,
      bulletSpeed: 300,
      pattern: 'fan3',
    },
    H: {
      type: 'H',
      hp: 200,
      speed: 120,
      exp: 45,
      score: 800,
      radius: 34,
      heartChance: 0.2,
      fireInterval: 2.0,
      bulletSpeed: 280,
      pattern: 'ring',
    },
    K: {
      type: 'K',
      hp: 10,
      speed: 320,
      exp: 6,
      score: 80,
      radius: 14,
      heartChance: 0,
    },
    D: {
      type: 'D',
      hp: 40,
      speed: 105,
      exp: 22,
      score: 500,
      radius: 26,
      heartChance: 0.12,
      fireInterval: 2.2,
      bulletSpeed: 280,
      pattern: 'fan3',
    },
    N: {
      type: 'N',
      hp: 18,
      speed: 150,
      exp: 15,
      score: 350,
      radius: 18,
      heartChance: 0.06,
      fireInterval: 2.4,
      bulletSpeed: 420,
      pattern: 'snipe',
      holdY: 170,
      holdTime: 5,
    },
    F: {
      type: 'F',
      hp: 12,
      speed: 280,
      exp: 10,
      score: 180,
      radius: 16,
      heartChance: 0.02,
      fireInterval: 1.9,
      bulletSpeed: 260,
      pattern: 'single',
    },
    G: {
      type: 'G',
      hp: 35,
      speed: 165,
      exp: 20,
      score: 450,
      radius: 24,
      heartChance: 0.08,
      fireInterval: 1.7,
      bulletSpeed: 300,
      pattern: 'fan3',
    },
  },
  episodes: [
    {
      type: 'burst',
      duration: 5.0,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'topLeft', count: 3, interval: 0.35, path: 'dive', delay: 0 },
        { type: 'S', side: 'topRight', count: 3, interval: 0.35, path: 'dive', delay: 0.9 },
      ],
    },
    {
      type: 'burst',
      duration: 7.0,
      pauseAfter: 2.2,
      spawns: [
        { type: 'S', side: 'left', count: 3, interval: 0.45, path: 'strafe', delay: 0 },
        { type: 'S', side: 'right', count: 3, interval: 0.45, path: 'strafe', delay: 0.2 },
        { type: 'M', side: 'top', count: 3, interval: 1.4, path: 'dive', delay: 2.0 },
      ],
    },
    {
      type: 'burst',
      duration: 6.5,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'top', count: 4, interval: 0.55, path: 'dive', delay: 0 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.35, path: 'kamikaze', delay: 2.2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.35, path: 'kamikaze', delay: 2.8 },
      ],
    },
    {
      type: 'burst',
      duration: 8.0,
      pauseAfter: 2.2,
      spawns: [
        { type: 'M', side: 'left', count: 1, interval: 0, path: 'strafe', delay: 0 },
        { type: 'M', side: 'right', count: 1, interval: 0, path: 'strafe', delay: 0.4 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', delay: 1.2 },
        { type: 'S', side: 'topLeft', count: 3, interval: 0.6, path: 'dive', delay: 1.4 },
        { type: 'S', side: 'topRight', count: 3, interval: 0.6, path: 'dive', delay: 1.8 },
      ],
    },
    {
      type: 'burst',
      duration: 9.0,
      pauseAfter: 2.4,
      spawns: [
        { type: 'M', side: 'left', count: 1, interval: 0, path: 'strafe', delay: 0 },
        { type: 'M', side: 'right', count: 1, interval: 0, path: 'strafe', delay: 0.5 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', delay: 1.0 },
        { type: 'S', side: 'top', count: 8, interval: 0.8, path: 'dive', delay: 1.2 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.45, path: 'kamikaze', delay: 3.0 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.45, path: 'kamikaze', delay: 3.8 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.45, path: 'kamikaze', delay: 5.0 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.45, path: 'kamikaze', delay: 5.8 },
      ],
    },
    {
      type: 'burst',
      duration: 10.0,
      pauseAfter: 0.6,
      spawns: [
        { type: 'H', side: 'left', count: 1, interval: 0, path: 'strafe', delay: 0 },
        { type: 'H', side: 'right', count: 1, interval: 0, path: 'strafe', delay: 0.5 },
        { type: 'M', side: 'top', count: 3, interval: 1.2, path: 'dive', delay: 1.4 },
        { type: 'M', side: 'top', count: 3, interval: 1.2, path: 'dive', delay: 3.0 },
        { type: 'S', side: 'top', count: 8, interval: 0.7, path: 'dive', delay: 1.8 },
        { type: 'S', side: 'topLeft', count: 5, interval: 0.8, path: 'dive', delay: 3.2 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.32, path: 'kamikaze', delay: 2.2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.32, path: 'kamikaze', delay: 2.8 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.28, path: 'kamikaze', delay: 4.2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.28, path: 'kamikaze', delay: 4.8 },
      ],
    },
  ],
  boss: {
    name: '云海之眼',
    title: '风暴巡洋舰',
    hp: 8000,
    radius: 95,
    custom: 'stormEye',
    skills: [
      { id: 'rotate', label: 'S-01 雷霆旋花' },
      { id: 'radial', label: 'S-02 暴雨放射' },
      { id: 'array', label: 'S-03 云海阵列' },
      { id: 'track', label: 'S-04 追踪雷矢' },
      { id: 'summon', label: 'S-05 召唤残兵' },
    ],
    summon: { types: ['S', 'S', 'M'], count: 3 },
  },
  background: {
    skyTop: [8, 22, 38],
    skyMid: [22, 58, 84],
    skyLow: [10, 20, 34],
    mountains: [
      [30, 56, 78],
      [20, 40, 60],
      [10, 22, 36],
    ],
    haze: [200, 232, 255],
  },
};

const STAGE_3 = {
  id: 3,
  title: 'Stage3 天穹王座',
  subtitle: '终焉神域',
  enabled: true,
  randomPause: true,
  enemyDefs: {
    S: {
      type: 'S',
      hp: 50,
      speed: 270,
      exp: 12,
      score: 200,
      radius: 16,
      heartChance: 0.02,
      fireInterval: 2.2,
      bulletSpeed: 260,
      pattern: 'fan3',
    },
    M: {
      type: 'M',
      hp: 120,
      speed: 180,
      exp: 28,
      score: 500,
      radius: 24,
      heartChance: 0.06,
      fireInterval: 1.25,
      bulletSpeed: 340,
      pattern: 'fan3',
    },
    H: {
      type: 'H',
      hp: 250,
      speed: 130,
      exp: 55,
      score: 1000,
      radius: 34,
      heartChance: 0.2,
      fireInterval: 1.5,
      bulletSpeed: 320,
      pattern: 'spread5',
    },
    K: {
      type: 'K',
      hp: 30,
      speed: 340,
      exp: 8,
      score: 120,
      radius: 14,
      heartChance: 0,
    },
    D: {
      type: 'D',
      hp: 500,
      speed: 120,
      exp: 30,
      score: 600,
      radius: 26,
      heartChance: 0.12,
      fireInterval: 2.8,
      bulletSpeed: 300,
      pattern: 'single',
      shieldHp: 600,
      shieldRadius: 120,
    },
    N: {
      type: 'N',
      hp: 200,
      speed: 150,
      exp: 18,
      score: 400,
      radius: 18,
      heartChance: 0.06,
      fireInterval: 2.4,
      bulletSpeed: 460,
      pattern: 'snipe',
      holdY: 170,
      holdTime: 5.5,
    },
    F: {
      type: 'F',
      hp: 16,
      speed: 300,
      exp: 12,
      score: 220,
      radius: 16,
      heartChance: 0.02,
      fireInterval: 1.9,
      bulletSpeed: 280,
      pattern: 'single',
    },
    G: {
      type: 'G',
      hp: 50,
      speed: 190,
      exp: 24,
      score: 520,
      radius: 24,
      heartChance: 0.08,
      fireInterval: 1.6,
      bulletSpeed: 320,
      pattern: 'fan3',
    },
  },
  episodes: [
    {
      type: 'burst',
      duration: 6,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'top', count: 6, interval: 0.2, path: 'group', formation: 'V', groupConfig: { vy: 210, splitAtY: 620 } },
      ],
    },
    {
      type: 'burst',
      duration: 7,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'left', count: 4, interval: 0.8, path: 'strafe' },
        { type: 'S', side: 'right', count: 4, interval: 0.8, path: 'strafe', delay: 0.4 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'M', side: 'top', count: 2, interval: 0, path: 'group', formation: 'lineH', groupConfig: { vy: 80 }, y: 110, spacingX: 150 },
        { type: 'M', side: 'top', count: 2, interval: 0, path: 'group', formation: 'lineH', groupConfig: { vy: 80 }, y: 240, spacingX: 150 },
        { type: 'S', side: 'left', count: 2, interval: 1.2, path: 'strafe' },
        { type: 'S', side: 'right', count: 2, interval: 1.2, path: 'strafe', delay: 0.6 },
      ],
    },
    {
      type: 'burst',
      duration: 7,
      pauseAfter: 2.0,
      spawns: [
        { type: 'K', side: 'topLeft', count: 4, interval: 0.22, path: 'kamikaze' },
        { type: 'K', side: 'topRight', count: 4, interval: 0.22, path: 'kamikaze', delay: 0.8 },
        { type: 'S', side: 'top', count: 4, interval: 0.9, path: 'dive', delay: 1.4 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 300 },
        { type: 'S', side: 'top', count: 1, interval: 0, path: 'hold', x: 290, y: -40, holdY: 350, holdTime: 7 },
        { type: 'S', side: 'top', count: 1, interval: 0, path: 'hold', x: 430, y: -40, holdY: 350, holdTime: 7 },
        { type: 'S', side: 'top', count: 1, interval: 0, path: 'hold', x: 320, y: -40, holdY: 410, holdTime: 7 },
        { type: 'S', side: 'top', count: 1, interval: 0, path: 'hold', x: 400, y: -40, holdY: 410, holdTime: 7 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.7, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.7, path: 'kamikaze', delay: 2.5 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'M', side: 'top', count: 3, interval: 0, path: 'group', formation: 'triangle', groupConfig: { vy: 120 } },
        { type: 'S', side: 'top', count: 6, interval: 0.18, path: 'group', formation: 'lineH', groupConfig: { vy: 150 }, y: -70, spacingX: 70 },
      ],
    },
    {
      type: 'burst',
      duration: 9,
      pauseAfter: 2.0,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 300 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 300 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 140, y: -40, holdY: 360, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 360, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 360, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 580, y: -40, holdY: 360, holdTime: 8 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.6, path: 'kamikaze', delay: 2.2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.6, path: 'kamikaze', delay: 2.8 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 360, y: -70 },
        { type: 'S', side: 'top', count: 6, interval: 0, path: 'group', formation: 'arc', groupConfig: { vy: 105 }, cx: 360, cy: 80, radius: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 210, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 510, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 10,
      pauseAfter: 2.0,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 300 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 360, y: -60 },
        { type: 'M', side: 'top', count: 6, interval: 0, path: 'group', formation: 'ring', groupConfig: { vy: 110 }, cx: 360, cy: 300, radius: 170 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.55, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 4, interval: 0.55, path: 'kamikaze', delay: 2.5 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 160 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 160 },
      ],
    },
    {
      type: 'burst',
      duration: 12,
      pauseAfter: 0.6,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 330, y: -40, holdY: 300 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 390, y: -40, holdY: 300 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 360, y: -70 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 300, y: -40, holdY: 360, holdTime: 9 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 420, y: -40, holdY: 360, holdTime: 9 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 330, y: -40, holdY: 420, holdTime: 9 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 390, y: -40, holdY: 420, holdTime: 9 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 1.5 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 2.0 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 3.5 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 4.0 },
        { type: 'S', side: 'top', count: 8, interval: 0.6, path: 'dive', delay: 2.5 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 160 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 160 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'S', side: 'top', count: 10, interval: 0.15, path: 'group', formation: 'wedge', groupConfig: { vx: -130, vy: 230 } },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'M', side: 'top', count: 6, interval: 0.12, path: 'group', formation: 'stairs', groupConfig: { vy: 120 } },
      ],
    },
    {
      type: 'burst',
      duration: 9,
      pauseAfter: 2.0,
      spawns: [
        { type: 'K', side: 'topLeft', count: 4, interval: 0.2, path: 'kamikaze' },
        { type: 'K', side: 'topRight', count: 4, interval: 0.2, path: 'kamikaze', delay: 1.5 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.2, path: 'kamikaze', delay: 3 },
        { type: 'K', side: 'topRight', count: 4, interval: 0.2, path: 'kamikaze', delay: 4.5 },
        { type: 'M', side: 'top', count: 2, interval: 1.6, path: 'dive', delay: 1 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 10,
      pauseAfter: 2.0,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 290 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 300 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 290 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 140, y: -40, holdY: 350, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 350, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 320, y: -40, holdY: 360, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 400, y: -40, holdY: 360, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 350, holdTime: 8 },
        { type: 'M', side: 'top', count: 1, interval: 0, path: 'hold', x: 580, y: -40, holdY: 350, holdTime: 8 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.5, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.5, path: 'kamikaze', delay: 2.5 },
      ],
    },
    {
      type: 'burst',
      duration: 8,
      pauseAfter: 2.0,
      spawns: [
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 240, y: -70 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 480, y: -70 },
        { type: 'M', side: 'top', count: 4, interval: 0.9, path: 'dive', delay: 1 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 10,
      pauseAfter: 2.0,
      spawns: [
        { type: 'M', side: 'top', count: 2, interval: 0.6, path: 'converge' },
        { type: 'M', side: 'left', count: 2, interval: 0.6, path: 'converge' },
        { type: 'M', side: 'right', count: 2, interval: 0.6, path: 'converge' },
        { type: 'M', side: 'bottom', count: 2, interval: 0.6, path: 'converge' },
        { type: 'S', side: 'top', count: 2, interval: 0.5, path: 'converge' },
        { type: 'S', side: 'left', count: 2, interval: 0.5, path: 'converge' },
        { type: 'S', side: 'right', count: 2, interval: 0.5, path: 'converge' },
        { type: 'S', side: 'bottom', count: 2, interval: 0.5, path: 'converge' },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 300 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 9,
      pauseAfter: 2.0,
      spawns: [
        { type: 'H', side: 'top', count: 3, interval: 1.4, path: 'dive' },
        { type: 'M', side: 'top', count: 5, interval: 0.7, path: 'dive', delay: 1.2 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 2.5 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 4 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 170 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 170 },
      ],
    },
    {
      type: 'burst',
      duration: 10,
      pauseAfter: 2.0,
      spawns: [
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 360, y: -70 },
        { type: 'M', side: 'top', count: 6, interval: 0, path: 'group', formation: 'ring', groupConfig: { vy: 110 }, cx: 360, cy: 280, radius: 180 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 2.5 },
        { type: 'K', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 4 },
        { type: 'S', side: 'top', count: 6, interval: 0.5, path: 'dive', delay: 1.5 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 150 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160 },
      ],
    },
    {
      type: 'burst',
      duration: 10,
      pauseAfter: 2.0,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 280, y: -40, holdY: 300 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 440, y: -40, holdY: 300 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 280, y: -70 },
        { type: 'H', side: 'top', count: 1, interval: 0, path: 'dive', x: 440, y: -70 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.35, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 4, interval: 0.35, path: 'kamikaze', delay: 2.5 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.35, path: 'kamikaze', delay: 4 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 150 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160 },
      ],
    },
    {
      type: 'burst',
      duration: 14,
      pauseAfter: 0.8,
      spawns: [
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 330, y: -40, holdY: 300 },
        { type: 'D', side: 'top', count: 1, interval: 0, path: 'hold', x: 390, y: -40, holdY: 300 },
        { type: 'H', side: 'top', count: 3, interval: 1.5, path: 'dive' },
        { type: 'M', side: 'top', count: 6, interval: 0.6, path: 'dive', delay: 1.2 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.3, path: 'kamikaze', delay: 2 },
        { type: 'K', side: 'topRight', count: 4, interval: 0.3, path: 'kamikaze', delay: 2.5 },
        { type: 'K', side: 'topLeft', count: 4, interval: 0.3, path: 'kamikaze', delay: 4 },
        { type: 'K', side: 'topRight', count: 4, interval: 0.3, path: 'kamikaze', delay: 4.5 },
        { type: 'S', side: 'top', count: 10, interval: 0.45, path: 'dive', delay: 1.8 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 150 },
        { type: 'N', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160 },
      ],
    },
  ],
  miniBoss: {
    custom: 'twinGuards',
    parts: [
      { key: 'alpha', name: '锋卫α', title: '迅捷守卫', artKey: 'enemy_fengwei_a', hp: 5000, radius: 48, targetX: 180, targetY: 330 },
      { key: 'beta', name: '锋卫β', title: '重装守卫', artKey: 'enemy_fengwei_b', hp: 6000, radius: 56, targetX: 540, targetY: 330 },
    ],
  },
  boss: {
    name: '天阙主宰',
    title: '终焉神机',
    custom: 'finalLord',
    hp: 12000,
    radius: 100,
    phases: [
      { threshold: 0.75, duration: 1.5, text: '天穹之力，开始解放' },
      { threshold: 0.5, duration: 1.8, text: '防御瓦解，全力迎击' },
      { threshold: 0.25, duration: 2.0, text: '最后的意志，就此绽放' },
    ],
    turrets: [
      { side: 'left', hp: 2500, name: '左翼炮舱' },
      { side: 'right', hp: 2500, name: '右翼炮舱' },
    ],
    bulletPrefix: 'boss3_bullet_',
    skills: [
      { id: 'rotate', label: 'F-01 神域旋花' },
      { id: 'radial', label: 'F-02 圣光放射' },
      { id: 'laser', label: 'F-03 天罚光柱' },
      { id: 'track', label: 'F-04 追命神矢' },
      { id: 'array', label: 'F-05 王座阵列' },
      { id: 'summon', label: 'F-06 召唤卫队' },
    ],
    summon: { types: ['S', 'S', 'M'], count: 3 },
  },
  background: {
    skyTop: [46, 58, 86],
    skyMid: [112, 118, 142],
    skyLow: [58, 66, 88],
    mountains: [
      [84, 88, 118],
      [58, 62, 92],
      [34, 38, 62],
    ],
    haze: [240, 236, 220],
  },
};

const STAGE_4 = {
  id: 4,
  title: 'Extra Stage 堙灭虚空',
  subtitle: '宇宙坟场',
  enabled: true,
  hidden: true,
  randomPause: true,
  space: true,
  enemyDefs: {
    ES: { type: 'ES', hp: 250, speed: 270, exp: 12, score: 200, radius: 16, heartChance: 0.02, fireInterval: 2.2, bulletSpeed: 260, pattern: 'fan3', bulletColor: '#b26bff' },
    EM: { type: 'EM', hp: 750, speed: 180, exp: 28, score: 500, radius: 24, heartChance: 0.06, fireInterval: 1.25, bulletSpeed: 340, pattern: 'fan3', bulletColor: '#b26bff' },
    EH: { type: 'EH', hp: 1500, speed: 130, exp: 55, score: 1000, radius: 34, heartChance: 0.2, fireInterval: 1.5, bulletSpeed: 320, pattern: 'spread5', bulletColor: '#b26bff' },
    EK: { type: 'EK', hp: 100, speed: 340, exp: 8, score: 120, radius: 14, heartChance: 0 },
    EN: { type: 'EN', hp: 1000, speed: 150, exp: 18, score: 400, radius: 18, heartChance: 0.06, fireInterval: 2.4, bulletSpeed: 520, pattern: 'snipe5', holdY: 170, holdTime: 5.5, bulletColor: '#b26bff' },
    ED: { type: 'ED', hp: 2000, speed: 120, exp: 30, score: 600, radius: 26, heartChance: 0.12, fireInterval: 2.8, bulletSpeed: 300, pattern: 'single', shieldHp: 2500, shieldRadius: 130, shieldKind: 'erosion', bulletColor: '#b26bff' },
    U: { type: 'U', hp: 1000, speed: 150, exp: 30, score: 600, radius: 24, heartChance: 0.1, fireInterval: 1.8, bulletSpeed: 300, pattern: 'ringSmall', bulletColor: '#c26bff' },
    UV: { type: 'UV', hp: 2000, speed: 110, exp: 60, score: 1200, radius: 34, heartChance: 0.2, fireInterval: 2.0, bulletSpeed: 340, pattern: 'fanWide', bulletColor: '#c26bff' },
    UG: { type: 'UG', hp: 2500, speed: 60, exp: 40, score: 800, radius: 30, heartChance: 0, holdY: 120, holdTime: 999 },
  },
  episodes: [
    { type: 'burst', duration: 12, pauseAfter: 0.8, spawns: [
      { type: 'ES', side: 'top', count: 5, interval: 0.25, path: 'group', formation: 'V', groupConfig: { vy: 210, splitAtY: 620 } },
    ] },
    { type: 'burst', duration: 14, pauseAfter: 0.8, spawns: [
      { type: 'ES', side: 'left', count: 3, interval: 0.8, path: 'strafe' },
      { type: 'ES', side: 'right', count: 3, interval: 0.8, path: 'strafe', delay: 0.4 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 170, holdTime: 7 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 170, holdTime: 7, delay: 1.2 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 170, holdTime: 7, delay: 2.4 },
    ] },
    { type: 'burst', duration: 14, pauseAfter: 0.8, spawns: [
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.3, path: 'kamikaze' },
      { type: 'EK', side: 'topRight', count: 2, interval: 0.3, path: 'kamikaze', delay: 1.2 },
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.3, path: 'kamikaze', delay: 2.6 },
      { type: 'EM', side: 'top', count: 3, interval: 0, path: 'group', formation: 'lineH', groupConfig: { vy: 90 }, y: -60, spacingX: 140, delay: 1 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 260, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 300, y: -40, holdY: 330, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 420, y: -40, holdY: 330, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 270, y: -40, holdY: 410, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 450, y: -40, holdY: 410, holdTime: 10 },
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.5, path: 'kamikaze', delay: 2.5 },
      { type: 'EK', side: 'topRight', count: 2, interval: 0.5, path: 'kamikaze', delay: 4 },
    ] },
    { type: 'burst', duration: 12, pauseAfter: 0.8, spawns: [
      { type: 'EM', side: 'top', count: 5, interval: 0, path: 'group', formation: 'lineH', groupConfig: { vy: 90 }, y: -60, spacingX: 90 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'EM', side: 'top', count: 5, interval: 0.14, path: 'group', formation: 'stairs', groupConfig: { vy: 120 } },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160, holdTime: 8 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160, holdTime: 8, delay: 1 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 280, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 250, y: -40, holdY: 350, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 470, y: -40, holdY: 350, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 320, y: -40, holdY: 430, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 400, y: -40, holdY: 430, holdTime: 10 },
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.5, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 2, interval: 0.5, path: 'kamikaze', delay: 3.5 },
    ] },
    { type: 'burst', duration: 14, pauseAfter: 0.8, spawns: [
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 220, holdTime: 9 },
      { type: 'ES', side: 'top', count: 4, interval: 0, path: 'group', formation: 'arc', groupConfig: { vy: 105 }, cx: 360, cy: 80, radius: 180 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 240, y: -40, holdY: 260, holdTime: 10 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 480, y: -40, holdY: 260, holdTime: 10 },
      { type: 'EM', side: 'top', count: 4, interval: 0, path: 'group', formation: 'ring', groupConfig: { vy: 110 }, cx: 360, cy: 300, radius: 170 },
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.5, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 2, interval: 0.5, path: 'kamikaze', delay: 3 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 160, holdTime: 8 },
    ] },
    { type: 'burst', duration: 14, pauseAfter: 0.8, spawns: [
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 240, y: -40, holdY: 240, holdTime: 9 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 480, y: -40, holdY: 240, holdTime: 9 },
      { type: 'EM', side: 'top', count: 3, interval: 0.6, path: 'dive' },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 280, holdTime: 10 },
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 280, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 140, y: -40, holdY: 360, holdTime: 10 },
      { type: 'EM', side: 'top', count: 1, interval: 0, path: 'hold', x: 220, y: -40, holdY: 360, holdTime: 10 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 500, y: -40, holdY: 360, holdTime: 10 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 580, y: -40, holdY: 360, holdTime: 10 },
    ] },
    { type: 'burst', duration: 6, pauseAfter: 0.8, flyover: true, spawns: [] },
    { type: 'burst', duration: 18, pauseAfter: 0.7, spawns: [
      { type: 'ES', side: 'top', count: 7, interval: 0.4, path: 'dive' },
      { type: 'EM', side: 'top', count: 3, interval: 0.5, path: 'dive', delay: 1 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 230, holdTime: 9, delay: 2 },
      { type: 'EK', side: 'topLeft', count: 3, interval: 0.35, path: 'kamikaze', delay: 1.5 },
      { type: 'EK', side: 'topRight', count: 3, interval: 0.35, path: 'kamikaze', delay: 2.5 },
      { type: 'EK', side: 'topLeft', count: 3, interval: 0.35, path: 'kamikaze', delay: 4 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 160, holdTime: 8 },
    ] },
    { type: 'burst', duration: 20, pauseAfter: 1.5, meteorStorm: true, meteorClearAtEnd: true, spawns: [
      { type: 'MET', size: 'large', side: 'top', count: 2, interval: 2.5, delay: 2 },
      { type: 'MET', size: 'large', side: 'left', count: 1, interval: 0, delay: 6 },
      { type: 'MET', size: 'medium', side: 'top', count: 5, interval: 0.9, delay: 2 },
      { type: 'MET', size: 'medium', side: 'right', count: 3, interval: 1.1, delay: 3 },
      { type: 'MET', size: 'small', side: 'top', count: 10, interval: 0.5, delay: 2.5 },
      { type: 'MET', size: 'small', side: 'bottom', count: 6, interval: 0.7, delay: 3 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'ES', side: 'top', count: 8, interval: 0.18, path: 'group', formation: 'V', groupConfig: { vy: 200, splitAtY: 640 } },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 170, holdTime: 7 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 170, holdTime: 7, delay: 1 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 170, holdTime: 7, delay: 2 },
      { type: 'U', side: 'top', count: 4, interval: 0, path: 'group', formation: 'lineH', groupConfig: { vy: 80 }, y: 110, spacingX: 110, delay: 1.5 },
    ] },
    { type: 'burst', duration: 14, pauseAfter: 0.8, spawns: [
      { type: 'U', side: 'top', count: 4, interval: 0.7, path: 'dive' },
      { type: 'EM', side: 'top', count: 4, interval: 0.7, path: 'dive', delay: 0.6 },
      { type: 'EK', side: 'topLeft', count: 2, interval: 0.5, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 2, interval: 0.5, path: 'kamikaze', delay: 3 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'UG', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 120, holdTime: 999 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 280, y: -40, holdY: 280, holdTime: 999, delay: 0.6 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 440, y: -40, holdY: 280, holdTime: 999, delay: 0.6 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 320, y: -40, holdY: 360, holdTime: 999, delay: 1.2 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 400, y: -40, holdY: 360, holdTime: 999, delay: 1.2 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 430, holdTime: 999, delay: 1.8 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 240, y: -40, holdY: 240, holdTime: 9 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 480, y: -40, holdY: 240, holdTime: 9 },
      { type: 'EM', side: 'top', count: 3, interval: 0.7, path: 'dive' },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160, holdTime: 8 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160, holdTime: 8, delay: 1 },
      { type: 'U', side: 'top', count: 3, interval: 0.7, path: 'dive', delay: 1.5 },
    ] },
    { type: 'burst', duration: 16, pauseAfter: 0.8, spawns: [
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 240, y: -40, holdY: 200, holdTime: 9999 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 480, y: -40, holdY: 200, holdTime: 9999, delay: 0.5 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 300, holdTime: 9999, delay: 1 },
      { type: 'U', side: 'top', count: 3, interval: 0.7, path: 'dive', delay: 1 },
      { type: 'EM', side: 'top', count: 2, interval: 0.8, path: 'dive', delay: 1.5 },
      { type: 'ES', side: 'top', count: 3, interval: 0.8, path: 'dive', delay: 2 },
    ] },
    { type: 'burst', duration: 18, pauseAfter: 0.8, spawns: [
      { type: 'ES', side: 'left', count: 2, interval: 0.6, path: 'converge' },
      { type: 'EM', side: 'right', count: 2, interval: 0.6, path: 'converge', delay: 0.5 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'converge', delay: 1 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 240, holdTime: 9999, delay: 1.5 },
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 260, holdTime: 10 },
      { type: 'MET', size: 'medium', side: 'left', count: 2, interval: 1.2, delay: 2 },
      { type: 'MET', size: 'small', side: 'right', count: 3, interval: 0.9, delay: 2.5 },
    ] },
    { type: 'burst', duration: 18, pauseAfter: 0.8, spawns: [
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 300, y: -40, holdY: 230, holdTime: 9 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 420, y: -40, holdY: 230, holdTime: 9, delay: 1 },
      { type: 'EM', side: 'top', count: 3, interval: 0.7, path: 'dive' },
      { type: 'ES', side: 'top', count: 4, interval: 0.5, path: 'dive', delay: 0.8 },
      { type: 'EK', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 3 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 160, holdTime: 8 },
      { type: 'U', side: 'top', count: 2, interval: 0.7, path: 'dive', delay: 2 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 200, holdTime: 8, delay: 2.5 },
      { type: 'MET', size: 'medium', side: 'left', count: 2, interval: 1.2, delay: 2.5 },
      { type: 'MET', size: 'small', side: 'right', count: 3, interval: 0.9, delay: 3 },
    ] },
    { type: 'burst', duration: 18, pauseAfter: 0.8, spawns: [
      { type: 'UG', side: 'top', count: 1, interval: 0, path: 'hold', x: 140, y: -40, holdY: 120, holdTime: 9999 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 80, y: -40, holdY: 280, holdTime: 9999, delay: 1 },
      { type: 'U', side: 'top', count: 1, interval: 0, path: 'hold', x: 200, y: -40, holdY: 280, holdTime: 9999, delay: 1 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 140, y: -40, holdY: 360, holdTime: 9999, delay: 2 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 240, holdTime: 9, delay: 2.5 },
      { type: 'MET', size: 'medium', side: 'left', count: 2, interval: 1.2, delay: 3 },
      { type: 'MET', size: 'small', side: 'right', count: 3, interval: 0.9, delay: 3.5 },
    ] },
    { type: 'burst', duration: 20, pauseAfter: 0.7, spawns: [
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 260, y: -40, holdY: 220, holdTime: 10 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 460, y: -40, holdY: 220, holdTime: 10, delay: 0.8 },
      { type: 'EM', side: 'top', count: 3, interval: 0.7, path: 'dive' },
      { type: 'ES', side: 'top', count: 4, interval: 0.5, path: 'dive', delay: 0.8 },
      { type: 'EK', side: 'topLeft', count: 3, interval: 0.4, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 3, interval: 0.4, path: 'kamikaze', delay: 3 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160, holdTime: 8 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160, holdTime: 8, delay: 1 },
      { type: 'U', side: 'top', count: 2, interval: 0.7, path: 'dive', delay: 1.5 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 200, holdTime: 8, delay: 2 },
      { type: 'UG', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 120, holdTime: 999, delay: 2.5 },
      { type: 'MET', size: 'medium', side: 'left', count: 2, interval: 1.2, delay: 3 },
      { type: 'MET', size: 'small', side: 'right', count: 4, interval: 0.9, delay: 3.5 },
    ] },
    { type: 'burst', duration: 22, pauseAfter: 0.7, spawns: [
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 240, holdTime: 12 },
      { type: 'ED', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 240, holdTime: 12 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 300, y: -40, holdY: 220, holdTime: 12 },
      { type: 'EH', side: 'top', count: 1, interval: 0, path: 'hold', x: 420, y: -40, holdY: 220, holdTime: 12, delay: 1 },
      { type: 'EM', side: 'top', count: 3, interval: 0.6, path: 'dive' },
      { type: 'ES', side: 'top', count: 5, interval: 0.4, path: 'dive', delay: 1 },
      { type: 'EK', side: 'topLeft', count: 4, interval: 0.35, path: 'kamikaze', delay: 2 },
      { type: 'EK', side: 'topRight', count: 4, interval: 0.35, path: 'kamikaze', delay: 3 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 180, y: -40, holdY: 160, holdTime: 10 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 360, y: -40, holdY: 160, holdTime: 10, delay: 1 },
      { type: 'EN', side: 'top', count: 1, interval: 0, path: 'hold', x: 540, y: -40, holdY: 160, holdTime: 10, delay: 2 },
      { type: 'UG', side: 'top', count: 1, interval: 0, path: 'hold', x: 580, y: -40, holdY: 120, holdTime: 9999, delay: 2.5 },
      { type: 'U', side: 'top', count: 3, interval: 0.6, path: 'dive', delay: 3 },
      { type: 'UV', side: 'top', count: 1, interval: 0, path: 'hold', x: 580, y: -40, holdY: 240, holdTime: 9999, delay: 3.5 },
      { type: 'MET', size: 'medium', side: 'left', count: 3, interval: 1.1, delay: 3 },
      { type: 'MET', size: 'small', side: 'right', count: 4, interval: 0.9, delay: 3.5 },
    ] },
  ],
  boss: {
    name: '异形母舰',
    title: '堙灭虚空之核',
    hp: 200000,
    radius: 210,
    custom: 'alienMothership',
    artScale: 3.0,
    skills: [
      { id: 'p1', label: 'P1 · 双副炮扫射' },
      { id: 'p2', label: 'P2 · 裂壳光束' },
      { id: 'p3', label: 'P3 · 核心重火' },
      { id: 'p4', label: 'P4 · 狂暴终末' },
    ],
    turrets: [
      { side: 'left', name: '左副炮舱', hp: 15000 },
      { side: 'right', name: '右副炮舱', hp: 15000 },
    ],
    phases: [
      { threshold: 0.70, text: '副炮损毁·外壳开裂', duration: 1.8 },
      { threshold: 0.40, text: '装甲剥落·核心暴露', duration: 1.8 },
      { threshold: 0.15, text: '狂暴模式·终末倒计时', duration: 1.8 },
    ],
  },
};

const STAGES = [STAGE_1, STAGE_2, STAGE_3, STAGE_4];

function getStage(id) {
  return STAGES.find((stage) => stage.id === id) || STAGE_1;
}

module.exports = {
  STAGES,
  STAGE_1,
  STAGE_2,
  STAGE_3,
  getStage,
};

  });
  register("src/core/achievements.js", function (module, exports, require) {
const platform = require('./platform.js');

const KEY = 'cloudspire_achievements_v1';
const DEBUG_GATE_KEY = 'cloudspire_debug_unlocked_v1';

const DEFINITIONS = [
  { id: 'pvp', title: 'PVP达人', desc: '在 Local PK 模式取得一次胜利' },
  { id: 'hardClear', title: '虚假的晴空', desc: '达成结局A，首次通关 Hard 模式' },
  { id: 'insaneClear', title: '星海烬余安', desc: '达成结局B，首次通关 Insane 模式' },
  { id: 'debugUnlock', title: 'Hello,World', desc: '解锁内测跳关模式' },
];

function load() {
  const data = platform.getStorage(KEY, null);
  return data && typeof data === 'object' ? data : {};
}

function save(data) {
  platform.setStorage(KEY, data);
}

function isUnlocked(id) {
  return !!load()[id];
}

// Returns true if the achievement was newly unlocked (was locked before).
function unlock(id) {
  if (!DEFINITIONS.some((d) => d.id === id)) return false;
  const data = load();
  if (data[id]) return false;
  data[id] = true;
  save(data);
  return true;
}

function countUnlocked() {
  const data = load();
  return DEFINITIONS.filter((d) => !!data[d.id]).length;
}

// 内测跳关 gate: the debug-stage button is locked until the player watches one ad.
function isDebugUnlocked() {
  return !!platform.getStorage(DEBUG_GATE_KEY, false);
}

function setDebugUnlocked() {
  platform.setStorage(DEBUG_GATE_KEY, true);
}

module.exports = {
  KEY,
  DEFINITIONS,
  load,
  isUnlocked,
  unlock,
  countUnlocked,
  isDebugUnlocked,
  setDebugUnlocked,
};

  });
  register("src/core/artbank.js", function (module, exports, require) {
const { loadAssets } = require('./assets.js');

class ArtBank {
  constructor() {
    this.images = {};
    this.ready = false;
    this.promise = null;
  }

  start() {
    this.load();
  }

  load(onProgress) {
    if (this.promise) return this.promise;
    this.promise = new Promise((resolve) => {
      loadAssets((images) => {
        this.images = images;
        this.ready = true;
        resolve();
      }, onProgress);
    });
    return this.promise;
  }

  get(name) {
    const image = this.images[name];
    return image && image.width > 0 ? image : null;
  }
}

module.exports = ArtBank;

  });
  register("src/core/assets.js", function (module, exports, require) {
const ASSETS = {
  player: 'assets/images/web/player.png',
  enemy_s: 'assets/images/web/enemy_s.png',
  enemy_m: 'assets/images/web/enemy_m.png',
  enemy_h: 'assets/images/web/enemy_h.png',
  enemy_tuxi: 'assets/images/web/enemy_tuxi.png',
  enemy_hudun: 'assets/images/web/enemy_hudun.png',
  enemy_juji: 'assets/images/web/enemy_juji.png',
  enemy_fengwei_a: 'assets/images/web/enemy_fengwei_a.png',
  enemy_fengwei_b: 'assets/images/web/enemy_fengwei_b.png',
  boss: 'assets/images/web/boss.png',
  boss2: 'assets/images/web/boss2.png',
  boss3: 'assets/images/web/boss3.png',
  bullets: 'assets/images/bullets.png',
  mountain_bg: 'assets/images/mountain_bg.png',
  player_bullet: 'assets/images/player_bullet.png',
  enemy_bullet_small: 'assets/images/enemy_bullet_small.png',
  enemy_bullet_medium: 'assets/images/enemy_bullet_medium.png',
  enemy_bullet_large: 'assets/images/enemy_bullet_large.png',
  boss_bullet_1: 'assets/images/boss_bullet_1.png',
  boss_bullet_2: 'assets/images/boss_bullet_2.png',
  boss_bullet_3: 'assets/images/boss_bullet_3.png',
  boss_bullet_4: 'assets/images/boss_bullet_4.png',
  boss_bullet_5: 'assets/images/boss_bullet_5.png',
  boss_bullet_6: 'assets/images/boss_bullet_6.png',
  boss3_bullet_1: 'assets/images/boss3_bullet_1.png',
  boss3_bullet_2: 'assets/images/boss3_bullet_2.png',
  boss3_bullet_3: 'assets/images/boss3_bullet_3.png',
  boss3_bullet_4: 'assets/images/boss3_bullet_4.png',
  boss3_bullet_5: 'assets/images/boss3_bullet_5.png',
  boss3_bullet_6: 'assets/images/boss3_bullet_6.png',
  be01: 'assets/images/web/be01.jpg',
  be02: 'assets/images/web/be02.jpg',
  be03: 'assets/images/web/be03.jpg',
  be04: 'assets/images/web/be04.jpg',
  he00: 'assets/images/he00.jpg',
  he01: 'assets/images/he01.jpg',
  he02: 'assets/images/he02.jpg',
  he03: 'assets/images/he03.jpg',
  he04: 'assets/images/he04.jpg',
  he05: 'assets/images/he05.jpg',
  enemy_es: 'assets/images/web/enemy_es.png',
  enemy_em: 'assets/images/web/enemy_em.png',
  enemy_eh: 'assets/images/web/enemy_eh.png',
  enemy_ek: 'assets/images/web/enemy_ek.png',
  enemy_en: 'assets/images/web/enemy_en.png',
  enemy_ed: 'assets/images/web/enemy_ed.png',
  ufo_m: 'assets/images/web/ufo_m.png',
  ufo_l: 'assets/images/web/ufo_l.png',
  ufo_gen: 'assets/images/web/ufo_gen.png',
  meteor_small: 'assets/images/web/meteor_small.png',
  meteor_medium: 'assets/images/web/meteor_medium.png',
  meteor_large: 'assets/images/web/meteor_large.png',
  mothership: 'assets/images/web/mothership.png',
  boss_laser: 'assets/images/boss_laser.png',
};

function loadImage(path) {
  return new Promise((resolve) => {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    let image;
    if (wxApi && wxApi.createImage) {
      image = wxApi.createImage();
    } else if (typeof Image !== 'undefined') {
      image = new Image();
    } else {
      resolve(null);
      return;
    }
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = path;
  });
}

async function loadAssets(callback, onProgress) {
  const images = {};
  const entries = Object.entries(ASSETS);
  let loaded = 0;
  await Promise.all(
    entries.map(async ([key, path]) => {
      images[key] = await loadImage(path);
      loaded += 1;
      if (onProgress) onProgress({ loaded, total: entries.length });
    })
  );
  if (callback) callback(images);
  return images;
}

module.exports = {
  ASSETS,
  loadImage,
  loadAssets,
};

  });
  register("src/core/audio.js", function (module, exports, require) {
const platform = require('./platform.js');

let sharedContext = null;

function getContext() {
  if (sharedContext) return sharedContext;
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createWebAudioContext) {
    sharedContext = wxApi.createWebAudioContext();
  } else if (typeof AudioContext !== 'undefined') {
    sharedContext = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    sharedContext = new webkitAudioContext();
  }
  return sharedContext;
}

function loadBufferTrack(track) {
  fetch(track.src)
    .then((response) => response.arrayBuffer())
    .then((data) => getContext().decodeAudioData(data))
    .then((buffer) => {
      track.buffer = buffer;
      track.ready = true;
      if (track.onReady) track.onReady();
    })
    .catch(() => {
      if (typeof Audio !== 'undefined') {
        track.fallback = new Audio(track.src);
        track.fallback.loop = true;
        track.fallback.addEventListener('ended', () => {
          if (track.onEnded) track.onEnded();
        });
      }
      track.ready = true;
      if (track.onReady) track.onReady();
    });
}

function createAudio(src) {
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createInnerAudioContext) {
    const inner = wxApi.createInnerAudioContext();
    inner.src = src;
    inner.loop = true;
    const track = { kind: 'inner', src, audio: inner, fallback: null, ready: false, pending: false, stopping: false };
    const markReady = () => {
      if (track.ready) return;
      track.ready = true;
      if (track.onReady) track.onReady();
    };
    if (typeof inner.onCanplay === 'function') inner.onCanplay(markReady);
    else inner.onCanplay = markReady;
    if (typeof inner.onError === 'function') inner.onError(markReady);
    else inner.onError = markReady;
    return track;
  }
  if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
    const track = {
      kind: 'buffer',
      src,
      buffer: null,
      fallback: null,
      source: null,
      gain: null,
      ready: false,
      pending: false,
      stopping: false,
    };
    loadBufferTrack(track);
    return track;
  }
  if (typeof Audio !== 'undefined') {
    const audio = new Audio(src);
    audio.loop = true;
    const track = { kind: 'inner', src, audio, fallback: null, ready: false, pending: false, stopping: false };
    audio.addEventListener('loadeddata', () => {
      track.ready = true;
      if (track.onReady) track.onReady();
    });
    audio.addEventListener('error', () => {
      track.ready = true;
      if (track.onReady) track.onReady();
    });
    audio.addEventListener('ended', () => {
      if (track.onEnded) track.onEnded();
    });
    return track;
  }
  return null;
}

function tone(freq, duration, type, gainValue, when, slideTo) {
  const ctx = getContext();
  if (!ctx) return;
  const start = (when === undefined ? 0 : when) + ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }
  gain.gain.setValueAtTime(gainValue || 0.12, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration, gainValue, when) {
  const ctx = getContext();
  if (!ctx) return;
  const start = (when === undefined ? 0 : when) + ctx.currentTime;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  source.buffer = buffer;
  gain.gain.setValueAtTime(gainValue || 0.2, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

class AudioManager {
  constructor() {
    this.started = false;
    this.titleTrack = null;
    this.stageTrack = null;
    this.stage2Track = null;
    this.stage3Track = null;
    this.stage4Track = null;
    this.boss4Track = null;
    this.heTrack = null;
    this.current = null;
    this.lightingBuffer = null;
    this.lightingSource = null;
    this.lightingGain = null;
    this.lightingReady = false;
    this.watchdogTimer = 0;
    this.lastContextState = null;
  }

  allTracks() {
    return [this.titleTrack, this.stageTrack, this.stage2Track, this.stage3Track, this.stage4Track, this.boss4Track, this.heTrack].filter(Boolean);
  }

  createTrack(src) {
    const track = createAudio(src);
    if (!track) return null;
    track.onReady = () => this.tryStartPending(track);
    track.onEnded = () => this.restartTrack(track);
    this.attachEndedGuard(track);
    return track;
  }

  // BGM must never stop after a single pass. Some runtimes drop the loop flag, so
  // every track also gets an ended-handler that restarts it while it is the active BGM.
  attachEndedGuard(track) {
    const player = track.audio || track.fallback;
    if (!player) return;
    const handler = () => {
      if (track.onEnded) track.onEnded();
    };
    if (typeof player.addEventListener === 'function') {
      player.addEventListener('ended', handler);
      return;
    }
    if (typeof player.onEnded === 'function') {
      player.onEnded(handler);
      return;
    }
    player.onEnded = handler;
  }

  loadBgms() {
    this.titleTrack = this.createTrack('assets/audio/title.mp3');
    this.stageTrack = this.createTrack('assets/audio/stage1.mp3');
    this.stage2Track = this.createTrack('assets/audio/stage2.mp3');
    this.stage3Track = this.createTrack('assets/audio/stage3.mp3');
    this.stage4Track = this.createTrack('assets/audio/stage4.mp3');
    this.boss4Track = this.createTrack('assets/audio/boss4.m4a');
    this.heTrack = this.createTrack('assets/audio/he.mp3');
    this.loadLightingSfx();
  }

  loadLightingSfx(onDone) {
    if (this.lightingReady || this.lightingBuffer) {
      if (onDone) onDone();
      return;
    }
    if (typeof fetch === 'undefined') {
      this.lightingReady = true;
      if (onDone) onDone();
      return;
    }
    fetch('assets/audio/lighting.mp3')
      .then((r) => r.arrayBuffer())
      .then((d) => getContext().decodeAudioData(d))
      .then((buf) => {
        this.lightingBuffer = buf;
        this.lightingReady = true;
        if (onDone) onDone();
      })
      .catch(() => {
        this.lightingReady = true;
        if (onDone) onDone();
      });
  }

  loadAll(onProgress) {
    return new Promise((resolve) => {
      const tracks = this.allTracks();
      const total = tracks.length + 1;
      const readyTrack = (track) =>
        track.ready ||
        !!track.buffer ||
        (track.kind === 'inner' && track.audio && typeof track.audio.duration === 'number' && track.audio.duration > 0);
      const check = () => {
        const loaded = tracks.filter(readyTrack).length + (this.lightingReady || !!this.lightingBuffer ? 1 : 0);
        if (onProgress) onProgress({ loaded, total });
        if (loaded >= total) resolve();
      };
      for (const track of tracks) {
        const original = track.onReady;
        track.onReady = () => {
          if (original) original();
          check();
        };
      }
      this.loadLightingSfx(() => check());
      check();
    });
  }

  unlock() {
    const ctx = getContext();
    if (ctx && ctx.resume) {
      const resumed = ctx.resume();
      if (resumed && resumed.catch) resumed.catch(() => {});
    }
    this.started = true;
    for (const track of this.allTracks()) this.tryStartPending(track);
    if (this.current && this.current.kind === 'inner') {
      const inner = this.current.audio || this.current.fallback;
      if (inner && (inner.paused || inner.paused === undefined) && inner.play) {
        this.markPlaying(this.current);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
    }
  }

  playBgm(track) {
    if (!track || this.current === track) return;
    this.stopBgm();
    track.stopping = false;
    track.shortPlays = 0;
    track.lastRestartAt = 0;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (!inner) return;
      inner.loop = true;
      this.rewind(inner);
      if (inner.play) {
        this.markPlaying(track);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
      this.current = track;
      return;
    }
    const ctx = getContext();
    if (!ctx) return;
    if (!track.buffer) {
      track.pending = true;
      this.current = track;
      if (track.fallback) {
        this.playFallback(track);
      }
      return;
    }
    if (!this.started) {
      track.pending = true;
      this.current = track;
      return;
    }
    this.startBuffer(track);
  }

  rewind(player) {
    if (!player) return;
    try {
      player.currentTime = 0;
    } catch (err) {
      // some runtimes reject seek before metadata is ready
    }
    if (typeof player.seek === 'function') {
      try {
        player.seek(0);
      } catch (err) {
        // ignore
      }
    }
  }

  playFallback(track) {
    const player = track && track.fallback;
    if (!player) return;
    player.loop = true;
    this.rewind(player);
    this.markPlaying(track);
    const played = player.play();
    if (played && played.catch) played.catch(() => {});
  }

  // Restarts the active BGM in place, used when a runtime ends a looping track.
  restartTrack(track) {
    if (!track || this.current !== track || track.pending || track.stopping) return;
    const now = Date.now();
    const expected = this.trackDuration(track);
    const playedMs = now - (track.playedSince || 0);
    const endedTooEarly = expected > 2 && playedMs < expected * 300;
    if (endedTooEarly) {
      // Ended far too early: this track cannot play cleanly, so stop retrying it.
      track.shortPlays = (track.shortPlays || 0) + 1;
      if (track.shortPlays > 3) return;
    } else {
      track.shortPlays = 0;
    }
    // Never restart faster than the guard can be useful; a healthy BGM ends after a full pass.
    if (track.lastRestartAt && now - track.lastRestartAt < 300) return;
    track.lastRestartAt = now;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (!inner) return;
      inner.loop = true;
      this.rewind(inner);
      if (inner.play) {
        this.markPlaying(track);
        const played = inner.play();
        if (played && played.catch) played.catch(() => {});
      }
      return;
    }
    if (!track.buffer) {
      this.playFallback(track);
      return;
    }
    if (!this.started) {
      track.pending = true;
      return;
    }
    this.startBuffer(track);
  }

  trackDuration(track) {
    if (track.buffer && track.buffer.duration) return track.buffer.duration;
    const player = track.audio || track.fallback;
    if (player && typeof player.duration === 'number' && !isNaN(player.duration)) return player.duration;
    return 0;
  }

  markPlaying(track) {
    track.playedSince = Date.now();
  }

  tryStartPending(track) {
    if (!track || track !== this.current || !track.pending || !this.started) return;
    if (track.kind !== 'buffer' || !track.buffer) return;
    this.startBuffer(track);
  }

  releaseSource(track) {
    const source = track.source;
    track.source = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch (err) {
        // already stopped
      }
      try {
        source.disconnect();
      } catch (err) {
        // ignore
      }
    }
    if (track.gain) {
      try {
        track.gain.disconnect();
      } catch (err) {
        // ignore
      }
      track.gain = null;
    }
  }

  startBuffer(track) {
    const ctx = getContext();
    if (!ctx || !track.buffer) return;
    this.releaseSource(track);
    track.pending = false;
    track.stopping = false;
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.loopStart = 0;
    if (track.buffer.duration > 0) source.loopEnd = track.buffer.duration;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.onended = () => {
      // Fires only when a runtime ignored `loop`; restart so the BGM never goes silent.
      if (track.stopping || this.current !== track || track.source !== source) return;
      this.restartTrack(track);
    };
    track.source = source;
    track.gain = gain;
    this.markPlaying(track);
    source.start(0);
    this.current = track;
  }

  // Called every frame; keeps mobile/WeChat interruptions from leaving the BGM silent.
  tick(dt) {
    this.watchdogTimer += dt || 0;
    if (this.watchdogTimer < 0.5) return;
    this.watchdogTimer = 0;
    this.ensurePlayback();
  }

  ensurePlayback() {
    const ctx = getContext();
    let resumedFromInterrupt = false;
    let contextRunning = true;
    if (ctx && ctx.state) {
      if (ctx.state !== 'running') {
        this.lastContextState = ctx.state;
        contextRunning = false;
        if (ctx.resume) {
          const resumed = ctx.resume();
          if (resumed && resumed.catch) resumed.catch(() => {});
        }
      } else {
        if (this.lastContextState && this.lastContextState !== 'running') resumedFromInterrupt = true;
        this.lastContextState = 'running';
      }
    }
    const track = this.current;
    if (!track || track.pending || track.stopping || !this.started) return;
    if (track.kind === 'inner') {
      const inner = track.audio || track.fallback;
      if (inner && inner.paused === true) this.restartTrack(track);
      return;
    }
    if (!contextRunning) return;
    if (!track.buffer) {
      if (track.fallback && track.fallback.paused === true) this.restartTrack(track);
      return;
    }
    // The audio clock stopped (phone lock / app switch) and came back: the old
    // buffer source is dead even though `loop` is set, so build a fresh one.
    if (resumedFromInterrupt && track.source) this.restartTrack(track);
  }

  playTitleBgm() {
    this.playBgm(this.titleTrack);
  }

  playStageBgm() {
    this.playBgm(this.stageTrack);
  }

  playStage2Bgm() {
    this.playBgm(this.stage2Track);
  }

  playStage3Bgm() {
    this.playBgm(this.stage3Track);
  }

  playStage4Bgm() {
    this.playBgm(this.stage4Track);
  }

  playBoss4Bgm() {
    this.playBgm(this.boss4Track);
  }

  playHeBgm() {
    this.playBgm(this.heTrack);
  }

  startBgm() {
    this.playTitleBgm();
  }

  stopBgm() {
    if (!this.current) return;
    const track = this.current;
    track.pending = false;
    track.stopping = true;
    if (track.kind === 'buffer') {
      this.releaseSource(track);
    } else {
      const inner = track.audio || track.fallback;
      if (inner && inner.pause) inner.pause();
      if (inner) this.rewind(inner);
    }
    this.current = null;
  }

  shoot() {
    tone(900, 0.05, 'square', 0.13, 0, 620);
  }

  explosion() {
    noise(0.3, 0.4);
    tone(160, 0.2, 'sawtooth', 0.2, 0, 60);
  }

  pickup() {
    tone(660, 0.07, 'sine', 0.14);
    tone(990, 0.08, 'sine', 0.14, 0.07);
  }

  levelup() {
    tone(523, 0.09, 'square', 0.15);
    tone(659, 0.09, 'square', 0.15, 0.08);
    tone(784, 0.14, 'square', 0.15, 0.16);
  }

  bomb() {
    tone(300, 0.8, 'sawtooth', 0.22, 0, 40);
    noise(0.9, 0.3);
    tone(1200, 0.4, 'sine', 0.1, 0.1, 1600);
  }

  thunder() {
    noise(1.1, 0.5);
    tone(70, 1.0, 'sawtooth', 0.35, 0, 28);
    tone(140, 0.5, 'square', 0.25, 0.06, 45);
  }

  playLighting() {
    const ctx = getContext();
    if (!ctx) return;
    this.stopLighting();
    if (this.lightingBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.lightingBuffer;
      src.loop = false;
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0);
      this.lightingSource = src;
      this.lightingGain = gain;
      src.onended = () => {
        if (this.lightingSource === src) {
          this.lightingSource = null;
          this.lightingGain = null;
        }
      };
    } else {
      this.thunder();
    }
  }

  stopLighting() {
    if (this.lightingSource) {
      try { this.lightingSource.stop(); } catch (e) {}
      try { this.lightingSource.disconnect(); } catch (e) {}
      this.lightingSource = null;
    }
    if (this.lightingGain) {
      try { this.lightingGain.disconnect(); } catch (e) {}
      this.lightingGain = null;
    }
  }

  hit() {
    tone(220, 0.09, 'sawtooth', 0.14, 0, 130);
  }

  bossWarning() {
    tone(392, 0.12, 'square', 0.15);
    tone(392, 0.12, 'square', 0.15, 0.14);
    tone(523, 0.2, 'square', 0.17, 0.28);
  }

  bossPhase() {
    tone(330, 0.1, 'square', 0.15);
    tone(494, 0.18, 'square', 0.15, 0.1);
  }

  gameover() {
    tone(392, 0.25, 'triangle', 0.16);
    tone(311, 0.25, 'triangle', 0.16, 0.24);
    tone(233, 0.45, 'triangle', 0.16, 0.48);
  }

  clear() {
    tone(523, 0.12, 'square', 0.15);
    tone(659, 0.12, 'square', 0.15, 0.1);
    tone(784, 0.12, 'square', 0.15, 0.2);
    tone(1047, 0.3, 'square', 0.17, 0.3);
  }
}

module.exports = AudioManager;

  });
  register("src/core/input.js", function (module, exports, require) {
class Input {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.touches = {};
    this.taps = [];
    this.enabled = true;
    this.handlers = null;
    this.onAnyTap = null;
  }

  start() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi) return;
    this.handlers = {
      start: (event) => this.handleStart(event),
      move: (event) => this.handleMove(event),
      end: (event) => this.handleEnd(event),
    };
    if (wxApi.onTouchStart) wxApi.onTouchStart(this.handlers.start);
    if (wxApi.onTouchMove) wxApi.onTouchMove(this.handlers.move);
    if (wxApi.onTouchEnd) wxApi.onTouchEnd(this.handlers.end);
    if (wxApi.onTouchCancel) wxApi.onTouchCancel(this.handlers.end);
  }

  stop() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi || !this.handlers) return;
    if (wxApi.offTouchStart) wxApi.offTouchStart(this.handlers.start);
    if (wxApi.offTouchMove) wxApi.offTouchMove(this.handlers.move);
    if (wxApi.offTouchEnd) wxApi.offTouchEnd(this.handlers.end);
    if (wxApi.offTouchCancel) wxApi.offTouchCancel(this.handlers.end);
    this.handlers = null;
  }

  toDesign(clientX, clientY) {
    if (this.game) return this.game.toDesign(clientX, clientY);
    return { x: clientX, y: clientY };
  }

  handleStart(event) {
    if (!this.enabled) return;
    if (this.onAnyTap) this.onAnyTap();
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      const point = this.toDesign(touch.clientX, touch.clientY);
      this.touches[touch.identifier] = point;
      this.taps.push({ x: point.x, y: point.y, id: touch.identifier });
      if (!this.active) {
        this.active = { id: touch.identifier, x: point.x, y: point.y };
      }
    }
  }

  handleMove(event) {
    if (!this.enabled) return;
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      const point = this.toDesign(touch.clientX, touch.clientY);
      this.touches[touch.identifier] = point;
      if (this.active && this.active.id === touch.identifier) {
        this.active.x = point.x;
        this.active.y = point.y;
      }
    }
  }

  handleEnd(event) {
    const changed = event.changedTouches || event.touches || [];
    for (const touch of changed) {
      delete this.touches[touch.identifier];
      if (this.active && this.active.id === touch.identifier) {
        this.active = null;
      }
    }
  }

  getMoveTarget() {
    return this.active ? { x: this.active.x, y: this.active.y } : null;
  }

  consumeTap() {
    if (!this.taps.length) return null;
    return this.taps.shift();
  }

  hasTapIn(rect) {
    const index = this.taps.findIndex(
      (tap) => tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h
    );
    if (index === -1) return false;
    this.taps.splice(index, 1);
    return true;
  }
}

module.exports = Input;

  });
  register("src/core/mountain-background.js", function (module, exports, require) {
const { rand, TAU } = require('../utils/math.js');

const PHASE_DURATION = 30;

// stage3 遮挡层云：固定使用完全展开的大尺寸（约 2400px 宽），不再随进度放大。
const OCC_CLOUD_SCALE = 2.17;
const OCC_CLOUD_INTERVAL_MIN = 6;
const OCC_CLOUD_INTERVAL_MAX = 12;

const TIME_PHASES = [
  {
    skyTop: [214, 168, 124],
    skyMid: [196, 158, 118],
    terrainFar: [184, 142, 102],
    terrainNear: [176, 126, 86],
  },
  {
    skyTop: [226, 186, 134],
    skyMid: [212, 170, 118],
    terrainFar: [198, 148, 98],
    terrainNear: [192, 132, 84],
  },
  {
    skyTop: [208, 172, 136],
    skyMid: [198, 164, 130],
    terrainFar: [194, 152, 116],
    terrainNear: [188, 138, 98],
  },
];

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function scaleColor(color, factor) {
  return color.map((v) => Math.round(Math.min(255, v * factor)));
}

function css(color) {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function makeCanvas(width, height) {
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createCanvas && typeof document === 'undefined') {
    const c = wxApi.createCanvas();
    c.width = width;
    c.height = height;
    return c;
  }
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function smoothStep(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function makeMountains(count, minW, maxW, minH, maxH) {
  const mountains = [];
  for (let i = 0; i < count; i += 1) {
    mountains.push({
      x: rand(-40, 720),
      y: rand(-700, 1280),
      w: rand(minW, maxW),
      h: rand(minH, maxH),
      curve: rand(0.15, 0.35),
      seed: Math.floor(rand(0, 100000)),
      rock: rand(0.4, 1.6),
    });
  }
  return mountains;
}

class MountainBackground {
  constructor(options) {
    const opts = options || {};
    this.fixed = opts.fixed || null;
    this.rain = opts.rain ? this.makeRain() : null;
    this.sea = !!opts.sea;
    this.cloudtop = !!opts.cloudtop;
    if (this.sea) {
      this.makeSea();
      return;
    }
    if (this.cloudtop) {
      this.makeCloudtop();
      return;
    }
    this.terrain = !!opts.terrain;
    if (this.terrain && this.makeTerrain()) {
      return;
    }
    this.terrain = false;
    this.space = !!opts.space;
    if (this.space) {
      this.makeSpace();
      return;
    }
    this.layers = [
      {
        speed: 16,
        alpha: 0.55,
        mountains: makeMountains(8, 150, 280, 160, 380),
      },
      {
        speed: 36,
        alpha: 0.85,
        mountains: makeMountains(7, 130, 260, 220, 480),
      },
      {
        speed: 64,
        alpha: 1,
        mountains: makeMountains(6, 110, 240, 260, 560),
      },
    ];
    this.haze = [];
    for (let i = 0; i < 8; i += 1) {
      this.haze.push({ x: rand(0, 720), y: rand(0, 1280), w: rand(120, 260) });
    }
    this.time = 0;
  }

  makeSpace() {
    this.time = 0;
    this.starLayers = [
      { speed: 18, stars: this.makeStars(55, 0.4, 1.1, 0.35) },
      { speed: 45, stars: this.makeStars(45, 0.7, 1.6, 0.5) },
      { speed: 85, stars: this.makeStars(30, 1.0, 2.2, 0.8) },
    ];
    const nebColors = ['74,42,138', '42,58,154', '122,42,106', '42,74,122'];
    this.nebulae = [];
    for (let i = 0; i < 5; i += 1) {
      this.nebulae.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        r: rand(210, 330),
        color: nebColors[i % nebColors.length],
        speed: rand(7, 14),
        alpha: rand(0.15, 0.28),
      });
    }
    this.dustLanes = [];
    for (let i = 0; i < 4; i += 1) {
      this.dustLanes.push({
        x: rand(80, 640),
        y: rand(0, 1280),
        r: rand(180, 320),
        alpha: rand(0.24, 0.4),
        speed: rand(5, 12),
        ph: rand(0, TAU),
      });
    }
    this.debris = [];
    for (let i = 0; i < 16; i += 1) {
      this.debris.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        w: rand(8, 40),
        h: rand(5, 15),
        spin: rand(-1.4, 1.4),
        vx: rand(-12, 12),
        vy: rand(22, 55),
        angle: rand(0, TAU),
      });
    }
    this.celestials = [];
    for (let i = 0; i < 4; i += 1) {
      const planet = i % 2 === 0;
      this.celestials.push({
        kind: planet ? 'planet' : 'moon',
        ring: planet && i === 0,
        x: rand(100, 620),
        y: planet ? rand(120, 980) : rand(-420, 260),
        r: planet ? rand(58, 105) : rand(34, 58),
        speed: rand(10, 18),
        phase: rand(0, TAU),
      });
    }
    this.shooting = null;
    this.shootTimer = rand(2, 5);
  }

  makeStars(count, minR, maxR, bright) {
    const list = [];
    const palette = [
      [232, 238, 255],
      [255, 255, 255],
      [255, 234, 196],
      [201, 242, 255],
      [201, 162, 255],
    ];
    for (let i = 0; i < count; i += 1) {
      const c = palette[Math.floor(rand(0, palette.length))];
      list.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        r: rand(minR, maxR),
        phase: rand(0, TAU),
        bright: bright + rand(0, 0.3),
        rgb: c,
        color: `rgb(${c[0]},${c[1]},${c[2]})`,
        glint: Math.random() < 0.25,
        glow: Math.random() < 0.18,
      });
    }
    return list;
  }

  makeRain() {
    const drops = [];
    for (let i = 0; i < 90; i += 1) {
      drops.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        len: rand(14, 26),
        speed: rand(700, 1000),
        alpha: rand(0.25, 0.5),
      });
    }
    return drops;
  }

  palette() {
    if (this.fixed) {
      return {
        skyTop: this.fixed.skyTop,
        skyMid: this.fixed.skyMid,
        far: this.fixed.mountains[0],
        mid: this.fixed.mountains[1],
        near: this.fixed.mountains[2],
        haze: this.fixed.haze || this.fixed.skyMid,
      };
    }
    const total = TIME_PHASES.length * PHASE_DURATION;
    const cycle = (this.time % total) / PHASE_DURATION;
    const index = Math.floor(cycle) % TIME_PHASES.length;
    const t = cycle - Math.floor(cycle);
    const a = TIME_PHASES[index];
    const b = TIME_PHASES[(index + 1) % TIME_PHASES.length];
    const terrainFar = mixColor(a.terrainFar, b.terrainFar, t);
    const terrainNear = mixColor(a.terrainNear, b.terrainNear, t);
    return {
      skyTop: mixColor(a.skyTop, b.skyTop, t),
      skyMid: mixColor(a.skyMid, b.skyMid, t),
      far: mixColor(terrainFar, terrainNear, 0.3),
      mid: scaleColor(mixColor(terrainFar, terrainNear, 0.55), 0.82),
      near: scaleColor(terrainNear, 0.62),
      haze: mixColor(mixColor(a.skyMid, b.skyMid, t), [255, 255, 255], 0.6),
    };
  }

  update(dt) {
    this.time += dt;
    if (this.sea) {
      this.updateSea(dt);
      return;
    }
    if (this.cloudtop) {
      this.updateCloudtop(dt);
      return;
    }
    if (this.terrain) {
      this.updateTerrain(dt);
      return;
    }
    if (this.space) {
      for (const layer of this.starLayers) {
        for (const star of layer.stars) {
          star.y += layer.speed * dt;
          if (star.y > 1310) {
            star.y = -10;
            star.x = rand(0, 720);
          }
        }
      }
      for (const neb of this.nebulae) {
        neb.y += neb.speed * dt;
        if (neb.y > 1280 + neb.r) {
          neb.y = -neb.r;
          neb.x = rand(0, 720);
        }
      }
      for (const lane of this.dustLanes) {
        lane.y += lane.speed * dt;
        lane.x += Math.sin(this.time * 0.1 + lane.ph) * 2 * dt;
        if (lane.y > 1280 + lane.r) {
          lane.y = -lane.r;
          lane.x = rand(80, 640);
        }
      }
      for (const d of this.debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.angle += d.spin * dt;
        if (d.y > 1320 || d.x > 760 || d.x < -60) {
          d.x = rand(0, 720);
          d.y = -30;
          d.vy = rand(22, 55);
        }
      }
      for (const c of this.celestials) {
        c.y += c.speed * dt;
        if (c.y > 1380) {
          c.y = -c.r * 2;
          c.x = rand(120, 600);
        }
      }
      if (this.shooting) {
        this.shooting.x += this.shooting.vx * dt;
        this.shooting.y += this.shooting.vy * dt;
        this.shooting.life -= dt;
        if (this.shooting.life <= 0 || this.shooting.y > 700) this.shooting = null;
      } else {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
          this.shooting = {
            x: rand(120, 560),
            y: rand(-90, -30),
            vx: rand(-300, -180),
            vy: rand(420, 560),
            life: rand(0.5, 0.8),
          };
          this.shootTimer = rand(3, 7);
        }
      }
      return;
    }
    for (const layer of this.layers) {
      for (const mountain of layer.mountains) {
        mountain.y += layer.speed * dt;
        if (mountain.y > 1280 + mountain.h) {
          mountain.y = -mountain.h * 1.6;
          mountain.x = rand(-40, 720);
        }
      }
    }
    for (const haze of this.haze) {
      haze.y += 42 * dt;
      haze.x += Math.sin(this.time + haze.w) * 3 * dt;
      if (haze.y > 1320) {
        haze.y = -80;
        haze.x = rand(0, 720);
      }
    }
    if (this.rain) {
      for (const drop of this.rain) {
        drop.y += drop.speed * dt;
        drop.x += 26 * dt;
        if (drop.y > 1320) {
          drop.y = -20;
          drop.x = rand(0, 720);
        }
      }
    }
  }

  render(ctx, fx) {
    const effect = fx || {};
    if (this.sea) {
      this.renderSea(ctx, effect);
      return;
    }
    if (this.cloudtop) {
      this.renderCloudtop(ctx, effect);
      return;
    }
    if (this.terrain) {
      this.renderTerrain(ctx);
      return;
    }
    if (this.space) {
      this.renderSpace(ctx);
      return;
    }
    const p = this.palette();
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, css(p.skyTop));
    sky.addColorStop(0.45, css(p.skyMid));
    sky.addColorStop(0.8, css(p.far));
    sky.addColorStop(1, css(p.near));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    const layerColors = [
      mixColor(p.far, [176, 186, 202], 0.42),
      mixColor(p.mid, p.far, 0.1),
      p.near,
    ];
    for (let i = 0; i < this.layers.length; i += 1) {
      const layer = this.layers[i];
      ctx.globalAlpha = layer.alpha;
      for (const mountain of layer.mountains) {
        this.drawMountain(ctx, mountain, layerColors[i], i === 2);
      }
    }

    for (const haze of this.haze) {
      const g = ctx.createRadialGradient(haze.x, haze.y, 4, haze.x, haze.y, haze.w);
      g.addColorStop(0, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0.16)`);
      g.addColorStop(0.7, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0.07)`);
      g.addColorStop(1, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(haze.x, haze.y, haze.w, haze.w * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.rain) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(185,215,238,0.9)';
      for (const drop of this.rain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 5, drop.y + drop.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    for (let i = 0; i < 340; i += 1) {
      const x = (i * 263 + 37) % 720;
      const y = (i * 97) % 1280;
      const light = i % 3 !== 0;
      ctx.globalAlpha = 0.02 + ((i * 7) % 3) * 0.009;
      ctx.fillStyle = light ? '#fff0d4' : '#2b1606';
      ctx.fillRect(x, y, 1 + ((i * 13) % 2), 1);
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(360, 640, 200, 360, 640, 760);
    vignette.addColorStop(0, 'rgba(20,12,4,0)');
    vignette.addColorStop(1, 'rgba(20,12,4,0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderSpace(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#04020c');
    sky.addColorStop(0.45, '#0b0618');
    sky.addColorStop(0.8, '#140b24');
    sky.addColorStop(1, '#0a0614');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    for (let ni = 0; ni < this.nebulae.length; ni += 1) {
      const neb = this.nebulae[ni];
      const puffs = [
        { dx: 0, dy: 0, r: neb.r, a: 0.85 },
        { dx: Math.cos(ni * 2.399) * neb.r * 0.42, dy: -neb.r * 0.18, r: neb.r * 0.62, a: 0.5 },
        { dx: Math.sin(ni * 1.7) * neb.r * 0.5, dy: neb.r * 0.28, r: neb.r * 0.5, a: 0.4 },
      ];
      for (const puff of puffs) {
        const g = ctx.createRadialGradient(neb.x + puff.dx, neb.y + puff.dy, puff.r * 0.08, neb.x + puff.dx, neb.y + puff.dy, puff.r);
        g.addColorStop(0, `rgba(${neb.color},${(neb.alpha * puff.a).toFixed(3)})`);
        g.addColorStop(0.62, `rgba(${neb.color},${(neb.alpha * puff.a * 0.55).toFixed(3)})`);
        g.addColorStop(1, `rgba(${neb.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(neb.x + puff.dx, neb.y + puff.dy, puff.r, 0, TAU);
        ctx.fill();
      }
      const coreColor = ni % 2 === 0 ? '238,232,255' : '255,240,252';
      const core = ctx.createRadialGradient(neb.x, neb.y, 2, neb.x, neb.y, neb.r * 0.4);
      core.addColorStop(0, `rgba(${coreColor},${(0.22 + neb.alpha * 0.8).toFixed(3)})`);
      core.addColorStop(0.4, `rgba(${coreColor},${(neb.alpha * 0.5).toFixed(3)})`);
      core.addColorStop(1, `rgba(${coreColor},0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.r * 0.4, 0, TAU);
      ctx.fill();
    }
    for (const lane of this.dustLanes) {
      const g = ctx.createRadialGradient(lane.x, lane.y, lane.r * 0.2, lane.x, lane.y, lane.r);
      g.addColorStop(0, `rgba(4,3,12,${(lane.alpha * 0.7).toFixed(3)})`);
      g.addColorStop(0.7, `rgba(8,5,18,${(lane.alpha * 0.3).toFixed(3)})`);
      g.addColorStop(1, 'rgba(8,5,18,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lane.x, lane.y, lane.r, 0, TAU);
      ctx.fill();
    }

    for (const layer of this.starLayers) {
      for (const star of layer.stars) {
        const tw = star.bright * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * (1.5 + star.phase) + star.phase)));
        ctx.globalAlpha = Math.min(1, tw);
        if (star.glow && star.r > 1 && star.rgb) {
          const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 5.5);
          g.addColorStop(0, `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},${(tw * 0.26).toFixed(3)})`);
          g.addColorStop(1, `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 5.5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = star.color || '#e8ecff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, TAU);
        ctx.fill();
        if (star.glint && star.r > 1.5) {
          ctx.strokeStyle = star.color || '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(star.x - star.r * 2.4, star.y);
          ctx.lineTo(star.x + star.r * 2.4, star.y);
          ctx.moveTo(star.x, star.y - star.r * 2.4);
          ctx.lineTo(star.x, star.y + star.r * 2.4);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.save();
    for (let i = 0; i < 240; i += 1) {
      const x = (i * 173 + 53) % 720;
      const y = (i * 109) % 1280;
      const tone = i % 4;
      ctx.globalAlpha = 0.03 + ((i * 7) % 4) * 0.02;
      if (tone === 0) ctx.fillStyle = '#dfe8ff';
      else if (tone === 1) ctx.fillStyle = '#ffd9f0';
      else if (tone === 2) ctx.fillStyle = '#c9b8ff';
      else ctx.fillStyle = '#9adcff';
      ctx.fillRect(x, y, 1 + ((i * 13) % 2), 1 + ((i * 17) % 2));
    }
    ctx.restore();

    for (const c of this.celestials) {
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.kind === 'planet') {
        const glow = ctx.createRadialGradient(0, 0, c.r * 0.4, 0, 0, c.r * 1.6);
        glow.addColorStop(0, 'rgba(150,120,240,0.22)');
        glow.addColorStop(0.6, 'rgba(110,80,200,0.08)');
        glow.addColorStop(1, 'rgba(110,80,200,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, c.r * 1.6, 0, TAU);
        ctx.fill();
        const body = ctx.createRadialGradient(-c.r * 0.45, -c.r * 0.45, c.r * 0.08, 0, 0, c.r);
        body.addColorStop(0, '#9c88d8');
        body.addColorStop(0.5, '#57468f');
        body.addColorStop(0.85, '#2c2258');
        body.addColorStop(1, '#120c30');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.clip();
        ctx.fillStyle = 'rgba(20,12,46,0.16)';
        for (let b = 0; b < 3; b += 1) {
          const by = -c.r * 0.5 + b * c.r * 0.3;
          ctx.fillRect(-c.r, by, c.r * 2, c.r * 0.11);
        }
        const term = ctx.createRadialGradient(c.r * 0.5, 0, c.r * 0.1, c.r * 0.5, 0, c.r * 1.35);
        term.addColorStop(0, 'rgba(6,3,18,0.55)');
        term.addColorStop(0.7, 'rgba(6,3,18,0.2)');
        term.addColorStop(1, 'rgba(6,3,18,0)');
        ctx.fillStyle = term;
        ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
        ctx.restore();
        if (c.ring) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, c.r, 0, TAU);
          ctx.clip();
          ctx.fillStyle = 'rgba(6,3,18,0.42)';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.r * 1.7, c.r * 0.5, -0.35, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = c.ring ? 'rgba(222,204,255,0.55)' : 'rgba(215,195,255,0.4)';
        ctx.lineWidth = c.ring ? 7 : 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 1.7, c.r * 0.5, -0.35, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(160,130,235,0.35)';
        ctx.lineWidth = c.ring ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 1.82, c.r * 0.54, -0.35, 0, TAU);
        ctx.stroke();
      } else {
        const glow = ctx.createRadialGradient(0, 0, c.r * 0.5, 0, 0, c.r * 1.8);
        glow.addColorStop(0, 'rgba(220,214,255,0.2)');
        glow.addColorStop(1, 'rgba(220,214,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, c.r * 1.8, 0, TAU);
        ctx.fill();
        const body = ctx.createRadialGradient(-c.r * 0.35, -c.r * 0.35, c.r * 0.1, 0, 0, c.r);
        body.addColorStop(0, '#f0ecfa');
        body.addColorStop(0.6, '#c3bce0');
        body.addColorStop(1, '#8d86b8');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.clip();
        const craters = [
          { dx: -0.25, dy: 0.15, r: 0.2 },
          { dx: 0.28, dy: -0.18, r: 0.16 },
          { dx: 0.1, dy: 0.38, r: 0.12 },
        ];
        for (const crater of craters) {
          ctx.fillStyle = 'rgba(60,45,110,0.28)';
          ctx.beginPath();
          ctx.arc(crater.dx * c.r, crater.dy * c.r, crater.r * c.r, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(28,18,62,0.3)';
          ctx.beginPath();
          ctx.arc(crater.dx * c.r - crater.r * c.r * 0.25, crater.dy * c.r - crater.r * c.r * 0.2, crater.r * c.r * 0.72, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(236,230,255,0.6)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(
            crater.dx * c.r + crater.r * c.r * 0.22,
            crater.dy * c.r + crater.r * c.r * 0.18,
            crater.r * c.r * 0.8,
            Math.PI * 0.1,
            Math.PI * 1.25
          );
          ctx.stroke();
        }
        const shade = ctx.createRadialGradient(c.r * 0.4, c.r * 0.45, c.r * 0.1, 0, 0, c.r * 1.3);
        shade.addColorStop(0, 'rgba(12,6,30,0.35)');
        shade.addColorStop(1, 'rgba(12,6,30,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
        ctx.restore();
      }
      ctx.restore();
    }

    for (const d of this.debris) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.fillStyle = '#3a2c3e';
      ctx.strokeStyle = 'rgba(160,110,220,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-d.w / 2, -d.h / 2);
      ctx.lineTo(d.w / 2, -d.h / 3);
      ctx.lineTo(d.w / 3, d.h / 2);
      ctx.lineTo(-d.w / 3, d.h / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.shooting) {
      const s = this.shooting;
      const alpha = Math.max(0, Math.min(1, s.life * 2));
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.06, s.y - s.vy * 0.06);
      g.addColorStop(0, `rgba(255,240,255,${(0.9 * alpha).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,240,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.06, s.y - s.vy * 0.06);
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(360, 640, 220, 360, 640, 780);
    vignette.addColorStop(0, 'rgba(10,4,24,0)');
    vignette.addColorStop(1, 'rgba(10,4,24,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 720, 1280);
  }

  makeTerrain() {
    this.time = 0;
    this.terrainScroll = 0;
    try {
      this.terrainTile = this.buildTerrainTile();
    } catch (err) {
      this.terrainTile = null;
    }
    this.ridges = [];
    for (let i = 0; i < 84; i += 1) {
      this.ridges.push(this.spawnRidge(i, true));
    }
    return !!this.terrainTile;
  }

  spawnRidge(index, initial) {
    return {
      y: initial ? -320 + rand(0, 1680) : -340,
      cx: rand(20, 700),
      len: rand(100, 480),
      tilt: rand(-0.55, 0.55),
      amp: rand(5, 34),
      w: rand(8, 30),
      seed: Math.floor(rand(0, 100000)),
      ph: rand(0, TAU),
      dark: rand(0.5, 1),
      index,
    };
  }

  buildTerrainTile() {
    const W = 480;
    const H = 800;
    const canvas = makeCanvas(W, H);
    const c = canvas.getContext('2d');
    if (!c || !c.createImageData) return null;
    const hash = (ix, iy, seed) => {
      const v = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const vnoise = (px, py, cx, cy, seed) => {
      const u = (px / W) * cx;
      const v = (py / H) * cy;
      const x0 = Math.floor(u) % cx;
      const y0 = Math.floor(v) % cy;
      const fx = u - Math.floor(u);
      const fy = v - Math.floor(v);
      const x1 = (x0 + 1) % cx;
      const y1 = (y0 + 1) % cy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = hash(x0, y0, seed);
      const b = hash(x1, y0, seed);
      const cc = hash(x0, y1, seed);
      const d = hash(x1, y1, seed);
      return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy;
    };
    const height = new Float32Array(W * H);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const n1 = vnoise(x, y, 10, 17, 11) * 0.5;
        const n2 = vnoise(x, y, 20, 34, 23) * 0.3;
        const n3 = vnoise(x, y, 40, 68, 41) * 0.2;
        const r1 = vnoise(x, y, 13, 22, 57);
        const r2 = vnoise(x, y, 26, 44, 71);
        const rid1 = 1 - Math.abs(2 * r1 - 1);
        const rid2 = 1 - Math.abs(2 * r2 - 1);
        let h = 0.5 + (n1 + n2 + n3 - 0.5) * 0.9 + (rid1 * rid1 * 0.62 + rid2 * rid2 * 0.28 - 0.45) * 0.9;
        if (h < 0) h = 0;
        if (h > 1) h = 1;
        height[y * W + x] = h;
      }
    }
    const image = c.createImageData(W, H);
    const data = image.data;
    const ramp = (t) => {
      const stops = [
        { t: 0, c: [66, 60, 44] },
        { t: 0.38, c: [136, 108, 74] },
        { t: 0.7, c: [198, 158, 112] },
        { t: 1, c: [224, 188, 134] },
      ];
      if (t <= 0) return stops[0].c.slice();
      for (let i = 1; i < stops.length; i += 1) {
        if (t <= stops[i].t) {
          const a = stops[i - 1];
          const b = stops[i];
          const k = (t - a.t) / (b.t - a.t);
          return [
            a.c[0] + (b.c[0] - a.c[0]) * k,
            a.c[1] + (b.c[1] - a.c[1]) * k,
            a.c[2] + (b.c[2] - a.c[2]) * k,
          ];
        }
      }
      return stops[stops.length - 1].c.slice();
    };
    const lx = -0.62;
    const ly = -0.55;
    const lz = 0.56;
    const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = y * W + x;
        const hc = height[i];
        const hL = height[y * W + ((x + W - 1) % W)];
        const hR = height[y * W + ((x + 1) % W)];
        const hU = height[((y + H - 1) % H) * W + x];
        const hD = height[((y + 1) % H) * W + x];
        const hx = (hR - hL) * 6;
        const hy = (hD - hU) * 6;
        const nx = -hx;
        const ny = -hy;
        const nz = 1;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const shade = (nx * lx + ny * ly + nz * lz) / (nl * ll);
        let lit = 0.5 + 0.5 * shade;
        lit = 0.5 + (lit - 0.5) * 1.55;
        if (lit < 0) lit = 0;
        if (lit > 1) lit = 1;
        const base = ramp(hc);
        const glow = Math.min(1, Math.max(0, (hc - 0.62) * 2.4));
        const r = Math.min(255, (base[0] * (0.62 + 0.72 * lit)) * (1 + glow * 0.18));
        const g = Math.min(255, (base[1] * (0.62 + 0.72 * lit)) * (1 + glow * 0.16));
        const b = Math.min(255, (base[2] * (0.62 + 0.72 * lit)) * (1 + glow * 0.12));
        const o = i * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      }
    }
    c.putImageData(image, 0, 0);
    const tile = makeCanvas(720, 1280);
    const tc = tile.getContext('2d');
    if (!tc) return null;
    tc.imageSmoothingEnabled = true;
    tc.drawImage(canvas, 0, 0, 720, 1280);
    return tile;
  }

  updateTerrain(dt) {
    this.terrainScroll = (this.terrainScroll + 96 * dt) % 1280;
    for (const ridge of this.ridges) {
      ridge.y += 96 * dt;
      if (ridge.y > 1700) {
        const r = this.spawnRidge(ridge.index, false);
        ridge.y = r.y;
        ridge.cx = r.cx;
        ridge.len = r.len;
        ridge.tilt = r.tilt;
        ridge.amp = r.amp;
        ridge.w = r.w;
        ridge.seed = r.seed;
        ridge.ph = r.ph;
        ridge.dark = r.dark;
      }
    }
  }

  drawTerrainRidges(ctx) {
    for (const ridge of this.ridges) {
      const x0 = ridge.cx - ridge.len / 2;
      const x1 = ridge.cx + ridge.len / 2;
      const pts = [];
      for (let x = x0; x <= x1; x += 6) {
        const t = (x - ridge.cx) / ridge.len;
        pts.push({
          x: x + Math.sin(x * 0.02 + ridge.seed) * 2,
          y:
            ridge.y +
            Math.sin(x * 0.012 + ridge.ph) * ridge.amp +
            Math.sin(x * 0.031 + ridge.ph * 1.7) * ridge.amp * 0.4 +
            t * ridge.len * ridge.tilt,
        });
      }
      const band = (dxA, dyA, dxB, dyB, fillStyle) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 1) {
          const p = pts[i];
          if (i === 0) ctx.moveTo(p.x + dxA, p.y + dyA);
          else ctx.lineTo(p.x + dxA, p.y + dyA);
        }
        for (let i = pts.length - 1; i >= 0; i -= 1) {
          const p = pts[i];
          ctx.lineTo(p.x + dxB, p.y + dyB);
        }
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      };
      const halfW = ridge.w * 0.5;
      band(halfW * 0.9, halfW * 0.65, -halfW * 0.3, -halfW * 0.18, `rgba(30,15,5,${(0.4 + 0.2 * ridge.dark).toFixed(3)})`);
      band(-halfW * 0.62, -halfW * 0.5, halfW * 0.55, halfW * 0.4, `rgba(238,192,132,${(0.24 + 0.14 * ridge.dark).toFixed(3)})`);
      ctx.strokeStyle = `rgba(255,222,170,${(0.16 + 0.1 * ridge.dark).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 1) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
  }

  renderTerrain(ctx) {
    const tile = this.terrainTile;
    const y = this.terrainScroll;
    if (tile) {
      ctx.drawImage(tile, 0, y - 1280, 720, 1280);
      ctx.drawImage(tile, 0, y, 720, 1280);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, 1280);
      g.addColorStop(0, '#8a7357');
      g.addColorStop(1, '#5b4a35');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 720, 1280);
    }
    ctx.fillStyle = 'rgba(28,15,5,0.3)';
    ctx.fillRect(0, 0, 720, 1280);
    this.drawTerrainRidges(ctx);
    ctx.save();
    for (let i = 0; i < 260; i += 1) {
      const x = (i * 181 + 47) % 720;
      const yy = (i * 113) % 1280;
      const light = i % 2 === 0;
      ctx.globalAlpha = 0.02 + ((i * 5) % 4) * 0.01;
      ctx.fillStyle = light ? '#fff3d8' : '#2a1a08';
      ctx.fillRect(x, yy, 1 + ((i * 11) % 2), 1);
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(360, 640, 240, 360, 640, 820);
    vg.addColorStop(0, 'rgba(20,10,2,0)');
    vg.addColorStop(1, 'rgba(20,10,2,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 720, 1280);
  }

  triggerLightning(x) {
    if (!this.sea) return;
    this.strikeX = Math.max(40, Math.min(680, x == null ? this.strikeX : x));
    this.strikeY = rand(120, 980);
  }

  makeSea() {
    this.time = 0;
    this.horizon = 0;
    this.waterH = 1280 - this.horizon;
    this.strikeX = 360;
    this.strikeY = 560;
    this.boltSeed = Math.floor(rand(0, 1000));
    this.rows = [];
    const N = 30;
    for (let i = 0; i < N; i += 1) {
      this.rows.push({
        u: (i + Math.random()) / N,
        ph1: rand(0, TAU),
        ph2: rand(0, TAU),
        ph3: rand(0, TAU),
        roller: Math.random(),
        size: rand(0.35, 1.65),
        seed: Math.floor(rand(0, 100000)),
      });
    }
    this.rows.sort((a, b) => a.u - b.u);
    this.rain = this.makeRainLayer(46, 10, 18, 620, 840, 0.08, 0.22);
    this.nearRain = this.makeRainLayer(28, 20, 34, 860, 1150, 0.25, 0.46);
    this.splashes = [];
    this.splashTimer = rand(0.05, 0.15);
    this.skyPuffs = [];
    for (let i = 0; i < 8; i += 1) {
      this.skyPuffs.push({
        x: rand(-140, 780),
        y: rand(6, 205),
        rx: rand(90, 250),
        ry: rand(22, 60),
        a: rand(0.22, 0.48),
        drift: rand(2, 7),
        ph: rand(0, TAU),
        light: Math.random() < 0.5,
      });
    }
  }

  makeRainLayer(count, minLen, maxLen, minSpeed, maxSpeed, minAlpha, maxAlpha) {
    const drops = [];
    for (let i = 0; i < count; i += 1) {
      drops.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        len: rand(minLen, maxLen),
        speed: rand(minSpeed, maxSpeed),
        alpha: rand(minAlpha, maxAlpha),
      });
    }
    return drops;
  }

  seaT(u) {
    return Math.max(u, 0.00001);
  }

  seaY(u) {
    return this.horizon + this.seaT(u) * this.waterH;
  }

  updateSea(dt) {
    for (const row of this.rows) {
      const t = this.seaT(row.u);
      row.u += 0.068 * dt;
      if (row.u >= 1) {
        row.u -= 1;
        row.ph1 = rand(0, TAU);
        row.ph2 = rand(0, TAU);
        row.ph3 = rand(0, TAU);
        row.roller = Math.random();
        row.size = rand(0.35, 1.65);
        row.seed = Math.floor(rand(0, 100000));
      }
      row.ph1 += (0.05 + 0.35 * t) * dt;
      row.ph2 += (0.09 + 0.55 * t) * dt;
    }
    if (this.rain) {
      for (const drop of this.rain) {
        drop.y += drop.speed * dt;
        drop.x += 18 * dt;
        if (drop.y > 1320) {
          drop.y = -20;
          drop.x = rand(0, 720);
        }
      }
    }
    if (this.nearRain) {
      for (const drop of this.nearRain) {
        drop.y += drop.speed * dt;
        drop.x += 42 * dt;
        if (drop.y > 1320) {
          drop.y = -30;
          drop.x = rand(0, 720);
        }
      }
    }
    this.splashTimer -= dt;
    while (this.splashTimer <= 0) {
      this.splashTimer += rand(0.035, 0.11);
      const depth = Math.random();
      this.splashes.push({
        x: rand(24, 696),
        y: this.horizon + 12 + depth * (this.waterH - 60),
        t: 0,
        dur: rand(0.26, 0.6),
        size: rand(5, 14),
        vx: rand(-8, 8),
      });
    }
    if (this.splashes.length > 36) {
      this.splashes.splice(0, this.splashes.length - 36);
    }
    for (const sp of this.splashes) sp.t += dt;
    this.splashes = this.splashes.filter((sp) => sp.t < sp.dur);
    for (const c of this.skyPuffs) {
      c.x += (c.drift + Math.sin(this.time * 0.35 + c.ph) * 5) * dt;
      if (c.x > 900) c.x = -c.rx * 1.2;
      if (c.x < -c.rx * 1.4) c.x = 900;
    }
  }

  renderStormSky(ctx, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const g = ctx.createLinearGradient(0, 0, 0, this.horizon + 18);
    g.addColorStop(0, css(scaleColor([12, 18, 24], 1 + 0.4 * f)));
    g.addColorStop(0.4, css(scaleColor([30, 42, 51], 1 + 0.38 * f)));
    g.addColorStop(0.8, css(scaleColor([64, 78, 86], 1 + 0.46 * f)));
    g.addColorStop(1, css(scaleColor([108, 122, 130], 1 + 0.58 * f)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 720, this.horizon + 14);

    for (const c of this.skyPuffs) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(1, c.ry / c.rx);
      const body = ctx.createRadialGradient(0, 0, 0, 0, 0, c.rx);
      const a = Math.min(0.6, c.a * (1 + 0.3 * f));
      const core = c.light ? scaleColor([88, 104, 114], 1 + 0.28 * f) : scaleColor([46, 59, 69], 1 + 0.22 * f);
      const edge = c.light ? scaleColor([46, 60, 70], 1 + 0.25 * f) : scaleColor([22, 32, 41], 1 + 0.25 * f);
      body.addColorStop(0, `rgba(${core[0]},${core[1]},${core[2]},${(a * 0.8).toFixed(3)})`);
      body.addColorStop(0.55, `rgba(${core[0]},${core[1]},${core[2]},${a.toFixed(3)})`);
      body.addColorStop(0.85, `rgba(${edge[0]},${edge[1]},${edge[2]},${(a * 0.35).toFixed(3)})`);
      body.addColorStop(1, 'rgba(20,30,38,0)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, c.rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < Math.min(4, this.skyPuffs.length); i += 1) {
      const c = this.skyPuffs[i];
      if (c.y + c.ry * 1.4 < 120 || c.y > 190) continue;
      const topY = c.y + c.ry * 1.1;
      const shaftW = 20 + ((i * 43) % 36);
      const shaft = ctx.createLinearGradient(0, topY, 0, this.horizon);
      shaft.addColorStop(0, `rgba(196,220,234,${(0.04 + Math.sin(this.time * 0.6 + i * 1.9) * 0.018).toFixed(3)})`);
      shaft.addColorStop(1, 'rgba(186,212,226,0)');
      ctx.fillStyle = shaft;
      ctx.fillRect(c.x - shaftW / 2 + 30, topY, shaftW, Math.max(10, this.horizon - topY));
    }

    const haze = ctx.createLinearGradient(0, this.horizon - 14, 0, this.horizon + 34);
    haze.addColorStop(0, 'rgba(198,214,222,0)');
    haze.addColorStop(0.6, `rgba(196,212,220,${(0.24 + 0.28 * f).toFixed(3)})`);
    haze.addColorStop(1, 'rgba(190,208,216,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.horizon - 14, 720, 50);
  }

  renderSeaBase(ctx, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const g = ctx.createLinearGradient(0, this.horizon, 0, 1280);
    g.addColorStop(0, css(scaleColor([64, 86, 96], 1 + 0.4 * f)));
    g.addColorStop(0.28, css(scaleColor([46, 66, 76], 1 + 0.28 * f)));
    g.addColorStop(0.6, css(scaleColor([32, 50, 60], 1 + 0.16 * f)));
    g.addColorStop(1, css(scaleColor([24, 40, 50], 1 + 0.08 * f)));
    ctx.fillStyle = g;
    ctx.fillRect(0, this.horizon, 720, 1280 - this.horizon + 2);
  }

  drawSeaRow(ctx, row, nextY, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const y = this.seaY(row.u);
    if (y < 2) return;
    const size = row.size || 1;
    const amp = 0.7 + 7.5 * size;
    const freq = 0.018 + 0.014 * ((row.seed % 100) / 100);
    const x0 = -60;
    const x1 = 780;
    const wob = (x) =>
      Math.sin(x * freq + row.ph1) * amp +
      Math.sin(x * freq * 2.9 + row.ph2) * amp * 0.34 +
      Math.sin(x * freq * 0.53 + row.ph3) * amp * 0.22;
    const base = mixColor([66, 88, 97], [40, 60, 70], Math.min(0.5, (y / 1280) * 0.38));
    const crest = mixColor(base, [198, 214, 223], Math.min(0.75, 0.1 + 0.5 * f));
    const deep = mixColor(base, [3, 8, 13], 0.44);
    const bandH = Math.max(3, nextY - y + 4);
    const a0 = Math.min(0.62, 0.1 + 0.15 * size + 0.3 * f);
    const grad = ctx.createLinearGradient(0, y - amp, 0, y + bandH);
    grad.addColorStop(0, `rgba(${crest[0]},${crest[1]},${crest[2]},${a0.toFixed(3)})`);
    grad.addColorStop(0.18, `rgba(${base[0]},${base[1]},${base[2]},${(a0 * 0.5).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${deep[0]},${deep[1]},${deep[2]},${(a0 * 0.18).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${deep[0]},${deep[1]},${deep[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) {
      const wy = y + wob(x);
      if (x === x0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    for (let x = x1; x >= x0; x -= 6) {
      ctx.lineTo(x, y + bandH + wob(x) * 0.25);
    }
    ctx.closePath();
    ctx.fill();

    const segs = 2 + Math.floor(size * 2.6) + (row.roller > 0.85 ? 2 : 0);
    const rimA = Math.min(0.9, (0.1 + 0.2 * size + 0.32 * f) * (0.5 + 0.5 * Math.sin(row.ph1 * 2 + this.time * 2)));
    ctx.globalAlpha = rimA;
    ctx.strokeStyle = css(mixColor(crest, [255, 255, 255], 0.2 + f * 0.4));
    ctx.lineWidth = Math.max(0.8, 0.8 + size * 1.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const rndR = (n) => {
      const v = Math.sin(n * 127.1 + row.seed * 0.618 + 17.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let s = 0; s < segs; s += 1) {
      const sx = -30 + rndR(s + 1) * 740;
      const sl = 22 + rndR(s + 44) * 130;
      let first = true;
      for (let x = sx; x <= sx + sl; x += 4) {
        const wy = y + wob(x);
        if (first) {
          ctx.moveTo(x, wy);
          first = false;
        } else {
          ctx.lineTo(x, wy);
        }
      }
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1;

    if (size > 1.1) {
      const foam = 2 + Math.floor((size - 1) * 4);
      const rnd = (n) => {
        const v = Math.sin(n * 127.1 + row.seed * 0.618 + 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      ctx.lineCap = 'round';
      for (let k = 0; k < foam; k += 1) {
        const cx = -20 + rnd(k + 1) * 720;
        const len = 16 + rnd(k + 60) * 60;
        const fa = Math.min(0.8, 0.18 + size * 0.2 + f * 0.35);
        ctx.strokeStyle = `rgba(226,239,245,${fa.toFixed(3)})`;
        ctx.lineWidth = 1 + size;
        ctx.beginPath();
        let first = true;
        for (let x = cx; x <= cx + len; x += 4) {
          const wy = y + wob(x) - 1;
          if (first) {
            ctx.moveTo(x, wy);
            first = false;
          } else {
            ctx.lineTo(x, wy);
          }
        }
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
  }

  renderSeaRain(ctx) {
    if (this.rain) {
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(176,206,225,0.8)';
      for (const drop of this.rain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.3, drop.y + drop.len);
        ctx.stroke();
      }
    }
    if (this.nearRain) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(198,224,240,0.9)';
      for (const drop of this.nearRain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.42, drop.y + drop.len);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  renderBolt(ctx, flash) {
    if (flash < 0.78) return;
    const a = Math.min(1, (flash - 0.78) / 0.22);
    const seed = this.boltSeed;
    const rnd = (n) => {
      const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const sx = this.strikeX;
    const pts = [];
    let x = sx;
    let y = -12;
    for (let i = 0; i < 11; i += 1) {
      pts.push({ x, y });
      x += (rnd(i * 7 + 1) - 0.5) * 30;
      y += 22 + rnd(i * 13 + 2) * 22;
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(190,225,255,0.95)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(240,250,255,0.96)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 1) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(225,242,255,0.85)';
    ctx.beginPath();
    const b1 = pts[4];
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b1.x - 20 - rnd(3) * 34, b1.y + 30 + rnd(4) * 28);
    ctx.lineTo(b1.x - 34 - rnd(5) * 24, b1.y + 42 + rnd(6) * 22);
    const b2 = pts[8];
    ctx.moveTo(b2.x, b2.y);
    ctx.lineTo(b2.x + 24 + rnd(8) * 36, b2.y + 34 + rnd(9) * 30);
    ctx.stroke();
    ctx.restore();
  }

  renderSeaGlare(ctx, flash) {
    if (flash <= 0.02) return;
    const sx = this.strikeX;
    const g = ctx.createLinearGradient(sx - 170, 0, sx + 170, 0);
    g.addColorStop(0, 'rgba(216,234,244,0)');
    g.addColorStop(0.5, `rgba(220,237,247,${(0.34 * flash).toFixed(3)})`);
    g.addColorStop(1, 'rgba(216,234,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - 170, 0, 340, 1280);
    const vertical = ctx.createLinearGradient(0, 0, 0, 1280);
    vertical.addColorStop(0, `rgba(240,249,255,${(0.5 * flash).toFixed(3)})`);
    vertical.addColorStop(0.3, `rgba(226,242,252,${(0.3 * flash).toFixed(3)})`);
    vertical.addColorStop(1, 'rgba(214,233,245,0)');
    ctx.fillStyle = vertical;
    ctx.fillRect(sx - 26, 0, 52, 1280);
    const bloom = ctx.createRadialGradient(sx, this.strikeY, 2, sx, this.strikeY, 190);
    bloom.addColorStop(0, `rgba(244,250,255,${(0.9 * flash).toFixed(3)})`);
    bloom.addColorStop(0.28, `rgba(226,242,252,${(0.5 * flash).toFixed(3)})`);
    bloom.addColorStop(1, 'rgba(216,234,244,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(sx - 190, this.strikeY - 190, 380, 380);
    ctx.strokeStyle = `rgba(230,244,252,${(0.4 * flash).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, this.strikeY, 90 + flash * 90, 34, 0, 0, TAU);
    ctx.stroke();
  }

  renderSea(ctx, fx) {
    const f = Math.min(1, Math.max(0, fx.lightning || 0));
    this.renderSeaBase(ctx, f);
    const sorted = this.rows.slice().sort((a, b) => a.u - b.u);
    for (let i = 0; i < sorted.length; i += 1) {
      const row = sorted[i];
      const next = sorted[i + 1];
      const y = this.seaY(row.u);
      const t = this.seaT(row.u);
      const nextY = next ? this.seaY(next.u) : Math.max(1245, y + 120 + t * 120);
      this.drawSeaRow(ctx, row, nextY, f);
    }
    this.renderSeaRain(ctx);
    this.renderSeaSplashes(ctx);
    this.renderSeaGlints(ctx);
    if (f > 0.02) this.renderSeaGlare(ctx, f);
    const vg = ctx.createRadialGradient(360, 640, 240, 360, 640, 820);
    vg.addColorStop(0, 'rgba(5,9,12,0)');
    vg.addColorStop(1, 'rgba(5,9,12,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderSeaSplashes(ctx) {
    for (const sp of this.splashes) {
      const k = sp.t / sp.dur;
      const r = sp.size * (0.35 + k * 1.45);
      const a = (1 - k) * 0.5;
      ctx.strokeStyle = `rgba(204,226,238,${a.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 2.4 * (1 - k) + 0.8);
      ctx.beginPath();
      ctx.ellipse(sp.x + sp.vx * sp.t, sp.y, r * 1.45, r * 0.3, 0, 0, TAU);
      ctx.stroke();
      if (k < 0.35) {
        ctx.fillStyle = `rgba(216,234,244,${((1 - k / 0.35) * 0.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sp.x + sp.vx * sp.t, sp.y, 1.6, 0, TAU);
        ctx.fill();
      }
    }
  }

  renderSeaGlints(ctx) {
    const time = this.time;
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i += 1) {
      const ph = i * 2.399;
      const x = (Math.sin(i * 127.1 + 3.7) * 0.5 + 0.5) * 660 + 20;
      const depth = Math.sin(i * 73.7 + 1.3) * 0.5 + 0.5;
      const y = this.horizon + 10 + depth * (this.waterH - 60);
      const tw = 0.5 + 0.5 * Math.sin(time * (0.7 + depth * 1.4) + ph);
      const alpha = (0.04 + 0.1 * depth) * Math.max(0, tw);
      if (alpha < 0.02) continue;
      const len = (9 + depth * 34) * (0.6 + 0.4 * Math.sin(time * 1.7 + ph));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(222,238,248,0.9)';
      ctx.lineWidth = 0.8 + depth * 1.2;
      ctx.beginPath();
      ctx.moveTo(x - len / 2, y);
      ctx.lineTo(x + len / 2, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  makeCloudtop() {
    this.time = 0;
    this.deckTop = 0;
    this.deckH = 1280 - this.deckTop;
    this.rows = [];
    const N = 26;
    for (let i = 0; i < N; i += 1) {
      this.rows.push({
        u: (i + Math.random()) / N,
        ph1: rand(0, TAU),
        ph2: rand(0, TAU),
        roller: Math.random(),
        seed: Math.floor(rand(0, 100000)),
      });
    }
    this.rows.sort((a, b) => a.u - b.u);
    this.cloudCells = [];
    for (let i = 0; i < 100; i += 1) {
      this.cloudCells.push({
        u: Math.random(),
        x: rand(30, 690),
        seed: Math.floor(rand(0, 100000)),
        ph: rand(0, TAU),
      });
    }
    this.cirrus = [];
    for (let i = 0; i < 9; i += 1) {
      this.cirrus.push({
        x: rand(-120, 760),
        y: rand(60, 460),
        len: rand(150, 330),
        slope: rand(-0.06, 0.06),
        alpha: rand(0.1, 0.24),
        speed: rand(2, 7),
        ph: rand(0, TAU),
      });
    }
    this.sun = { x: 150, y: 472, r: 25 };
    this.blobWhite = this.makeBlobSprite(1, 0);
    this.blobFar = this.makeBlobSprite(0.74, 1);
    this.occTimer = rand(OCC_CLOUD_INTERVAL_MIN, OCC_CLOUD_INTERVAL_MAX);
    this.occClouds = [];
    this.occElapsed = 0;
    this.occDuration = 0;
    this.occVeil = 0;
    this.foreSprites = [];
    const scales = [0.72, 0.58, 0.66];
    for (const s of scales) {
      const sprite = this.makeCloudSprite(s);
      if (sprite) this.foreSprites.push(sprite);
    }
  }

  makeBlobSprite(opacity, mode) {
    let canvas;
    try {
      canvas = makeCanvas(220, 150);
    } catch (err) {
      return null;
    }
    const c = canvas.getContext('2d');
    if (!c) return null;
    const rx = 96;
    c.save();
    c.translate(110, 88);
    c.scale(1, 0.66);
    const g = c.createRadialGradient(-rx * 0.3, -rx * 0.24, rx * 0.04, 0, 0, rx * 1.02);
    const cool = mode ? [216, 228, 238] : [235, 244, 250];
    g.addColorStop(0, `rgba(255,255,255,${(0.95 * opacity).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(250,252,253,${(0.9 * opacity).toFixed(3)})`);
    g.addColorStop(0.82, `rgba(${cool[0]},${cool[1]},${cool[2]},${(0.55 * opacity).toFixed(3)})`);
    g.addColorStop(1, `rgba(${cool[0]},${cool[1]},${cool[2]},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, rx, 0, TAU);
    c.fill();
    const shadeColor = mode ? [128, 152, 172] : [188, 205, 220];
    const sh = c.createRadialGradient(rx * 0.4, rx * 0.5, rx * 0.06, rx * 0.16, rx * 0.5, rx * 1.0);
    sh.addColorStop(0, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},${(0.34 * opacity).toFixed(3)})`);
    sh.addColorStop(0.5, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},${(0.17 * opacity).toFixed(3)})`);
    sh.addColorStop(1, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},0)`);
    c.fillStyle = sh;
    c.beginPath();
    c.arc(0, 0, rx, 0, TAU);
    c.fill();
    c.restore();
    return canvas;
  }

  makeCloudSprite(alphaScale) {
    let canvas;
    try {
      canvas = makeCanvas(1100, 660);
    } catch (err) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const lobes = [
      { x: 550, y: 460, rx: 320, ry: 125 },
      { x: 250, y: 465, rx: 200, ry: 88 },
      { x: 845, y: 470, rx: 215, ry: 92 },
      { x: 390, y: 330, rx: 165, ry: 78 },
      { x: 715, y: 340, rx: 180, ry: 82 },
      { x: 545, y: 300, rx: 150, ry: 72 },
      { x: 165, y: 350, rx: 125, ry: 62 },
      { x: 950, y: 360, rx: 130, ry: 62 },
      { x: 70, y: 330, rx: 120, ry: 58 },
      { x: 1030, y: 330, rx: 115, ry: 56 },
    ];
    for (const lobe of lobes) {
      ctx.save();
      ctx.translate(lobe.x, lobe.y);
      ctx.scale(1, lobe.ry / lobe.rx);
      const g = ctx.createRadialGradient(0, -lobe.ry * 0.5, 0, 0, 0, lobe.rx);
      g.addColorStop(0, `rgba(232,240,247,${(0.96 * alphaScale).toFixed(3)})`);
      g.addColorStop(0.42, `rgba(210,225,237,${(0.9 * alphaScale).toFixed(3)})`);
      g.addColorStop(0.8, `rgba(188,208,224,${(0.5 * alphaScale).toFixed(3)})`);
      g.addColorStop(1, 'rgba(180,202,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, lobe.rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const shade = ctx.createLinearGradient(0, 250, 0, 620);
    shade.addColorStop(0, 'rgba(140,168,190,0)');
    shade.addColorStop(0.7, `rgba(150,176,198,${(0.2 * alphaScale).toFixed(3)})`);
    shade.addColorStop(1, `rgba(150,176,198,${(0.3 * alphaScale).toFixed(3)})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 250, 1100, 370);
    return canvas;
  }

  updateCloudtop(dt) {
    for (const row of this.rows) {
      const t = this.cloudT(row.u);
      row.u += 0.05 * dt;
      if (row.u >= 1) {
        row.u -= 1;
        row.ph1 = rand(0, TAU);
        row.ph2 = rand(0, TAU);
        row.roller = Math.random();
        row.seed = Math.floor(rand(0, 100000));
      }
      row.ph1 += (0.04 + 0.14 * t) * dt;
      row.ph2 += (0.06 + 0.2 * t) * dt;
    }
    for (const cell of this.cloudCells) {
      cell.u += 0.042 * dt;
      if (cell.u >= 1) {
        cell.u -= 1;
        cell.x = rand(30, 690);
        cell.seed = Math.floor(rand(0, 100000));
        cell.ph = rand(0, TAU);
      }
    }
    for (const c of this.cirrus) {
      c.x -= c.speed * dt;
      c.ph += dt * 0.4;
      if (c.x + c.len < -60) {
        c.x = 820 + rand(0, 60);
        c.y = rand(60, 460);
      }
    }

    let wasActive = this.occClouds.length > 0;
    if (!wasActive) {
      this.occTimer -= dt;
      if (this.occTimer <= 0) {
        const maxDur = rand(5.4, 7.6);
        this.occDuration = maxDur;
        this.occElapsed = 0;
        // 每次只来一团云：固定从屏幕正上方（中线）以大尺寸垂直下落。
        this.occClouds.push({
          delay: 0,
          prog: -0.12,
          speed: rand(0.185, 0.235),
          x: 360,
          sway: rand(50, 150),
          swayPh: rand(0, TAU),
          swaySpeed: rand(0.35, 0.7),
          alpha: rand(0.78, 0.94),
          sprite: 0,
        });
      }
    }
    for (const cl of this.occClouds) {
      if (cl.delay > 0) {
        cl.delay -= dt;
      } else {
        cl.prog += cl.speed * dt;
      }
    }
    this.occClouds = this.occClouds.filter((cl) => cl.delay <= 0 && cl.prog < 1.18);
    if (wasActive && this.occClouds.length === 0) {
      this.occTimer = rand(OCC_CLOUD_INTERVAL_MIN, OCC_CLOUD_INTERVAL_MAX);
    }
    const veilTarget = this.occClouds.length ? 0.26 : 0;
    const rate = veilTarget > this.occVeil ? 0.35 : 0.8;
    this.occVeil += (veilTarget - this.occVeil) * Math.min(1, rate * dt);
    if (Math.abs(this.occVeil - veilTarget) < 0.002) this.occVeil = veilTarget;
  }

  cloudT(u) {
    return Math.max(u, 0.00001);
  }

  cloudY(u) {
    return this.deckTop + this.cloudT(u) * this.deckH;
  }

  drawFarCloudMist(ctx) {
    if (!this.blobFar) return;
    const rnd = (n) => {
      const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 40; i += 1) {
      const p = i / 40;
      const hy = this.deckTop - 8 + Math.pow(p, 1.9) * 128;
      const x = -30 + rnd(i * 3 + 1) * 780;
      const r = 3.5 + Math.pow(p, 1.5) * 26;
      ctx.globalAlpha = 0.14 + p * 0.22 + Math.sin(this.time * 0.9 + i) * 0.03;
      const w = r * 2;
      const h = w * 0.68;
      ctx.drawImage(this.blobFar, x - r, hy - h * 0.5, w, h);
    }
    ctx.globalAlpha = 1;
  }

  drawCloudDeckRow(ctx, row) {
    const t = this.cloudT(row.u);
    if (t < 0.3) return;
    const y = this.cloudY(row.u);
    const seed = row.seed;
    const rnd = (n) => {
      const v = Math.sin(n * 127.1 + seed * 78.233 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const rBase = 4 + 108 * Math.pow(t, 2.3);
    const spacing = Math.max(18, rBase * (1.9 + 0.42 * rnd(1)));
    const rowA = Math.min(0.97, 0.42 + 0.55 * t);
    const sprite = t < 0.55 ? this.blobFar : this.blobWhite;
    let cx = -90 + ((seed % 89) / 89) * spacing * 1.2;
    let k = 0;
    while (cx < 830 && k < 36) {
      const rr = rBase * (0.5 + 0.95 * rnd(k + 3));
      const jy = y + (rnd(k + 41) - 0.5) * rBase * 1.9 + Math.sin(k * 1.9 + row.ph1) * rBase * 0.35;
      const a = rowA * (0.55 + 0.45 * rnd(k + 77));
      if (sprite) {
        ctx.globalAlpha = Math.min(1, a);
        const w = rr * 2;
        const h = w * 0.68;
        ctx.drawImage(sprite, cx - rr, jy - h * 0.55, w, h);
      }
      k += 1;
      cx += spacing * (0.34 + 1.25 * rnd(k + 11));
    }
    ctx.globalAlpha = 1;
  }

  drawCloudCells(ctx) {
    const time = this.time;
    for (const cell of this.cloudCells) {
      const t = this.cloudT(cell.u);
      const y = this.cloudY(cell.u);
      const seed = cell.seed;
      const rnd = (n) => {
        const v = Math.sin(n * 127.1 + seed * 78.233 + 41.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const r = Math.max(8, (16 + 42 * rnd(1) + 22 * t) * (rnd(5) > 0.92 ? 1.7 : 1));
      const sprite = rnd(6) < 0.3 ? this.blobFar : this.blobWhite;
      if (!sprite) continue;
      const cx = cell.x + Math.sin(time * 0.5 + cell.ph) * r * 0.5;
      const cy = y + (rnd(2) - 0.5) * r * 0.9;
      const a = Math.min(0.96, 0.62 + 0.3 * rnd(3) + t * 0.06);
      ctx.globalAlpha = Math.min(1, a * (0.55 + 0.45 * rnd(3)));
      const w = r * 2;
      const h = w * 0.68;
      ctx.drawImage(sprite, cx - r, cy - h * 0.55, w, h);
    }
    ctx.globalAlpha = 1;
  }

  renderCloudtop(ctx, fx) {
    const deck = ctx.createLinearGradient(0, 0, 0, 1280);
    deck.addColorStop(0, 'rgba(214,238,252,1)');
    deck.addColorStop(0.3, 'rgba(198,228,248,1)');
    deck.addColorStop(0.62, 'rgba(180,218,244,1)');
    deck.addColorStop(1, 'rgba(170,208,238,1)');
    ctx.fillStyle = deck;
    ctx.fillRect(0, 0, 720, 1280);
    this.drawCloudCells(ctx);
    const skyTint = ctx.createLinearGradient(0, 0, 0, 1280);
    skyTint.addColorStop(0, 'rgba(140,205,250,0.2)');
    skyTint.addColorStop(0.45, 'rgba(130,192,242,0.12)');
    skyTint.addColorStop(1, 'rgba(120,180,230,0.05)');
    ctx.fillStyle = skyTint;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderCloudForeground(ctx) {
    if (!this.cloudtop || !this.foreSprites.length) return;
    if (this.occVeil > 0.004) {
      ctx.fillStyle = `rgba(240,246,251,${this.occVeil.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    const time = this.time;
    for (const cl of this.occClouds) {
      if (cl.delay > 0) continue;
      const prog = Math.max(0, Math.min(1, cl.prog));
      const fadeIn = smoothStep(-0.1, 0.06, cl.prog);
      const fadeOut = 1 - smoothStep(1.02, 1.16, cl.prog);
      const sprite = this.foreSprites[cl.sprite] || this.foreSprites[0];
      const y = -340 + prog * 1640;
      // 尺寸恒定：一出现就是完全展开的大云，只做平移，不做缩放。
      const scale = OCC_CLOUD_SCALE;
      const x = cl.x + Math.sin(time * cl.swaySpeed + cl.swayPh) * cl.sway;
      const w = 1100 * scale;
      const h = 660 * scale * 0.78;
      ctx.globalAlpha = Math.max(0, cl.alpha * fadeIn * fadeOut);
      ctx.drawImage(sprite, x - w / 2, y - h * 0.62, w, h);
    }
    ctx.globalAlpha = 1;
  }

  renderForeground(ctx) {
    if (this.cloudtop) this.renderCloudForeground(ctx);
  }

  drawMountain(ctx, mountain, color, nearLayer) {
    const m = mountain;
    if (!color) color = [122, 94, 74];
    const topY = m.y;
    const baseY = m.y + m.h;
    const cx = m.x;
    const half = m.w / 2;
    const seed = m.seed || 0;
    const rock = m.rock || 1;
    const jit = (n) => {
      const v = Math.sin(n * 127.1 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const grad = ctx.createLinearGradient(0, topY, 0, baseY + 40);
    grad.addColorStop(0, css(scaleColor(color, 1.3)));
    grad.addColorStop(0.4, css(scaleColor(color, 1.02)));
    grad.addColorStop(0.8, css(scaleColor(color, 0.72)));
    grad.addColorStop(1, css(scaleColor(color, 0.5)));
    ctx.fillStyle = grad;
    ctx.beginPath();
    const jag = m.h * 0.03 * rock;
    const curveY = (u, c) =>
      (1 - u) * (1 - u) * baseY +
      2 * (1 - u) * u * (topY + m.h * c) +
      u * u * topY;
    ctx.moveTo(cx - half - 4, baseY + 10);
    const L = 9;
    for (let i = 1; i <= L; i += 1) {
      const u = i / L;
      ctx.lineTo(cx - half + half * u, curveY(u, m.curve) + (jit(i * 3 + 1) - 0.5) * jag);
    }
    for (let i = L - 1; i >= 1; i -= 1) {
      const u = i / L;
      ctx.lineTo(cx + half * u, curveY(u, m.curve) + (jit(i * 3 + 2) - 0.5) * jag * 0.9);
    }
    ctx.lineTo(cx + half + 4, baseY + 10);
    ctx.closePath();
    ctx.fill();

    // warm lit edge on the left slope
    ctx.strokeStyle = nearLayer ? 'rgba(255,214,150,0.14)' : 'rgba(255,214,150,0.07)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= L; i += 1) {
      const u = i / L;
      const x = cx - half + half * u + (nearLayer ? 6 : 3);
      const y = curveY(u, m.curve) + (jit(i * 5 + 3) - 0.5) * jag * 0.7;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // darker right slope shade
    ctx.fillStyle = nearLayer ? 'rgba(22,11,5,0.16)' : 'rgba(22,11,5,0.08)';
    ctx.beginPath();
    const inset = half * (nearLayer ? 0.24 : 0.3);
    for (let i = 0; i <= L; i += 1) {
      const u = i / L;
      ctx.lineTo(cx + inset * u, curveY(u, m.curve) + 1);
    }
    for (let i = L - 1; i >= 0; i -= 1) {
      const u = i / L;
      ctx.lineTo(cx + half * u, curveY(u, m.curve) + 1 + (jit(i * 7 + 1) - 0.5) * jag);
    }
    ctx.closePath();
    ctx.fill();

    // broken ravines on the shaded side
    const ravines = nearLayer ? 9 : 2;
    ctx.lineCap = 'round';
    for (let r = 0; r < ravines; r += 1) {
      const u0 = 0.1 + (r / ravines) * 0.52;
      ctx.strokeStyle = `rgba(20,10,4,${nearLayer ? 0.1 : 0.06})`;
      ctx.lineWidth = 0.7 + rock * 0.4;
      ctx.beginPath();
      let first = true;
      for (let s = 0; s <= 7; s += 1) {
        const u = u0 + (s / 7) * (0.55 - u0);
        const x = cx + half * (u * 0.7) + (jit(r * 11 + s + 20) - 0.5) * half * 0.14;
        const y = curveY(u, m.curve) + 6 + (jit(r * 13 + s + 30) - 0.5) * jag * 0.8;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
}

module.exports = MountainBackground;

  });
  register("src/core/particles.js", function (module, exports, require) {
const { TAU, rand, randInt, clamp } = require('../utils/math.js');

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.flash = 0;
  }

  burst(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const velocity = rand(speed * 0.3, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: rand(life * 0.5, life),
        maxLife: life,
        size: rand(size * 0.5, size),
        color,
        gravity: rand(20, 60),
      });
    }
  }

  sparkle(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(20, 90);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.2, 0.6),
        maxLife: 0.6,
        size: rand(1.5, 3.5),
        color,
        gravity: -10,
        sparkle: true,
      });
    }
  }

  ring(x, y, color, maxRadius, life, width) {
    this.rings.push({
      x,
      y,
      radius: 0,
      maxRadius,
      life,
      maxLife: life,
      color,
      width: width || 5,
    });
  }

  explosion(x, y, color) {
    this.burst(x, y, color, 26, 260, 0.7, 5);
    this.burst(x, y, '#fff7d9', 12, 180, 0.5, 4);
    this.ring(x, y, color, 90, 0.5, 6);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const r = this.rings[i];
      r.life -= dt;
      r.radius += (r.maxRadius / r.maxLife) * dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    this.flash = Math.max(0, this.flash - dt * 1.2);
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.sparkle) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }
    for (const r of this.rings) {
      const alpha = clamp(r.life / r.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }
}

module.exports = ParticleSystem;

  });
  register("src/core/platform.js", function (module, exports, require) {
function getWx() {
  return typeof wx !== 'undefined' ? wx : null;
}

const platform = {
  isWeChat() {
    return !!getWx();
  },
  getStorage(key, fallback) {
    const wxApi = getWx();
    if (!wxApi) return fallback;
    try {
      const value = wxApi.getStorageSync(key);
      return value === '' || value === undefined || value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  },
  setStorage(key, value) {
    const wxApi = getWx();
    if (!wxApi) return;
    try {
      wxApi.setStorageSync(key, value);
    } catch (err) {
      // Storage quota or privacy errors are non-fatal for a single run.
    }
  },
  removeStorage(key) {
    const wxApi = getWx();
    if (!wxApi) return;
    try {
      wxApi.removeStorageSync(key);
    } catch (err) {
      // ignore
    }
  },
  exitApp() {
    const wxApi = getWx();
    if (wxApi && wxApi.exitMiniProgram) {
      wxApi.exitMiniProgram({});
      return;
    }
    if (typeof location !== 'undefined' && location.reload) {
      location.reload();
    }
  },
  createCanvas() {
    const wxApi = getWx();
    if (wxApi && wxApi.createCanvas) return wxApi.createCanvas();
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      return canvas;
    }
    return null;
  },
  getSystemInfoSync() {
    const wxApi = getWx();
    if (wxApi && wxApi.getSystemInfoSync) {
      const info = wxApi.getSystemInfoSync();
      return {
        windowWidth: info.windowWidth,
        windowHeight: info.windowHeight,
        pixelRatio: info.pixelRatio || 1,
      };
    }
    return { windowWidth: 720, windowHeight: 1280, pixelRatio: 1 };
  },
  showKeyboard(options) {
    const opts = options || {};
    const wxApi = getWx();
    if (wxApi && wxApi.showKeyboard) {
      if (wxApi.onKeyboardConfirm && opts.onConfirm) wxApi.onKeyboardConfirm((res) => { opts.onConfirm(res); });
      if (wxApi.onKeyboardComplete && opts.onComplete) wxApi.onKeyboardComplete((res) => { opts.onComplete(res); });
      if (wxApi.onKeyboardInput && opts.onInput) wxApi.onKeyboardInput((res) => { opts.onInput(res); });
      wxApi.showKeyboard(opts);
      return;
    }
    if (typeof window !== 'undefined' && window.__wxKeyboardStub) {
      window.__wxKeyboardStub.show(opts);
    }
  },
  hideKeyboard() {
    const wxApi = getWx();
    if (wxApi && wxApi.hideKeyboard) {
      wxApi.hideKeyboard();
      return;
    }
    if (typeof window !== 'undefined' && window.__wxKeyboardStub) {
      window.__wxKeyboardStub.hide();
    }
  },
  vibrateShort() {
    const wxApi = getWx();
    if (wxApi && wxApi.vibrateShort) {
      wxApi.vibrateShort({ type: 'light' });
    }
  },
};

module.exports = platform;

  });
  register("src/core/scenes.js", function (module, exports, require) {
class SceneManager {
  constructor(game) {
    this.game = game;
    this.scenes = {};
    this.current = null;
  }

  register(name, scene) {
    this.scenes[name] = scene;
  }

  go(name, params) {
    if (!this.scenes[name]) {
      throw new Error(`Unknown scene: ${name}`);
    }
    if (this.current && this.current.exit) this.current.exit();
    this.current = this.scenes[name];
    this.current.enter(params || {});
  }

  update(dt) {
    if (this.current && this.current.update) this.current.update(dt);
  }

  render(ctx) {
    if (this.current && this.current.render) this.current.render(ctx);
  }
}

module.exports = SceneManager;

  });
  register("src/core/storage.js", function (module, exports, require) {
const platform = require('./platform.js');

const SAVE_KEY = 'cloudspire_save_v1';
const AUTH_KEY = 'cloudspire_auth_v1';

function loadSave() {
  return platform.getStorage(SAVE_KEY, null);
}

function saveSave(data) {
  const snapshot = Object.assign({}, data, {
    version: 1,
    savedAt: Date.now(),
  });
  platform.setStorage(SAVE_KEY, snapshot);
  return snapshot;
}

function clearSave() {
  platform.removeStorage(SAVE_KEY);
}

function hasSave() {
  return !!loadSave();
}

function loadAuth() {
  return platform.getStorage(AUTH_KEY, null);
}

function saveAuth(data) {
  platform.setStorage(AUTH_KEY, data);
}

function clearAuth() {
  platform.removeStorage(AUTH_KEY);
}

module.exports = {
  SAVE_KEY,
  AUTH_KEY,
  loadSave,
  saveSave,
  clearSave,
  hasSave,
  loadAuth,
  saveAuth,
  clearAuth,
};

  });
  register("src/entities/alien-mothership.js", function (module, exports, require) {
const { TAU, angleTo, clamp } = require('../utils/math.js');

// 母舰全部光束：52 伤害 / 0.4 秒 = 130 伤害每秒（boss1 的广域激光仍为 20 / 0.4 秒）。
const MOTHERSHIP_BEAM_DAMAGE = 52;
const MOTHERSHIP_BEAM_HIT_INTERVAL = 0.4;

function initAlienMothership(boss, config, difficulty) {
  boss.targetY = 320;
  boss.y = -520;
  boss.r = config.radius || 210;
  boss.maxHp = Math.round(config.hp * difficulty.bossHp);
  boss.hp = boss.maxHp;
  boss.entering = true;
  boss.phase = 1;
  boss.transitioning = false;
  boss.transitionTimer = 0;
  boss.transitionIndex = 0;
  boss.finalDiveState = 'idle';
  boss.finalDiveTimer = 8;
  boss.finalDiveBaseY = boss.targetY;
  boss.smoke = [];
  boss.chargeGlow = 0;
  boss.beamSide = 'left';
  boss.summonTimer = 10;
  boss.artScale = config.artScale || 3.0;
  boss.phaseBoost = difficulty.id === 'hard' || difficulty.id === 'insane' ? 1.15 : 1;
  boss.intervalBoost = difficulty.id === 'insane' ? 0.78 : difficulty.id === 'hard' ? 0.88 : 1;
  boss.turrets = (config.turrets || []).map((turret) => {
    const hp = Math.round((turret.hp || 15000) * difficulty.bossHp);
    return {
      side: turret.side,
      name: turret.name || (turret.side === 'left' ? '左副炮舱' : '右副炮舱'),
      hp,
      maxHp: hp,
      broken: false,
      damaged: false,
    };
  });
  boss.phases = config.phases || [];
  boss.attackTimers = {
    fan: 1.0,
    swarm: 3.0,
    missile: 2.4,
    beam: 2.2,
    split: 1.5,
    cross: 1.2,
    ring: 2.0,
    laser: 2.4,
    p4Beam: 3.5,
    p4Split: 0.8,
    p4Missile: 3.5,
    dive: 6.0,
  };
}

const alienMothershipMethods = {
  updateAlienMothership(dt, bullets, player) {
    this.t += dt;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);

    if (this.entering) {
      this.y += 260 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.showSpell('异形母舰·降临');
      }
      return;
    }

    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 50 * dt;
      if (Math.random() < dt * 8) this.addSmoke(3);
      return;
    }

    if (this.transitioning) {
      this.transitionTimer -= dt;
      this.x = 360 + Math.sin(this.t * 0.35) * 40;
      this.y = this.targetY + Math.sin(this.t * 0.3) * 8;
      if (Math.random() < dt * 6) this.addSmoke(2);
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
        this.summonTimer = 10;
        this.showSpell('异形母舰·相位' + this.phase);
      }
      return;
    }

    if (this.phase === 1 && this.turrets.every((t) => t.broken)) {
      this.phase = 2;
      this.transitionIndex = 1;
      this.transitioning = true;
      this.transitionTimer = 1.8;
      this.hp = Math.max(0, Math.round(this.maxHp * 0.70));
      this.shake = 1;
      this.addSmoke(14);
      bullets.clearEnemy();
      this.showSpell('副炮损毁·外壳开裂');
      return;
    }

    const ratio = this.hp / this.maxHp;
    const next = this.phases[this.transitionIndex];
    if (next && ratio <= next.threshold) {
      this.phase = Math.min(4, this.phase + 1);
      this.transitionIndex += 1;
      this.transitioning = true;
      this.transitionTimer = next.duration || 1.8;
      this.shake = 1;
      this.addSmoke(12);
      bullets.clearEnemy();
      this.showSpell(next.text || '异形母舰·形态变化');
      return;
    }

    if (this.phase === 4) {
      this.x = 360;
      this.y = 300 + Math.sin(this.t * 0.5) * 6;
      this.updateFinalDiveAlien(dt);
    } else {
      const speed = this.phase === 1 ? 0.26 : this.phase === 2 ? 0.42 : 0.50;
      const amp = this.phase === 1 ? 120 : 150;
      this.x = 360 + Math.sin(this.t * speed) * amp;
      this.y = this.targetY + Math.sin(this.t * 0.24) * 8;
    }

    const timers = this.attackTimers;
    for (const key of Object.keys(timers)) timers[key] -= dt;
    const activeTimers = this.phase === 1
      ? [timers.fan, timers.swarm, timers.missile]
      : this.phase === 2
        ? [timers.beam, timers.split, timers.swarm]
        : this.phase === 3
          ? [timers.cross, timers.ring, timers.laser]
          : [timers.p4Beam, timers.p4Split, timers.p4Missile, timers.dive];
    const nearest = Math.min(...activeTimers);
    this.chargeGlow = clamp(1 - nearest / 0.8, 0, 1);

    if (this.phase === 1) this.runAlienPhase1(dt, bullets, player);
    else if (this.phase === 2) this.runAlienPhase2(dt, bullets, player);
    else if (this.phase === 3) this.runAlienPhase3(dt, bullets, player);
    else this.runAlienPhase4(dt, bullets, player);
  },

  damageAlienMothership(amount) {
    if (this.entering) return;
    if (this.turrets.some((t) => !t.broken)) {
      this.flash = Math.min(1, this.flash + 0.25);
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deathTimer = 0;
    }
  },

  alienTurretPoint(side) {
    const dir = side === 'left' ? -1 : 1;
    return { x: this.x + dir * 330, y: this.y + 130 };
  },

  runAlienPhase1(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.fan <= 0) {
      const side = this.beamSide;
      this.beamSide = side === 'left' ? 'right' : 'left';
      const point = this.alienTurretPoint(side);
      const dir = side === 'left' ? -1 : 1;
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(point.x, point.y, Math.PI / 2 + dir * 0.22 + i * 0.18, 250 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_3',
          large: true,
        });
      }
      timers.fan = 1.0 * this.intervalBoost;
    }
    if (timers.swarm <= 0 && this.summonCallback) {
      this.summonCallback(['ES', 'ES', 'ES', 'ES']);
      timers.swarm = 5 * this.intervalBoost;
    }
    if (timers.missile <= 0) {
      for (let i = 0; i < 3; i += 1) {
        const angle = Math.PI / 2 + (i - 1) * 0.35;
        bullets.fireEnemy(this.x, this.y + 170, angle, 150 * bs, {
          sprite: 'boss_bullet_4',
          color: '#ffb13d',
          large: true,
          destructible: true,
          hp: 260,
          life: 9,
          tracking: {
            originX: this.x,
            originY: this.y + 170,
            radius: 140,
            lockSpeed: 300 * bs,
          },
        });
      }
      timers.missile = 3.0 * this.intervalBoost;
    }
    void dt;
    void player;
  },

  runAlienPhase2(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.beam <= 0) {
      const side = this.beamSide;
      this.beamSide = side === 'left' ? 'right' : 'left';
      const point = this.alienTurretPoint(side);
      bullets.fireLaser(point.x, 0, 85, 2.4, 'boss_laser', {
        style: 'orbs',
        charge: 1.0,
        direction: 'vertical',
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.beam = 2.4 * this.intervalBoost;
    }
    if (timers.split <= 0) {
      const travel = (640 - (this.y + 170)) / (230 * bs);
      bullets.fireEnemy(this.x, this.y + 170, Math.PI / 2, 230 * bs, {
        large: true,
        color: '#c26bff',
        sprite: 'boss_bullet_6',
        life: Math.max(0.6, travel),
        fragment: {
          angles: [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4],
          speed: 280 * bs,
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        },
      });
      timers.split = 1.7 * this.intervalBoost;
    }
    if (timers.swarm <= 0 && this.summonCallback) {
      this.summonCallback(['ES', 'ES', 'EM']);
      timers.swarm = 5 * this.intervalBoost;
    }
    void dt;
    void player;
  },

  alienSummon() {
    if (!this.summonCallback) return;
    const erosion = ['ES', 'EM', 'EH', 'ED'].slice().sort(() => Math.random() - 0.5);
    const ufo = ['U', 'UV', 'UG'][Math.floor(Math.random() * 3)];
    this.summonCallback([erosion[0], erosion[1], ufo]);
    this.summonTimer = 10;
  },

  alienSummon() {
    if (!this.summonCallback) return;
    const erosion = ['ES', 'EM', 'EH', 'ED'].slice().sort(() => Math.random() - 0.5);
    const ufo = ['U', 'UV', 'UG'][Math.floor(Math.random() * 3)];
    this.summonCallback([erosion[0], erosion[1], ufo]);
    this.summonTimer = 10;
  },

  runAlienPhase3(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.cross <= 0) {
      for (const side of ['left', 'right']) {
        const point = this.alienTurretPoint(side);
        const dir = side === 'left' ? -1 : 1;
        for (let i = 0; i < 3; i += 1) {
          bullets.fireEnemy(point.x, point.y, Math.PI / 2 + dir * (0.38 + i * 0.16), 330 * bs, {
            color: '#ff8a4a',
            sprite: 'boss_bullet_2',
            large: true,
          });
        }
      }
      timers.cross = 1.2 * this.intervalBoost;
    }
    if (timers.ring <= 0) {
      const count = 12;
      const gap = Math.floor(Math.random() * count);
      for (let i = 0; i < count; i += 1) {
        if (i === gap || i === (gap + 1) % count) continue;
        bullets.fireEnemy(this.x, this.y + 140, (i / count) * TAU, 210 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        });
      }
      timers.ring = 2.2 * this.intervalBoost;
    }
    if (timers.laser <= 0 && player) {
      bullets.fireLaser(player.x, 0, 30, 1.3, 'boss_laser', {
        style: 'orbs',
        charge: 0.75,
        direction: 'vertical',
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.laser = 2.6 * this.intervalBoost;
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) this.alienSummon();
    void dt;
  },

  runAlienPhase4(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.p4Beam <= 0) {
      bullets.fireLaser(120, 0, 75, 5.0, 'boss_laser', {
        style: 'orbs',
        charge: 0.9,
        direction: 'vertical',
        vx: 115,
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      bullets.fireLaser(this.x, 430, 70, 5.0, 'boss_laser', {
        style: 'orbs',
        charge: 0.9,
        direction: 'horizontal',
        vy: 95,
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.p4Beam = 5.0 * this.intervalBoost;
    }
    if (timers.p4Split <= 0) {
      const travel = (620 - (this.y + 170)) / (310 * bs);
      bullets.fireEnemy(this.x, this.y + 170, Math.PI / 2, 310 * bs, {
        large: true,
        color: '#c26bff',
        sprite: 'boss_bullet_6',
        life: Math.max(0.5, travel),
        fragment: {
          angles: [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4],
          speed: 340 * bs,
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        },
      });
      timers.p4Split = 0.8 * this.intervalBoost;
    }
    if (timers.p4Missile <= 0) {
      for (let i = 0; i < 8; i += 1) {
        const angle = Math.PI / 2 + (i - 3.5) * 0.18;
        bullets.fireEnemy(this.x + (i - 3.5) * 45, this.y + 180, angle, 145 * bs, {
          sprite: 'boss_bullet_4',
          color: '#ffb13d',
          large: true,
          destructible: true,
          hp: 240,
          life: 9,
          tracking: {
            originX: this.x + (i - 3.5) * 45,
            originY: this.y + 180,
            radius: 155,
            lockSpeed: 320 * bs,
          },
        });
      }
      timers.p4Missile = 5.0 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startAlienFinalDive();
      timers.dive = 7.0 * this.intervalBoost;
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) this.alienSummon();
    void dt;
    void player;
  },

  startAlienFinalDive() {
    if (this.finalDiveState !== 'idle') return;
    this.finalDiveBaseY = this.y;
    this.finalDiveState = 'charge';
    this.finalDiveTimer = 1.2;
    this.showSpell('濒死冲击');
  },

  updateFinalDiveAlien(dt) {
    if (this.finalDiveState === 'charge') {
      this.finalDiveTimer -= dt;
      this.chargeGlow = Math.min(1, 1 - this.finalDiveTimer / 1.2);
      if (this.finalDiveTimer <= 0) {
        this.finalDiveState = 'dive';
      }
      return;
    }
    if (this.finalDiveState === 'dive') {
      this.y += 280 * dt;
      if (this.y >= this.finalDiveBaseY + 220) {
        this.y = this.finalDiveBaseY + 220;
        this.finalDiveState = 'retreat';
      }
      return;
    }
    if (this.finalDiveState === 'retreat') {
      this.y -= 390 * dt;
      if (this.y <= this.finalDiveBaseY) {
        this.y = this.finalDiveBaseY;
        this.finalDiveState = 'idle';
      }
    }
  },

  isAlienDiving() {
    return this.finalDiveState === 'dive';
  },

  renderAlienMothership(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 12 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    const aura = ctx.createRadialGradient(0, 0, 40, 0, 0, 420 + pulse * 40);
    aura.addColorStop(0, 'rgba(120,20,30,0.28)');
    aura.addColorStop(0.65, 'rgba(70,12,20,0.12)');
    aura.addColorStop(1, 'rgba(30,6,10,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 450, 0, TAU);
    ctx.fill();

    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.72;
      const scale = this.artScale || 3.0;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#4b1f2c';
      ctx.strokeStyle = '#1c0a12';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.lineTo(220, -80);
      ctx.lineTo(330, 60);
      ctx.lineTo(220, 180);
      ctx.lineTo(0, 240);
      ctx.lineTo(-220, 180);
      ctx.lineTo(-330, 60);
      ctx.lineTo(-220, -80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    this.renderAlienCore(ctx, time);
    this.renderAlienTurret(ctx, 'left');
    this.renderAlienTurret(ctx, 'right');

    if (this.phase >= 2) this.renderAlienCracks(ctx);
    if (this.phase >= 4) this.renderAlienRage(ctx, time);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.55;
      ctx.fillStyle = '#2a1830';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  renderAlienCore(ctx, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    const glow = 0.35 + this.chargeGlow * 0.55 + pulse * 0.1;
    const grad = ctx.createRadialGradient(0, 90, 8, 0, 90, 90 + pulse * 20);
    grad.addColorStop(0, `rgba(255,90,90,${glow.toFixed(3)})`);
    grad.addColorStop(0.5, `rgba(180,30,50,${(glow * 0.55).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(80,10,20,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 90, 115, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,180,170,${(0.55 + this.chargeGlow * 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 90, 22 + this.chargeGlow * 14, 34 + this.chargeGlow * 20, 0, 0, TAU);
    ctx.fill();
  },

  renderAlienTurret(ctx, side) {
    const turret = this.turrets.find((t) => t.side === side);
    if (!turret) return;
    const point = this.alienTurretPoint(side);
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    ctx.save();
    ctx.translate(dx, dy);
    if (turret.broken) {
      ctx.fillStyle = '#2a1c35';
      ctx.strokeStyle = '#120a1c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-38, -18);
      ctx.lineTo(24, -28);
      ctx.lineTo(34, 20);
      ctx.lineTo(-28, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,80,0.55)';
      ctx.beginPath();
      ctx.arc(-4, 4, 10, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#7a3b47';
      ctx.strokeStyle = '#241017';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-40, -24);
      ctx.lineTo(16, -36);
      ctx.lineTo(44, -8);
      ctx.lineTo(34, 30);
      ctx.lineTo(-30, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d8a0a8';
      ctx.beginPath();
      ctx.arc(2, 0, 13, 0, TAU);
      ctx.fill();
      if (turret.damaged) {
        ctx.fillStyle = 'rgba(30,15,40,0.7)';
        ctx.beginPath();
        ctx.arc(-10, 10, 16, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  renderAlienCracks(ctx) {
    ctx.strokeStyle = 'rgba(255,120,100,0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 80, 90 + Math.sin(a) * 55);
      ctx.lineTo(Math.cos(a) * 180, 90 + Math.sin(a) * 115);
      ctx.stroke();
    }
  },

  renderAlienRage(ctx, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 10);
    ctx.strokeStyle = `rgba(255,60,60,${(0.35 + pulse * 0.35).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 90, 145 + pulse * 18, 0, TAU);
    ctx.stroke();
  },
};

module.exports = {
  initAlienMothership,
  alienMothershipMethods,
};

  });
  register("src/entities/boss.js", function (module, exports, require) {
﻿const { TAU, angleTo, rand, randInt, clamp } = require('../utils/math.js');
const { initAlienMothership, alienMothershipMethods } = require('./alien-mothership.js');

const DEG30 = Math.PI / 6;
const DEG4 = (4 * Math.PI) / 180;

class Boss {
  constructor(config, difficulty) {
    this.config = config;
    this.difficulty = difficulty;
    this.x = 360;
    this.y = -190;
    this.targetY = 426;
    this.r = config.radius;
    this.maxHp = Math.round(config.hp * difficulty.bossHp);
    this.hp = this.maxHp;
    this.entering = true;
    this.phase = 1;
    this.t = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.spellBanner = '';
    this.bannerTimer = 0;
    this.flash = 0;
    this.summonCallback = null;
    this.art = null;
    this.skillIndex = 0;
    this.skillPhase = 'active';
    this.skillTimer = 0;
    this.internalTimer = 0;
    this.rotationAngle = 0;
    this.laserFired = false;
    this.summoned = false;
    this.radialRounds = 0;
    this.trackRounds = 0;
    this.custom = config.custom || null;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTransition = 0;
    this.nextCombo = 0;
    this.shake = 0;
    this.enterTimer = 0;
    this.turretExtend = 0;
    this.coreGlow = 0;
    this.speedBoost = 1;
    this.diveState = 'idle';
    this.diveTimer = 4.0;
    this.diveBaseY = this.targetY;
    this.wanderX = 360;
    this.wanderY = this.targetY;
    this.wanderTimer = 0;
    this.smoke = [];
    this.attackAngle = 0;
    this.heavyRound = 1;
    this.summonedB = false;
    this.turrets = this.custom === 'stormEye' ? [
      { side: 'left', hp: Math.round(700 * difficulty.bossHp), maxHp: Math.round(700 * difficulty.bossHp), broken: false, damaged: false },
      { side: 'right', hp: Math.round(700 * difficulty.bossHp), maxHp: Math.round(700 * difficulty.bossHp), broken: false, damaged: false },
    ] : [];
    this.attackTimers = this.custom === 'stormEye' ? {
      turret: 0.6,
      missile: 2.2,
      dive: 4.0,
      cross: 1.0,
      heavy: 3.2,
      kamikaze: 4.5,
      summon: 6.0,
      fan: 0.6,
    } : {};
    this.parts = [];
    if (this.custom === 'twinGuards') {
      this.parts = (config.parts || []).map((part, i) => ({
        key: part.key,
        name: part.name,
        title: part.title,
        artKey: part.artKey,
        art: null,
        hp: Math.round(part.hp * difficulty.bossHp),
        maxHp: Math.round(part.hp * difficulty.bossHp),
        x: part.targetX,
        y: -190,
        targetX: part.targetX,
        targetY: part.targetY,
        radius: part.radius,
        r: part.radius,
        dead: false,
        flash: 0,
        diveState: 'idle',
        diveTimer: 5 + i,
        diveBaseY: part.targetY,
        fireTimer: 0.8 + i * 0.3,
        sweepSign: i === 0 ? 1 : -1,
      }));
      this.entering = true;
      this.phase2 = false;
      this.combo = 0;
      this.comboTimer = 0;
      this.crossTimer = 1.2;
      this.maxHp = this.parts.reduce((sum, part) => sum + part.maxHp, 0);
      this.hp = this.maxHp;
    }
    if (this.custom === 'finalLord') {
      this.turrets = (config.turrets || []).map((turret) => {
        let hp = Math.round((turret.hp || 2500) * difficulty.bossHp);
        if (difficulty.id === 'hard' || difficulty.id === 'insane') {
          hp = Math.round(hp * 1.4);
        }
        return {
          side: turret.side,
          name: turret.name || turret.side + '翼炮舱',
          hp,
          maxHp: hp,
          broken: false,
          damaged: false,
        };
      });
      this.phases = config.phases || [];
      this.phase = 1;
      this.transitioning = false;
      this.transitionTimer = 0;
      this.transitionIndex = 0;
      this.finalDiveState = 'idle';
      this.finalDiveBaseY = this.targetY;
      this.sweepAngle = 0;
      this.sweepSide = 'left';
      this.phaseBoost = difficulty.id === 'hard' || difficulty.id === 'insane' ? 1.2 : 1;
      this.intervalBoost =
        difficulty.id === 'insane' ? 0.75 : difficulty.id === 'hard' ? 0.85 : 1;
      this.purple = config.bulletPrefix || 'boss3_bullet_';
      this.attackTimers = {
        wingFan: 1.0,
        cross: 1.6,
        main: 2.4,
        ring: 1.6,
        sweep: 2.2,
        matrix: 0.9,
        burst: 0.35,
        scatter: 1.2,
        dive: 7,
      };
      this.turretExtend = 1;
    }
    if (this.custom === 'alienMothership') {
      initAlienMothership(this, config, difficulty);
    }
  }

  currentPhase() {
    const ratio = this.hp / this.maxHp;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
  }

  getSkill() {
    return this.config.skills[this.skillIndex];
  }

  getDuration() {
    const id = this.getSkill().id;
    if (id === 'rotate') return 5.0;
    if (id === 'radial') return 2.1;
    if (id === 'laser') return 4.0;
    if (id === 'track') return 2.0;
    if (id === 'array') return 6.0;
    return 0.2;
  }

  getCooldown() {
    const id = this.getSkill().id;
    if (id === 'rotate') return 3.0;
    if (id === 'radial') return 2.0;
    if (id === 'laser') return 3.0;
    if (id === 'track') return 3.0;
    if (id === 'array') return 4.0;
    return 2.0;
  }

  nextSkill() {
    this.skillIndex = (this.skillIndex + 1) % this.config.skills.length;
    this.skillPhase = 'active';
    this.skillTimer = 0;
    this.internalTimer = 0;
    this.rotationAngle = 0;
    this.laserFired = false;
    this.summoned = false;
    this.radialRounds = 0;
    this.trackRounds = 0;
    this.showSpell(this.getSkill().label);
  }

  update(dt, bullets, player) {
    this.t += dt;
    if (this.custom === 'finalLord') {
      this.updateFinalLord(dt, bullets, player);
      return;
    }
    if (this.custom === 'alienMothership') {
      this.updateAlienMothership(dt, bullets, player);
      return;
    }
    if (this.custom === 'twinGuards') {
      this.updateTwinGuards(dt, bullets, player);
      return;
    }
    if (this.custom === 'stormEye') {
      this.updateStormEye(dt, bullets, player);
      return;
    }
    if (this.entering) {
      this.y += (this.targetY - this.y) * Math.min(1, dt * 1.1);
      if (Math.abs(this.targetY - this.y) < 1) {
        this.entering = false;
        this.showSpell(this.getSkill().label);
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      return;
    }

    const phase = this.currentPhase();
    if (phase !== this.phase) this.phase = phase;

    this.x = 360 + Math.sin(this.t * 0.42) * 200;
    this.y = this.targetY + Math.sin(this.t * 0.24) * 18;

    if (this.skillPhase === 'cooldown') {
      this.skillTimer -= dt;
      if (this.skillTimer <= 0) this.nextSkill();
    } else {
      this.skillTimer += dt;
      this.runSkill(this.getSkill().id, dt, bullets, player);
      if (this.skillTimer >= this.getDuration()) {
        this.skillPhase = 'cooldown';
        this.skillTimer = this.getCooldown();
      }
    }

    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
  }

  updateStormEye(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);
    if (this.entering) {
      this.enterTimer += dt;
      this.y += 120 * dt;
      this.turretExtend = Math.min(1, this.enterTimer * 0.5);
      this.coreGlow = Math.min(1, this.enterTimer * 0.8);
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.combo = 0;
        this.comboTimer = 0;
        this.showSpell('雷暴核心启动');
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 150 * dt;
      this.coreGlow = Math.max(0, this.coreGlow - dt * 0.7);
      if (Math.random() < dt * 6) this.addSmoke(2);
      return;
    }

    const ratio = this.hp / this.maxHp;
    const advance =
      (this.combo === 0 && (ratio < 0.7 || this.comboTimer >= 14)) ||
      (this.combo === 1 && (ratio < 0.4 || this.comboTimer >= 15)) ||
      (this.combo === 2 && (ratio < 0.15 || this.comboTimer >= 16));
    this.comboTimer += dt;

    if (this.comboTransition > 0) {
      this.comboTransition -= dt;
      this.shake = Math.max(0, this.shake - dt * 1.3);
      this.x = 360 + Math.sin(this.t * 0.42) * 180;
      this.y = this.targetY + Math.sin(this.t * 0.24) * 12;
      if (this.comboTransition <= 0) {
        this.combo = this.nextCombo;
        this.comboTimer = 0;
        this.diveState = 'idle';
        this.diveTimer = 4.0;
        this.diveBaseY = this.y;
        this.showSpell(['云海之眼·组合A', '云海之眼·组合B', '云海之眼·组合C', '云海之眼·狂暴'][this.combo]);
      }
      return;
    }

    if (advance && this.combo < 3) {
      this.startStormTransition(this.combo + 1);
      return;
    }

    if (this.combo === 1) {
      this.updateDive(dt);
    } else {
      this.updateWander(dt);
    }

    this.runStormAttacks(dt, bullets, player);
  }

  updateTwinGuards(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    const living = this.parts.filter((part) => !part.dead);
    if (living.length === 0) {
      this.dead = true;
      this.deathTimer += dt;
      return;
    }
    if (this.entering) {
      this.enterTimer += dt;
      let done = true;
      for (const part of this.parts) {
        if (part.dead) continue;
        part.y += 115 * dt;
        if (part.y >= part.targetY) {
          part.y = part.targetY;
        } else {
          done = false;
        }
      }
      if (done) {
        this.entering = false;
        this.showSpell('锋卫双骑 降临');
      }
      return;
    }

    const sumHp = living.reduce((sum, part) => sum + part.hp, 0);
    const sumMax = living.reduce((sum, part) => sum + part.maxHp, 0);
    if (!this.phase2 && sumHp / sumMax <= 0.5) {
      this.phase2 = true;
      this.showSpell('锋卫双骑·交叉神域');
    }

    const cycle = this.phase2 ? 4.2 : 5.5;
    this.comboTimer += dt;
    if (this.comboTimer >= cycle) {
      this.combo = (this.combo + 1) % 3;
      this.comboTimer = 0;
    }
    const bs = this.difficulty.bulletSpeed * (this.phase2 ? 1.15 : 1);
    const alpha = this.parts.find((part) => part.key === 'alpha');
    const beta = this.parts.find((part) => part.key === 'beta');

    if (this.combo === 0) {
      for (const part of this.parts) {
        if (part.dead) continue;
        part.x = part.targetX + Math.sin(this.t * 0.7 + (part.key === 'alpha' ? 0 : Math.PI)) * 170;
        part.y = part.targetY + Math.sin(this.t * 0.5 + part.sweepSign) * 8;
        part.fireTimer -= dt;
        if (part.fireTimer <= 0) {
          this.fireTwinSweep(part, bullets, bs);
          part.fireTimer = this.phase2 ? 0.5 : 0.7;
        }
      }
    } else if (this.combo === 1) {
      if (alpha && !alpha.dead) this.updateTwinDive(alpha, dt, player);
      if (beta && !beta.dead) {
        beta.x = beta.targetX + Math.sin(this.t * 0.6) * 120;
        beta.fireTimer -= dt;
        if (beta.fireTimer <= 0) {
          this.fireTwinFan(beta, bullets, bs);
          beta.fireTimer = this.phase2 ? 0.4 : 0.55;
        }
      }
    } else {
      if (beta && !beta.dead) this.updateTwinDive(beta, dt, player);
      if (alpha && !alpha.dead) {
        alpha.x = alpha.targetX + Math.sin(this.t * 0.6) * 120;
        alpha.fireTimer -= dt;
        if (alpha.fireTimer <= 0) {
          this.fireTwinBarrage(alpha, bullets, bs);
          alpha.fireTimer = this.phase2 ? 0.4 : 0.55;
        }
      }
    }

    if (this.phase2) {
      this.crossTimer -= dt;
      if (this.crossTimer <= 0) {
        this.fireTwinCross(bullets, bs);
        this.crossTimer = 0.9;
      }
    }
    for (const part of this.parts) {
      part.flash = Math.max(0, part.flash - dt * 3);
    }
  }

  updateTwinDive(part, dt, player) {
    if (part.diveState === 'idle') {
      part.diveTimer -= dt;
      if (part.diveTimer <= 0) {
        part.diveBaseY = part.y;
        part.diveState = 'dive';
      }
    } else if (part.diveState === 'dive') {
      const dx = player.x - part.x;
      const dy = player.y - part.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 480;
      part.x += (dx / dist) * speed * dt;
      part.y += (dy / dist) * speed * dt;
      if (part.y >= part.diveBaseY + 300) part.diveState = 'retreat';
    } else {
      part.y -= 520 * dt;
      if (part.y <= part.diveBaseY) {
        part.y = part.diveBaseY;
        part.diveState = 'idle';
        part.diveTimer = 5;
      }
    }
  }

  fireTwinSweep(part, bullets, bs) {
    const base = Math.PI / 2 + part.sweepSign * 0.35;
    for (let i = -1; i <= 1; i += 1) {
      bullets.fireEnemy(part.x, part.y + 16, base + i * 0.25, 230 * bs, {
        color: '#ffd36b',
        sprite: 'boss_bullet_1',
      });
    }
  }

  fireTwinFan(part, bullets, bs) {
    const base = Math.PI / 2;
    for (let i = -4; i <= 4; i += 1) {
      bullets.fireEnemy(part.x, part.y + 18, base + i * 0.24, 250 * bs, {
        color: '#ff9e3d',
        sprite: 'boss_bullet_3',
        medium: true,
      });
    }
  }

  fireTwinBarrage(part, bullets, bs) {
    const base = Math.PI / 2 + part.sweepSign * 0.5;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(part.x, part.y + 16, base + i * 0.2, 300 * bs, {
        color: '#ffb13d',
        sprite: 'boss_bullet_2',
      });
    }
  }

  fireTwinCross(bullets, bs) {
    const alpha = this.parts.find((part) => part.key === 'alpha');
    const beta = this.parts.find((part) => part.key === 'beta');
    if (alpha && !alpha.dead) {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(alpha.x, alpha.y + 16, Math.PI / 2 - 0.9 + i * 0.2, 280 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
    if (beta && !beta.dead) {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(beta.x, beta.y + 16, Math.PI / 2 + 0.3 + i * 0.2, 280 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
  }

  updateFinalLord(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);
    if (this.entering) {
      this.enterTimer += dt;
      this.y += 120 * dt;
      this.turretExtend = Math.min(1, this.enterTimer * 0.6);
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.showSpell('天阙主宰·相位一');
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 90 * dt;
      if (Math.random() < dt * 8) this.addSmoke(2);
      return;
    }
    if (this.transitioning) {
      this.transitionTimer -= dt;
      this.x = 360 + Math.sin(this.t * 0.35) * 60;
      this.y = this.targetY + Math.sin(this.t * 0.3) * 8;
      if (Math.random() < dt * 5) this.addSmoke(1);
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
        this.phase += 1;
        this.showSpell('天阙主宰·相位' + this.phase);
      }
      return;
    }

    this.x = 360 + Math.sin(this.t * 0.32) * 90;
    this.y = this.targetY + Math.sin(this.t * 0.22) * 10;

    const ratio = this.hp / this.maxHp;
    const next = this.phases[this.transitionIndex];
    if (next && ratio <= next.threshold) {
      this.hp = Math.max(0, Math.round(this.maxHp * next.threshold));
      this.startFinalTransition(next, bullets);
      return;
    }

    for (const key of Object.keys(this.attackTimers)) this.attackTimers[key] -= dt;
    if (this.phase === 1) {
      this.runFinalPhase1(dt, bullets, player);
    } else if (this.phase === 2) {
      this.runFinalPhase2(dt, bullets, player);
    } else if (this.phase === 3) {
      this.runFinalPhase3(dt, bullets, player);
    } else {
      this.runFinalPhase4(dt, bullets, player);
    }
  }

  startFinalTransition(next, bullets) {
    this.transitioning = true;
    this.transitionTimer = next.duration || 1.6;
    this.transitionIndex += 1;
    this.shake = 1;
    this.addSmoke(10);
    bullets.clearEnemy();
    this.showSpell(next.text || '天阙之力解放');
  }

  finalBullet(bullets, x, y, angle, speed, opts) {
    const options = opts || {};
    bullets.fireEnemy(x, y, angle, speed * this.phaseBoost, {
      color: options.color || '#c88bff',
      sprite: options.sprite || this.purple + '1',
      medium: !!options.medium,
      large: !!options.large,
      saturate: !!options.saturate,
    });
  }

  isTurretBroken(side) {
    const turret = this.turrets.find((t) => t.side === side);
    return !turret || turret.broken;
  }

  runFinalPhase1(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.wingFan <= 0) {
      if (!this.isTurretBroken('left')) {
        const point = this.turretPoint('left');
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + 0.35 + i * 0.16, 230, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      if (!this.isTurretBroken('right')) {
        const point = this.turretPoint('right');
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 - 0.35 - i * 0.16, 230, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      timers.wingFan = 1.6 * this.intervalBoost;
    }
    if (timers.cross <= 0) {
      if (!this.isTurretBroken('left')) {
        const point = this.turretPoint('left');
        for (let i = 0; i < 3; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + 0.35 + i * 0.15, 300, {
            sprite: this.purple + '1',
          });
        }
      }
      if (!this.isTurretBroken('right')) {
        const point = this.turretPoint('right');
        for (let i = 0; i < 3; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 - 0.35 - i * 0.15, 300, {
            sprite: this.purple + '1',
          });
        }
      }
      timers.cross = 2.0 * this.intervalBoost;
    }
    if (timers.main <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      for (let i = 0; i < 2; i += 1) {
        this.finalBullet(bullets, this.x, this.y - 30, base + (i === 0 ? -0.04 : 0.04), 380, {
          sprite: this.purple + '6',
          large: true,
          color: '#ffd36b',
        });
      }
      timers.main = 2.8 * this.intervalBoost;
    }
    void dt;
  }

  runFinalPhase2(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (const side of ['left', 'right']) {
        if (this.isTurretBroken(side)) continue;
        const point = this.turretPoint(side);
        for (let i = 0; i < 8; i += 1) {
          this.finalBullet(bullets, point.x, point.y, (i / 10) * TAU, 200, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      timers.ring = 2.3 * this.intervalBoost;
    }
    if (timers.sweep <= 0) {
      if (!this.isTurretBroken(this.sweepSide)) {
        const point = this.turretPoint(this.sweepSide);
        const dir = this.sweepSide === 'left' ? -1 : 1;
        this.sweepAngle += dir * 0.22;
        const base = Math.PI / 2 + dir * (0.4 + Math.sin(this.sweepAngle) * 0.8);
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, base + i * 0.2, 260, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      this.sweepSide = this.sweepSide === 'left' ? 'right' : 'left';
      timers.sweep = 1.4 * this.intervalBoost;
    }
    if (timers.main <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      for (let i = 0; i < 2; i += 1) {
        this.finalBullet(bullets, this.x, this.y - 30, base + (i - 1) * 0.05, 420, {
          sprite: this.purple + '6',
          large: true,
          color: '#ffd36b',
        });
      }
      timers.main = 2.6 * this.intervalBoost;
    }
    void dt;
  }

  runFinalPhase3(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (let layer = 0; layer < 2; layer += 1) {
        for (let i = 0; i < 10; i += 1) {
          this.finalBullet(bullets, this.x, this.y + 8, (i / 12) * TAU + layer * 0.3, 150 + layer * 42, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      timers.ring = 2.0 * this.intervalBoost;
    }
    if (timers.matrix <= 0) {
      const muzzles = [
        { x: this.x - 30, y: this.y + 18 },
        { x: this.x + 30, y: this.y + 18 },
      ];
      for (const muzzle of muzzles) {
        for (let i = 0; i < 2; i += 1) {
          this.finalBullet(bullets, muzzle.x, muzzle.y, Math.PI / 2 + i * 0.2, 300, {
            sprite: this.purple + '5',
          });
        }
      }
      timers.matrix = 1.4 * this.intervalBoost;
    }
    if (timers.burst <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      this.finalBullet(bullets, this.x, this.y - 30, base, 460, {
        sprite: this.purple + '6',
        large: true,
        color: '#ffd36b',
      });
      timers.burst = 0.42 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startFinalDive();
      timers.dive = 8 * this.intervalBoost;
    }
    this.updateFinalDive(dt, bullets);
    void player;
  }

  runFinalPhase4(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (let layer = 0; layer < 2; layer += 1) {
        for (let i = 0; i < 10; i += 1) {
          this.finalBullet(bullets, this.x, this.y + 8, (i / 14) * TAU + layer * 0.25, 170 + layer * 45, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      for (const side of ['left', 'right']) {
        if (this.isTurretBroken(side)) continue;
        const point = this.turretPoint(side);
        const dir = side === 'left' ? -1 : 1;
        for (let i = -4; i <= 4; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + dir * (0.25 + i * 0.15), 250, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      timers.ring = 1.6 * this.intervalBoost;
    }
    if (timers.scatter <= 0) {
      const base = angleTo(this.x, this.y, player.x, player.y);
      for (let i = 0; i < 4; i += 1) {
        const offset = (Math.random() - 0.5) * 0.6;
        this.finalBullet(bullets, this.x + (Math.random() - 0.5) * 90, this.y + 12, base + offset, 270 + Math.random() * 60, {
          sprite: this.purple + '5',
        });
      }
      timers.scatter = 1.7 * this.intervalBoost;
    }
    if (timers.burst <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      this.finalBullet(bullets, this.x, this.y - 30, base, 500, {
        sprite: this.purple + '6',
        large: true,
        color: '#ffd36b',
      });
      timers.burst = 0.3 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startFinalDive();
      timers.dive = 5 * this.intervalBoost;
    }
    this.updateFinalDive(dt, bullets);
    void player;
  }

  startFinalDive() {
    this.finalDiveBaseY = this.y;
    this.finalDiveState = 'dive';
  }

  updateFinalDive(dt, bullets) {
    if (this.finalDiveState === 'dive') {
      this.y += 300 * dt;
      if (this.y >= this.finalDiveBaseY + 240) {
        this.y = this.finalDiveBaseY + 240;
        if (bullets) {
          for (let i = 0; i < 12; i += 1) {
            this.finalBullet(bullets, this.x, this.y + 10, (i / 12) * TAU, 190, {
              sprite: this.purple + '2',
              medium: true,
            });
          }
        }
        this.finalDiveState = 'retreat';
      }
    } else if (this.finalDiveState === 'retreat') {
      this.y -= 420 * dt;
      if (this.y <= this.finalDiveBaseY) {
        this.y = this.finalDiveBaseY;
        this.finalDiveState = 'idle';
      }
    }
  }

  damagePart(key, amount) {
    const part = this.parts.find((p) => p.key === key);
    if (!part || part.dead) return;
    part.hp = Math.max(0, part.hp - amount);
    part.flash = 1;
    if (part.hp <= 0) part.dead = true;
  }

  startStormTransition(next) {
    this.comboTransition = 1.1;
    this.nextCombo = next;
    this.shake = 1;
    this.addSmoke(10);
    if (next === 1) {
      const damaged = this.turrets.find((t) => !t.broken);
      if (damaged) damaged.damaged = true;
    } else if (next === 2) {
      for (const t of this.turrets) t.broken = true;
      this.addSmoke(14);
    } else if (next === 3) {
      this.speedBoost = 1.22;
    }
  }

  updateDive(dt) {
    if (this.diveState === 'idle') {
      this.diveTimer -= dt;
      this.updateWander(dt);
      if (this.diveTimer <= 0) {
        this.diveBaseY = this.y;
        this.diveState = 'dive';
      }
    } else if (this.diveState === 'dive') {
      this.y += 430 * dt;
      if (this.y >= this.diveBaseY + 250) this.diveState = 'retreat';
    } else {
      this.y -= 520 * dt;
      if (this.y <= this.diveBaseY) {
        this.y = this.diveBaseY;
        this.diveState = 'idle';
        this.diveTimer = 4.5;
      }
    }
  }

  updateWander(dt) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderX = rand(80, 640);
      this.wanderY = rand(250, 540);
      this.wanderTimer = rand(2.5, 4.5);
    }
    const dx = this.wanderX - this.x;
    const dy = this.wanderY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 90;
    if (dist > 4) {
      const step = Math.min(speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    this.y += Math.sin(this.t * 0.5) * 6 * dt;
  }

  runStormAttacks(dt, bullets, player) {
    const timers = this.attackTimers;
    for (const key of Object.keys(timers)) timers[key] -= dt;
    const bs = this.difficulty.bulletSpeed * this.speedBoost;
    if (this.combo === 0) {
      if (timers.turret <= 0) {
        const side = Math.floor(this.t * 0.9) % 2 === 0 ? 'left' : 'right';
        this.fireTurretFan(bullets, side, bs);
        timers.turret = 0.9;
      }
      if (timers.missile <= 0) {
        this.fireTrackingMissiles(bullets, player, bs);
        timers.missile = 2.6;
      }
      return;
    }
    if (this.combo === 1) {
      const intact = this.turrets.find((t) => !t.broken && !t.damaged) || this.turrets.find((t) => !t.broken);
      if (intact && timers.turret <= 0) {
        this.fireDiagonalBurst(bullets, intact.side, bs);
        timers.turret = 0.45;
      }
      if (timers.cross <= 0) {
        this.fireCrossFire(bullets, bs);
        timers.cross = 1.0;
      }
      if (!this.summonedB && this.summonCallback) {
        this.summonCallback(['S', 'S']);
        this.summonedB = true;
      }
      return;
    }
    if (this.combo === 2) {
      if (timers.fan <= 0) {
        this.fireSweepFan(bullets, bs);
        timers.fan = 0.55;
      }
      if (timers.heavy <= 0) {
        this.fireHeavyBurst(bullets, bs, 8, 190);
        timers.heavy = 3.2;
      }
      if (timers.kamikaze <= 0 && this.summonCallback) {
        this.summonCallback(['K', 'K']);
        timers.kamikaze = 4.5;
      }
      return;
    }
    if (this.combo === 3) {
      if (timers.fan <= 0) {
        this.fireSweepFan(bullets, bs);
        timers.fan = 0.5;
      }
      if (timers.cross <= 0) {
        this.fireCrossFire(bullets, bs);
        timers.cross = 1.1;
      }
      if (timers.heavy <= 0) {
        this.fireHeavyBurst(bullets, bs, this.heavyRound === 1 ? 12 : 8, 150);
        this.heavyRound = this.heavyRound === 1 ? 2 : 1;
        timers.heavy = 2.6;
      }
      if (timers.kamikaze <= 0 && this.summonCallback) {
        this.summonCallback(['K', 'K']);
        timers.kamikaze = 2.2;
      }
    }
  }

  fireTurretFan(bullets, side, bs) {
    const dir = side === 'left' ? -1 : 1;
    const point = this.turretPoint(side);
    const base = Math.PI / 2 + dir * 0.15;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(point.x, point.y, base + i * 0.22, 240 * bs, {
        color: '#ff5f6b',
        sprite: 'boss_bullet_2',
        medium: true,
      });
    }
  }

  fireTrackingMissiles(bullets, player, bs) {
    for (let i = 0; i < 2; i += 1) {
      const angle = Math.PI / 2 + (i === 0 ? -0.4 : 0.4);
      bullets.fireEnemy(this.x, this.y + 20, angle, 150 * bs, {
        sprite: 'boss_bullet_4',
        color: '#ffb13d',
        saturate: true,
        tracking: {
          originX: this.x,
          originY: this.y + 20,
          radius: 110,
          lockSpeed: 270 * bs,
        },
      });
    }
    void player;
  }

  fireDiagonalBurst(bullets, side, bs) {
    const dir = side === 'left' ? -1 : 1;
    const point = this.turretPoint(side);
    const base = Math.PI / 2 + dir * 0.5;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(point.x, point.y, base + i * 0.2, 320 * bs, {
        color: '#ff8a4a',
        sprite: 'boss_bullet_3',
        medium: true,
      });
    }
  }

  fireCrossFire(bullets, bs) {
    for (let group = 0; group < 2; group += 1) {
      const sign = group === 0 ? -1 : 1;
      for (let i = 0; i < 4; i += 1) {
        const angle = Math.PI / 2 + sign * (0.5 + i * 0.2);
        bullets.fireEnemy(this.x, this.y + 18, angle, 300 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
  }

  fireSweepFan(bullets, bs) {
    this.attackAngle += 0.28;
    const base = Math.PI / 2 + Math.sin(this.attackAngle) * 0.9;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(this.x, this.y + 18, base + i * 0.16, 280 * bs, {
        color: '#c26bff',
        sprite: 'boss_bullet_5',
      });
    }
  }

  fireHeavyBurst(bullets, bs, count, speed) {
    bullets.fireEnemy(this.x, this.y + 20, Math.PI / 2, speed * bs, {
      large: true,
      color: '#ff3d55',
      sprite: 'boss_bullet_6',
      life: 2.4,
      fragment: {
        count,
        speed: speed * 0.9,
        color: '#ff5f6b',
        sprite: 'boss_bullet_5',
      },
    });
  }

  turretPoint(turret) {
    const side = typeof turret === 'string' ? turret : turret.side;
    if (this.custom === 'alienMothership') return this.alienTurretPoint(side);
    const dir = side === 'left' ? -1 : 1;
    const offset = 78 + this.turretExtend * 46;
    return { x: this.x + dir * offset, y: this.y + 6 };
  }

  damageTurret(side, amount) {
    if (this.custom === 'alienMothership' && this.entering) return;
    const turret = this.turrets.find((t) => t.side === side);
    if (!turret || turret.broken) return;
    turret.hp -= amount;
    if (turret.hp <= 0) {
      turret.broken = true;
      this.addSmoke(6);
    }
  }

  hitTurret(x, y, r) {
    if (!this.turrets.length) return null;
    for (const turret of this.turrets) {
      if (turret.broken) continue;
      const point = this.turretPoint(turret);
      const dx = x - point.x;
      const dy = y - point.y;
      if (dx * dx + dy * dy <= (r + 22) * (r + 22)) return turret.side;
    }
    return null;
  }

  isDiving() {
    return this.custom === 'stormEye' && this.diveState === 'dive';
  }

  addSmoke(count) {
    for (let i = 0; i < count; i += 1) {
      this.smoke.push({
        x: rand(-110, 110),
        y: rand(-20, 50),
        size: rand(5, 14),
        life: rand(0.8, 1.5),
        maxLife: 1.5,
      });
    }
  }

  updateSmoke(dt) {
    for (let i = this.smoke.length - 1; i >= 0; i -= 1) {
      const puff = this.smoke[i];
      puff.life -= dt;
      puff.y -= 18 * dt;
      if (puff.life <= 0) this.smoke.splice(i, 1);
    }
  }

  renderStormEye(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 150 + pulse * 20);
    aura.addColorStop(0, 'rgba(120,20,30,' + (0.3 + this.coreGlow * 0.15) + ')');
    aura.addColorStop(0.7, 'rgba(70,12,20,0.12)');
    aura.addColorStop(1, 'rgba(30,6,10,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(8,4,8,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 76, 96, 22, 0, 0, TAU);
    ctx.fill();

    if (this.art) {
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.6) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = '#5a1f2b';
      ctx.strokeStyle = '#260a12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(34, -34);
      ctx.lineTo(126, -16);
      ctx.lineTo(136, 18);
      ctx.lineTo(40, 42);
      ctx.lineTo(0, 58);
      ctx.lineTo(-40, 42);
      ctx.lineTo(-136, 18);
      ctx.lineTo(-126, -16);
      ctx.lineTo(-34, -34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,120,120,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-110, 8);
      ctx.lineTo(110, 8);
      ctx.stroke();
    }

    const corePulse = 0.7 + 0.3 * Math.sin(time * 3);
    ctx.shadowColor = '#ff2a35';
    ctx.shadowBlur = 14 + this.coreGlow * 34 * corePulse;
    ctx.fillStyle = 'rgba(255,' + Math.round(30 + 40 * corePulse) + ',40,' + (0.75 + this.coreGlow * 0.25) + ')';
    ctx.beginPath();
    ctx.arc(0, 12, 13 + corePulse * 3, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    this.renderStormTurret(ctx, this.turrets[0], -1);
    this.renderStormTurret(ctx, this.turrets[1], 1);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.5;
      ctx.fillStyle = '#1b1518';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderStormTurret(ctx, turret, dir) {
    const point = this.turretPoint(turret.side);
    ctx.save();
    ctx.translate(point.x - this.x, point.y - this.y);
    if (turret.broken) {
      ctx.fillStyle = '#2b1218';
      ctx.strokeStyle = '#120509';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(10, -10);
      ctx.lineTo(12, 8);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.rotate(dir * (0.12 + this.turretExtend * 0.1));
    ctx.fillStyle = '#7a2a36';
    ctx.strokeStyle = '#260a12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(4, -18);
    ctx.lineTo(20, -10);
    ctx.lineTo(18, 12);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a43a48';
    ctx.fillRect(-4, -34, 8, 24);
    if (turret.damaged && !turret.broken) {
      ctx.fillStyle = 'rgba(20,8,10,0.75)';
      ctx.beginPath();
      ctx.arc(-6, 4, 10, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  runSkill(id, dt, bullets, player) {
    if (id === 'rotate') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.5) {
        this.fireRotating(bullets);
        this.rotationAngle += DEG4;
        this.internalTimer -= 0.5;
      }
      return;
    }
    if (id === 'radial') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.7 && this.radialRounds < 3) {
        this.fireRadial(bullets);
        this.radialRounds += 1;
        this.internalTimer -= 0.7;
      }
      return;
    }
    if (id === 'laser') {
      if (!this.laserFired) {
        bullets.fireLaser(this.x, this.y + 40, 68, 4.0, 'boss_laser', { style: 'orbs', color: '#5fff7a', follow: { x: () => this.x, y: () => this.y + 40 } });
        this.laserFired = true;
      }
      return;
    }
    if (id === 'track') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.5 && this.trackRounds < 4) {
        this.fireTracking(bullets, player);
        this.trackRounds += 1;
        this.internalTimer -= 0.5;
      }
      return;
    }
    if (id === 'array') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.2) {
        this.fireArray(bullets);
        this.internalTimer -= 0.2;
      }
      return;
    }
    if (id === 'summon' && !this.summoned) {
      this.summonEnemies();
      this.summoned = true;
    }
  }

  fireRotating(bullets) {
    const speed = 190 * this.difficulty.bulletSpeed;
    for (let i = 0; i < 12; i += 1) {
      const angle = this.rotationAngle + i * DEG30;
      bullets.fireEnemy(this.x, this.y + 30, angle, speed, {
        color: '#ff6a3d',
        sprite: 'boss_bullet_1',
        saturate: true,
      });
    }
  }

  fireRadial(bullets) {
    const speed = 300 * this.difficulty.bulletSpeed;
    for (let i = 0; i < 12; i += 1) {
      bullets.fireEnemy(this.x, this.y + 24, i * DEG30, speed, {
        large: true,
        color: '#ff9e3d',
        sprite: 'boss_bullet_2',
        saturate: true,
      });
    }
  }

  fireTracking(bullets, player) {
    const angle = rand(0, TAU);
    bullets.fireEnemy(this.x, this.y + 24, angle, 135 * this.difficulty.bulletSpeed, {
      sprite: 'boss_bullet_4',
      color: '#ffb13d',
      saturate: true,
      tracking: {
        originX: this.x,
        originY: this.y,
        radius: 150,
        lockSpeed: 290,
      },
    });
  }

  fireArray(bullets) {
    const count = randInt(10, 16);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(90, 230) * this.difficulty.bulletSpeed;
      bullets.fireEnemy(this.x, this.y + 20, angle, speed, {
        sprite: 'boss_bullet_5',
        color: '#ffd36b',
        saturate: true,
      });
    }
  }

  summonEnemies() {
    const count = Math.max(1, Math.round(randInt(5, 7) * this.difficulty.enemyCount));
    const types = [];
    for (let i = 0; i < count; i += 1) {
      const roll = Math.random();
      types.push(roll < 0.5 ? 'S' : roll < 0.85 ? 'M' : 'H');
    }
    if (this.summonCallback) this.summonCallback(types);
  }

  damage(amount) {
    if (this.transitioning) return;
    if (this.custom === 'alienMothership') {
      this.damageAlienMothership(amount);
      return;
    }
    if (this.custom === 'twinGuards') {
      for (const part of this.parts) {
        if (part.dead) continue;
        part.hp = Math.max(0, part.hp - amount);
        part.flash = 1;
        if (part.hp <= 0) part.dead = true;
      }
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deathTimer = 0;
    }
  }

  showSpell(name) {
    this.spellBanner = name;
    this.bannerTimer = 2.2;
  }

  render(ctx, time) {
    if (this.custom === 'finalLord') {
      this.renderFinalLord(ctx, time);
      return;
    }
    if (this.custom === 'alienMothership') {
      this.renderAlienMothership(ctx, time);
      return;
    }
    if (this.custom === 'twinGuards') {
      this.renderTwinGuards(ctx, time);
      return;
    }
    if (this.custom === 'stormEye') {
      this.renderStormEye(ctx, time);
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.72;
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.5) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    if (this.flash > 0) ctx.globalAlpha = 0.72;
    this.drawAura(ctx, time);
    this.drawBody(ctx, time);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  renderTwinGuards(ctx, time) {
    for (const part of this.parts) {
      if (part.dead) continue;
      ctx.save();
      ctx.translate(part.x, part.y);
      const pulse = 0.5 + 0.5 * Math.sin(time * 4 + (part.key === 'alpha' ? 0 : 1.2));
      const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, part.radius * 2.1 + pulse * 8);
      aura.addColorStop(0, 'rgba(255,190,90,0.26)');
      aura.addColorStop(0.7, 'rgba(255,160,60,0.10)');
      aura.addColorStop(1, 'rgba(255,140,50,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, part.radius * 2.1 + pulse * 8, 0, TAU);
      ctx.fill();
      if (part.art) {
        if (part.flash > 0) ctx.globalAlpha = 0.6;
        const maxDim = Math.max(part.art.width, part.art.height) || 1;
        const scale = (part.radius * 3.4) / maxDim;
        const w = part.art.width * scale;
        const h = part.art.height * scale;
        ctx.drawImage(part.art, -w / 2, -h / 2, w, h);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = part.key === 'alpha' ? '#d8b64a' : '#b8894a';
        ctx.strokeStyle = '#3c2f0d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -part.radius);
        ctx.lineTo(part.radius * 0.65, part.radius * 0.55);
        ctx.lineTo(-part.radius * 0.65, part.radius * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderFinalLord(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 170 + pulse * 16);
    aura.addColorStop(0, 'rgba(168,96,255,0.30)');
    aura.addColorStop(0.7, 'rgba(120,60,200,0.12)');
    aura.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 170 + pulse * 16, 0, TAU);
    ctx.fill();

    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.68;
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.55) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#7a5ac8';
      ctx.strokeStyle = '#2a1a55';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(34, -32);
      ctx.lineTo(124, -14);
      ctx.lineTo(134, 20);
      ctx.lineTo(38, 42);
      ctx.lineTo(0, 58);
      ctx.lineTo(-38, 42);
      ctx.lineTo(-134, 20);
      ctx.lineTo(-124, -14);
      ctx.lineTo(-34, -32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const charge = this.transitioning ? 0 : Math.max(0, 1 - this.attackTimers.main / 2.4);
    ctx.fillStyle = 'rgba(255,220,120,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -46, 18 + charge * 22, 8 + charge * 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.ellipse(0, -50, 5 + charge * 8, 10 + charge * 14, 0, 0, TAU);
    ctx.fill();

    this.renderFinalTurret(ctx, this.turrets.find((t) => t.side === 'left'), -1);
    this.renderFinalTurret(ctx, this.turrets.find((t) => t.side === 'right'), 1);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.5;
      ctx.fillStyle = '#2a1830';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderFinalTurret(ctx, turret, dir) {
    if (!turret) return;
    const point = this.turretPoint(turret.side);
    ctx.save();
    ctx.translate(point.x - this.x, point.y - this.y);
    ctx.rotate(dir * 0.12);
    if (turret.broken) {
      ctx.fillStyle = '#2a1c35';
      ctx.strokeStyle = '#120a1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(12, -14);
      ctx.lineTo(16, 10);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,80,0.5)';
      ctx.beginPath();
      ctx.arc(-4, 2, 5, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#9a6fd8';
    ctx.strokeStyle = '#2a1a55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(5, -22);
    ctx.lineTo(24, -12);
    ctx.lineTo(22, 14);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8b6ff';
    ctx.beginPath();
    ctx.arc(2, -2, 7, 0, TAU);
    ctx.fill();
    if (turret.damaged) {
      ctx.fillStyle = 'rgba(30,15,40,0.75)';
      ctx.beginPath();
      ctx.arc(-6, 6, 9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAura(ctx, time) {
    const pulse = 0.5 + Math.sin(time * 4) * 0.5;
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 150 + pulse * 20);
    aura.addColorStop(0, 'rgba(120,70,30,0.34)');
    aura.addColorStop(0.7, 'rgba(70,40,16,0.12)');
    aura.addColorStop(1, 'rgba(30,16,6,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 155, 0, TAU);
    ctx.fill();
  }

  drawBody(ctx, time) {
    ctx.fillStyle = 'rgba(12,8,4,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 74, 66, 18, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#57534c';
    ctx.strokeStyle = '#1d1914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, -36);
    ctx.lineTo(-96, -12);
    ctx.lineTo(-108, 16);
    ctx.lineTo(-38, 10);
    ctx.lineTo(-26, 34);
    ctx.lineTo(26, 34);
    ctx.lineTo(38, 10);
    ctx.lineTo(108, 16);
    ctx.lineTo(96, -12);
    ctx.lineTo(30, -36);
    ctx.lineTo(0, -52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3c3932';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(10, -10);
    ctx.lineTo(22, 30);
    ctx.lineTo(-22, 30);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6e6a5f';
    ctx.fillRect(-92, 2, 22, 14);
    ctx.fillRect(70, 2, 22, 14);

    ctx.fillStyle = '#2f2c26';
    ctx.fillRect(-50, -22, 14, 20);
    ctx.fillRect(36, -22, 14, 20);

    ctx.fillStyle = 'rgba(255,90,30,0.9)';
    ctx.beginPath();
    ctx.ellipse(-81, 18, 3, 8, 0, 0, TAU);
    ctx.ellipse(81, 18, 3, 8, 0, 0, TAU);
    ctx.ellipse(0, 40, 3, 8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#d9365f';
    ctx.beginPath();
    ctx.arc(-30, -2, 3, 0, TAU);
    ctx.arc(30, -2, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(0, 14, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2b241c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('荒', 0, 19);
  }
}

Object.assign(Boss.prototype, alienMothershipMethods);

module.exports = Boss;

  });
  register("src/entities/bullets.js", function (module, exports, require) {
const { TAU, angleTo, rand } = require('../utils/math.js');

// Default beam payload: 20 damage per hit, one hit every 0.4s (=50 damage per second).
// Callers can override per beam via fireLaser options (boss4 uses 52 / 0.4s = 130 per second).
const BEAM_DAMAGE = 20;
const BEAM_HIT_INTERVAL = 0.4;

class BulletManager {
  constructor(artBank) {
    this.artBank = artBank || null;
    this.enemy = [];
    this.player = [];
    this.beams = [];
  }

  firePlayer(x, y, angle, speed, damage, opts) {
    const options = opts || {};
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.player.push({
      x,
      y,
      vx,
      vy,
      angle: Math.atan2(vy, vx) + Math.PI / 2,
      r: options.r || 10,
      damage,
      color: options.color || '#5fd7ff',
      life: 2.4,
      spin: Math.random() * TAU,
    });
  }

  fireEnemy(x, y, angle, speed, opts) {
    const options = opts || {};
    const large = !!options.large;
    const medium = !!options.medium;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.enemy.push({
      x,
      y,
      vx,
      vy,
      angle: Math.atan2(vy, vx) + Math.PI / 2,
      r: large ? 15 : medium ? 11 : 8,
      large,
      medium,
      life: options.life || 11,
      spin: Math.random() * TAU,
      color: options.color || '#ff6a3d',
      sprite: options.sprite || (large ? 'enemy_bullet_large' : medium ? 'enemy_bullet_medium' : 'enemy_bullet_small'),
      tracking: options.tracking || null,
      fragment: options.fragment || null,
      destructible: !!options.destructible,
      hp: options.hp || 0,
      maxHp: options.hp || 0,
    });
  }

  fireLaser(x, y, width, duration, sprite, opts) {
    const options = opts || {};
    this.beams.push({
      x,
      y,
      width,
      timer: 0,
      duration,
      hitTimer: 0,
      damage: options.damage === undefined ? BEAM_DAMAGE : options.damage,
      hitInterval: options.hitInterval === undefined ? BEAM_HIT_INTERVAL : options.hitInterval,
      sprite: sprite || 'boss_laser',
      direction: options.direction || 'vertical',
      charge: options.charge || 0,
      vx: options.vx || 0,
      vy: options.vy || 0,
      style: options.style || null,
      color: options.color || null,
      follow: options.follow || null,
    });
  }

  update(dt, player) {
    for (let i = this.player.length - 1; i >= 0; i -= 1) {
      const b = this.player[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.spin += dt * 10;
      b.life -= dt;
      if (b.y < -30 || b.x < -40 || b.x > 760 || b.life <= 0) {
        this.player.splice(i, 1);
      }
    }
    for (let i = this.enemy.length - 1; i >= 0; i -= 1) {
      const b = this.enemy[i];
      if (b.tracking) {
        this.updateTracking(b, dt, player);
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      b.spin += dt * 4;
      b.life -= dt;
      if (b.y < -40 || b.y > 1340 || b.x < -50 || b.x > 770 || b.life <= 0) {
        if (b.fragment) this.spawnFragments(b);
        this.enemy.splice(i, 1);
      }
    }
    for (let i = this.beams.length - 1; i >= 0; i -= 1) {
      const beam = this.beams[i];
      beam.timer += dt;
      beam.hitTimer -= dt;
      if (beam.follow) {
        beam.x = beam.follow.x();
        beam.y = beam.follow.y();
      } else {
        beam.x += beam.vx * dt;
        beam.y += beam.vy * dt;
      }
      if (beam.timer >= beam.duration) this.beams.splice(i, 1);
    }
  }

  updateTracking(b, dt, player) {
    const tracking = b.tracking;
    if (!tracking.lockedAngle) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const dx = b.x - tracking.originX;
      const dy = b.y - tracking.originY;
      if (Math.sqrt(dx * dx + dy * dy) >= tracking.radius) {
        if (player) {
          tracking.lockedAngle = angleTo(b.x, b.y, player.x, player.y);
        } else {
          tracking.lockedAngle = Math.atan2(b.vy, b.vx);
        }
        b.vx = Math.cos(tracking.lockedAngle) * tracking.lockSpeed;
        b.vy = Math.sin(tracking.lockedAngle) * tracking.lockSpeed;
        b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      }
    } else {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
  }

  clearEnemy() {
    this.enemy = [];
    this.beams = [];
  }

  spawnFragments(bullet) {
    const fragment = bullet.fragment;
    if (!fragment) return;
    const angles = fragment.angles || Array.from({ length: fragment.count || 4 }, (_, i) => (i / (fragment.count || 4)) * TAU + rand(0, 0.35));
    for (const angle of angles) {
      const speed = rand(fragment.speed * 0.8, fragment.speed * 1.2);
      this.fireEnemy(bullet.x, bullet.y, angle, speed, {
        color: fragment.color || '#ff5f6b',
        sprite: fragment.sprite || 'boss_bullet_5',
        medium: !!fragment.medium,
        large: !!fragment.large,
      });
    }
  }

  renderEnemy(ctx) {
    for (const b of this.enemy) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.saturate ? 'rgba(255,255,255,0.08)' : 'rgba(255,165,70,0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.5, 0, TAU);
      ctx.fill();
      const img = this.artBank ? this.artBank.get(b.sprite) : null;
      if (img) {
        ctx.rotate(b.angle);
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (b.r * 2.9) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#fff3d6';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.62, b.r, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.34, b.r * 0.72, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderPlayer(ctx) {
    const img = this.artBank ? this.artBank.get('player_bullet') : null;
    for (const b of this.player) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(140,232,255,0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 2.0, 0, TAU);
      ctx.fill();
      if (img && (!b.color || b.color === '#5fd7ff')) {
        ctx.rotate(b.angle);
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (b.r * 2.6) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = b.color || '#dffbff';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.45, b.r * 1.35, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = b.color || '#5fd7ff';
        ctx.beginPath();
        ctx.ellipse(0, b.r * 0.45, b.r * 0.25, b.r * 0.8, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderBeams(ctx) {
    for (const beam of this.beams) {
      const charging = beam.timer < beam.charge;
      const img = this.artBank ? this.artBank.get(beam.sprite) : null;
      if (charging) {
        const progress = Math.max(0, Math.min(1, beam.timer / beam.charge));
        ctx.save();
        ctx.globalAlpha = 0.25 + progress * 0.45;
        ctx.strokeStyle = beam.color || '#ff4b5f';
        ctx.lineWidth = 3 + progress * 5;
        ctx.beginPath();
        if (beam.direction === 'horizontal') {
          ctx.moveTo(0, beam.y);
          ctx.lineTo(720, beam.y);
        } else {
          ctx.moveTo(beam.x, beam.y);
          ctx.lineTo(beam.x, 1280);
        }
        ctx.stroke();
        ctx.restore();
        continue;
      }
      if (beam.style === 'orbs') {
        this.renderOrbBeam(ctx, beam);
        continue;
      }
      const alpha = 0.6 + Math.sin(beam.timer * 30) * 0.25;
      ctx.globalAlpha = Math.max(0.25, alpha);
      if (beam.direction === 'horizontal') {
        if (img) {
          ctx.drawImage(img, 0, beam.y - beam.width / 2, 720, beam.width);
        } else {
          const grad = ctx.createLinearGradient(0, 0, 720, 0);
          grad.addColorStop(0, 'rgba(255,60,20,0.15)');
          grad.addColorStop(0.35, 'rgba(255,90,30,0.75)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
          grad.addColorStop(0.65, 'rgba(255,90,30,0.75)');
          grad.addColorStop(1, 'rgba(255,60,20,0.15)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, beam.y - beam.width / 2, 720, beam.width);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(0, beam.y - 6, 720, 12);
        }
      } else {
        const startY = beam.y || 0;
        if (img) {
          ctx.drawImage(img, beam.x - beam.width / 2, startY, beam.width, 1280 - startY);
        } else {
          const grad = ctx.createLinearGradient(0, startY, 0, 1280);
          grad.addColorStop(0, 'rgba(255,255,255,0.95)');
          grad.addColorStop(0.12, 'rgba(255,180,80,0.9)');
          grad.addColorStop(0.35, 'rgba(255,90,30,0.75)');
          grad.addColorStop(1, 'rgba(255,60,20,0.15)');
          ctx.fillStyle = grad;
          ctx.fillRect(beam.x - beam.width / 2, startY, beam.width, 1280 - startY);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(beam.x - 6, startY, 12, 1280 - startY);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  renderOrbBeam(ctx, beam) {
    const color = beam.color || '#ff4b5f';
    const orbR = Math.max(6, beam.width * 0.42);
    const spacing = Math.max(10, orbR * 0.85);
    const pulse = 0.75 + 0.25 * Math.sin(beam.timer * 22);
    ctx.save();
    if (beam.direction === 'horizontal') {
      for (let x = 0; x <= 720; x += spacing) {
        const g = ctx.createRadialGradient(x, beam.y, 1, x, beam.y, orbR);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.35, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, beam.y, orbR, 0, TAU);
        ctx.fill();
      }
    } else {
      for (let y = beam.y; y <= 1280; y += spacing) {
        const g = ctx.createRadialGradient(beam.x, y, 1, beam.x, y, orbR);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.35, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(beam.x, y, orbR, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

module.exports = BulletManager;

  });
  register("src/entities/enemy.js", function (module, exports, require) {
const { TAU, clamp, rand, angleTo } = require('../utils/math.js');

function getStart(side, options) {
  if (options && typeof options.x === 'number' && typeof options.y === 'number') {
    return { x: options.x, y: options.y };
  }
  if (side === 'left') return { x: -60, y: rand(120, 420) };
  if (side === 'right') return { x: 780, y: rand(120, 420) };
  if (side === 'bottom') return { x: rand(60, 660), y: 1330 };
  if (side === 'topLeft') return { x: -50, y: -50 };
  if (side === 'topRight') return { x: 770, y: -50 };
  return { x: rand(60, 660), y: -50 };
}

class Enemy {
  constructor(def, options, difficulty, waveId) {
    this.def = def;
    this.type = def.type;
    this.difficulty = difficulty;
    this.waveId = waveId;
    this.options = options || {};
    this.path = this.options.path || 'dive';
    this.side = this.options.side || 'top';
    this.lane = this.options.lane || 0;
    this.flashing = !!(this.options.flashing || this.options.bombCarrier);
    const start = getStart(this.side, this.options);
    this.x = start.x;
    this.y = start.y;
    this.prevX = this.x;
    this.prevY = this.y;
    this.t = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = Math.PI;
    this.hp = Math.round(def.hp * difficulty.enemyHp);
    this.maxHp = this.hp;
    this.exp = def.exp;
    this.score = def.score;
    this.r = def.radius;
    this.dead = false;
    this.art = null;
    this.off = false;
    this.phase = 'move';
    this.fireTimer = rand(def.fireInterval || 2.2, (def.fireInterval || 2.2) + 0.8);
    if (this.path === 'loop') {
      this.phase = 'enter';
      this.loopConfig = this.options.loopConfig || {
        centerX: 300,
        radius: 72,
        loopDuration: 2.8,
      };
      this.loopStartAngle = this.side === 'left' ? Math.PI : 0;
      this.loopProgress = 0;
    } else if (this.path === 'hold') {
      this.holdPhase = 'enter';
      this.holdTimer = 0;
      this.holdY = this.options.holdY || this.def.holdY || 180;
      this.holdTime = this.options.holdTime || this.def.holdTime || 6;
    } else if (this.path === 'group') {
      this.groupConfig = this.options.groupConfig || { vy: 120 };
      this.groupPhase = 'descend';
    } else if (this.path === 'angleDive') {
      this.angleDiveAngle = this.options.angle !== undefined ? this.options.angle : Math.PI / 2;
    } else if (this.path === 'converge') {
      this.convergePhase = 'in';
    }
  }

  update(dt, bullets, player, difficulty, time) {
    this.t += dt;
    if (this.path === 'loop') {
      this.updateLoop(dt);
    } else if (this.path === 'kamikaze') {
      this.updateKamikaze(dt, player);
    } else if (this.path === 'hold') {
      this.updateHold(dt);
    } else if (this.path === 'group') {
      this.updateGroup(dt);
    } else if (this.path === 'angleDive') {
      this.updateAngleDive(dt);
    } else if (this.path === 'converge') {
      this.updateConverge(dt);
    } else {
      this.updateMove(dt);
    }
    this.angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    if (this.def.fireInterval && this.y > 40 && this.y < 900) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.def.fireInterval;
        this.fire(bullets, player, difficulty);
      }
    }
    this.off = this.isOff();
  }

  updateMove(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.side === 'left') {
      this.vx = speed;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane || (this.y + Math.sin(this.t * 2.2) * 24 * dt);
      return;
    }
    if (this.side === 'right') {
      this.vx = -speed;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane || (this.y + Math.sin(this.t * 2.2) * 24 * dt);
      return;
    }
    if (this.side === 'topLeft') {
      this.vx = speed * 0.8;
      this.vy = speed;
    } else if (this.side === 'topRight') {
      this.vx = -speed * 0.8;
      this.vy = speed;
    } else {
      this.vx = Math.sin(this.t * 2.4) * speed * 0.12;
      this.vy = speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateKamikaze(dt, player) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (!this.kamikazeAngle) {
      this.kamikazeAngle = player && player.alive ? angleTo(this.x, this.y, player.x, player.y) : Math.PI / 2;
    }
    this.vx = Math.cos(this.kamikazeAngle) * speed;
    this.vy = Math.sin(this.kamikazeAngle) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateHold(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.holdPhase === 'enter') {
      this.vy = speed;
      this.y += this.vy * dt;
      if (this.y >= this.holdY) {
        this.y = this.holdY;
        this.holdPhase = 'hold';
        this.holdTimer = 0;
      }
      return;
    }
    if (this.holdPhase === 'hold') {
      this.holdTimer += dt;
      this.vx = Math.sin(this.t * 1.3) * 22;
      this.vy = Math.sin(this.t * 2.1) * 10;
      this.x += this.vx * dt;
      if (this.holdTimer >= this.holdTime) {
        this.holdPhase = 'leave';
      }
      return;
    }
    this.vx = Math.sin(this.t * 2.4) * speed * 0.12;
    this.vy = speed * 1.15;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateGroup(dt) {
    const cfg = this.groupConfig || {};
    const speed = this.def.speed * this.difficulty.enemySpeed;
    const vy = cfg.vy !== undefined ? cfg.vy : speed;
    const vx = cfg.vx || 0;
    if (this.groupPhase === 'descend') {
      this.vx = vx;
      this.vy = vy;
      this.x += vx * dt;
      this.y += vy * dt;
      if (cfg.splitAtY && this.y >= cfg.splitAtY) {
        this.groupPhase = 'split';
        this.splitAngle = this.x < 360 ? 2.35 : Math.PI - 2.35;
      }
      return;
    }
    this.splitAngle = this.splitAngle === undefined ? Math.PI / 2 : this.splitAngle;
    this.vx = Math.cos(this.splitAngle) * speed * 1.35;
    this.vy = Math.sin(this.splitAngle) * speed * 1.35;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateAngleDive(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    const a = this.angleDiveAngle;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateConverge(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed * 1.15;
    const cx = 360;
    const cy = 620;
    if (this.convergePhase === 'in') {
      const dx = cx - this.x;
      const dy = cy - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
      }
      this.convergePhase = 'out';
    }
    const a =
      this.side === 'left' ? 2.2 :
      this.side === 'right' ? Math.PI - 2.2 :
      this.side === 'bottom' ? Math.PI / 2 : 2.4;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateLoop(dt) {
    const cfg = this.loopConfig;
    const sign = this.side === 'left' ? 1 : -1;
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.phase === 'enter') {
      this.vx = sign * speed * 1.25;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane;
      const reached = sign > 0 ? this.x >= cfg.centerX - cfg.radius : this.x <= cfg.centerX + cfg.radius;
      if (reached) {
        this.phase = 'loop';
        this.loopProgress = 0;
      }
      return;
    }
    if (this.phase === 'loop') {
      this.prevX = this.x;
      this.prevY = this.y;
      this.loopProgress += dt / cfg.loopDuration;
      const angle = this.loopStartAngle - this.loopProgress * TAU;
      this.x = cfg.centerX + Math.cos(angle) * cfg.radius;
      this.y = this.lane + Math.sin(angle) * cfg.radius;
      this.vx = (this.x - this.prevX) / Math.max(dt, 0.001);
      this.vy = (this.y - this.prevY) / Math.max(dt, 0.001);
      if (this.loopProgress >= 1) {
        this.phase = 'exit';
        this.x = cfg.centerX;
        this.y = this.lane;
      }
      return;
    }
    this.vx = sign * speed * 1.6;
    this.vy = 0;
    this.x += this.vx * dt;
    this.y = this.lane;
  }

  fire(bullets, player, difficulty) {
    const speed = this.def.bulletSpeed * difficulty.bulletSpeed;
    const base = angleTo(this.x, this.y, player.x, player.y);
    const color = this.def.bulletColor;
    if (this.def.pattern === 'snipe') {
      bullets.fireEnemy(this.x, this.y + 8, base, speed * 1.25, {
        color: color || '#ffd36b',
        sprite: 'enemy_bullet_medium',
        medium: true,
      });
      return;
    }
    if (this.def.pattern === 'snipe5') {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(this.x, this.y + 8, base + i * 0.055, speed * 1.45, {
          color: color || '#b26bff',
          sprite: 'enemy_bullet_medium',
          medium: true,
        });
      }
      return;
    }
    if (this.def.pattern === 'single') {
      bullets.fireEnemy(this.x, this.y + 10, base, speed, { color: color || '#ff5f6b', sprite: 'enemy_bullet_small' });
      return;
    }
    if (this.def.pattern === 'ring') {
      for (let i = 0; i < 10; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, i * (TAU / 10), speed * 0.9, { color: color || '#c26bff', sprite: 'enemy_bullet_medium', medium: true });
      }
      return;
    }
    if (this.def.pattern === 'ringSmall') {
      for (let i = 0; i < 12; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, i * (TAU / 12), speed * 0.85, { color: color || '#c26bff', sprite: 'enemy_bullet_small' });
      }
      return;
    }
    if (this.def.pattern === 'fanWide') {
      for (let i = -4; i <= 4; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, base + i * 0.15, speed * 0.95, { color: color || '#c26bff', sprite: 'enemy_bullet_medium', medium: true });
      }
      return;
    }
    if (this.def.pattern === 'fan3') {
      for (let i = -1; i <= 1; i += 1) {
        bullets.fireEnemy(this.x, this.y + 12, base + i * 0.24, speed, { color: color || '#ff8a4a', sprite: 'enemy_bullet_small' });
      }
      return;
    }
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(this.x, this.y + 14, base + i * 0.2, speed * 0.96, { color: color || '#ff8a4a', sprite: 'enemy_bullet_medium', medium: true });
    }
  }

  damage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  isOff() {
    return this.y > 1360 || this.x > 820 || this.x < -100 || this.y < -160;
  }

  offScreen() {
    return this.off;
  }

  render(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.flashing) {
      const pulse = 0.5 + Math.sin(time * 12) * 0.5;
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 16 + pulse * 18;
    } else if (this.glow) {
      const pulse = 0.5 + Math.sin(time * 10) * 0.5;
      ctx.shadowColor = this.glow === 'yellow' ? '#ffd36b' : '#4da6ff';
      ctx.shadowBlur = 14 + pulse * 16;
    }
    ctx.rotate(this.angle);
    if (this.art) {
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 3.4) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
    } else {
      this.drawJet(ctx, time);
    }
    ctx.restore();
    ctx.shadowBlur = 0;

    if (this.hp < this.maxHp && this.hp > 0) {
      ctx.fillStyle = 'rgba(10,12,8,0.7)';
      ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2, 4);
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2 * clamp(this.hp / this.maxHp, 0, 1), 4);
    }
  }

  drawJet(ctx, time) {
    const exhaust = 0.65 + Math.sin(time * 16) * 0.25;
    if (this.type === 'U' || this.type === 'UV') {
      const s = this.type === 'UV' ? 1.5 : 1;
      ctx.fillStyle = '#5a4a72';
      ctx.strokeStyle = '#2c1f42';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8f7bb8';
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 10 * s, 7 * s, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#c26bff';
      ctx.beginPath();
      ctx.arc(0, -6 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e8b9ff';
      ctx.fillRect(-14 * s, -2 * s, 4, 2);
      ctx.fillRect(10 * s, -2 * s, 4, 2);
      ctx.fillStyle = 'rgba(190,120,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 10 * s, 6 * s, 3 * s, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'UG') {
      ctx.fillStyle = '#3a3050';
      ctx.strokeStyle = '#17102a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(10, -8);
      ctx.lineTo(16, 18);
      ctx.lineTo(6, 26);
      ctx.lineTo(-6, 26);
      ctx.lineTo(-16, 18);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c26bff';
      ctx.shadowColor = '#c26bff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -4, 6, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, -4, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(194,107,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 8, 3, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'ES') {
      ctx.fillStyle = '#4a2a5a';
      ctx.strokeStyle = '#1d0d2b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(6, -4);
      ctx.lineTo(16, 8);
      ctx.lineTo(4, 6);
      ctx.lineTo(2, 16);
      ctx.lineTo(-2, 16);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-16, 8);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b26bff';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2.5, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EM') {
      ctx.fillStyle = '#3d2450';
      ctx.strokeStyle = '#160b24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(9, -8);
      ctx.lineTo(20, 6);
      ctx.lineTo(22, 14);
      ctx.lineTo(8, 9);
      ctx.lineTo(6, 20);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-8, 9);
      ctx.lineTo(-22, 14);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7a4a9a';
      ctx.fillRect(-16, 8, 5, 7);
      ctx.fillRect(11, 8, 5, 7);
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(-13, 16, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(13, 16, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EH') {
      ctx.fillStyle = '#331f44';
      ctx.strokeStyle = '#12071f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(10, -10);
      ctx.lineTo(30, 4);
      ctx.lineTo(34, 16);
      ctx.lineTo(14, 12);
      ctx.lineTo(10, 26);
      ctx.lineTo(-10, 26);
      ctx.lineTo(-14, 12);
      ctx.lineTo(-34, 16);
      ctx.lineTo(-30, 4);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5a6e';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(6, -6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9a5ab8';
      ctx.fillRect(-24, 10, 8, 8);
      ctx.fillRect(16, 10, 8, 8);
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(-20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(0, 28, 2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EK') {
      ctx.fillStyle = '#5a2240';
      ctx.strokeStyle = '#26091a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(5, 0);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(194,107,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EN') {
      ctx.fillStyle = '#4a2a6a';
      ctx.strokeStyle = '#180b2e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6a3a9a';
      ctx.fillRect(-4, -8, 8, 18);
      ctx.fillStyle = '#d9aaff';
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(178,107,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2.4, 7, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'ED') {
      ctx.fillStyle = '#6a2020';
      ctx.strokeStyle = '#2b0606';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(14, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-14, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a2626';
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff6a6a';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,90,60,0.95)';
      ctx.beginPath();
      ctx.ellipse(-15, 15, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(15, 15, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'K') {
      ctx.fillStyle = '#c2394a';
      ctx.strokeStyle = '#4a0d16';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(5, 0);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,90,50,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'D') {
      ctx.fillStyle = '#d8b64a';
      ctx.strokeStyle = '#4d3b0f';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(14, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-14, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4d7dff';
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f7e9b8';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.95)';
      ctx.beginPath();
      ctx.ellipse(-15, 15, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(15, 15, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'N') {
      ctx.fillStyle = '#c7a54a';
      ctx.strokeStyle = '#3a2f0c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6c1d';
      ctx.fillRect(-4, -8, 8, 18);
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,220,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2.4, 7, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'F') {
      ctx.fillStyle = '#e0c05a';
      ctx.strokeStyle = '#4a3a10';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(8, -4);
      ctx.lineTo(18, 6);
      ctx.lineTo(4, 4);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(0, -4, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'G') {
      ctx.fillStyle = '#c9a94e';
      ctx.strokeStyle = '#3c2f0d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(12, -14);
      ctx.lineTo(24, -4);
      ctx.lineTo(26, 12);
      ctx.lineTo(12, 14);
      ctx.lineTo(8, 24);
      ctx.lineTo(-8, 24);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-26, 12);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-12, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5a6e';
      ctx.beginPath();
      ctx.arc(-7, -10, 3, 0, TAU);
      ctx.arc(7, -10, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.9)';
      ctx.beginPath();
      ctx.ellipse(-16, 18, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(16, 18, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'S') {
      ctx.fillStyle = '#6f7c86';
      ctx.strokeStyle = '#303b45';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(6, -4);
      ctx.lineTo(16, 8);
      ctx.lineTo(4, 6);
      ctx.lineTo(2, 16);
      ctx.lineTo(-2, 16);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-16, 8);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#26333d';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,120,50,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2.5, 6, 0, 0, TAU);
      ctx.fill();
    } else if (this.type === 'M') {
      ctx.fillStyle = '#4f5b45';
      ctx.strokeStyle = '#222b1e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(9, -8);
      ctx.lineTo(20, 6);
      ctx.lineTo(22, 14);
      ctx.lineTo(8, 9);
      ctx.lineTo(6, 20);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-8, 9);
      ctx.lineTo(-22, 14);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#314037';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(5, -2);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#788b6b';
      ctx.fillRect(-16, 8, 5, 7);
      ctx.fillRect(11, 8, 5, 7);
      ctx.fillStyle = 'rgba(255,120,50,0.9)';
      ctx.beginPath();
      ctx.ellipse(-13, 16, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(13, 16, 2.2, 5, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#6d5f50';
      ctx.strokeStyle = '#2e251d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(10, -10);
      ctx.lineTo(30, 4);
      ctx.lineTo(34, 16);
      ctx.lineTo(14, 12);
      ctx.lineTo(10, 26);
      ctx.lineTo(-10, 26);
      ctx.lineTo(-14, 12);
      ctx.lineTo(-34, 16);
      ctx.lineTo(-30, 4);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3f3c33';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(6, -6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9a8870';
      ctx.fillRect(-24, 10, 8, 8);
      ctx.fillRect(16, 10, 8, 8);
      ctx.fillStyle = 'rgba(255,110,40,0.85)';
      ctx.beginPath();
      ctx.ellipse(-20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(0, 28, 2, 5, 0, 0, TAU);
      ctx.fill();
    }
  }
}

module.exports = Enemy;

  });
  register("src/entities/player.js", function (module, exports, require) {
const { clamp, TAU } = require('../utils/math.js');

const EXTRA_LIFE_SCORES = [50000, 150000, 300000];
const MAX_LEVEL = 26;
const SHIELD_MAX = 100;
const SHIELD_REGEN_INTERVAL = 0.5;
const SHIELD_REGEN_COOLDOWN = 3;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 6;
    this.maxHp = 100;
    this.hp = 100;
    this.lives = 3;
    this.reviveUsed = 0;
    this.invincible = false;
    this.shield = 0;
    this.maxShield = 0;
    this.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
    this.shieldRegenCooldown = 0;
    this.lifeFlash = 0;
    this.level = 1;
    this.exp = 0;
    this.expTotal = 0;
    this.bombs = 3;
    this.score = 0;
    this.fireTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this.attack = 6;
    this.fireInterval = 0.13;
    this.claimedExtras = [];
    this.onLevelUp = null;
    this.respawnTimer = 0;
    this.spectating = false;
    this.tilt = 0;
    this.art = null;
  }

  static fromState(state) {
    const player = new Player(360, 1080);
    player.hp = state.hp || 100;
    player.maxHp = state.maxHp || 100;
    player.lives = state.lives === undefined ? 3 : state.lives;
    player.reviveUsed = state.reviveUsed || 0;
    player.invincible = !!state.invincible;
    player.shield = 0;
    player.maxShield = 0;
    player.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
    player.shieldRegenCooldown = 0;
    player.level = state.level || 1;
    player.exp = state.exp || 0;
    player.expTotal = state.expTotal || 0;
    player.bombs = state.bombs === undefined ? 3 : state.bombs;
    player.score = state.score || 0;
    player.claimedExtras = (state.claimedExtras || []).slice();
    player.spectating = !!state.spectating;
    player.recomputeCombatStats();
    player.shield = state.shield === undefined ? player.maxShield : Math.min(Math.max(0, state.shield), player.maxShield);
    if (player.maxShield > 0 && player.shield <= 0) player.shieldRegenCooldown = SHIELD_REGEN_COOLDOWN;
    return player;
  }

  toState() {
    return {
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      lives: this.lives,
      reviveUsed: this.reviveUsed || 0,
      spectating: this.spectating,
      invincible: this.invincible,
      shield: this.shield,
      maxShield: this.maxShield,
      level: this.level,
      exp: Math.round(this.exp),
      expTotal: Math.round(this.expTotal),
      bombs: this.bombs,
      score: this.score,
      claimedExtras: this.claimedExtras.slice(),
    };
  }

  expToNext() {
    return 100 + (this.level - 1) * 60;
  }

  recomputeCombatStats() {
    const level = clamp(this.level, 1, MAX_LEVEL);
    let attack = Math.max(6, Math.round(6 * Math.pow(1.08, level - 1)));
    if (level >= 20) attack *= 2;
    this.attack = attack;
    this.fireInterval = Math.max(0.07, 0.13 * Math.pow(0.94, level - 1));
    this.maxHp = 100 + 12 * (level - 1);
    const shieldMax = level >= 20 ? SHIELD_MAX : 0;
    if (this.maxShield !== shieldMax) {
      if (shieldMax > 0 && this.maxShield === 0) this.shield = SHIELD_MAX;
      this.maxShield = shieldMax;
      if (this.maxShield === 0) this.shield = 0;
    }
    this.shield = Math.min(this.shield, this.maxShield);
  }

  addExp(amount) {
    this.exp += amount;
    this.expTotal += amount;
    while (this.exp >= this.expToNext() && this.level < MAX_LEVEL) {
      this.exp -= this.expToNext();
      this.level += 1;
      const prevMax = this.maxHp;
      this.recomputeCombatStats();
      const gained = this.maxHp - prevMax;
      if (gained > 0) this.hp = Math.min(this.maxHp, this.hp + gained);
      if (this.onLevelUp) this.onLevelUp(this.level);
    }
  }

  addScore(amount) {
    this.score += amount;
    for (const threshold of EXTRA_LIFE_SCORES) {
      if (this.score >= threshold && this.claimedExtras.indexOf(threshold) === -1) {
        this.claimedExtras.push(threshold);
        this.lives += 1;
        this.lifeFlash = 2;
      }
    }
  }

  damage(amount) {
    if (!this.alive || this.invuln > 0) return false;
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (this.maxShield > 0 && this.shield <= 0) {
      this.shieldRegenCooldown = SHIELD_REGEN_COOLDOWN;
    }
    if (remaining > 0) this.hp -= remaining;
    if (this.hp <= 0) {
      this.hp = 0;
      this.miss();
    }
    return true;
  }

  miss() {
    if (!this.invincible) this.lives -= 1;
    this.alive = false;
    this.respawnTimer = 1.1;
  }

  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    this.invuln = 2;
    this.respawnTimer = 0;
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  addBomb(amount) {
    this.bombs = clamp(this.bombs + amount, 0, 5);
  }

  update(dt, moveTarget) {
    if (!this.alive) {
      if (this.respawnTimer > 0) this.respawnTimer -= dt;
      return;
    }
    if (moveTarget) {
      const dx = moveTarget.x - this.x;
      const dy = moveTarget.y - this.y;
      this.x = moveTarget.x;
      this.y = moveTarget.y;
      const targetTilt = clamp(dx * 0.003, -0.8, 0.8);
      this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 14);
    } else {
      this.tilt += (0 - this.tilt) * Math.min(1, dt * 5);
    }
    this.x = clamp(this.x, 28, 692);
    this.y = clamp(this.y, 70, 1230);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.lifeFlash > 0) this.lifeFlash = Math.max(0, this.lifeFlash - dt);
    if (this.maxShield > 0) {
      if (this.shieldRegenCooldown > 0) {
        this.shieldRegenCooldown = Math.max(0, this.shieldRegenCooldown - dt);
      } else {
        this.shieldRegenTimer -= dt;
        if (this.shieldRegenTimer <= 0) {
          this.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
          if (this.shield < this.maxShield) this.shield = Math.min(this.maxShield, this.shield + 1);
        }
      }
    }
  }

  updateFire(dt, bullets) {
    if (!this.alive) return;
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    this.fireTimer = this.fireInterval;
    const shots = [];
    if (this.level < 3) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2 });
    } else if (this.level < 6) {
      shots.push({ x: this.x - 9, y: this.y - 20, angle: -Math.PI / 2 + 0.05 });
      shots.push({ x: this.x + 9, y: this.y - 20, angle: -Math.PI / 2 - 0.05 });
    } else if (this.level < 10) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2 });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12 });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12 });
    } else if (this.level < 15) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2, r: 18 });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12, r: 15 });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12, r: 15 });
      shots.push({ x: this.x - 30, y: this.y - 14, angle: -Math.PI / 2, r: 10, color: '#7dff8a' });
      shots.push({ x: this.x + 30, y: this.y - 14, angle: -Math.PI / 2, r: 10, color: '#7dff8a' });
    } else {
      const red = this.level >= 20 ? '#ff4d6b' : '#d9b3ff';
      const gold = this.level >= 20 ? '#ffd36b' : '#d9b3ff';
      const purple = this.level >= 20 ? '#b26bff' : '#d9b3ff';
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2, r: 20, color: gold });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12, r: 20, color: red });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12, r: 20, color: purple });
      shots.push({ x: this.x - 30, y: this.y - 14, angle: -Math.PI / 2, r: 20, color: red });
      shots.push({ x: this.x + 30, y: this.y - 14, angle: -Math.PI / 2, r: 20, color: purple });
    }
    for (const shot of shots) {
      bullets.firePlayer(shot.x, shot.y, shot.angle, 860, this.attack, { r: shot.r, color: shot.color });
    }
  }

  reviveFromSpectate() {
      this.spectating = false;
      this.alive = true;
      this.hp = this.maxHp;
      this.invuln = 3;
      this.respawnTimer = 0;
      this.x = 360;
      this.y = 1000;
      this.tilt = 0;
    }


  render(ctx, time) {
    if (!this.alive) {
      if (this.respawnTimer > 0) {
        const alpha = Math.min(1, this.respawnTimer * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff9d80';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('信号丢失', this.x, this.y + 44);
        ctx.globalAlpha = 1;
      }
      return;
    }
    if (this.invuln > 0 && Math.floor(time * 14) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.art) {
      ctx.rotate(this.tilt * 0.3);
      const w = 64;
      const h = 72;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
      this.renderShield(ctx, time);
      return;
    }
    ctx.rotate(this.tilt * 0.3);

    ctx.fillStyle = 'rgba(20,16,8,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 24, 7, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#e7ecf2';
    ctx.strokeStyle = '#3d4650';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(9, -8);
    ctx.lineTo(24, 10);
    ctx.lineTo(26, 18);
    ctx.lineTo(9, 13);
    ctx.lineTo(5, 24);
    ctx.lineTo(-5, 24);
    ctx.lineTo(-9, 13);
    ctx.lineTo(-26, 18);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-9, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cf3f4f';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(7, -8);
    ctx.lineTo(16, 8);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#26333d';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5, -2);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(92,222,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -10, 4, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,140,50,0.95)';
    ctx.beginPath();
    ctx.ellipse(0, 27, 3, 8, 0, 0, TAU);
    ctx.ellipse(-22, 20, 2, 5, 0, 0, TAU);
    ctx.ellipse(22, 20, 2, 5, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;

    this.renderShield(ctx, time);

    ctx.fillStyle = 'rgba(140,230,255,0.18)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 18 + Math.sin(time * 5) * 3, 0, TAU);
    ctx.fill();
  }
  renderShield(ctx, time) {
    if (this.shield <= 0) return;
    const ratio = Math.min(1, this.shield / Math.max(1, this.maxShield));
    const pulse = 1 + Math.sin(time * 5) * 0.04;
    const radius = (34 + ratio * 8) * pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
    grad.addColorStop(0, "rgba(140,220,255,0.05)");
    grad.addColorStop(0.75, "rgba(140,220,255,0.16)");
    grad.addColorStop(1, "rgba(190,240,255,0.38)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fill();
    const low = ratio < 0.25;
    const ringAlpha = low && Math.floor(time * 6) % 2 === 0 ? 0.35 : 0.9;
    ctx.strokeStyle = "rgba(160,228,255," + ringAlpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,240,255,0.55)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const start = (i / 3) * TAU + time * 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, start + 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

module.exports = Player;
Player.EXTRA_LIFE_SCORES = EXTRA_LIFE_SCORES;


  });
  register("src/main.js", function (module, exports, require) {
const platform = require('./core/platform.js');
const SceneManager = require('./core/scenes.js');
const Input = require('./core/input.js');
const AudioManager = require('./core/audio.js');
const ArtBank = require('./core/artbank.js');
const storage = require('./core/storage.js');

const AuthScene = require('./scenes/auth.js');
const TitleScene = require('./scenes/title.js');
const DifficultyScene = require('./scenes/difficulty.js');
const StoryScene = require('./scenes/story.js');
const StageScene = require('./scenes/stage.js');
const GameOverScene = require('./scenes/gameover.js');
const StageClearScene = require('./scenes/stageclear.js');
const FakeEndingScene = require('./scenes/fakeending.js');
const LoadingScene = require('./scenes/loading.js');
const DebugStageScene = require('./scenes/debugstage.js');
const TrueEndingScene = require('./scenes/trueending.js');
const MpNameScene = require('./scenes/mpname.js');
const MpRoomScene = require('./scenes/mproom.js');
const AchievementScene = require('./scenes/achievements.js');
const AdScene = require('./scenes/ad.js');

class Game {
  constructor() {
    this.designW = 720;
    this.designH = 1280;
    this.canvas = platform.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    const info = platform.getSystemInfoSync();
    this.windowWidth = info.windowWidth;
    this.windowHeight = info.windowHeight;
    this.scale = Math.min(this.windowWidth / this.designW, this.windowHeight / this.designH);
    this.offsetX = (this.windowWidth - this.designW * this.scale) / 2;
    this.offsetY = (this.windowHeight - this.designH * this.scale) / 2;
    this.input = new Input(this);
    this.audio = new AudioManager();
    this.artBank = new ArtBank();
    this.audio.loadBgms();
    this.sceneManager = new SceneManager(this);
    this.lastTime = 0;
    this.running = false;

    this.sceneManager.register('auth', new AuthScene(this));
    this.sceneManager.register('title', new TitleScene(this));
    this.sceneManager.register('difficulty', new DifficultyScene(this));
    this.sceneManager.register('story', new StoryScene(this));
    this.sceneManager.register('stage', new StageScene(this));
    this.sceneManager.register('gameover', new GameOverScene(this));
    this.sceneManager.register('stageclear', new StageClearScene(this));
    this.sceneManager.register('fakeending', new FakeEndingScene(this));
    this.sceneManager.register('loading', new LoadingScene(this));
    this.sceneManager.register('debugstage', new DebugStageScene(this));
    this.sceneManager.register('trueending', new TrueEndingScene(this));
    this.sceneManager.register('mpname', new MpNameScene(this));
    this.sceneManager.register('mproom', new MpRoomScene(this));
    this.sceneManager.register('achievement', new AchievementScene(this));
    this.sceneManager.register('ad', new AdScene(this));

    if (typeof window !== 'undefined') {
      window.__cloudspireGame = this;
    }
  }

  toDesign(clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale,
    };
  }

  go(name, params) {
    this.sceneManager.go(name, params);
  }

  toTitle() {
    this.go('title');
  }

  start() {
    if (!this.canvas || !this.ctx) return;
    this.input.onAnyTap = () => this.audio.unlock();
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.audio.tick(1);
      });
    }
    this.input.start();
    const auth = storage.loadAuth();
    this.go('loading');
    this.running = true;
    this.lastTime = Date.now();
    this.tick();
  }

  tick() {
    if (!this.running) return;
    const now = Date.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.tick());
  }

  update(dt) {
    if (this.audio && this.audio.tick) this.audio.tick(dt);
    this.sceneManager.update(dt);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.designW, this.designH);
    ctx.clip();
    this.sceneManager.render(ctx);
    ctx.restore();
  }
}

module.exports = {
  Game,
};

  });
  register("src/net/multiplayer.js", function (module, exports, require) {
class Multiplayer {
  constructor() {
    this.conn = null;
    this.sendRaw = null;
    this.roomId = null;
    this.playerIndex = 0;
    this.name = '';
    this.peerName = '';
    this.seed = 0;
    this.url = '';
    this.onMessage = null;
    this.onClose = null;
    this.clockOffsetMs = 0;
    this.smoothedRttMs = 60;
    this._pingTimer = null;
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
  }

  connect(url) {
    return new Promise((resolve, reject) => {
      this.url = url;
      let settled = false;
      const fail = (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.onClose) this.onClose();
        reject(e || new Error('连接失败'));
      };
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => fail(new Error('连接超时')), 6000);
      const wxApi = typeof wx !== 'undefined' ? wx : null;
      if (wxApi && wxApi.connectSocket) {
        const task = wxApi.connectSocket({ url, fail: (e) => fail(e) });
        task.onOpen(() => {
          this.conn = task;
          this.sendRaw = (s) => task.send({ data: s });
          done();
          this._beginClockSync();
        });
        task.onMessage((res) => this.dispatch(res.data));
        task.onClose(() => fail(new Error('连接已断开')));
        task.onError((e) => fail(e));
        return;
      }
      if (typeof WebSocket === 'undefined') {
        fail(new Error('WebSocket 不可用'));
        return;
      }
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.conn = ws;
        this.sendRaw = (s) => ws.send(s);
        done();
        this._beginClockSync();
      };
      ws.onmessage = (e) => this.dispatch(e.data);
      ws.onclose = () => fail(new Error('连接已断开'));
      ws.onerror = () => fail(new Error('连接失败'));
    });
  }

  _beginClockSync() {
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
    const sample = () => {
      this._pingCount += 1;
      this.send({ type: 'ping', t: Date.now() });
      this._pingTimer = setTimeout(sample, this._pingCount < 3 ? 200 : 1000);
    };
    sample();
  }

  send(obj) {
    if (this.sendRaw) this.sendRaw(JSON.stringify(obj));
  }

  dispatch(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (msg.type === 'pong') {
      const sentAt = typeof msg.t === 'number' ? msg.t : 0;
      const serverTime = typeof msg.serverTime === 'number' ? msg.serverTime : Date.now();
      if (sentAt > 0) {
        const recvAt = Date.now();
        const offset = serverTime - (sentAt + recvAt) / 2;
        const rtt = recvAt - sentAt;
        this._pingSamples.push(offset);
        this._rttSamples.push(rtt);
        if (this._pingSamples.length > 5) this._pingSamples.shift();
        if (this._rttSamples.length > 5) this._rttSamples.shift();
        let sum = 0;
        for (const s of this._pingSamples) sum += s;
        this.clockOffsetMs = Math.round(sum / this._pingSamples.length);
        let rttSum = 0;
        for (const r of this._rttSamples) rttSum += r;
        this.smoothedRttMs = Math.max(4, Math.round(rttSum / this._rttSamples.length));
      }
    } else if (msg.type === 'created') {
      this.roomId = msg.roomId;
      this.playerIndex = msg.playerIndex || 1;
    } else if (msg.type === 'joined') {
      this.roomId = msg.roomId;
      this.playerIndex = msg.playerIndex || 2;
      this.peerName = msg.hostName || '';
    } else if (msg.type === 'peerJoined') {
      this.peerName = msg.name || '';
    } else if (msg.type === 'pkForfeit') {
      if (msg.host) this.playerIndex = 1;
    } else if (msg.type === 'start' || msg.type === 'difficulty') {
      this.seed = msg.seed || 0;
    }
    if (this.onMessage) this.onMessage(msg);
  }

  create(name) {
    this.name = name || '';
    this.send({ type: 'create', name: this.name });
  }

  join(roomId, name) {
    this.name = name || '';
    this.send({ type: 'join', roomId: String(roomId || ''), name: this.name });
  }

  start() {
    this.send({ type: 'start' });
  }

  selectDifficulty(difficulty) {
    this.send({ type: 'selectDifficulty', difficulty });
  }

  sendIntent(frame, move, bomb, stageId) {
    this.send({
      type: 'input',
      frame: Number(frame) || 0,
      move: move || null,
      bomb: !!bomb,
      stage: stageId || 0,
    });
  }

  sendPkForfeit() {
      this.send({ type: 'pkForfeit' });
    }


  sendPkState(state) {
      this.send({
        type: 'pkState',
        score: Number(state.score) || 0,
        stage: Number(state.stage) || 1,
        lives: Number(state.lives) || 0,
        hp: Number(state.hp) || 0,
        maxHp: Number(state.maxHp) || 100,
        over: !!state.over,
      });
    }

    sendPkFinished(score, stage, cleared) {
      this.send({ type: 'pkFinished', score: Number(score) || 0, stage: Number(stage) || 1, cleared: !!cleared });
    }

    sendPkWatch(on) {
      this.send({ type: 'pkWatchOn', on: !!on });
    }

    sendPkFrame(data) {
      this.send({ type: 'pkFrame', data: String(data || '') });
    }


  sendInput(move) {
    this.sendIntent(0, move, false, 0);
  }

  gameover() {
    this.send({ type: 'gameover' });
  }

  close() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
      this._pingTimer = null;
    }
    this._pingCount = 0;
    this._pingSamples = [];
    this._rttSamples = [];
    this.clockOffsetMs = 0;
    this.smoothedRttMs = 60;
    if (this.conn) {
      try {
        if (typeof this.conn.close === 'function') this.conn.close();
        else this.conn.close({});
      } catch (e) {}
    }
    this.conn = null;
    this.sendRaw = null;
    this.roomId = null;
    this.playerIndex = 0;
    this.peerName = '';
  }
}

module.exports = new Multiplayer();

  });
  register("src/scenes/achievements.js", function (module, exports, require) {
const achievements = require('../core/achievements.js');
const { drawButton, drawInkTitle } = require('../ui/menu.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const CARD_X = 70;
const CARD_W = 580;
const CARD_H = 150;
const CARD_YS = [270, 450, 630, 810];

const CARD_ACCENTS = ['#ffd36b', '#8fd8ff', '#ffb45e', '#c9a0ff'];

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawLock(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(220,232,255,0.55)';
  ctx.fillStyle = 'rgba(220,232,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -4, 5, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(-7, -3, 14, 11);
  ctx.restore();
}

class AchievementScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    this.time = 0;
    this.game.audio.playTitleBgm();
  }

  update(dt) {
    this.time += dt;
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.game.audio.pickup();
      this.game.go('title');
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.5, '#1b2440');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    drawInkTitle(ctx, '成就', 360, 150, 56);

    const unlocked = achievements.countUnlocked();
    const total = achievements.DEFINITIONS.length;
    ctx.textAlign = 'center';
    ctx.fillStyle = unlocked === total ? '#9fe8b8' : 'rgba(220,232,255,0.75)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`已达成 ${unlocked} / ${total}`, 360, 220);

    achievements.DEFINITIONS.forEach((def, index) => {
      const done = achievements.isUnlocked(def.id);
      const x = CARD_X;
      const y = CARD_YS[index];
      const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

      ctx.save();
      ctx.globalAlpha = done ? 1 : 0.6;
      ctx.fillStyle = done ? 'rgba(16,28,48,0.9)' : 'rgba(12,18,32,0.82)';
      ctx.strokeStyle = done ? accent : 'rgba(220,232,255,0.45)';
      ctx.lineWidth = done ? 2 : 1.2;
      roundedRect(ctx, x, y, CARD_W, CARD_H, 14);
      ctx.fill();
      ctx.stroke();

      const iconCx = x + 46;
      const iconCy = y + CARD_H / 2;
      if (done) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', iconCx, iconCy + 9);
      } else {
        ctx.strokeStyle = 'rgba(220,232,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, 22, 0, Math.PI * 2);
        ctx.stroke();
        drawLock(ctx, iconCx, iconCy);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = done ? '#fff3d6' : 'rgba(220,232,255,0.85)';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(def.title, x + 92, y + 62);

      ctx.fillStyle = done ? 'rgba(210,226,255,0.85)' : 'rgba(200,212,235,0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText(def.desc, x + 92, y + 106);

      ctx.textAlign = 'right';
      ctx.fillStyle = done ? '#9fe8b8' : 'rgba(220,232,255,0.45)';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(done ? '已达成' : '未达成', x + CARD_W - 24, y + CARD_H / 2 + 7);
      ctx.restore();
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,232,255,0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('达成条件后自动解锁', 360, 1010);
    ctx.textAlign = 'left';

    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });
  }
}

module.exports = AchievementScene;


  });
  register("src/scenes/ad.js", function (module, exports, require) {
const { drawButton } = require('../ui/menu.js');

const CONTINUE_RECT = { x: 210, y: 1060, w: 300, h: 64 };

const AD_LINES = [
  '云阙商城 · 星海补给站',
  '舰载武器限时 8 折',
  '扫码领取新机师礼包',
];

class AdScene {
  constructor(game) {
    this.game = game;
    this.duration = 15;
    this.timer = 15;
    this.done = false;
    this.time = 0;
    this.onDone = null;
  }

  enter(params) {
    const opts = params || {};
    this.duration = Math.max(1, opts.duration || 15);
    this.timer = this.duration;
    this.done = false;
    this.time = 0;
    this.onDone = typeof opts.onDone === 'function' ? opts.onDone : null;
    this.headline = opts.headline || '广告';
  }

  update(dt) {
    this.time += dt;
    if (!this.done) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
        this.done = true;
      }
      return;
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, CONTINUE_RECT)) {
      this.game.audio.pickup();
      if (this.onDone) {
        const done = this.onDone;
        this.onDone = null;
        done();
      } else {
        this.game.go('title');
      }
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#1a1030');
    sky.addColorStop(0.55, '#3a1f52');
    sky.addColorStop(1, '#120b20');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.fillStyle = 'rgba(255,220,120,0.16)';
    for (let i = 0; i < 5; i += 1) {
      const x = (i * 173 + 60) % 720;
      const y = (i * 257 + 80) % 1280;
      ctx.beginPath();
      ctx.arc(x, y, 42 + i * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd36b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('广告', 360, 150);
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 44px "STKaiti","KaiTi","SimSun",serif';
    ctx.fillText('云阙飞戈 · 星海补给站', 360, 260);

    ctx.fillStyle = '#f2e7ff';
    ctx.font = 'bold 26px sans-serif';
    AD_LINES.forEach((line, index) => {
      ctx.fillText(line, 360, 400 + index * 52);
    });

    const seconds = Math.max(0, Math.ceil(this.timer));
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(this.done ? '广告播放完毕' : `广告剩余 ${seconds} 秒`, 360, 640);

    const barX = 170;
    const barW = 380;
    const progress = this.done ? 1 : 1 - this.timer / this.duration;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(barX, 680, barW, 12);
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(barX, 680, barW * Math.max(0, Math.min(1, progress)), 12);

    if (this.done) {
      drawButton(ctx, CONTINUE_RECT, '继续', { font: 'bold 26px sans-serif', pulse: 0.2 + 0.1 * Math.sin(this.time * 2), accent: 'rgba(140,220,255,0.9)' });
    } else {
      ctx.fillStyle = 'rgba(220,232,255,0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText('（模拟广告 · 观看完成后即可继续）', 360, 820);
    }
    ctx.textAlign = 'left';
  }
}

module.exports = AdScene;

  });
  register("src/scenes/auth.js", function (module, exports, require) {
const storage = require('../core/storage.js');
const platform = require('../core/platform.js');
const { validateAuth } = require('../utils/idcard.js');
const { drawButton, drawPanel } = require('../ui/menu.js');

const NAME_RECT = { x: 170, y: 520, w: 380, h: 68 };
const ID_RECT = { x: 170, y: 640, w: 380, h: 68 };
const SUBMIT_RECT = { x: 230, y: 800, w: 260, h: 64 };

class AuthScene {
  constructor(game) {
    this.game = game;
    this.name = '';
    this.id = '';
    this.activeField = null;
    this.error = '';
    this.handlers = null;
  }

  enter() {
    this.game.audio.stopBgm();
    const auth = storage.loadAuth();
    if (auth && auth.verified) {
      this.game.go('title');
      return;
    }
    this.name = '';
    this.id = '';
    this.error = '';
    this.activeField = null;
    this.bindKeyboard();
  }

  exit() {
    platform.hideKeyboard();
    this.unbindKeyboard();
  }

  bindKeyboard() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi || this.handlers) return;
    this.handlers = {
      input: (res) => {
        if (this.activeField === 'name') this.name = (res.value || '').slice(0, 20);
        if (this.activeField === 'id') this.id = (res.value || '').toUpperCase().slice(0, 18);
      },
      confirm: () => {
        platform.hideKeyboard();
        this.activeField = null;
        this.submit();
      },
      complete: () => {
        this.activeField = null;
      },
    };
    if (wxApi.onKeyboardInput) wxApi.onKeyboardInput(this.handlers.input);
    if (wxApi.onKeyboardConfirm) wxApi.onKeyboardConfirm(this.handlers.confirm);
    if (wxApi.onKeyboardComplete) wxApi.onKeyboardComplete(this.handlers.complete);
  }

  unbindKeyboard() {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (!wxApi || !this.handlers) return;
    if (wxApi.offKeyboardInput) wxApi.offKeyboardInput(this.handlers.input);
    if (wxApi.offKeyboardConfirm) wxApi.offKeyboardConfirm(this.handlers.confirm);
    if (wxApi.offKeyboardComplete) wxApi.offKeyboardComplete(this.handlers.complete);
    this.handlers = null;
  }

  showKeyboard(value, maxLength) {
    platform.showKeyboard({
      defaultValue: value,
      maxLength,
      multiple: false,
      confirmHold: false,
      confirmType: 'done',
    });
  }

  submit() {
    const result = validateAuth(this.name, this.id);
    if (!result.ok) {
      this.error = result.reason;
      return;
    }
    storage.saveAuth({ verified: true, verifiedAt: Date.now(), name: result.name });
    this.game.audio.pickup();
    this.game.go('title');
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, NAME_RECT)) {
      this.activeField = 'name';
      this.error = '';
      this.showKeyboard(this.name, 20);
      return;
    }
    if (this.inRect(tap, ID_RECT)) {
      this.activeField = 'id';
      this.error = '';
      this.showKeyboard(this.id, 18);
      return;
    }
    if (this.inRect(tap, SUBMIT_RECT)) {
      platform.hideKeyboard();
      this.activeField = null;
      this.submit();
      return;
    }
    platform.hideKeyboard();
    this.activeField = null;
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#101b33');
    sky.addColorStop(0.55, '#1d2c4d');
    sky.addColorStop(1, '#35435f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#dce8ff';
    for (let i = 0; i < 16; i += 1) {
      const x = (i * 97) % 720;
      const y = (i * 173) % 1280;
      ctx.beginPath();
      ctx.ellipse(x, y, 46 + i * 5, 16 + i * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#f7e9c9';
    ctx.font = 'bold 58px "STKaiti","KaiTi","SimSun",serif';
    ctx.textAlign = 'center';
    ctx.fillText('实名认证', 360, 300);
    ctx.fillStyle = 'rgba(240,244,255,0.75)';
    ctx.font = '18px sans-serif';
    ctx.fillText('年满18岁方可进入云阙', 360, 350);

    drawPanel(ctx, { x: 110, y: 440, w: 500, h: 470 });
    ctx.fillStyle = '#eef3ff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('姓名', 170, 495);
    ctx.fillText('身份证号', 170, 615);
    ctx.strokeStyle = this.activeField === 'name' ? '#ffd36b' : 'rgba(220,232,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(NAME_RECT.x, NAME_RECT.y, NAME_RECT.w, NAME_RECT.h);
    ctx.strokeStyle = this.activeField === 'id' ? '#ffd36b' : 'rgba(220,232,255,0.7)';
    ctx.strokeRect(ID_RECT.x, ID_RECT.y, ID_RECT.w, ID_RECT.h);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText(this.name || (this.activeField === 'name' ? '请输入姓名' : '点击输入姓名'), NAME_RECT.x + 16, NAME_RECT.y + 43);
    ctx.fillText(this.id || (this.activeField === 'id' ? '请输入18位身份证号' : '点击输入身份证号'), ID_RECT.x + 16, ID_RECT.y + 43);

    if (this.error) {
      ctx.fillStyle = '#ff9dab';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.error, 360, 790);
      ctx.textAlign = 'left';
    }

    drawButton(ctx, SUBMIT_RECT, '进入云阙', { active: true });
  }
}

module.exports = AuthScene;

  });
  register("src/scenes/debugstage.js", function (module, exports, require) {
const { DIFFICULTIES, ORDER } = require('../config/difficulty.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const { clamp } = require('../utils/math.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const START_RECT = { x: 210, y: 1120, w: 300, h: 64 };
const DIFF_RECTS = ORDER.map((id, index) => ({
  id,
  rect: { x: 60 + index * 150, y: 300, w: 140, h: 64 },
}));
const STAGE_RECTS = [1, 2, 3, 4].map((stage) => ({
  stage,
  rect: { x: 150 + (stage - 1) * 105, y: 440, w: 90, h: 64 },
}));
const LV_MINUS = { x: 180, y: 580, w: 70, h: 56 };
const LV_PLUS = { x: 470, y: 580, w: 70, h: 56 };
const BOMB_MINUS = { x: 180, y: 700, w: 70, h: 56 };
const BOMB_PLUS = { x: 470, y: 700, w: 70, h: 56 };
const INV_RECT = { x: 210, y: 830, w: 300, h: 64 };

class DebugStageScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    this.difficulty = 'easy';
    this.stage = 1;
    this.level = 1;
    this.bombs = 3;
    this.invincible = false;
    this.time = 0;
    this.game.audio.playTitleBgm();
  }

  stageMax() {
    return DIFFICULTIES[this.difficulty].stageCount;
  }

  update(dt) {
    this.time += dt;
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.game.audio.pickup();
      this.game.go('title');
      return;
    }
    if (this.inRect(tap, START_RECT)) {
      this.game.audio.pickup();
      const maxHp = 100 + 12 * (this.level - 1);
      this.game.go('stage', {
        mode: 'new',
        difficulty: this.difficulty,
        stage: this.stage,
        invincible: this.invincible,
        noSave: true,
        debugStage: true,
        progress: {
          level: this.level,
          exp: 0,
          expTotal: 0,
          bombs: this.bombs,
          lives: 3,
          invincible: this.invincible,
          hp: maxHp,
          maxHp,
          score: 0,
          claimedExtras: [],
        },
      });
      return;
    }
    for (const diff of DIFF_RECTS) {
      if (this.inRect(tap, diff.rect)) {
        this.difficulty = diff.id;
        this.stage = Math.min(this.stage, this.stageMax());
        this.game.audio.pickup();
        return;
      }
    }
    for (const st of STAGE_RECTS) {
      if (st.stage <= this.stageMax() && this.inRect(tap, st.rect)) {
        this.stage = st.stage;
        this.game.audio.pickup();
        return;
      }
    }
    if (this.inRect(tap, LV_MINUS)) {
      this.level = clamp(this.level - 1, 1, 26);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, LV_PLUS)) {
      this.level = clamp(this.level + 1, 1, 26);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, BOMB_MINUS)) {
      this.bombs = clamp(this.bombs - 1, 0, 5);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, BOMB_PLUS)) {
      this.bombs = clamp(this.bombs + 1, 0, 5);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, INV_RECT)) {
      this.invincible = !this.invincible;
      this.game.audio.pickup();
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.6, '#16233a');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    drawInkTitle(ctx, '内测跳关', 360, 150, 54);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,232,255,0.75)';
    ctx.font = '18px sans-serif';
    ctx.fillText('选择难度 / 关卡 / 初始状态', 360, 215);

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('难度', 360, 275);
    for (const diff of DIFF_RECTS) {
      drawButton(ctx, diff.rect, DIFFICULTIES[diff.id].label, {
        font: 'bold 20px sans-serif',
        active: this.difficulty === diff.id,
        accent: this.difficulty === diff.id ? 'rgba(255,211,107,0.9)' : undefined,
      });
    }

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('关卡', 360, 415);
    for (const st of STAGE_RECTS) {
      const locked = st.stage > this.stageMax();
      drawButton(ctx, st.rect, String(st.stage), {
        font: 'bold 22px sans-serif',
        active: !locked && this.stage === st.stage,
        fill: locked ? 'rgba(20,28,44,0.35)' : undefined,
        frame: locked ? 'rgba(220,232,255,0.25)' : undefined,
        color: locked ? 'rgba(220,232,255,0.35)' : undefined,
      });
    }

    this.drawStepper(ctx, '自机等级', this.level, 26, LV_MINUS, LV_PLUS, 555);
    this.drawStepper(ctx, '炸弹数', this.bombs, 5, BOMB_MINUS, BOMB_PLUS, 675);

    drawButton(ctx, INV_RECT, `无敌模式：${this.invincible ? '开' : '关'}`, {
      font: 'bold 22px sans-serif',
      active: this.invincible,
      accent: this.invincible ? 'rgba(140,255,190,0.9)' : undefined,
      glowColor: '#7dffc0',
    });
    ctx.fillStyle = 'rgba(255,179,161,0.9)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('此模式无法保存进度', 360, 925);
    if (this.invincible) {
      ctx.fillStyle = 'rgba(157,255,200,0.85)';
      ctx.font = '16px sans-serif';
      ctx.fillText('炸弹无限 · 残机无限', 360, 945);
    }

    drawButton(ctx, START_RECT, '开始作战', {
      font: 'bold 26px sans-serif',
      pulse: 0.15 + 0.1 * Math.sin(this.time * 1.8),
      accent: 'rgba(255,120,140,0.9)',
    });
    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });
  }

  drawStepper(ctx, label, value, max, minusRect, plusRect, labelY) {
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 360, labelY);
    drawButton(ctx, minusRect, '-', { font: 'bold 26px sans-serif' });
    drawButton(ctx, plusRect, '+', { font: 'bold 26px sans-serif' });
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`${value} / ${max}`, 360, labelY + 52);
  }
}

module.exports = DebugStageScene;

  });
  register("src/scenes/difficulty.js", function (module, exports, require) {
const { DIFFICULTIES, ORDER } = require('../config/difficulty.js');
const net = require('../net/multiplayer.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const AmbientField = require('../ui/ambient.js');
const { clamp, easeOutCubic } = require('../utils/math.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const BOOST_PANEL = { x: 90, y: 470, w: 540, h: 360 };
const BOOST_YES = { x: 150, y: 730, w: 190, h: 60 };
const BOOST_NO = { x: 380, y: 730, w: 190, h: 60 };

const DIFF_PALETTE = {
  skyTop: [7, 18, 32],
  skyMid: [18, 44, 64],
  skyLow: [8, 20, 34],
  starColor: [220, 236, 255],
  cloudColor: [180, 220, 235],
  mountains: [
    [22, 44, 62],
    [14, 30, 46],
    [8, 17, 28],
  ],
  accent: [120, 210, 255],
  haze: [196, 228, 255],
};

const DIFF_PALETTE_ALT = {
  skyTop: [24, 22, 44],
  skyMid: [48, 64, 88],
  skyLow: [18, 24, 42],
  starColor: [232, 226, 255],
  cloudColor: [208, 216, 240],
  mountains: [
    [34, 40, 68],
    [22, 28, 52],
    [12, 16, 30],
  ],
  accent: [255, 190, 120],
  haze: [218, 222, 255],
};

const CARD_THEMES = {
  easy: {
    accent: '#7fd8c4',
    tagline: '巡境前哨',
    desc: '敌机稀疏、弹幕平缓，适合熟悉天空',
    stages: [1, null, null, null],
    badge: null,
  },
  normal: {
    accent: '#7fb4ff',
    tagline: '主力突袭',
    desc: '敌机更快更硬，弹幕开始织成罗网',
    stages: [1, 2, null, null],
    badge: '推荐',
  },
  hard: {
    accent: '#ffb45e',
    tagline: '全面战争',
    desc: '敌机密集、弹幕交叉，考验极限闪避',
    stages: [1, 2, 3, null],
    badge: null,
  },
  insane: {
    accent: '#ff5f78',
    tagline: '云阙禁忌',
    desc: '隐藏路线与未知敌影，通关后显现',
    stages: [1, 2, 3, 4],
    badge: '???',
  },
};

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

class DifficultyScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.invincible = false;
    this.ambient = new AmbientField({
      palette: DIFF_PALETTE,
      paletteAlt: DIFF_PALETTE_ALT,
      fighterCount: 2,
      moon: null,
    });
    this.cards = ORDER.map((id, index) => ({
      id,
      config: DIFFICULTIES[id],
      theme: CARD_THEMES[id] || { accent: '#9fb8ff', tagline: '', desc: '', stages: [], badge: null },
      rect: { x: 90, y: 280 + index * 200, w: 540, h: 170 },
    }));
    this.boostPrompt = false;
    this.boostCard = null;
    this.boostTime = 0;
  }

  enter(params) {
      this.pendingStart = false;
      this.pendingStartAt = 0;
      this.pendingStageParams = null;
      this.invincible = !!(params && params.invincible);
      this.challenge = !!(params && params.challenge);
      this.coop = !!(params && params.coop);
      this.pk = !!(params && params.pk);
      this.coopPlayerIndex = net.playerIndex || 1;
      this.waiting = false;
      this.boostPrompt = false;
      this.boostCard = null;
      this.boostTime = 0;
      this.game.audio.playTitleBgm();
      this.time = 0;
      this.ambient.time = 0;
      if (this.coop) {
        net.onMessage = (msg) => {
          if (msg.type === 'difficulty') {
            const startAt = typeof msg.startAt === 'number' ? msg.startAt : Date.now() + 500;
            this.pendingStartAt = startAt + (net.clockOffsetMs || 0);
            this.pendingStageParams = {
              mode: 'new',
              difficulty: msg.difficulty,
              stage: 1,
              coop: true,
              pk: this.pk,
              roomId: net.roomId,
              playerIndex: net.playerIndex,
              seed: msg.seed,
              startAtLocal: this.pendingStartAt,
              hostName: msg.hostName,
              guestName: msg.guestName,
            };
            this.pendingStart = true;
          }
        };
      }
    }

  update(dt) {
      this.time += dt;
      this.ambient.update(dt);
      if (this.coop && this.pendingStart) {
        if (Date.now() >= this.pendingStartAt) {
          const params = this.pendingStageParams;
          this.pendingStart = false;
          this.pendingStageParams = null;
          this.game.go('stage', params);
        }
        return;
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.boostPrompt) {
        if (this.inRect(tap, BOOST_YES)) {
          this.boostPrompt = false;
          this.startBoosted();
        } else if (this.inRect(tap, BOOST_NO)) {
          this.boostPrompt = false;
          this.startPlain();
        }
        return;
      }
      if (this.inRect(tap, BACK_RECT)) {
        if (this.coop) {
          this.pendingStart = false;
          this.pendingStageParams = null;
          net.onMessage = null;
          net.close();
        }
        this.game.go('title');
        return;
      }
      for (const card of this.cards) {
        if (this.inRect(tap, card.rect)) {
          if (this.coop) {
            if (this.coopPlayerIndex === 1) {
              this.game.audio.pickup();
              this.waiting = true;
              net.selectDifficulty(card.id);
            }
            return;
          }
          this.game.audio.pickup();
          this.boostCard = card;
          this.boostTime = this.time;
          this.boostPrompt = true;
          return;
        }
      }
    }

  startBoosted() {
    const card = this.boostCard;
    const self = this;
    this.game.go('ad', {
      duration: 15,
      headline: '战机升级',
      onDone: () => {
        self.goStory(card, true);
      },
    });
  }

  startPlain() {
    this.goStory(this.boostCard, false);
  }

  goStory(card, boost) {
    this.game.go('story', {
      difficulty: card.id,
      stage: 1,
      invincible: this.invincible,
      challenge: this.challenge,
      boost: !!boost,
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    this.ambient.render(ctx);

    drawInkTitle(ctx, '选择作战难度', 360, 145, 52);
    ctx.fillStyle = 'rgba(220,232,255,0.8)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('难度越高，敌人更快、更硬、弹幕更密', 360, 205);
    if (this.invincible) {
      ctx.fillStyle = '#9dffc8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('无敌模式 · 生命无限', 360, 232);
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('此模式不会保存游戏进度', 360, 256);
    }
    if (this.challenge) {
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('挑战模式 · 广告复活限 2 次', 360, 232);
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('无法保存进度', 360, 256);
    }
    if (this.coop) {
      ctx.fillStyle = '#9fd8ff';
      ctx.font = 'bold 18px sans-serif';
      let coopLabel = '';
      if (this.pendingStart) {
        coopLabel = `即将开始 · ${Math.max(1, Math.ceil((this.pendingStartAt - Date.now()) / 1000))}`;
      } else if (this.coopPlayerIndex === 1) {
        coopLabel = this.waiting ? '已选择难度，等待开始…' : (this.pk ? 'PK 模式 · 由你选择难度' : '联机模式 · 由你选择难度');
      } else {
        coopLabel = this.pk ? 'PK 模式 · 等待房主选择难度…' : '联机模式 · 等待房主选择难度…';
      }
      ctx.fillText(coopLabel, 360, 232);
    }

    const lineY = 226;
    ctx.strokeStyle = 'rgba(127,180,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(230, lineY);
    ctx.lineTo(490, lineY);
    ctx.stroke();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.arc(360 + Math.sin(this.time * 1.6) * 95, lineY, 3, 0, Math.PI * 2);
    ctx.fill();

    for (const [index, card] of this.cards.entries()) {
      const delay = 0.18 * index;
      const t = easeOutCubic(clamp((this.time - delay) * 1.25, 0, 1));
      const scale = 0.94 + 0.06 * easeOutCubic(clamp((this.time - delay) * 1.0, 0, 1));
      const offsetY = (1 - t) * 70;
      this.drawCard(ctx, card, index, t, offsetY, scale);
    }

    ctx.fillStyle = '#dce6ff';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(this.time * 1.3);
    ctx.fillText('点击卡片，进入作战简报', 360, 1116);
    ctx.globalAlpha = 1;

    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });

    if (this.boostPrompt) {
      ctx.fillStyle = 'rgba(4,8,18,0.72)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, BOOST_PANEL);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('是否观看广告升级战机？', 360, 540);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('观看 15 秒广告，本局战机等级 +5', 360, 596);
      ctx.fillText('（含火力、射速与耐久提升）', 360, 630);
      ctx.fillStyle = 'rgba(220,232,255,0.7)';
      ctx.font = '18px sans-serif';
      ctx.fillText('点击否将直接进入游戏', 360, 676);
      drawButton(ctx, BOOST_YES, '观看广告', { accent: 'rgba(255,211,107,0.95)' });
      drawButton(ctx, BOOST_NO, '直接开始', { accent: 'rgba(140,200,255,0.95)' });
      ctx.textAlign = 'left';
    }
  }

  drawCard(ctx, card, index, t, offsetY, scale) {
    const rect = card.rect;
    const theme = card.theme;
    const accent = theme.accent;
    const y = rect.y + offsetY;
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(rect.x + rect.w / 2, y + rect.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(rect.x + rect.w / 2), -(y + rect.h / 2));

    ctx.strokeStyle = accent;
    ctx.globalAlpha = t * (0.12 + 0.06 * Math.sin(this.time * 1.5 + index * 1.3));
    ctx.lineWidth = 8;
    roundedRect(ctx, rect.x - 4, y - 4, rect.w + 8, rect.h + 8, 17);
    ctx.stroke();

    ctx.globalAlpha = t;
    ctx.fillStyle = 'rgba(10,18,34,0.84)';
    ctx.strokeStyle = 'rgba(222,232,255,0.55)';
    ctx.lineWidth = 1.5;
    roundedRect(ctx, rect.x, y, rect.w, rect.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(rect.x + 14, y + 16, 6, rect.h - 32);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(card.config.label, rect.x + 44, y + 58);

    ctx.fillStyle = accent;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(theme.tagline || '', rect.x + 44, y + 92);

    ctx.fillStyle = 'rgba(230,238,255,0.78)';
    ctx.font = '15px sans-serif';
    const descText = theme.desc || card.config.rangeLabel;
    ctx.fillText(descText.slice(0, 9), rect.x + 44, y + 122);
    if (descText.length > 9) {
      ctx.fillText(descText.slice(9, 18), rect.x + 44, y + 144);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '19px sans-serif';
    ctx.fillText(card.config.rangeLabel, rect.x + rect.w - 26, y + 58);

    this.drawStages(ctx, rect, y, theme);

    if (theme.badge) {
      const badgeText = theme.badge;
      const badgeW = 70;
      ctx.textAlign = 'center';
      ctx.fillStyle = badgeText === '推荐' ? 'rgba(255,211,107,0.16)' : 'rgba(255,95,120,0.18)';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      roundedRect(ctx, rect.x + rect.w - 90, y + 14, badgeW, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(badgeText, rect.x + rect.w - 55, y + 35);
    }

    const scanY = y + 16 + ((this.time * 55 + index * 37) % (rect.h - 30));
    ctx.fillStyle = accent;
    ctx.globalAlpha = t * 0.12;
    ctx.fillRect(rect.x + 22, scanY, rect.w - 44, 2);
    ctx.restore();
  }

  drawStages(ctx, rect, y, theme) {
    const chipSize = 46;
    const gap = 14;
    const count = theme.stages.length;
    const total = count * chipSize + (count - 1) * gap;
    let x = rect.x + rect.w - 26 - total;
    ctx.textAlign = 'center';
    for (const stage of theme.stages) {
      const cy = y + 92;
      const cx = x + chipSize / 2;
      ctx.fillStyle = stage === null ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)';
      ctx.strokeStyle = stage === null ? 'rgba(220,232,255,0.2)' : 'rgba(220,232,255,0.4)';
      ctx.lineWidth = 1.2;
      roundedRect(ctx, x, cy - chipSize / 2, chipSize, chipSize, 9);
      ctx.fill();
      ctx.stroke();
      if (stage === null) {
        this.drawLock(ctx, cx, cy);
      } else if (stage === '?') {
        ctx.fillStyle = '#ff7d92';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('?', cx, cy + 7);
      } else {
        const open = stage === 1;
        ctx.fillStyle = open ? theme.accent : 'rgba(220,232,255,0.45)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(String(stage), cx, cy + 7);
      }
      x += chipSize + gap;
    }
  }

  drawLock(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(220,232,255,0.5)';
    ctx.fillStyle = 'rgba(220,232,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -4, 5, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(-7, -3, 14, 11);
    ctx.restore();
  }
}

module.exports = DifficultyScene;

  });
  register("src/scenes/fakeending.js", function (module, exports, require) {
const achievements = require('../core/achievements.js');
const PAGES = [
  {
    key: 'be01',
    text: '天阙主宰的巨型机体在猛烈炮火下轰然崩碎，暗黑装甲四分五裂，遍布全身的红色裂纹接连爆裂，包裹核心的异形大脑支离破碎。无数金属残骸裹挟金色火光，向着云海四处飘散。',
  },
  {
    key: 'be02',
    text: '破碎的异形大脑残块之中，一点刺目的猩红色光点挣脱残骸的束缚。',
  },
  {
    key: 'be03',
    text: '它没有随碎片一同坠落，反而冲破云层，不断向上加速，刺破大气层。',
  },
  {
    key: 'be04',
    text: '向着深邃漆黑的宇宙深空疾驰飞去，越变越小，最后化为天边一道转瞬即逝的暗红流光。',
  },
];

const END_TITLE = '结局A · 虚假的晴空';
const END_SUBTITLE = '它并未消亡，只是将火种送往更遥远的星海。';

const EXTRA_PAGES = [
  { key: 'he00', text: '你驾驶飞戈‑1，毅然调转航向，追入漆黑的宇宙虚空。' },
  { key: 'he00', text: '前方，是未知的星域，被侵染的机械与宇宙残骸，正静静等待着你的到来。' },
];

class FakeEndingScene {
  constructor(game) {
    this.game = game;
    this.images = { be01: null, be02: null, be03: null, be04: null };
    this.ready = false;
    this.page = 0;
    this.chars = 0;
    this.phase = 'story';
    this.timer = 0;
    this.pageFade = 0;
  }

  enter(params) {
    this.params = params || {};
    this.insane = this.params.difficulty === 'insane';
    this.pages = PAGES;
    this.page = 0;
    this.chars = 0;
    this.phase = 'story';
    this.timer = 0;
    this.pageFade = 0;
    this.images = {
      be01: this.game.artBank.get('be01'),
      be02: this.game.artBank.get('be02'),
      be03: this.game.artBank.get('be03'),
      be04: this.game.artBank.get('be04'),
      he00: this.game.artBank.get('he00'),
    };
    this.ready = true;
    if (this.params.difficulty === 'hard') achievements.unlock('hardClear');
  }

  update(dt) {
    if (!this.ready) return;
    if (this.phase === 'story' || this.phase === 'extra') {
      this.pageFade = Math.min(1, this.pageFade + dt / 0.5);
      const pages = this.phase === 'extra' ? EXTRA_PAGES : this.pages;
      const current = pages[this.page];
      if (this.chars < current.text.length) {
        this.chars = Math.min(current.text.length, this.chars + dt * 26);
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.chars < current.text.length) {
        this.chars = current.text.length;
        return;
      }
      if (this.page < pages.length - 1) {
        this.page += 1;
        this.chars = 0;
        this.pageFade = 0;
      } else if (this.phase === 'story') {
        if (this.insane) {
          this.phase = 'black';
          this.timer = 0;
        } else {
          this.phase = 'ending';
          this.timer = 0;
        }
      } else {
        this.game.audio.stopBgm();
        this.game.go('stage', {
          mode: 'new',
          difficulty: 'insane',
          stage: 4,
          progress: this.params.progress,
          invincible: this.params.invincible,
        });
      }
      return;
    }
    if (this.phase === 'black') {
      this.timer += dt;
      if (this.timer >= 1.2) {
        this.phase = 'extra';
        this.page = 0;
        this.chars = 0;
        this.pageFade = 0;
        this.game.audio.stopBgm();
      }
      return;
    }
    this.timer += dt;
    if (this.timer >= 10) {
      this.game.go('title');
    }
  }

  wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  drawImageCover(ctx, img, alpha) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const scale = Math.max(720 / img.width, 1280 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (720 - w) / 2, (1280 - h) / 2, w, h);
    ctx.restore();
  }

  render(ctx) {
    ctx.fillStyle = '#03030a';
    ctx.fillRect(0, 0, 720, 1280);
    if (!this.ready) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('影像载入中…', 360, 640);
      ctx.textAlign = 'left';
      return;
    }
    if (this.phase === 'story' || this.phase === 'extra') {
      const pages = this.phase === 'extra' ? EXTRA_PAGES : this.pages;
      const current = pages[this.page];
      const img = this.images[current.key];
      this.drawImageCover(ctx, img, this.pageFade);
      ctx.fillStyle = `rgba(5,4,12,${(0.42 * this.pageFade).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = 'rgba(6,5,14,0.78)';
      ctx.fillRect(40, 930, 640, 250);
      ctx.strokeStyle = 'rgba(255,220,150,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40.5, 930.5, 639, 249);

      const visible = current.text.slice(0, Math.ceil(this.chars));
      ctx.fillStyle = '#f6ecd4';
      ctx.font = '24px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'left';
      const lines = this.wrapText(ctx, visible, 600);
      lines.forEach((line, index) => {
        ctx.fillText(line, 70, 980 + index * 36);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`点击继续 ${this.page + 1} / ${pages.length}`, 360, 1240);
      ctx.textAlign = 'left';
      return;
    }

    if (this.phase === 'black') {
      const blackAlpha = Math.min(1, this.timer / 0.9);
      ctx.fillStyle = `rgba(0,0,0,${blackAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      return;
    }

    const t = this.timer;
    const whiteAlpha = Math.min(1, Math.max(0, t <= 4 ? t / 2 : 1 - (t - 4) / 2));
    const blackAlpha = Math.min(1, Math.max(0, (t - 4) / 2));
    const titleAlpha = t >= 2 && t < 4.6 ? Math.min(1, (t - 2) / 0.5, (4.6 - t) / 0.5) : 0;
    const subtitleAlpha = t >= 6 ? Math.min(1, (t - 6) / 0.8) : 0;

    ctx.fillStyle = `rgba(255,250,235,${whiteAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (titleAlpha > 0) {
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = '#2a1538';
      ctx.font = 'bold 44px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d8b6ff';
      ctx.shadowBlur = 18;
      ctx.fillText(END_TITLE, 360, 620);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(2,2,6,${blackAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (subtitleAlpha > 0) {
      ctx.globalAlpha = subtitleAlpha;
      ctx.fillStyle = '#cfc4dd';
      ctx.font = '24px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'center';
      ctx.fillText(END_SUBTITLE, 360, 640);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
}

FakeEndingScene.PAGES = PAGES;

module.exports = FakeEndingScene;

  });
  register("src/scenes/gameover.js", function (module, exports, require) {
const { drawButton, drawPanel, drawVignette } = require('../ui/menu.js');

const RETRY_RECT = { x: 170, y: 720, w: 380, h: 64 };
const TITLE_RECT = { x: 170, y: 810, w: 380, h: 64 };

class GameOverScene {
  constructor(game) {
    this.game = game;
    this.params = {};
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.params = params || {};
    this.challenge = !!(params && params.challenge);
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.challenge) {
      if (this.inRect(tap, RETRY_RECT)) this.game.go('title');
      return;
    }
    if (this.inRect(tap, RETRY_RECT)) {
      this.game.go('stage', { mode: 'new', difficulty: this.params.difficulty || 'easy', stage: this.params.stage || 1 });
    } else if (this.inRect(tap, TITLE_RECT)) {
      this.game.go('title');
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, 720, 1280);
    ctx.fillStyle = '#e5486b';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4060';
    ctx.shadowBlur = 24;
    ctx.fillText('GAME OVER', 360, 460);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#dce6ff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score ${String(this.params.score || 0).padStart(7, '0')}`, 360, 540);
    ctx.fillText(`难度 ${String(this.params.difficulty || 'easy').toUpperCase()}`, 360, 590);
    ctx.fillStyle = 'rgba(220,232,255,0.65)';
    ctx.font = '18px sans-serif';
    ctx.fillText(this.challenge ? '挑战失败 · 本局结束' : '境界已经消散，飞戈仍未折返', 360, 650);

    if (this.challenge) {
      drawButton(ctx, RETRY_RECT, 'Title', { color: '#ffb3c1' });
    } else {
      drawButton(ctx, RETRY_RECT, 'Retry Stage');
      drawButton(ctx, TITLE_RECT, 'Title');
    }
    drawVignette(ctx);
  }
}

module.exports = GameOverScene;

  });
  register("src/scenes/loading.js", function (module, exports, require) {
const { drawButton, drawLogo } = require('../ui/menu.js');

const ENTER_RECT = { x: 230, y: 820, w: 260, h: 64 };

class LoadingScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.ready = false;
    this.progress = 0;
    this.imgLoaded = 0;
    this.imgTotal = 0;
    this.audioLoaded = 0;
    this.audioTotal = 0;
  }

  enter() {
    this.time = 0;
    this.ready = false;
    this.progress = 0;
    this.imgLoaded = 0;
    this.imgTotal = 0;
    this.audioLoaded = 0;
    this.audioTotal = 0;
    this.game.artBank.load((p) => {
      this.imgLoaded = p.loaded;
      this.imgTotal = p.total;
      if (!this.ready) this.updateProgress();
    }).then(() => {
      this.ready = true;
      this.progress = 1;
    });
    this.game.audio.loadAll((p) => {
      this.audioLoaded = p.loaded;
      this.audioTotal = p.total;
      if (!this.ready) this.updateProgress();
    });
  }

  updateProgress() {
    const total = this.imgTotal + this.audioTotal;
    if (total <= 0) return;
    const loaded = this.imgLoaded + this.audioLoaded;
    this.progress = Math.min(0.999, loaded / total);
  }

  update(dt) {
    this.time += dt;
    const tap = this.game.input.consumeTap();
    if (!tap || !this.ready) return;
    if (!this.inRect(tap, ENTER_RECT)) return;
    this.game.audio.unlock();
    this.game.go('auth');
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1020');
    sky.addColorStop(0.55, '#16243d');
    sky.addColorStop(1, '#0b111f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#e9f0ff';
    for (let i = 0; i < 22; i += 1) {
      const x = (i * 149 + this.time * 4) % 720;
      const y = (i * 211) % 1280;
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawLogo(ctx, 360, 330, { time: this.time, float: true, wings: true, glow: 16 });

    ctx.fillStyle = 'rgba(220,232,255,0.72)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('正在装载云海兵器库…', 360, 470);
    ctx.textAlign = 'left';

    const barX = 90;
    const barY = 720;
    const barW = 540;
    const barH = 18;
    ctx.fillStyle = 'rgba(10,18,34,0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(barX, barY, barW * this.progress, barH);
    ctx.strokeStyle = 'rgba(255,211,107,0.65)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX + 0.75, barY + 0.75, barW - 1.5, barH - 1.5);

    ctx.fillStyle = '#fff3cf';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(this.progress * 100)}%`, 360, 700);

    if (this.ready) {
      drawButton(ctx, ENTER_RECT, '点击进入', {
        pulse: 0.3 + 0.2 * Math.sin(this.time * 2.2),
        accent: 'rgba(255,211,107,0.95)',
        glowColor: '#ffd36b',
      });
    }
    ctx.textAlign = 'left';
  }
}

module.exports = LoadingScene;

  });
  register("src/scenes/mpname.js", function (module, exports, require) {
const platform = require('../core/platform.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');

const NAME_RECT = { x: 160, y: 520, w: 400, h: 72 };
const CONFIRM_RECT = { x: 210, y: 680, w: 300, h: 64 };
const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };

class MpNameScene {
  constructor(game) {
    this.game = game;
    this.name = '';
  }

  enter() {
    this.name = '';
    this.game.audio.playTitleBgm();
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, NAME_RECT)) {
      this.openKeyboard();
      return;
    }
    if (this.inRect(tap, CONFIRM_RECT)) {
      if (this.name.trim()) {
        this.game.audio.pickup();
        this.game.go('mproom', { name: this.name.trim() });
      }
      return;
    }
    if (this.inRect(tap, BACK_RECT)) {
      this.game.go('title');
    }
  }

  openKeyboard() {
    platform.showKeyboard({
      defaultValue: this.name,
      maxLength: 12,
      confirmType: 'done',
      onConfirm: (res) => {
        this.name = (res && res.value) || '';
        platform.hideKeyboard();
      },
      onComplete: (res) => {
        const v = res && res.value !== undefined ? res.value : '';
        if (v) this.name = v;
        platform.hideKeyboard();
      },
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.6, '#1a2540');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    drawInkTitle(ctx, 'Local PK', 360, 220, 52);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,232,255,0.8)';
    ctx.font = '20px sans-serif';
    ctx.fillText('请输入你的玩家名称', 360, 340);

    drawPanel(ctx, { x: 140, y: 500, w: 440, h: 110 });
    ctx.fillStyle = this.name ? '#f2f6ff' : 'rgba(220,232,255,0.45)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(this.name || '点击输入昵称…', 360, 558);

    drawButton(ctx, CONFIRM_RECT, '确认', {
      font: 'bold 26px sans-serif',
      accent: 'rgba(140,200,255,0.9)',
    });
    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });
    ctx.textAlign = 'left';
  }
}

module.exports = MpNameScene;

  });
  register("src/scenes/mproom.js", function (module, exports, require) {
const platform = require('../core/platform.js');
const net = require('../net/multiplayer.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const { clamp } = require('../utils/math.js');

const CREATE_RECT = { x: 160, y: 440, w: 400, h: 72 };
const JOIN_RECT = { x: 160, y: 540, w: 400, h: 72 };
const SERVER_RECT = { x: 160, y: 640, w: 400, h: 64 };
const ROOMCODE_RECT = { x: 140, y: 500, w: 440, h: 72 };
const JOIN_CONFIRM_RECT = { x: 210, y: 640, w: 300, h: 64 };
const START_RECT = { x: 210, y: 900, w: 300, h: 64 };
const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };

function defaultServerUrl() {
  if (typeof location !== 'undefined' && location.hostname) {
    return 'ws://' + location.hostname + ':5174';
  }
  return 'ws://localhost:5174';
}

class MpRoomScene {
  constructor(game) {
    this.game = game;
    this.view = 'menu';
    this.name = '';
    this.serverUrl = defaultServerUrl();
    this.roomId = '';
    this.hostName = '';
    this.guestName = '';
    this.error = '';
    this.countdown = 0;
    this.enterCode = '';
    this.busy = false;
  }

  enter(params) {
    this.params = params || {};
    this.name = this.params.name || net.name || '';
    this.view = this.params.fromGame ? 'room' : 'menu';
    this.hostName = net.playerIndex === 1 ? this.name : net.peerName || '';
    this.guestName = net.playerIndex === 1 ? net.peerName || '' : this.name;
    this.roomId = net.roomId || '';
    this.error = '';
    this.countdown = 0;
    this.busy = false;
    net.onMessage = (msg) => this.handleMessage(msg);
    net.onClose = () => {
      if (this.view !== 'menu') {
        this.error = '连接已断开';
      }
    };
  }

  leave() {
    net.onMessage = null;
    net.onClose = null;
    net.close();
  }

  update(dt) {
    if (this.countdown > 0) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.game.go('difficulty', {
          coop: true,
          pk: true,
          roomId: net.roomId,
          playerIndex: net.playerIndex,
          seed: net.seed,
          hostName: this.hostName,
          guestName: this.guestName,
        });
      }
      return;
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.leave();
      this.game.go('title');
      return;
    }
    if (this.view === 'menu') {
      if (this.inRect(tap, CREATE_RECT)) {
        this.createRoom();
        return;
      }
      if (this.inRect(tap, JOIN_RECT)) {
        this.view = 'enterCode';
        this.enterCode = '';
        return;
      }
      if (this.inRect(tap, SERVER_RECT)) {
        this.openText('服务器地址', this.serverUrl, (v) => { this.serverUrl = v; });
      }
      return;
    }
    if (this.view === 'enterCode') {
      if (this.inRect(tap, ROOMCODE_RECT)) {
        this.openText('房间号(10位)', this.enterCode, (v) => { this.enterCode = v; });
        return;
      }
      if (this.inRect(tap, JOIN_CONFIRM_RECT)) {
        this.joinRoom();
      }
      return;
    }
    if (this.view === 'room') {
      if (net.playerIndex === 1 && this.guestName && this.inRect(tap, START_RECT)) {
        net.start();
      }
    }
  }

  createRoom() {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    net.connect(this.serverUrl)
      .then(() => {
        net.create(this.name);
      })
      .catch(() => {
        this.error = '无法连接服务器';
        this.busy = false;
      });
  }

  joinRoom() {
    if (this.busy) return;
    if (!/^\d{10}$/.test(this.enterCode)) {
      this.error = '请输入10位房间号';
      return;
    }
    this.busy = true;
    this.error = '';
    net.connect(this.serverUrl)
      .then(() => {
        net.join(this.enterCode, this.name);
      })
      .catch(() => {
        this.error = '无法连接服务器';
        this.busy = false;
      });
  }

  openText(title, value, done) {
    platform.showKeyboard({
      defaultValue: value,
      maxLength: 20,
      confirmType: 'done',
      onConfirm: (res) => {
        done((res && res.value) || '');
        platform.hideKeyboard();
      },
      onComplete: (res) => {
        const v = res && res.value !== undefined ? res.value : '';
        if (v) done(v);
        platform.hideKeyboard();
      },
    });
    void title;
  }

  handleMessage(msg) {
    if (msg.type === 'created') {
      this.roomId = msg.roomId;
      this.hostName = this.name;
      this.view = 'room';
      this.busy = false;
    } else if (msg.type === 'joined') {
      this.roomId = msg.roomId;
      this.hostName = msg.hostName;
      this.guestName = this.name;
      this.view = 'room';
      this.busy = false;
    } else if (msg.type === 'peerJoined') {
      this.guestName = msg.name;
    } else if (msg.type === 'start') {
      this.hostName = msg.hostName;
      this.guestName = msg.guestName;
      this.countdown = 3;
    } else if (msg.type === 'joinFailed') {
      this.error = msg.reason || '加入失败';
      this.busy = false;
    } else if (msg.type === 'peerLeft') {
      this.error = '对方已离开房间';
      this.leave();
      this.game.go('title');
    } else if (msg.type === 'gameover') {
      this.countdown = 0;
      this.view = 'room';
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.6, '#1a2540');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    if (this.view === 'menu') {
      drawInkTitle(ctx, 'Local PK', 360, 200, 46);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(220,232,255,0.8)';
      ctx.font = '20px sans-serif';
      ctx.fillText(`玩家：${this.name}`, 360, 300);
      drawButton(ctx, CREATE_RECT, 'Create Room', { font: 'bold 26px sans-serif', accent: 'rgba(140,200,255,0.9)' });
      drawButton(ctx, JOIN_RECT, 'Join Room', { font: 'bold 26px sans-serif', accent: 'rgba(255,160,120,0.9)' });
      drawButton(ctx, SERVER_RECT, `服务器：${this.serverUrl}`, { font: 'bold 18px sans-serif' });
      if (this.busy) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('连接中…', 360, 730);
      }
    } else if (this.view === 'enterCode') {
      drawInkTitle(ctx, 'Join Room', 360, 220, 46);
      drawPanel(ctx, { x: 120, y: 480, w: 480, h: 110 });
      ctx.textAlign = 'center';
      ctx.fillStyle = this.enterCode ? '#f2f6ff' : 'rgba(220,232,255,0.45)';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(this.enterCode || '点击输入10位房间号', 360, 542);
      drawButton(ctx, JOIN_CONFIRM_RECT, '加入', { font: 'bold 26px sans-serif' });
    } else {
      drawInkTitle(ctx, '房间', 360, 180, 52);
      drawPanel(ctx, { x: 110, y: 300, w: 500, h: 420 });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`房间号：${this.roomId}`, 360, 360);
      ctx.fillStyle = '#f2f6ff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`player1：${this.hostName || '…'}`, 360, 430);
      ctx.fillText(`player2：${this.guestName || '等待玩家2加入…'}`, 360, 480);
      if (this.busy) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.fillText('连接中…', 360, 540);
      } else if (net.playerIndex === 1) {
        if (this.guestName) {
          drawButton(ctx, START_RECT, 'Start', { font: 'bold 28px sans-serif', pulse: 0.15 + 0.1 * Math.sin(this.game.time || 0) });
        } else {
          ctx.fillStyle = 'rgba(220,232,255,0.7)';
          ctx.font = '20px sans-serif';
          ctx.fillText('等待玩家2加入…', 360, 560);
        }
      } else {
        ctx.fillStyle = 'rgba(220,232,255,0.7)';
        ctx.font = '20px sans-serif';
        ctx.fillText('等待房主开始…', 360, 560);
      }
    }

    if (this.error) {
      ctx.fillStyle = '#ffb3a0';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.error, 360, 760);
    }
    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });

    if (this.countdown > 0) {
      ctx.fillStyle = 'rgba(4,8,18,0.72)';
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = '#fff3cf';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.max(1, Math.ceil(this.countdown))), 360, 640);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('即将开始游戏…', 360, 720);
    }
    ctx.textAlign = 'left';
  }
}

module.exports = MpRoomScene;

  });
  register("src/scenes/pause.js", function (module, exports, require) {
const { drawButton, drawPanel } = require('../ui/menu.js');

const RESUME_RECT = { x: 210, y: 500, w: 300, h: 62 };
const SAVE_RECT = { x: 210, y: 590, w: 300, h: 62 };
const EXIT_RECT = { x: 210, y: 680, w: 300, h: 62 };
const EXIT_RECT_INV = { x: 210, y: 590, w: 300, h: 62 };

class PauseScene {
  constructor(game) {
    this.game = game;
  }

  update(input, invincible, noSave, pk) {
      const saveDisabled = invincible || !!noSave;
      const tap = input.consumeTap();
      if (!tap) return null;
      if (this.inRect(tap, RESUME_RECT)) return 'resume';
      if (pk) {
        if (this.inRect(tap, EXIT_RECT_INV)) return 'escape';
        return null;
      }
      if (!saveDisabled && this.inRect(tap, SAVE_RECT)) return 'save-exit';
      if (this.inRect(tap, saveDisabled ? EXIT_RECT_INV : EXIT_RECT)) return 'exit';
      return null;
    }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx, snapshot, invincible, noSave, pk) {
      const saveDisabled = invincible || !!noSave;
      ctx.fillStyle = 'rgba(4,8,18,0.78)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, { x: 110, y: 350, w: 500, h: 480 });
      ctx.fillStyle = '#f2e7c8';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂停', 360, 440);
      ctx.fillStyle = 'rgba(220,232,255,0.8)';
      ctx.font = '17px sans-serif';
      ctx.fillText(`${snapshot.difficulty.toUpperCase()} · Stage ${snapshot.stage} · Score ${snapshot.score}`, 360, 478);
      drawButton(ctx, RESUME_RECT, 'Resume');
      if (pk) {
        drawButton(ctx, EXIT_RECT_INV, 'Escape', { color: '#ff9d80' });
      } else if (saveDisabled) {
        drawButton(ctx, EXIT_RECT_INV, 'Exit', { color: '#ffb3c1' });
      } else {
        drawButton(ctx, SAVE_RECT, 'Save and exit');
        drawButton(ctx, EXIT_RECT, 'Exit', { color: '#ffb3c1' });
      }
    }
}

module.exports = PauseScene;

  });
  register("src/scenes/stage.js", function (module, exports, require) {
const { getDifficulty } = require('../config/difficulty.js');
const { getStage } = require('../config/stages.js');
const Player = require('../entities/player.js');
const Enemy = require('../entities/enemy.js');
const Boss = require('../entities/boss.js');
const BulletManager = require('../entities/bullets.js');
const ParticleSystem = require('../core/particles.js');
const MountainBackground = require('../core/mountain-background.js');
const storage = require('../core/storage.js');
const platform = require('../core/platform.js');
const PauseScene = require('./pause.js');
const { drawHud, drawCoopHud, drawBossHud, drawTwinBossHud } = require('../ui/hud.js');
const { drawInkTitle, drawButton, drawPanel } = require('../ui/menu.js');
const { TAU, circlesOverlap, rand, clamp } = require('../utils/math.js');
const net = require('../net/multiplayer.js');
const achievements = require('../core/achievements.js');
const { setGlobalSeed } = require('../utils/rng.js');
const { tintSprite } = require('../utils/tint.js');

const PAUSE_RECT = { x: 652, y: 14, w: 56, h: 52 };
const BOMB_RECT = { x: 38, y: 1152, w: 76, h: 92 };
const PK_WATCH_RECT = { x: 110, y: 900, w: 230, h: 76 };
const PK_WAIT_RECT = { x: 380, y: 900, w: 230, h: 76 };
const PK_EXIT_RECT = { x: 24, y: 24, w: 120, h: 48 };
const PK_TOP_RIGHT_RECT = { x: 576, y: 24, w: 120, h: 48 };
const PK_CONFIRM_PANEL = { x: 90, y: 500, w: 540, h: 290 };
const PK_CONFIRM_YES = { x: 190, y: 700, w: 140, h: 56 };
const PK_CONFIRM_NO = { x: 390, y: 700, w: 140, h: 56 };
const REVIVE_PANEL = { x: 90, y: 470, w: 540, h: 380 };
const REVIVE_YES = { x: 130, y: 730, w: 210, h: 60 };
const REVIVE_NO = { x: 380, y: 730, w: 210, h: 60 };

function formationPosition(layout, index, count, spawn) {
  const spacing = spawn.spacingX || 70;
  const spacingY = spawn.spacingY || 80;
  const cx = spawn.x !== undefined ? spawn.x : spawn.cx !== undefined ? spawn.cx : 360;
  const cy = spawn.y !== undefined ? spawn.y : spawn.cy !== undefined ? spawn.cy : -40;
  if (layout === 'V') {
    return { x: 360 + (index - (count - 1) / 2) * 58, y: -30 - Math.abs(index - (count - 1) / 2) * 42 };
  }
  if (layout === 'lineH') {
    return { x: cx + (index - (count - 1) / 2) * spacing, y: cy };
  }
  if (layout === 'lineV') {
    return { x: cx, y: -40 + index * spacingY };
  }
  if (layout === 'arc') {
    const radius = spawn.radius || 160;
    const angle = -Math.PI / 2 + (count === 1 ? 0 : (index / (count - 1)) * Math.PI);
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }
  if (layout === 'ring') {
    const radius = spawn.radius || 170;
    const angle = (index / count) * TAU;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }
  if (layout === 'triangle') {
    if (index === 0) return { x: cx, y: cy - 40 };
    if (index === 1) return { x: cx - 120, y: cy + 130 };
    return { x: cx + 120, y: cy + 130 };
  }
  if (layout === 'wedge') {
    return { x: 620 - index * 58, y: -60 + index * 48 };
  }
  if (layout === 'stairs') {
    const col = index % 2;
    const row = Math.floor(index / 2);
    return { x: 260 + col * 150, y: -60 + row * 100 + col * 45 };
  }
  return { x: null, y: null };
}

class StageScene {
  constructor(game) {
    this.game = game;
    this.pauseUi = new PauseScene(game);
  }

  enter(params) {
    this.params = params || {};
    const save = this.params.save;
    this.difficulty = getDifficulty(this.params.difficulty || (save && save.difficulty) || 'easy');
    this.stage = getStage(this.params.stage || (save && save.stage) || 1);
    this.continueMode = this.params.mode === 'continue';
    this.challenge = !!(this.params.challenge);
    this.noSave = !!(this.params.noSave || this.challenge);
    this.pk = !!(this.params.pk);
    this.coop = !!(this.params.coop) && !this.params.pk;
    if (this.coop) {
      this.roomId = this.params.roomId || '';
      this.playerIndex = this.params.playerIndex || 1;
      this.hostName = this.params.hostName || '';
      this.guestName = this.params.guestName || '';
      this.baseSeed = this.params.seed || 1;
      this.seed = this.baseSeed + Math.max(0, (this.stage ? this.stage.id : 1) - 1);
      this.coopEndSent = false;
      this.noSave = true;
      this.coopLocalSim = !!(this.params.coopLocalSim);
      this.coopClaimedExtras = [];
      this.coopMsg = '';
      this.coopBannerTimer = 0;
      this.coopNextStageId = 0;
      this.coopNextTimer = 0;
      this.coopStep = 1 / 60;
      this.coopBuffer = 6;
      this.coopGrace = 12;
      this.coopStartAtMs = typeof this.params.startAtLocal === 'number' ? this.params.startAtLocal : Date.now();
      this.coopNowMs = this.params.coopNowMs || (() => Date.now());
      this.coopSample = 0;
      this.coopNextStep = 0;
      this.localIntents = [];
      this.remoteIntents = {};
      this.lastRemoteIntent = { move: null, bomb: false };
      this.coopFrameIntent = null;
      setGlobalSeed(this.seed);
      net.onMessage = (msg) => this.handleNetMessage(msg);
    }
    if (this.pk) {
      this.noSave = true;
      this.roomId = this.params.roomId || '';
      this.playerIndex = this.params.playerIndex || 1;
      this.hostName = this.params.hostName || '';
      this.guestName = this.params.guestName || '';
      this.baseSeed = 1;
      this.pkState = 'play';
      this.pkChoice = null;
      this.pkConfirm = null;
      this.pkFinishedSent = false;
      this.pkOppFinished = false;
      this.pkLeaveSent = false;
      this.pkForfeitTimer = 0;
      this.pkForfeitName = '';
      this.pkSettleForfeit = '';
      this.pkSettleTimer = 0;
      this.pkStateTimer = 0;
      this.pkLastFrameAt = 0;
      this.pkFrameData = '';
      this.pkFrameImg = null;
      this.pkBroadcast = false;
      this.pkNextStageId = 0;
      this.pkNextTimer = 0;
      this.pkOpp = {
        name: this.playerIndex === 1 ? (this.params.guestName || 'P2') : (this.params.hostName || 'P1'),
        score: 0,
        stage: 1,
        lives: 3,
        hp: 100,
        maxHp: 100,
        over: false,
      };
      net.onMessage = (msg) => this.handlePkMessage(msg);
    }
    this.player = save ? Player.fromState(save) : this.params.progress ? Player.fromState(this.params.progress) : new Player(360, 1080);
    if (this.coop) {
      this.player2 = Player.fromState(this.player.toState());
      this.player2.x = 160;
      this.player2.y = 900;
      this.player2.red = true;
    }
    this.player.art = this.game.artBank ? this.game.artBank.get('player') : null;
    this.player.invincible = !!(
      this.params.invincible ||
      (save && save.invincible) ||
      (this.params.progress && this.params.progress.invincible)
    );
    if (this.params.boost && !save && !this.params.progress && this.player.level < 26) {
      this.player.level = Math.min(26, this.player.level + 5);
      this.player.recomputeCombatStats();
      this.player.hp = this.player.maxHp;
    }
    this.player.onLevelUp = () => {
      this.game.audio.levelup();
      this.particles.ring(this.player.x, this.player.y, '#f7d36b', 90, 0.7, 4);
    };

    this.bullets = new BulletManager(this.game.artBank);
    this.enemies = [];
    this.pickups = [];
    this.particles = new ParticleSystem();
    this.background = new MountainBackground({
      fixed: this.stage.background || null,
      terrain: this.stage.id === 1,
      sea: this.stage.id === 2,
      cloudtop: this.stage.id === 3,
      space: !!this.stage.space,
    });
    this.boss = null;
    this.bossFlashTimer = 0;
    this.paused = false;
    this.blockMoveUntilRelease = false;
    this.bombFx = null;
    this.bombTextTimer = 0;
    this.screenFlash = 0;
    this.hitFlash = 0;
    this.shields = [];
    this.meteors = [];
    this.meteorStormTimer = 0;
    this.cinematic = null;
    this.bossPlaceholderTimer = 0;
    this.miniBossCleared = false;
    this.bossPhase2Played = false;
    this.finalLordDropsSent = false;
    this.boss4BgmPlayed = false;
    this.alienDeathMusicStopped = false;
    this.bossDeadFade = 0;
    this.fakeEndingMode = (this.difficulty.id === 'hard' || this.difficulty.id === 'insane') && this.stage.id === 3;
    this.thunderTimer = rand(8, 12);
    this.lightningFlash = 0;
    this.thunderFlashDelay = 0;
    this.time = 0;
    this.shootCount = 0;
    this.gameOverSent = false;
    this.clearSent = false;
    this.revivePhase = null;
    this.reviveAdTimer = 0;
    this.activeEpisodeId = 0;
    this.episodeSpawns = [];
    this.episodeTimer = 0;
    this.pauseTimer = 0;

    this.episodeIndex = save ? save.waveIndex || 0 : 0;
    this.miniBossCleared = !!(save && save.miniBossCleared);
    if (this.continueMode && save) {
      if (this.stage.id === 3 && this.episodeIndex >= 10 && !this.miniBossCleared) {
        this.episodeIndex = 10;
        this.state = 'miniBoss';
        this.ensureMiniBoss();
        if (this.boss && save.twinHp) {
          for (const saved of save.twinHp) {
            const part = this.boss.parts.find((p) => p.key === saved.key);
            if (part && typeof saved.hp === 'number') {
              part.hp = Math.min(part.maxHp, saved.hp);
              if (part.hp <= 0) part.dead = true;
            }
          }
        }
      } else if (this.episodeIndex >= this.stage.episodes.length) {
        this.state = 'boss';
        this.ensureBoss();
        if (typeof save.bossHp === 'number' && save.bossHp >= 0) {
          this.boss.hp = Math.min(this.boss.maxHp, save.bossHp);
        }
        if (save.bossPhase) {
          this.boss.phase = Math.max(1, Math.min(3, save.bossPhase));
        }
      } else {
        this.state = 'intro';
        this.introTimer = 2.8;
      }
    } else {
      this.state = 'intro';
      this.introTimer = 2.8;
    }
    if (this.stage.id === 2) {
      this.game.audio.playStage2Bgm();
    } else if (this.stage.id === 3) {
      this.game.audio.playStage3Bgm();
    } else if (this.stage.id === 4) {
      this.game.audio.playStage4Bgm();
    } else {
      this.game.audio.playStageBgm();
    }
  }

  startEpisode(index) {
    const episode = this.stage.episodes[index];
    if (!episode) return;
    this.activeEpisodeId = index;
    this.episodeTimer = 0;
    this.pauseTimer = 0;
    this.episodeSpawns = [];
    this.cinematic = episode.flyover ? { t: 0, duration: episode.duration } : null;
    if (this.stage.id === 4) {
      const wave = index + 1;
      if (wave % 10 === 0) this.pickups.push({ type: 'bomb', x: 360, y: -30 });
      if (wave % 5 === 0) this.pickups.push({ type: 'heart', x: 440, y: -30 });
    }
    if (episode.meteorStorm) {
      this.meteorStormTimer = 12;
      for (const m of this.meteors) {
        m.vx *= 1.4;
        m.vy *= 1.4;
      }
    }
    if (episode.type === 'formation') {
      for (const group of episode.groups) {
        const groupCount = Math.max(1, Math.round(group.count * this.difficulty.enemyCount));
        const startY = 360 - ((groupCount - 1) * group.spacing) / 2;
        for (let i = 0; i < groupCount; i += 1) {
          const lane = startY + i * group.spacing;
          const flashing = episode.includeBombCarrier && i === 1 && group.side === 'left';
          const enemy = new Enemy(
            this.stage.enemyDefs[episode.enemyType],
            {
              side: group.side,
              path: 'loop',
              lane,
              flashing,
              loopConfig: {
                centerX: group.centerX,
                radius: group.radius,
                loopDuration: group.loopDuration,
              },
            },
            this.difficulty,
            index
          );
          this.applyEnemyArt(enemy);
          this.addEnemy(enemy);
        }
      }
    } else {
      this.episodeSpawns = episode.spawns.map((spawn) => {
        const baseInterval = spawn.interval || 0.5;
        return {
          type: spawn.type,
          side: spawn.side,
          path: spawn.path || 'dive',
          count: Math.max(1, Math.round(spawn.count * this.difficulty.enemyCount)),
          interval: baseInterval === 0 ? 0 : baseInterval * this.difficulty.enemyInterval,
          flashing: !!spawn.flashing,
          formation: spawn.formation || null,
          spawned: 0,
          nextAt: spawn.delay || 0,
        };
      });
    }
  }

  spawnEnemy(spawn, index) {
    if (spawn.type === 'MET') {
      this.spawnMeteor(spawn, index);
      return;
    }
    const def = this.stage.enemyDefs[spawn.type];
    if (!def) return;
    const pos = spawn.formation
      ? formationPosition(spawn.formation, index, spawn.count || 1, spawn)
      : { x: spawn.x !== undefined ? spawn.x : null, y: spawn.y !== undefined ? spawn.y : null };
    const enemy = new Enemy(
      def,
      {
        side: spawn.side,
        path: spawn.path || 'dive',
        flashing: spawn.flashing,
        x: pos.x,
        y: pos.y,
        groupConfig: spawn.groupConfig,
        holdY: spawn.holdY,
        holdTime: spawn.holdTime,
        angle: spawn.angle,
      },
      this.difficulty,
      this.activeEpisodeId
    );
    this.addEnemy(enemy);
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
    if (this.stage.id === 4 && (enemy.type === 'EN' || enemy.type === 'ED' || enemy.type === 'UV' || enemy.type === 'UG')) {
      enemy.holdTime = 9999;
    }

    if (enemy.type === 'UG') {
      const emHp = Math.max(1, Math.round(2500 * this.difficulty.enemyHp));
      this.shields.push({
        enemy,
        kind: 'em',
        hp: emHp,
        maxHp: emHp,
        radius: 210,
        active: true,
      });
      return;
    }
    if (enemy.def.shieldHp) {
      const hp = Math.max(1, Math.round(enemy.def.shieldHp * this.difficulty.enemyHp));
      this.shields.push({
        enemy,
        kind: enemy.def.shieldKind || 'normal',
        hp,
        maxHp: hp,
        radius: enemy.def.shieldRadius || 120,
        active: true,
      });
    }

    if (this.stage.id !== 4 && this.player && this.player.level >= 20) {
      const roll = Math.random();
      if (roll < 0.08) enemy.glow = 'yellow';
      else if (roll < 0.16) enemy.glow = 'blue';
    }
  }

  removeShield(enemy) {
    for (let i = this.shields.length - 1; i >= 0; i -= 1) {
      if (this.shields[i].enemy === enemy) this.shields.splice(i, 1);
    }
  }

  findShieldFor(enemy) {
    let best = null;
    let bestDist = Infinity;
    for (const shield of this.shields) {
      if (!shield.active) continue;
      if (shield.kind === 'em' && shield.enemy === enemy) continue;
      const dx = shield.enemy.x - enemy.x;
      const dy = shield.enemy.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= shield.radius + enemy.r && dist < bestDist) {
        best = shield;
        bestDist = dist;
      }
    }
    return best;
  }

  applyEnemyArt(enemy) {
    const artKeys = {
      S: 'enemy_s',
      M: 'enemy_m',
      H: 'enemy_h',
      K: 'enemy_tuxi',
      D: 'enemy_hudun',
      N: 'enemy_juji',
      F: 'enemy_fengwei_a',
      G: 'enemy_fengwei_b',
      ES: 'enemy_es',
      EM: 'enemy_em',
      EH: 'enemy_eh',
      EK: 'enemy_ek',
      EN: 'enemy_en',
      ED: 'enemy_ed',
      U: 'ufo_m',
      UV: 'ufo_l',
      UG: 'ufo_gen',
    };
    const key = artKeys[enemy.type];
    enemy.art = key ? (this.game.artBank ? this.game.artBank.get(key) : null) : null;
  }

  ensureBoss() {
    if ((!this.boss || this.boss.custom === 'twinGuards') && this.stage.boss) {
      this.boss = new Boss(this.stage.boss, this.difficulty);
      const bossArtKey =
        this.boss.custom === 'stormEye' ? 'boss2' : this.boss.custom === 'finalLord' ? 'boss3' : this.boss.custom === 'alienMothership' ? 'mothership' : 'boss';
      this.boss.art = this.game.artBank ? this.game.artBank.get(bossArtKey) : null;
    }
  }

  ensureMiniBoss() {
    if (!this.boss && this.stage.miniBoss) {
      this.boss = new Boss(this.stage.miniBoss, this.difficulty);
      if (this.boss.parts) {
        for (const part of this.boss.parts) {
          part.art = this.game.artBank ? this.game.artBank.get(part.artKey) : null;
        }
      }
    }
  }

  spawnBossEscorts(types) {
    for (const type of types) {
      const def = this.stage.enemyDefs[type];
      if (!def) continue;
      const side = ['top', 'topLeft', 'topRight'][Math.floor(Math.random() * 3)];
      const enemy = new Enemy(def, { side, path: type === 'K' ? 'kamikaze' : 'dive' }, this.difficulty, -1);
      this.applyEnemyArt(enemy);
    this.enemies.push(enemy);
    }
  }

  update(dt) {
      if (!this.coop) {
        if (this.pk) this.updatePkMeta(dt);
        this.step(dt);
        return;
      }
      const now = this.coopNowMs();
      const STEP_MS = this.coopStep * 1000;
      while (now - this.coopStartAtMs >= this.coopSample * STEP_MS) {
        const intent = this.sampleCoopIntent();
        this.localIntents[this.coopSample] = intent;
        if (this.coopLocalSim) {
          this.remoteIntents[this.coopSample] = { move: null, bomb: false };
        } else {
          net.sendIntent(this.coopSample, intent.move, intent.bomb, this.stage.id);
        }
        this.coopSample += 1;
      }
      if (!this.coopLocalSim) {
        const rttMs = typeof net.smoothedRttMs === 'number' && net.smoothedRttMs > 0 ? net.smoothedRttMs : 60;
        const want = Math.max(1, Math.min(10, Math.ceil((rttMs + 10) / STEP_MS)));
        if (want !== this.coopBuffer) this.coopBuffer = want;
      }
      const stepLimit = this.coopLocalSim
        ? this.coopSample
        : Math.max(0, this.coopSample - this.coopBuffer);
      let guard = 0;
      while (this.coopNextStep < stepLimit && guard < 12) {
        const f = this.coopNextStep;
        if (!this.coopLocalSim && !this.remoteIntents[f]) {
          if (this.coopSample - f <= this.coopBuffer + this.coopGrace) break;
          this.remoteIntents[f] = this.lastRemoteIntent;
        }
        const remote = this.remoteIntents[f] || { move: null, bomb: false };
        this.coopFrameIntent = {
          p1: this.playerIndex === 1 ? this.localIntents[f] : remote,
          p2: this.playerIndex === 2 ? this.localIntents[f] : remote,
        };
        this.step(this.coopStep);
        if (this.coopBannerTimer > 0) {
          this.coopBannerTimer = Math.max(0, this.coopBannerTimer - this.coopStep);
        }
        this.coopNextStep += 1;
        guard += 1;
      }
    }

  step(dt) {
    if (this.pk && this.state === 'pkNext') {
      this.pkNextTimer -= dt;
      if (this.pkNextTimer <= 0) {
        this.pkNextTimer = 0;
        this.pkStartNextStage();
      }
      return;
    }
    if (this.pk && this.pkState === 'forfeit') {
      this.pkForfeitTimer -= dt;
      if (this.pkForfeitTimer <= 0) {
        this.pkForfeitTimer = 0;
        this.pkBeginSettle(this.pkForfeitName || '对方');
      }
      return;
    }
    if (this.pk && this.pkState === 'settle') {
      this.pkSettleTimer -= dt;
      if (this.pkSettleTimer <= 0 && !this.pkLeaveSent) {
        this.pkLeaveSent = true;
        if (this.pkSettleForfeit) {
          // 对方已逃跑并退出房间，无需再回房间，直接返回标题界面
          net.close();
          this.game.go('title');
        } else {
          net.gameover();
          this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        }
      }
      return;
    }
    if (this.pk && this.pkState !== 'play') {
      this.handlePkTerminal(dt);
      return;
    }
    if (this.state === 'coopNext') {
      this.coopNextTimer -= dt;
      if (this.coopNextTimer <= 0) {
        this.coopNextTimer = 0;
        this.beginNextStage();
      }
      return;
    }
    if (this.revivePhase) {
      this.updateRevive(dt);
      return;
    }
    if (this.paused) {
      const action = this.pauseUi.update(this.game.input, this.player.invincible, this.noSave, this.pk);
      if (action === 'resume') {
        this.paused = false;
      } else if (action === 'escape' && this.pk) {
        this.paused = false;
        this.pkEscape();
      } else if (action === 'save-exit') {
        if (!this.player.invincible && !this.noSave) storage.saveSave(this.makeSnapshot());
        this.game.go('title');
      } else if (action === 'exit') {
        if (!this.noSave) storage.clearSave();
        this.game.go('title');
      }
      return;
    }

    if (this.state === 'bossPlaceholder') {
      this.bossPlaceholderTimer -= dt;
      if (this.bossPlaceholderTimer <= 0) this.triggerClear();
      return;
    }

    this.time += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.background.update(dt);
    this.updateThunder(dt);
    this.particles.update(dt);
    this.updateBombFx(dt);
    this.updateIntro(dt);
    this.handleStageTaps();
    this.updatePlayer(dt);
    if (this.revivePhase) return;
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateBossFlash(dt);
    this.updateBoss(dt);
    this.bullets.update(dt, this.player);
    this.updateCollisions();
    this.updateMeteors(dt);
    this.updatePickups(dt);
    this.checkGameOver();
  }

  updateThunder(dt) {
    if (this.stage.id !== 2) return;
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0) {
      this.game.audio.playLighting();
      this.background.triggerLightning(rand(120, 600));
      this.lightningFlash = 1;
      this.thunderTimer = rand(8, 12);
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 0.5);
  }

  updateIntro(dt) {
    if (this.state !== 'intro') return;
    this.introTimer -= dt;
    if (this.introTimer <= 0) {
      this.state = 'waves';
      this.startEpisode(this.episodeIndex);
    }
  }

  handleStageTaps() {
      if (this.coop) return;
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.inRect(tap, PAUSE_RECT)) {
        this.paused = true;
        this.blockMoveUntilRelease = true;
        return;
      }
      if (this.inRect(tap, BOMB_RECT)) {
        this.blockMoveUntilRelease = true;
        this.tryBomb(this.player);
      }
    }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  updatePlayer(dt) {
    if (this.coop) {
      this.updateCoopPlayers(dt);
      return;
    }
    if (!this.player.art && this.game.artBank && this.game.artBank.ready) {
      this.player.art = this.game.artBank.get('player');
    }
    const moveTarget = this.blockMoveUntilRelease ? null : this.game.input.getMoveTarget();
    if (!this.game.input.active) this.blockMoveUntilRelease = false;
    this.player.update(dt, moveTarget);
    if (!this.player.alive && this.player.respawnTimer <= 0) {
      if (this.player.lives < 0) {
        if (this.offerRevive()) return;
        this.triggerGameOver();
        return;
      }
      this.player.respawn();
      this.bullets.clearEnemy();
      this.particles.ring(this.player.x, this.player.y, '#b7e0ff', 90, 0.6, 5);
    }
    if (this.player.alive) {
      this.shootCount += 1;
      this.player.updateFire(dt, this.bullets);
      if (this.shootCount % 4 === 0) this.game.audio.shoot();
    }
  }

  updateCoopPlayers(dt) {
      if (!this.player.art && this.game.artBank && this.game.artBank.ready) {
        this.player.art = this.game.artBank.get('player');
      }
      if (this.player2 && !this.player2.art && this.player.art) {
        this.player2.art = tintSprite(this.player.art, 'rgba(255,60,60,0.9)');
      }
      const intent = this.coopFrameIntent || {};
      const i1 = intent.p1 || { move: null, bomb: false };
      const i2 = intent.p2 || { move: null, bomb: false };
      this.player.update(dt, this.player.spectating ? null : i1.move);
      this.player2.update(dt, this.player2.spectating ? null : i2.move);

      let bomber = null;
      if (i1.bomb && this.player.alive && !this.player.spectating) bomber = this.player;
      if (!bomber && i2.bomb && this.player2.alive && !this.player2.spectating) bomber = this.player2;
      if (bomber) this.tryBomb(bomber);

      for (const p of [this.player, this.player2]) {
        if (p.alive || p.respawnTimer > 0 || p.spectating) continue;
        if (p.lives > 0) {
          p.respawn();
          p.spectating = false;
          this.bullets.clearEnemy();
          this.particles.ring(p.x, p.y, p.red ? '#ff8fa0' : '#b7e0ff', 90, 0.6, 5);
        } else {
          p.spectating = true;
          const local = this.playerIndex === 1 ? this.player : this.player2;
          this.coopAnnounce(
            local === p
              ? '你已出局 · 观战中'
              : ((p.red ? this.guestName : this.hostName) || '队友') + ' 已出局，等待返场',
            2.6
          );
        }
      }
      if (this.player.spectating && this.player2.spectating) {
        this.triggerGameOver();
        return;
      }
      for (const p of [this.player, this.player2]) {
        if (p.alive && !p.spectating) p.updateFire(dt, this.bullets);
      }
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (local.alive && !local.spectating) {
        this.shootCount += 1;
        if (this.shootCount % 4 === 0) this.game.audio.shoot();
      }
    }

  handleNetMessage(msg) {
      if (msg.type === 'input') {
        if (msg.stage !== undefined && msg.stage !== this.stage.id) return;
        const intent = { move: msg.move || null, bomb: !!msg.bomb };
        this.remoteIntents[msg.frame] = intent;
        this.lastRemoteIntent = intent;
      } else if (msg.type === 'gameover') {
        if (!this.coopEndSent) {
          this.coopEndSent = true;
          this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        }
      }
    }

  damagePlayerFor(p, amount) {
    if (p.damage(amount)) {
      this.hitFlash = 0.5;
      platform.vibrateShort();
    }
  }

  updatePlayer2Collisions() {
    if (!this.coop || !this.player2) return;
    const p2 = this.player2;
    if (!p2.alive || p2.invuln > 0) return;
    for (let i = this.bullets.enemy.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.enemy[i];
      if (circlesOverlap(bullet.x, bullet.y, bullet.r, p2.x, p2.y, p2.r + 2)) {
        const damage = bullet.large ? 30 : 12;
        this.damagePlayerFor(p2, damage);
        this.bullets.enemy.splice(i, 1);
        if (bullet.fragment) this.bullets.spawnFragments(bullet);
        this.particles.burst(p2.x, p2.y, '#ff6f91', 8, 140, 0.4, 4);
        this.game.audio.hit();
      }
    }
    for (const beam of this.bullets.beams) {
      if (beam.timer < (beam.charge || 0)) continue;
      const beamHit = beam.direction === 'horizontal'
        ? Math.abs(p2.y - beam.y) <= beam.width / 2 + p2.r + 4
        : p2.y >= beam.y && Math.abs(p2.x - beam.x) <= beam.width / 2 + p2.r + 4;
      if (beamHit && beam.hitTimer <= 0) {
        beam.hitTimer = beam.hitInterval || 0.4;
        this.damagePlayerFor(p2, beam.damage || 20);
        this.particles.burst(p2.x, p2.y, '#ff8a4a', 10, 160, 0.45, 4);
        this.game.audio.hit();
      }
    }
    for (const enemy of this.enemies.slice()) {
      if (enemy.dead) continue;
      if (circlesOverlap(enemy.x, enemy.y, enemy.r, p2.x, p2.y, p2.r + 6)) {
        this.damagePlayerFor(p2, 20);
        enemy.damage(999);
        this.particles.burst(enemy.x, enemy.y, '#ff9dab', 10, 120, 0.4, 4);
      }
    }
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      const m = this.meteors[i];
      if (circlesOverlap(m.x, m.y, m.r, p2.x, p2.y, p2.r + 6)) {
        this.damagePlayerFor(p2, 30);
        this.explodeMeteor(m, i, false);
      }
    }
    if (this.boss && !this.boss.dead) {
      if (this.boss.custom === 'stormEye' && this.boss.isDiving() &&
          circlesOverlap(p2.x, p2.y, p2.r, this.boss.x, this.boss.y, this.boss.r * 0.75)) {
        this.damagePlayerFor(p2, 25);
        this.boss.flash = 1;
      }
      if (this.boss.custom === 'alienMothership' && this.boss.isAlienDiving() &&
          circlesOverlap(p2.x, p2.y, p2.r, this.boss.x, this.boss.y, this.boss.r * 0.8)) {
        this.damagePlayerFor(p2, 30);
        this.boss.flash = 1;
      }
      if (this.boss.custom === 'twinGuards') {
        for (const part of this.boss.parts) {
          if (!part.dead && part.diveState === 'dive' &&
              circlesOverlap(p2.x, p2.y, p2.r, part.x, part.y, part.r * 0.8)) {
            this.damagePlayerFor(p2, 25);
            part.flash = 1;
          }
        }
      }
    }
  }

  sampleCoopIntent() {
      const intent = { move: null, bomb: false };
      const input = this.game && this.game.input;
      if (!input) return intent;
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (!local || local.spectating) return intent;
      if (this.blockMoveUntilRelease && !input.active) this.blockMoveUntilRelease = false;
      const tap = input.consumeTap();
      if (tap && this.inRect(tap, BOMB_RECT)) {
        intent.bomb = true;
        this.blockMoveUntilRelease = true;
      }
      if (!this.blockMoveUntilRelease && input.active) {
        intent.move = input.getMoveTarget();
      }
      return intent;
    }

    coopAnnounce(text, duration) {
      this.coopMsg = text || '';
      this.coopBannerTimer = duration || 2.2;
    }

    addTeamScore(amount) {
      if (!this.coop) {
        this.player.addScore(amount);
        return;
      }
      this.player.score += amount;
      for (const threshold of Player.EXTRA_LIFE_SCORES || []) {
        if (this.player.score < threshold || this.coopClaimedExtras.indexOf(threshold) !== -1) continue;
        this.coopClaimedExtras.push(threshold);
        this.coopAnnounce('奖命达成 · 双方残机 +1', 2.6);
        for (const p of [this.player, this.player2]) {
          if (p.spectating) {
            p.lives += 1;
            this.reviveSpectator(p);
          } else {
            p.lives += 1;
            p.lifeFlash = 2;
          }
        }
      }
    }

    reviveSpectator(p) {
      p.reviveFromSpectate();
      this.particles.ring(p.x, p.y, '#ffd36b', 130, 0.9, 8);
      this.game.audio.levelup();
    }

    beginNextStage() {
      const next = this.coopNextStageId;
      this.coopNextStageId = 0;
      this.resetStageWorld(next);
    }

    resetStageWorld(stageId) {
      this.stage = getStage(stageId);
      this.seed = this.baseSeed + Math.max(0, stageId - 1);
      setGlobalSeed(this.seed);
      const resetShips = [this.player];
      if (this.player2) resetShips.push(this.player2);
      for (const p of resetShips) {
        p.x = p === this.player2 ? 160 : 360;
        p.y = p === this.player2 ? 900 : 1080;
        p.tilt = 0;
        if (p.spectating) {
          p.respawnTimer = 0;
          continue;
        }
        if (!p.alive && p.lives > 0) p.respawn();
        p.invuln = Math.max(p.invuln, 2);
      }
      this.bullets = new BulletManager(this.game.artBank);
      this.enemies = [];
      this.pickups = [];
      this.particles = new ParticleSystem();
      this.background = new MountainBackground({
        fixed: this.stage.background || null,
        terrain: this.stage.id === 1,
        sea: this.stage.id === 2,
        cloudtop: this.stage.id === 3,
        space: !!this.stage.space,
      });
      this.boss = null;
      this.bossFlashTimer = 0;
      this.paused = false;
      this.blockMoveUntilRelease = false;
      this.bombFx = null;
      this.bombTextTimer = 0;
      this.screenFlash = 0;
      this.hitFlash = 0;
      this.shields = [];
      this.meteors = [];
      this.meteorStormTimer = 0;
      this.cinematic = null;
      this.bossPlaceholderTimer = 0;
      this.miniBossCleared = false;
      this.bossPhase2Played = false;
      this.finalLordDropsSent = false;
      this.boss4BgmPlayed = false;
      this.alienDeathMusicStopped = false;
      this.bossDeadFade = 0;
      this.fakeEndingMode = (this.difficulty.id === 'hard' || this.difficulty.id === 'insane') && this.stage.id === 3;
      this.thunderTimer = rand(8, 12);
      this.lightningFlash = 0;
      this.thunderFlashDelay = 0;
      this.time = 0;
      this.shootCount = 0;
      this.gameOverSent = false;
      this.clearSent = false;
      this.activeEpisodeId = 0;
      this.episodeSpawns = [];
      this.episodeTimer = 0;
      this.pauseTimer = 0;
      this.episodeIndex = 0;
      this.state = 'intro';
      this.introTimer = 2.8;
      this.coopMsg = '';
      this.coopBannerTimer = 0;
      if (this.stage.id === 2) this.game.audio.playStage2Bgm();
      else if (this.stage.id === 3) this.game.audio.playStage3Bgm();
      else if (this.stage.id === 4) this.game.audio.playStage4Bgm();
      else this.game.audio.playStageBgm();
    }

    renderCoopOverlay(ctx) {
      if (!this.coop) return;
      const local = this.playerIndex === 1 ? this.player : this.player2;
      if (local && local.spectating) {
        ctx.fillStyle = '#ff9db0';
        ctx.font = 'bold 26px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('你已出局 · 观战中', 360, 196);
        ctx.textAlign = 'left';
      }
      if (this.coopBannerTimer > 0 && this.coopMsg) {
        ctx.globalAlpha = Math.min(1, this.coopBannerTimer);
        ctx.fillStyle = 'rgba(8,14,30,0.55)';
        ctx.fillRect(120, 700, 480, 92);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.coopMsg, 360, 752);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
      if (this.state === 'coopNext') {
        ctx.fillStyle = 'rgba(6,10,24,0.55)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 44px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${this.stage.id} 关突破`, 360, 600);
        ctx.font = 'bold 24px sans-serif';
        const next = this.coopNextStageId;
        const nextStage = getStage(next);
        ctx.fillText(`即将进入第 ${next} 关 · ${nextStage ? nextStage.title : ''}`, 360, 660);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#9fd8ff';
        ctx.fillText(String(Math.max(1, Math.ceil(this.coopNextTimer))), 360, 722);
        ctx.textAlign = 'left';
      }
    }


  updatePkMeta(dt) {
      if (!this.pk || this.pkState !== 'play') return;
      this.pkStateTimer -= dt;
      if (this.pkStateTimer <= 0) {
        this.pkStateTimer = 0.25;
        net.sendPkState({
          score: this.player.score,
          stage: this.stage.id,
          lives: Math.max(0, this.player.lives),
          hp: Math.max(0, Math.ceil(this.player.hp)),
          maxHp: this.player.maxHp,
          over: false,
        });
      }
    }

    handlePkMessage(msg) {
        if (!msg) return;
        if (msg.type === 'pkState') {
          this.pkOpp.score = msg.score || 0;
          this.pkOpp.stage = msg.stage || this.pkOpp.stage;
          this.pkOpp.lives = typeof msg.lives === 'number' ? msg.lives : this.pkOpp.lives;
          this.pkOpp.hp = msg.hp || 0;
          this.pkOpp.maxHp = msg.maxHp || 100;
          if (msg.over) this.pkOpp.over = true;
          return;
        }
        if (msg.type === 'pkFinished') {
          this.pkOpp.score = msg.score || 0;
          this.pkOpp.stage = msg.stage || this.pkOpp.stage;
          this.pkOpp.over = true;
          this.pkOppFinished = true;
          if (this.pkState !== 'play' && this.pkFinishedSent) this.pkBeginSettle();
          return;
        }
        if (msg.type === 'pkWatchOn') {
          this.pkBroadcast = !!msg.on;
          return;
        }
        if (msg.type === 'pkFrame') {
          this.pkFrameData = msg.data || '';
          const ImageCtor = typeof Image !== 'undefined' ? Image : null;
          if (ImageCtor && this.pkFrameData) {
            const img = new ImageCtor();
            img.onload = () => { this.pkFrameImg = img; };
            img.src = this.pkFrameData;
          }
          return;
        }
        if (msg.type === 'pkForfeit') {
          this.pkConfirm = null;
          this.game.audio.stopBgm();
          this.pkForfeitName = msg.name || '对方';
          this.pkForfeitTimer = 2;
          this.pkBroadcast = false;
          this.pkState = 'forfeit';
          this.pkChoice = null;
          return;
        }
        if (msg.type === 'gameover') {
          if (!this.pkLeaveSent) {
            this.pkLeaveSent = true;
            this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
          }
          return;
        }
        if (msg.type === 'peerLeft') {
          net.close();
          this.game.go('title');
        }
      }

    pkFinishRun(cleared) {
      if (this.pkState !== 'play') return;
      this.pkState = cleared ? 'clear' : 'over';
      this.game.audio.stopLighting();
      this.game.audio.stopBgm();
      if (cleared) this.game.audio.clear();
      else this.game.audio.gameover();
      if (!this.pkFinishedSent) {
        this.pkFinishedSent = true;
        net.sendPkFinished(this.player.score, this.stage.id, cleared);
      }
      if (this.pkOppFinished && this.pkOpp.over) this.pkBeginSettle();
    }

    pkBeginSettle(forfeitName) {
        if (this.pkState === 'settle') return;
        this.pkConfirm = null;
        this.pkSettleForfeit = forfeitName || '';
        this.pkState = 'settle';
        this.pkSettleTimer = 3;
        this.pkChoice = 'settle';
        const myScore = this.player.score;
        const oppScore = this.pkOpp.score;
        if (this.pkSettleForfeit || myScore > oppScore) achievements.unlock('pvp');
      }

    pkStartNextStage() {
      this.resetStageWorld(this.pkNextStageId);
    }

    handlePkTerminal(dt) {
        if (this.pkState === 'settle' || this.pkState === 'forfeit') return;
        const tap = this.game.input.consumeTap();
        if (!tap) return;
        if (this.pkConfirm) {
          if (this.inRect(tap, PK_CONFIRM_YES)) {
            this.pkConfirm = null;
            this.pkForfeitLocal();
          } else if (this.inRect(tap, PK_CONFIRM_NO)) {
            this.pkConfirm = null;
          }
          return;
        }
        if (this.pkChoice === 'wait' || this.pkChoice === 'watch') {
          if (this.inRect(tap, PK_EXIT_RECT)) {
            this.pkConfirm = { mode: 'exitForfeit' };
            this.game.audio.pickup();
            return;
          }
          if (this.pkChoice === 'wait' && this.inRect(tap, PK_TOP_RIGHT_RECT)) {
            this.pkChoice = 'watch';
            net.sendPkWatch(true);
            this.game.audio.pickup();
            return;
          }
          if (this.pkChoice === 'watch' && this.inRect(tap, PK_TOP_RIGHT_RECT)) {
            this.pkChoice = 'wait';
            net.sendPkWatch(false);
            this.game.audio.pickup();
          }
          return;
        }
        if (this.inRect(tap, PK_WATCH_RECT)) {
          this.pkChoice = 'watch';
          net.sendPkWatch(true);
          this.game.audio.pickup();
          return;
        }
        if (this.inRect(tap, PK_WAIT_RECT)) {
          this.pkChoice = 'wait';
          this.game.audio.pickup();
        }
      }

    drawPkOpponentBar(ctx) {
        ctx.fillStyle = 'rgba(4,8,20,0.62)';
        ctx.fillRect(0, 1248, 720, 32);
        const myName = this.playerIndex === 1 ? (this.hostName || 'P1') : (this.guestName || 'P2');
        const oppName = this.playerIndex === 1 ? (this.guestName || 'P2') : (this.hostName || 'P1');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('你 ' + myName + '  ' + String(this.player.score).padStart(7, '0'), 24, 1270);
        ctx.fillStyle = '#ff9db0';
        ctx.textAlign = 'right';
        ctx.fillText(String(this.pkOpp.score).padStart(7, '0') + '  ' + oppName + '（对方）', 696, 1270);
        ctx.textAlign = 'left';
      }

    renderPkOverlay(ctx) {
        if (!this.pk) return;
        if (this.pkState === 'play') {
          this.drawPkOpponentBar(ctx);
          return;
        }
        if (this.pkState === 'forfeit') {
          ctx.fillStyle = 'rgba(4,6,16,0.82)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffd36b';
          ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('对方已逃跑', 360, 560);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('即将进入结算界面…', 360, 640);
          ctx.fillStyle = 'rgba(220,232,255,0.85)';
          ctx.font = '22px sans-serif';
          ctx.fillText(String(Math.max(1, Math.ceil(this.pkForfeitTimer))), 360, 700);
          ctx.textAlign = 'left';
          return;
        }
        if (this.pkChoice === 'wait') {
          ctx.fillStyle = 'rgba(4,6,16,0.72)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffe9b8';
          ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('等待结算', 360, 400);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('对方仍在游戏中 · 分数实时更新', 360, 470);
          ctx.fillStyle = 'rgba(220,232,255,0.8)';
          ctx.font = '20px sans-serif';
          ctx.fillText('对方结束后将自动进入 PK 结算', 360, 520);
          ctx.textAlign = 'left';
          drawButton(ctx, PK_EXIT_RECT, '退出房间', { font: 'bold 22px sans-serif', accent: 'rgba(255,140,150,0.95)' });
          drawButton(ctx, PK_TOP_RIGHT_RECT, '观战', { font: 'bold 24px sans-serif', accent: 'rgba(140,230,180,0.95)' });
          this.drawPkOpponentBar(ctx);
          return;
        }
        if (this.pkChoice === 'watch') {
          ctx.fillStyle = '#04070d';
          ctx.fillRect(0, 0, 720, 1280);
          const img = this.pkFrameImg;
          if (img) {
            try { ctx.drawImage(img, 0, 0, 720, 1280); } catch (e) {}
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 28px "STKaiti","KaiTi",serif';
            ctx.textAlign = 'center';
            ctx.fillText('正在同步对方画面…', 360, 620);
            ctx.textAlign = 'left';
          }
          ctx.fillStyle = 'rgba(140,230,180,0.95)';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('观战中 · 对方结束后自动结算', 360, 72);
          ctx.textAlign = 'left';
          this.drawPkOpponentBar(ctx);
          drawButton(ctx, PK_EXIT_RECT, '退出房间', { font: 'bold 22px sans-serif', accent: 'rgba(255,140,150,0.95)' });
          drawButton(ctx, PK_TOP_RIGHT_RECT, '等待结算', { font: 'bold 24px sans-serif', accent: 'rgba(140,200,255,0.95)' });
          return;
        }
        if (this.pkState === 'settle') {
          const myScore = this.player.score;
          const oppScore = this.pkOpp.score;
          const myName = this.playerIndex === 1 ? (this.hostName || 'P1') : (this.guestName || 'P2');
          const oppName = this.playerIndex === 1 ? (this.guestName || 'P2') : (this.hostName || 'P1');
          ctx.fillStyle = 'rgba(4,6,16,0.84)';
          ctx.fillRect(0, 0, 720, 1280);
          ctx.fillStyle = '#ffe9b8';
          ctx.font = 'bold 58px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('PK 结算', 360, 320);
          ctx.font = 'bold 30px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(myName + '  ' + String(myScore).padStart(7, '0'), 360, 430);
          ctx.fillStyle = '#ffd36b';
          ctx.fillText('VS', 360, 492);
          ctx.fillStyle = '#fff';
          ctx.fillText(oppName + '  ' + String(oppScore).padStart(7, '0'), 360, 554);
          let verdict = '';
          if (this.pkSettleForfeit) {
            verdict = this.pkSettleForfeit + ' 逃跑 · 你胜出';
          } else if (myScore > oppScore) {
            verdict = myName + ' 胜出';
          } else if (oppScore > myScore) {
            verdict = oppName + ' 胜出';
          } else {
            verdict = '平局';
          }
          ctx.fillStyle = '#ffd36b';
          ctx.font = 'bold 40px "STKaiti","KaiTi",serif';
          ctx.fillText(verdict, 360, 672);
          ctx.fillStyle = 'rgba(220,232,255,0.8)';
          ctx.font = '22px sans-serif';
          ctx.fillText((this.pkSettleForfeit ? '即将返回标题界面 · ' : '即将返回房间 · ') + Math.max(1, Math.ceil(this.pkSettleTimer)), 360, 742);
          ctx.textAlign = 'left';
          return;
        }
        ctx.fillStyle = 'rgba(4,6,16,0.74)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = this.pkState === 'clear' ? '#9fe8b8' : '#ff9db0';
        ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.pkState === 'clear' ? '本局通关' : '你已阵亡', 360, 390);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('本局得分 ' + String(this.player.score).padStart(7, '0'), 360, 470);
        ctx.fillStyle = 'rgba(220,232,255,0.75)';
        ctx.font = '22px sans-serif';
        ctx.fillText('选择观战，或等待对方结束后结算', 360, 540);
        ctx.textAlign = 'left';
        drawButton(ctx, PK_WATCH_RECT, '观战', { font: 'bold 28px sans-serif', accent: 'rgba(140,230,180,0.95)' });
        drawButton(ctx, PK_WAIT_RECT, '等待结算', { font: 'bold 26px sans-serif', accent: 'rgba(140,200,255,0.95)' });
        this.drawPkOpponentBar(ctx);
      }

    renderPkConfirm(ctx) {
        if (!this.pkConfirm) return;
        if (this.pkState !== 'over' && this.pkState !== 'clear') return;
        ctx.fillStyle = 'rgba(4,6,16,0.62)';
        ctx.fillRect(0, 0, 720, 1280);
        drawPanel(ctx, PK_CONFIRM_PANEL);
        ctx.fillStyle = '#ffd36b';
        ctx.font = 'bold 36px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('退出房间', 360, 578);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('是否退出房间？', 360, 642);
        ctx.fillStyle = 'rgba(255,157,176,0.95)';
        ctx.font = '20px sans-serif';
        ctx.fillText('确认后本局将自动判负 · 对方胜出', 360, 682);
        ctx.textAlign = 'left';
        drawButton(ctx, PK_CONFIRM_YES, '确认退出', { font: 'bold 24px sans-serif', accent: 'rgba(255,120,120,0.9)' });
        drawButton(ctx, PK_CONFIRM_NO, '取消', { font: 'bold 24px sans-serif', accent: 'rgba(140,200,255,0.9)' });
      }

    pkEscape() {
        if (this.pkState !== 'play') return;
        this.pkFinishRun(false);
      }

      pkForfeitLocal() {
        if (this.pkLeaveSent) return;
        this.pkLeaveSent = true;
        net.sendPkForfeit();
        net.close();
        this.game.go('title');
      }


    capturePkFrame(ctx) {
        if (!this.pk || this.pkState !== 'play' || !this.pkBroadcast) return;
        const now = Date.now();
        const cv = ctx && ctx.canvas;
        if (!cv || typeof cv.toDataURL !== 'function') return;
        let target = cv;
        let period = 220;
        let quality = 0.35;
        try {
          if (typeof document !== 'undefined' && document.createElement) {
            if (!this.pkOffCanvas) {
              this.pkOffCanvas = document.createElement('canvas');
              this.pkOffCanvas.width = 270;
              this.pkOffCanvas.height = 480;
            }
            const octx = this.pkOffCanvas.getContext('2d');
            if (octx && typeof this.pkOffCanvas.toDataURL === 'function') {
              octx.drawImage(cv, 0, 0, 270, 480);
              target = this.pkOffCanvas;
              period = 66;
              quality = 0.5;
            }
          }
          if (now - this.pkLastFrameAt < period) return;
          this.pkLastFrameAt = now;
          net.sendPkFrame(target.toDataURL('image/jpeg', quality));
        } catch (e) {}
      }


  updateWave(dt) {
    if (this.state !== 'waves') return;
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.advanceEpisode();
      return;
    }
    const episode = this.stage.episodes[this.episodeIndex];
    if (!episode) {
      this.advanceEpisode();
      return;
    }
    if (episode.type === 'burst') {
      if (this.cinematic) {
        this.cinematic.t += dt;
        if (this.cinematic.t >= this.cinematic.duration) {
          this.cinematic = null;
          this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 1.5;
        }
        return;
      }
      this.episodeTimer += dt;
      for (const spawn of this.episodeSpawns) {
        if (spawn.spawned < spawn.count && this.episodeTimer >= spawn.nextAt) {
          this.spawnEnemy(spawn, spawn.spawned);
          spawn.spawned += 1;
          spawn.nextAt += spawn.interval * (0.8 + Math.random() * 0.4);
        }
      }
      const activeLeft =
        this.enemies.some((enemy) => enemy.waveId === this.activeEpisodeId) ||
        this.meteors.some((m) => m.waveId === this.activeEpisodeId);
      if (this.episodeTimer >= episode.duration && !activeLeft) {
        if (episode.meteorClearAtEnd) this.clearAllMeteors();
        this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 1.5;
      }
      return;
    }
    const activeLeft = this.enemies.some((enemy) => enemy.waveId === this.activeEpisodeId);
    if (!activeLeft) {
      this.pauseTimer = this.stage.randomPause ? rand(1.2, 2) : episode.pauseAfter || 2;
    }
  }

  advanceEpisode() {
    this.episodeIndex += 1;
    if (this.stage.id === 3 && this.episodeIndex === 10 && !this.miniBossCleared) {
      this.state = 'miniBossWarning';
      this.miniBossWarningTimer = 2.0;
      this.screenFlash = 1;
      this.game.audio.bossWarning();
      return;
    }
    if (this.episodeIndex < this.stage.episodes.length) {
      this.startEpisode(this.episodeIndex);
    } else if (this.stage.id === 2) {
      this.state = 'bossFlash';
      this.bossFlashTimer = 0.5;
    } else if (this.stage.id === 4) {
      this.state = 'bossWarning';
      this.bossWarningTimer = 2.2;
      this.game.audio.bossWarning();
    } else {
      this.state = 'bossWarning';
      this.bossWarningTimer = 2.2;
      this.game.audio.bossWarning();
    }
  }

  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (!enemy.art && this.game.artBank && this.game.artBank.ready) this.applyEnemyArt(enemy);
      enemy.update(dt, this.bullets, this.player, this.difficulty, this.time);
      if (enemy.dead) {
        this.killEnemy(enemy);
        this.removeShield(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      if (enemy.offScreen()) {
        this.removeShield(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      if (
        this.player.alive &&
        this.player.invuln <= 0 &&
        circlesOverlap(enemy.x, enemy.y, enemy.r, this.player.x, this.player.y, this.player.r + 6)
      ) {
        this.damagePlayer(20);
        enemy.damage(999);
        this.particles.burst(enemy.x, enemy.y, '#ff9dab', 10, 120, 0.4, 4);
        if (enemy.dead) {
          this.killEnemy(enemy);
          this.removeShield(enemy);
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  killEnemy(enemy, quiet) {
      if (this.coop && this.player2) this.player2.addExp(enemy.exp);
      this.player.addExp(enemy.exp);
      this.addTeamScore(enemy.score);
      this.particles.explosion(enemy.x, enemy.y, enemy.flashing ? '#ffd36b' : '#ff8a4a');
      if (!quiet) this.game.audio.explosion();
      if (enemy.glow === 'yellow') {
        this.pickups.push({ type: 'bomb', x: enemy.x, y: enemy.y });
      } else if (enemy.glow === 'blue') {
        this.pickups.push({ type: 'shield', x: enemy.x, y: enemy.y });
      } else if (enemy.flashing) {
        this.pickups.push({ type: 'bomb', x: enemy.x, y: enemy.y });
      } else if (this.stage.id !== 4 && Math.random() < (enemy.def.heartChance || 0)) {
        this.pickups.push({ type: 'heart', x: enemy.x, y: enemy.y });
      }
    }

  updateBossFlash(dt) {
    if (this.state !== 'bossFlash') return;
    this.bossFlashTimer -= dt;
    if (this.bossFlashTimer <= 0) {
      this.state = 'bossWarning';
      this.bossWarningTimer = 1.8;
      this.game.audio.bossWarning();
    }
  }

  updateBoss(dt) {
    if (this.state === 'miniBossWarning') {
      this.miniBossWarningTimer -= dt;
      this.ensureMiniBoss();
      if (this.miniBossWarningTimer <= 0) {
        this.state = 'miniBoss';
        if (this.boss) this.boss.showSpell('锋卫双骑 降临');
      }
      return;
    }
    if (this.state === 'miniBoss') {
      this.ensureMiniBoss();
      if (!this.boss) return;
      for (const part of this.boss.parts) {
        if (!part.art && this.game.artBank && this.game.artBank.ready) {
          part.art = this.game.artBank.get(part.artKey);
        }
      }
      this.boss.update(dt, this.bullets, this.player);
      if (this.boss.phase2 && !this.bossPhase2Played) {
        this.bossPhase2Played = true;
        this.game.audio.bossPhase();
      }
      if (this.boss.dead) {
        this.state = 'miniBossDeath';
        this.miniBossDeathTimer = 0;
        this.bullets.clearEnemy();
        for (const part of this.boss.parts) {
          this.particles.explosion(part.x, part.y, '#ffd36b');
        }
        this.pickups.push({ type: 'heart', x: 200, y: 420 });
        this.pickups.push({ type: 'heart', x: 520, y: 420 });
        this.pickups.push({ type: 'bomb', x: 360, y: 470 });
      }
      return;
    }
    if (this.state === 'miniBossDeath') {
      this.miniBossDeathTimer += dt;
      if (this.boss) {
        for (const part of this.boss.parts) {
          this.particles.burst(
            part.x + (Math.random() - 0.5) * 140,
            part.y + (Math.random() - 0.5) * 140,
            '#ffe9b8',
            5,
            170,
            0.6,
            5
          );
        }
      }
      if (this.miniBossDeathTimer > 3.0) {
        this.state = 'reinforceBanner';
        this.reinforceTimer = 2.5;
      }
      return;
    }
    if (this.state === 'reinforceBanner') {
      this.reinforceTimer -= dt;
      if (this.reinforceTimer <= 0) {
        this.miniBossCleared = true;
        this.episodeIndex = 10;
        this.state = 'waves';
        this.startEpisode(10);
      }
      return;
    }
    if (this.state === 'bossWarning') {
      this.bossWarningTimer -= dt;
      this.ensureBoss();
      if (this.boss) {
        this.boss.y = -190;
      }
      if (this.bossWarningTimer <= 0) {
        this.state = 'boss';
        if (this.boss) this.boss.showSpell(this.boss.config.skills[0].label);
      }
      return;
    }
    if (this.state === 'boss') {
      this.ensureBoss();
      if (!this.boss) return;
      if (!this.boss.art && this.game.artBank && this.game.artBank.ready) {
        const bossArtKey =
          this.boss.custom === 'stormEye' ? 'boss2' : this.boss.custom === 'finalLord' ? 'boss3' : this.boss.custom === 'alienMothership' ? 'mothership' : 'boss';
        this.boss.art = this.game.artBank.get(bossArtKey);
      }
      if (this.stage.id === 4 && this.boss.custom === 'alienMothership' && !this.boss4BgmPlayed) {
        this.boss4BgmPlayed = true;
        this.game.audio.playBoss4Bgm();
      }
      this.boss.summonCallback = (types) => this.spawnBossEscorts(types);
      this.boss.update(dt, this.bullets, this.player);
      if (this.boss.phase !== this.bossPhase) {
        this.bossPhase = this.boss.phase;
        this.game.audio.bossPhase();
      }
      if (this.boss.dead) {
        this.state = 'bossDeath';
        this.bossDeathTimer = 0;
        this.bullets.clearEnemy();
        this.particles.explosion(this.boss.x, this.boss.y, '#ff8fb0');
      }
      return;
    }
    if (this.state === 'bossDeath') {
      this.bossDeathTimer += dt;
      if (this.boss) {
        const color = this.boss.custom === 'finalLord' ? '#d8b6ff' : '#ffe9b8';
        this.particles.burst(this.boss.x + (Math.random() - 0.5) * 170, this.boss.y + (Math.random() - 0.5) * 170, color, 6, 170, 0.6, 5);
        if (this.boss.custom === 'finalLord' && Math.random() < dt * 7) {
          this.particles.burst(
            this.boss.x + (Math.random() - 0.5) * 240,
            this.boss.y + (Math.random() - 0.5) * 240,
            '#ffd36b',
            8,
            230,
            0.7,
            6
          );
        }
      }
      if (this.boss && this.boss.custom === 'alienMothership') {
        if (!this.alienDeathMusicStopped) {
          this.alienDeathMusicStopped = true;
          this.game.audio.stopBgm();
        }
        if (this.bossDeathTimer >= 5) {
          this.bossDeadFade = Math.min(1, this.bossDeadFade + dt / 1.5);
          if (this.bossDeadFade >= 1) {
            if (this.coop || this.pk) { this.triggerClear(); return; }
            this.game.go('trueending', {
              difficulty: this.difficulty.id,
              score: this.player.score,
              progress: this.progressState(),
              invincible: this.player.invincible,
            });
          }
        }
        return;
      }
      if (this.fakeEndingMode && this.boss && this.boss.custom === 'finalLord') {
        if (this.bossDeathTimer >= 4 && !this.finalLordDropsSent) {
          this.finalLordDropsSent = true;
          this.addTeamScore(200000);
          this.pickups.push({ type: 'heart', x: 140, y: 500 });
          this.pickups.push({ type: 'heart', x: 300, y: 560 });
          this.pickups.push({ type: 'heart', x: 420, y: 560 });
          this.pickups.push({ type: 'heart', x: 580, y: 500 });
          this.pickups.push({ type: 'bomb', x: 230, y: 640 });
          this.pickups.push({ type: 'bomb', x: 490, y: 640 });
        }
        if (this.bossDeathTimer >= 9.5) {
          if (this.coop || this.pk) { this.triggerClear(); return; }
          this.game.audio.playTitleBgm();
          this.game.go('fakeending', {
            difficulty: this.difficulty.id,
            score: this.player.score,
            progress: this.progressState(),
            invincible: this.player.invincible,
          });
        }
        return;
      }
      if (this.boss && this.boss.custom === 'finalLord' && !this.finalLordDropsSent) {
        this.finalLordDropsSent = true;
        this.addTeamScore(200000);
        this.pickups.push({ type: 'heart', x: 140, y: 500 });
        this.pickups.push({ type: 'heart', x: 300, y: 560 });
        this.pickups.push({ type: 'heart', x: 420, y: 560 });
        this.pickups.push({ type: 'heart', x: 580, y: 500 });
        this.pickups.push({ type: 'bomb', x: 230, y: 640 });
        this.pickups.push({ type: 'bomb', x: 490, y: 640 });
      }
      const deathDuration =
        this.boss && this.boss.custom === 'stormEye' ? 3.4 :
        this.boss && this.boss.custom === 'finalLord' ? 4.0 : 2.2;
      if (this.bossDeathTimer > deathDuration) {
        this.triggerClear();
      }
    }
  }

  updateCollisions() {
    for (let i = this.bullets.player.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.player[i];
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (circlesOverlap(bullet.x, bullet.y, bullet.r, enemy.x, enemy.y, enemy.r)) {
          const shield = this.findShieldFor(enemy);
          if (shield) {
            shield.hp -= bullet.damage;
            this.particles.sparkle(shield.enemy.x, shield.enemy.y, shield.kind === 'em' ? '#c26bff' : '#ffd36b', 3);
            if (shield.hp <= 0) {
              shield.active = false;
              this.particles.explosion(shield.enemy.x, shield.enemy.y, shield.kind === 'em' ? '#c26bff' : '#ffe9b8');
              this.game.audio.hit();
            }
          } else {
            enemy.damage(bullet.damage);
            if (enemy.dead) {
              this.killEnemy(enemy);
              this.removeShield(enemy);
              this.enemies.splice(j, 1);
            }
          }
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (let k = this.bullets.enemy.length - 1; k >= 0; k -= 1) {
          const missile = this.bullets.enemy[k];
          if (!missile.destructible) continue;
          if (circlesOverlap(bullet.x, bullet.y, bullet.r, missile.x, missile.y, missile.r)) {
            missile.hp -= bullet.damage;
            this.particles.sparkle(missile.x, missile.y, '#ffb13d', 3);
            if (missile.hp <= 0) {
              this.bullets.enemy.splice(k, 1);
              this.particles.explosion(missile.x, missile.y, '#ffb13d');
              this.game.audio.hit();
            }
            hit = true;
            break;
          }
        }
      }
      if (!hit && this.boss && !this.boss.dead && this.state === 'boss') {
        const turretSide = this.boss.hitTurret(bullet.x, bullet.y, bullet.r);
        if (turretSide) {
          this.boss.damageTurret(turretSide, bullet.damage);
          this.particles.sparkle(bullet.x, bullet.y, '#ff5f6b', 3);
          hit = true;
        } else if (circlesOverlap(bullet.x, bullet.y, bullet.r, this.boss.x, this.boss.y, this.boss.r)) {
          this.boss.damage(bullet.damage);
          this.particles.sparkle(bullet.x, bullet.y, '#ffd36b', 2);
          hit = true;
        }
      }
      if (!hit && this.boss && this.boss.custom === 'twinGuards' && this.state === 'miniBoss') {
        for (const part of this.boss.parts) {
          if (!part.dead && circlesOverlap(bullet.x, bullet.y, bullet.r, part.x, part.y, part.r)) {
            this.boss.damagePart(part.key, bullet.damage);
            this.particles.sparkle(bullet.x, bullet.y, '#ffd36b', 3);
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (let k = this.meteors.length - 1; k >= 0; k -= 1) {
          const meteor = this.meteors[k];
          if (circlesOverlap(bullet.x, bullet.y, bullet.r, meteor.x, meteor.y, meteor.r)) {
            meteor.hp -= bullet.damage;
            this.particles.sparkle(meteor.x, meteor.y, '#d8a06a', 2);
            if (meteor.hp <= 0) this.explodeMeteor(meteor, k, true);
            hit = true;
            break;
          }
        }
      }
      if (hit) this.bullets.player.splice(i, 1);
    }

    if (this.player.alive && this.player.invuln <= 0) {
      if (this.boss && this.boss.custom === 'stormEye' && this.boss.isDiving() &&
          circlesOverlap(this.player.x, this.player.y, this.player.r, this.boss.x, this.boss.y, this.boss.r * 0.75)) {
        this.damagePlayer(25);
        this.boss.flash = 1;
        this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
        this.game.audio.hit();
      }
      if (this.boss && this.boss.custom === 'twinGuards') {
        for (const part of this.boss.parts) {
          if (!part.dead && part.diveState === 'dive' &&
              circlesOverlap(this.player.x, this.player.y, this.player.r, part.x, part.y, part.r * 0.8)) {
            this.damagePlayer(25);
            part.flash = 1;
            this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
            this.game.audio.hit();
          }
        }
      }

      if (this.boss && this.boss.custom === 'alienMothership' && this.boss.isAlienDiving() &&
          circlesOverlap(this.player.x, this.player.y, this.player.r, this.boss.x, this.boss.y, this.boss.r * 0.8)) {
        this.damagePlayer(30);
        this.boss.flash = 1;
        this.particles.burst(this.player.x, this.player.y, '#ff5f6b', 10, 180, 0.45, 4);
        this.game.audio.hit();
      }
      for (const beam of this.bullets.beams) {
        if (beam.timer < (beam.charge || 0)) continue;
        const beamHit = beam.direction === 'horizontal'
          ? Math.abs(this.player.y - beam.y) <= beam.width / 2 + this.player.r + 4
          : this.player.y >= beam.y && Math.abs(this.player.x - beam.x) <= beam.width / 2 + this.player.r + 4;
        if (beamHit) {
          if (beam.hitTimer <= 0) {
            beam.hitTimer = beam.hitInterval || 0.4;
            this.damagePlayer(beam.damage || 20);
            this.particles.burst(this.player.x, this.player.y, '#ff8a4a', 10, 160, 0.45, 4);
            this.game.audio.hit();
          }
        }
      }
    }

    if (!this.player.alive || this.player.invuln > 0) {
      if (this.coop) this.updatePlayer2Collisions();
      return;
    }
    for (let i = this.bullets.enemy.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets.enemy[i];
      if (circlesOverlap(bullet.x, bullet.y, bullet.r, this.player.x, this.player.y, this.player.r + 2)) {
        const damage = bullet.large ? 30 : 12;
        this.damagePlayer(damage);
        this.bullets.enemy.splice(i, 1);
        if (bullet.fragment) this.bullets.spawnFragments(bullet);
        this.particles.burst(this.player.x, this.player.y, '#ff6f91', 8, 140, 0.4, 4);
        this.game.audio.hit();
      }
    }
    this.updatePlayer2Collisions();
  }

  updatePickups(dt) {
      const ships = this.player2 ? [this.player, this.player2] : [this.player];
      for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
        const pickup = this.pickups[i];
        pickup.y += 85 * dt;
        if (pickup.y > 1320) {
          this.pickups.splice(i, 1);
          continue;
        }
        for (const p of ships) {
          if (p.spectating || !p.alive) continue;
          if (!circlesOverlap(pickup.x, pickup.y, 18, p.x, p.y, p.r + 16)) continue;
          if (pickup.type === 'heart') p.heal(30);
          if (pickup.type === 'bomb') {
            if (this.coop) this.player.addBomb(1);
            else p.addBomb(1);
          }
          if (pickup.type === 'shield') p.shield = Math.min(p.maxShield, p.shield + 50);
          this.game.audio.pickup();
          this.particles.sparkle(
            pickup.x,
            pickup.y,
            pickup.type === 'heart' ? '#ff8fb0' : pickup.type === 'shield' ? '#4da6ff' : '#ffd36b',
            8
          );
          this.pickups.splice(i, 1);
          break;
        }
      }
    }

  tryBomb(player) {
      const bomber = this.coop ? player || this.player : this.player;
      if ((this.player.bombs <= 0 && !this.player.invincible) || !bomber.alive || bomber.spectating || this.bombFx) return;
      if (!this.player.invincible) this.player.bombs -= 1;
      bomber.invuln = 3;
      this.bullets.clearEnemy();
      this.bombFx = { timer: 0, count: 0, x: bomber.x, y: bomber.y };
      this.bombTextTimer = 1.5;
      this.screenFlash = 1;
      this.game.audio.bomb();
      this.particles.burst(bomber.x, bomber.y, '#ffe9b8', 42, 320, 0.9, 6);
      for (const enemy of this.enemies.slice()) {
        this.killEnemy(enemy, true);
      }
      this.enemies = [];
      this.shields = [];
      this.meteors = [];
      this.meteorStormTimer = 0;
      this.cinematic = null;
      this.bossPlaceholderTimer = 0;
      if (this.boss && this.boss.custom === 'alienMothership' && !this.boss.dead && this.state === 'boss') {
        for (const turret of this.boss.turrets) {
          if (!turret.broken) this.boss.damageTurret(turret.side, 500);
        }
        if (this.boss.turrets.every((t) => t.broken)) this.boss.damage(500);
        this.particles.burst(this.boss.x, this.boss.y, '#ff8fb0', 22, 220, 0.7, 6);
      } else if (this.boss && !this.boss.dead && (this.state === 'boss' || this.state === 'miniBoss')) {
        this.boss.damage(500);
        this.particles.burst(this.boss.x, this.boss.y, '#ff8fb0', 22, 220, 0.7, 6);
      }
    }

  updateBombFx(dt) {
      if (this.bombFx) {
        this.bombFx.timer += dt;
        while (this.bombFx.count < 3 && this.bombFx.timer >= this.bombFx.count * 0.32) {
          const radius = 260 + this.bombFx.count * 60;
          const color = this.bombFx.count === 0 ? '#ffffff' : '#ffe9b8';
          this.particles.ring(this.bombFx.x, this.bombFx.y, color, radius, 0.85, 10 - this.bombFx.count * 2);
          this.bombFx.count += 1;
        }
        if (this.bombFx.count >= 3) this.bombFx = null;
      }
      this.screenFlash = Math.max(0, this.screenFlash - dt * 1.05);
      this.bombTextTimer = Math.max(0, this.bombTextTimer - dt);
    }

  progressState() {
    return this.player.toState();
  }

  makeSnapshot() {
    const snap = Object.assign(
      {
        version: 1,
        difficulty: this.difficulty.id,
        stage: this.stage.id,
        waveIndex: this.episodeIndex,
        bossPhase: this.boss && this.boss.phase ? this.boss.phase : 0,
        miniBossCleared: !!this.miniBossCleared,
      },
      this.player.toState(),
      { savedAt: Date.now() }
    );
    if (this.boss && this.boss.custom === 'twinGuards') {
      snap.twinHp = this.boss.parts.map((part) => ({ key: part.key, hp: Math.round(part.hp) }));
    } else if (this.boss) {
      snap.bossHp = Math.round(this.boss.hp);
      snap.bossMaxHp = this.boss.maxHp;
    }
    return snap;
  }

  damagePlayer(amount) {
    if (this.player.damage(amount)) {
      this.hitFlash = 0.5;
      platform.vibrateShort();
    }
  }

  spawnMeteor(spawn, index) {
    const size = spawn.size || 'medium';
    const sizes = {
      large: { r: 34, hp: 1500, speed: 90 },
      medium: { r: 22, hp: 750, speed: 140 },
      small: { r: 13, hp: 300, speed: 190 },
    };
    const cfg = sizes[size] || sizes.medium;
    const baseSpeed = cfg.speed * 1.2 * (spawn.speedFactor || 1);
    const side = spawn.side || 'top';
    let vx = 0;
    let vy = 0;
    let x = 360;
    let y = -60;
    if (side === 'top') {
      x = rand(40, 680);
      y = -60;
      vx = rand(-40, 40);
      vy = baseSpeed;
    } else if (side === 'bottom') {
      x = rand(40, 680);
      y = 1340;
      vx = rand(-40, 40);
      vy = -baseSpeed;
    } else if (side === 'left') {
      x = -60;
      y = rand(100, 900);
      vx = baseSpeed;
      vy = rand(-30, 50);
    } else {
      x = 780;
      y = rand(100, 900);
      vx = -baseSpeed;
      vy = rand(-30, 50);
    }
    this.meteors.push({
      x,
      y,
      vx,
      vy,
      r: cfg.r,
      size,
      hp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      maxHp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      spin: rand(0, TAU),
      spinSpeed: rand(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1),
      waveId: this.activeEpisodeId,
      seed: Math.random(),
    });
  }

  spawnSplitMeteor(size, x, y, angle) {
    const sizes = {
      large: { r: 34, hp: 1500, speed: 90 },
      medium: { r: 22, hp: 750, speed: 140 },
      small: { r: 13, hp: 300, speed: 190 },
    };
    const cfg = sizes[size];
    const speed = cfg.speed * 1.2 * rand(0.85, 1.15);
    this.meteors.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: cfg.r,
      size,
      hp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      maxHp: Math.max(1, Math.round(cfg.hp * this.difficulty.enemyHp)),
      spin: rand(0, TAU),
      spinSpeed: rand(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1),
      waveId: this.activeEpisodeId,
      seed: Math.random(),
    });
  }

  explodeMeteor(meteor, index, dropBoost) {
    this.particles.explosion(meteor.x, meteor.y, '#c97b45');
    this.particles.burst(meteor.x, meteor.y, '#ffb36b', 8, 160, 0.5, 5);
    if (meteor.size === 'large') {
      for (let k = 0; k < 3; k += 1) {
        const ang = (k / 3) * TAU + rand(0, 0.4);
        this.spawnSplitMeteor('medium', meteor.x, meteor.y, ang);
      }
    } else if (meteor.size === 'medium') {
      for (let k = 0; k < 3; k += 1) {
        const ang = (k / 3) * TAU + rand(0, 0.4);
        this.spawnSplitMeteor('small', meteor.x, meteor.y, ang);
      }
    }
    this.meteors.splice(index, 1);
  }

  clearAllMeteors() {
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      this.explodeMeteor(this.meteors[i], i, true);
    }
  }

  updateMeteors(dt) {
    if (this.meteorStormTimer > 0) this.meteorStormTimer = Math.max(0, this.meteorStormTimer - dt);
    for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
      const m = this.meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.spin += m.spinSpeed * dt;
      if (m.y > 1360 || m.y < -160 || m.x > 800 || m.x < -80) {
        this.meteors.splice(i, 1);
        continue;
      }
      if (
        this.player.alive &&
        this.player.invuln <= 0 &&
        circlesOverlap(m.x, m.y, m.r, this.player.x, this.player.y, this.player.r + 6)
      ) {
        this.damagePlayer(30);
        this.explodeMeteor(m, i, false);
      }
    }
  }

  renderMeteors(ctx) {
    const artMap = { large: 'meteor_large', medium: 'meteor_medium', small: 'meteor_small' };
    for (const m of this.meteors) {
      const img = this.game.artBank ? this.game.artBank.get(artMap[m.size] || 'meteor_medium') : null;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.spin);
      if (img) {
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (m.r * 3.2) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#5a4636';
        ctx.strokeStyle = 'rgba(30,20,12,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const points = 9;
        for (let p = 0; p < points; p += 1) {
          const a = (p / points) * TAU;
          const rr = m.r * (0.82 + 0.18 * Math.sin(m.seed * 97 + p * 1.7));
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(30,20,12,0.55)';
        ctx.beginPath();
        ctx.arc(-m.r * 0.3, -m.r * 0.2, m.r * 0.28, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.r * 0.25, m.r * 0.3, m.r * 0.18, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(178,107,255,0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, m.r * 1.12, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      if (m.hp < m.maxHp && m.hp > 0) {
        ctx.fillStyle = 'rgba(10,12,8,0.7)';
        ctx.fillRect(m.x - m.r, m.y - m.r - 12, m.r * 2, 4);
        ctx.fillStyle = '#ff7043';
        ctx.fillRect(m.x - m.r, m.y - m.r - 12, m.r * 2 * clamp(m.hp / m.maxHp, 0, 1), 4);
      }
    }
  }

  offerRevive() {
    if (this.coop || this.pk) return false;
    if (this.player.invincible) return false;
    if (this.params.debugStage) return false;
    if (this.player.reviveUsed >= 2) return false;
    if (this.gameOverSent || this.clearSent) return false;
    this.revivePhase = 'prompt';
    return true;
  }

  updateRevive(dt) {
    if (this.revivePhase === 'ad') {
      this.reviveAdTimer -= dt;
      if (this.reviveAdTimer <= 0) {
        this.reviveAdTimer = 0;
        this.revivePhase = null;
        this.performRevive();
      }
      return;
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, REVIVE_YES)) {
      this.game.audio.pickup();
      this.revivePhase = 'ad';
      this.reviveAdTimer = 15;
    } else if (this.inRect(tap, REVIVE_NO)) {
      this.revivePhase = null;
      this.triggerGameOver();
    }
  }

  performRevive() {
    this.player.lives = Math.max(0, this.player.lives + 1);
    this.player.reviveUsed += 1;
    this.player.respawn();
    this.bullets.clearEnemy();
    this.particles.ring(this.player.x, this.player.y, '#b7e0ff', 90, 0.6, 5);
    this.game.audio.pickup();
  }

  checkGameOver() {
    if (this.gameOverSent || this.clearSent) return;
    if (this.coop) return;
    if (this.player.lives < 0) {
      if (this.offerRevive()) return;
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
      if (this.gameOverSent) return;
      this.gameOverSent = true;
      if (this.coop) {
        if (!this.coopEndSent) { this.coopEndSent = true; net.gameover(); }
        this.game.audio.stopLighting();
        this.game.audio.gameover();
        this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        return;
      }
      if (this.pk) {
        this.pkFinishRun(false);
        return;
      }
      if (!this.player.invincible) storage.clearSave();
      this.game.audio.stopLighting();
      this.game.audio.gameover();
      this.game.go('gameover', {
        difficulty: this.difficulty.id,
        score: this.player.score,
        stage: this.stage.id,
        progress: this.progressState(),
        challenge: this.challenge,
      });
    }

  triggerClear() {
      if (this.clearSent) return;
      this.clearSent = true;
      if (this.coop) {
        const nextStage = this.stage.id + 1;
        const hasNext = nextStage <= this.difficulty.stageCount && !!getStage(nextStage).enabled;
        if (hasNext) {
          this.coopNextStageId = nextStage;
          this.coopNextTimer = 3.6;
          this.state = 'coopNext';
          this.game.audio.stopLighting();
          this.game.audio.clear();
          return;
        }
        if (!this.coopEndSent) { this.coopEndSent = true; net.gameover(); }
        this.game.audio.stopLighting();
        this.game.audio.clear();
        this.game.go('mproom', { name: net.name, roomId: this.roomId, playerIndex: this.playerIndex, fromGame: true });
        return;
      }
      if (this.pk) {
        const nextStage = this.stage.id + 1;
        const hasNext = nextStage <= this.difficulty.stageCount && !!getStage(nextStage).enabled;
        if (hasNext) {
          this.pkNextStageId = nextStage;
          this.pkNextTimer = 3.4;
          this.state = 'pkNext';
          this.game.audio.stopLighting();
          this.game.audio.clear();
          return;
        }
        this.pkFinishRun(true);
        return;
      }
      if (!this.player.invincible) storage.clearSave();
      this.game.audio.stopLighting();
      this.game.audio.clear();
      this.game.go('stageclear', {
        difficulty: this.difficulty.id,
        score: this.player.score,
        stage: this.stage.id,
        progress: this.progressState(),
      });
    }

  render(ctx) {
    this.background.render(ctx, { lightning: this.lightningFlash });
    this.renderMeteors(ctx);
    if (this.cinematic) {
      const img = this.game.artBank ? this.game.artBank.get('mothership') : null;
      const ct = this.cinematic.t / Math.max(0.001, this.cinematic.duration);
      const cx = 360 + (ct - 0.5) * 1000;
      const cy = 70 - Math.sin(ct * Math.PI) * 36;
      ctx.save();
      ctx.globalAlpha = 0.8;
      if (img) {
        const cs = 0.42;
        const cw = img.width * cs;
        const ch = img.height * cs;
        ctx.shadowColor = '#c26bff';
        ctx.shadowBlur = 22;
        ctx.drawImage(img, cx - cw / 2, cy - ch / 2, cw, ch);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(194,107,255,0.55)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('异形母舰 · 远景掠过', 360, 132);
      ctx.textAlign = 'left';
    }
    for (const shield of this.shields) this.renderShield(ctx, shield);
    for (const pickup of this.pickups) this.renderPickup(ctx, pickup);
    for (const enemy of this.enemies) enemy.render(ctx, this.time);
    if (
      this.boss &&
      this.state !== 'intro' &&
      !(this.fakeEndingMode && this.state === 'bossDeath' && this.bossDeathTimer >= 4) &&
      !(this.boss.custom === 'alienMothership' && this.state === 'bossDeath' && this.bossDeathTimer >= 5)
    ) {
      this.boss.render(ctx, this.time);
    }
    if (!this.player.spectating) this.player.render(ctx, this.time);
    if (this.coop && this.player2 && !this.player2.spectating) this.player2.render(ctx, this.time);
    this.bullets.renderEnemy(ctx);
    this.bullets.renderPlayer(ctx);
    this.bullets.renderBeams(ctx);
    this.particles.render(ctx);
    this.background.renderForeground(ctx);
    if (this.stage.id === 2 && this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(this.lightningFlash * 0.38).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    if (this.state === 'bossFlash') {
      const alpha = Math.min(1, Math.max(0, this.bossFlashTimer / 0.5));
      ctx.fillStyle = `rgba(4,6,12,${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    this.renderHud(ctx);
    this.renderCoopOverlay(ctx);
    this.renderPkOverlay(ctx);
    this.renderPkConfirm(ctx);
    this.renderIntro(ctx);
    this.renderBombFx(ctx);
    if (this.state === 'bossPlaceholder') {
      const alpha = Math.min(1, this.bossPlaceholderTimer / 0.6);
      ctx.fillStyle = `rgba(6,2,12,${(alpha * 0.6).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#d9b3ff';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('最终 Boss · 信号逼近', 360, 600);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#c9a2ff';
      ctx.fillText('Boss 战待定', 360, 660);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    if (this.hitFlash > 0) {
      const flashRatio = this.hitFlash / 0.5;
      const blink = 0.55 + 0.45 * Math.sin(this.time * 46);
      ctx.save();
      ctx.strokeStyle = `rgba(255,45,70,${(flashRatio * blink * 0.85).toFixed(3)})`;
      ctx.lineWidth = 18;
      ctx.shadowColor = '#ff2d46';
      ctx.shadowBlur = 26;
      ctx.strokeRect(9, 9, 702, 1262);
      ctx.restore();
    }
    if (this.state === 'reinforceBanner') {
      const alpha = Math.min(1, this.reinforceTimer / 0.6);
      ctx.fillStyle = `rgba(255,240,190,${(alpha * 0.16).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff3cf';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('神域大门开启', 360, 600);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('增援舰队抵达', 360, 655);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    if (this.state === 'bossDeath' && this.boss && this.boss.custom === 'finalLord') {
      if (this.fakeEndingMode) {
        const t = this.bossDeathTimer;
        if (t >= 4.5 && t < 9.5) {
          const dark = Math.min(1, Math.max(0, (t - 4.5) / 3));
          const textAlpha = t < 9.2 ? Math.min(1, (t - 4.5) / 0.8) : Math.max(0, (9.5 - t) / 0.3);
          ctx.fillStyle = `rgba(4,2,10,${dark.toFixed(3)})`;
          ctx.fillRect(0, 0, 720, 1280);
          ctx.globalAlpha = textAlpha;
          ctx.fillStyle = '#fff3cf';
          ctx.font = 'bold 38px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.fillText('击碎天阙主宰，天空重归宁静', 360, 620);
          ctx.globalAlpha = 1;
          ctx.textAlign = 'left';
        }
      } else if (this.bossDeathTimer > 2) {
        const alpha = Math.min(1, (this.bossDeathTimer - 2) / 1.2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(18,10,34,0.45)';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = '#fff3cf';
        ctx.font = 'bold 38px "STKaiti","KaiTi",serif';
        ctx.textAlign = 'center';
        ctx.fillText('击碎天阙主宰，天空重归宁静', 360, 620);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    }
    if (this.state === 'bossDeath' && this.boss && this.boss.custom === 'alienMothership' && this.bossDeadFade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.bossDeadFade.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    if (this.paused) this.pauseUi.render(ctx, this.makeSnapshot(), this.player.invincible, this.noSave, this.pk);
    if (this.revivePhase === 'prompt') {
      ctx.fillStyle = 'rgba(4,8,18,0.78)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, REVIVE_PANEL);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('是否观看广告复活？', 360, 536);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('彻底阵亡 · 观看 15 秒广告可复活', 360, 592);
      ctx.fillText('复活后残机数 +1 · 本局最多复活 2 次', 360, 628);
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('本局剩余复活次数：' + Math.max(0, 2 - this.player.reviveUsed) + ' / 2', 360, 670);
      drawButton(ctx, REVIVE_YES, '观看广告复活', { font: 'bold 24px sans-serif', accent: 'rgba(255,211,107,0.95)' });
      drawButton(ctx, REVIVE_NO, '放弃本局', { font: 'bold 24px sans-serif', accent: 'rgba(255,120,120,0.95)' });
      ctx.textAlign = 'left';
    } else if (this.revivePhase === 'ad') {
      const sky = ctx.createLinearGradient(0, 0, 0, 1280);
      sky.addColorStop(0, '#1a1030');
      sky.addColorStop(0.55, '#3a1f52');
      sky.addColorStop(1, '#120b20');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = 'rgba(255,220,120,0.14)';
      for (let i = 0; i < 5; i += 1) {
        const x = (i * 173 + 60) % 720;
        const y = (i * 257 + 80) % 1280;
        ctx.beginPath();
        ctx.arc(x, y, 42 + i * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('广告', 360, 150);
      ctx.fillStyle = '#fff3e0';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('复活药剂 · 星海补给站', 360, 260);
      ctx.fillStyle = '#f2e7ff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('观看完成即可复活继续战斗', 360, 360);
      const adSeconds = Math.max(0, Math.ceil(this.reviveAdTimer));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('广告剩余 ' + adSeconds + ' 秒', 360, 520);
      const barX = 170;
      const barW = 380;
      const progress = 1 - this.reviveAdTimer / 15;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(barX, 560, barW, 12);
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(barX, 560, barW * Math.max(0, Math.min(1, progress)), 12);
      ctx.fillStyle = 'rgba(220,232,255,0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText('（模拟广告 · 观看完成后将自动复活）', 360, 640);
      ctx.textAlign = 'left';
    }
    this.capturePkFrame(ctx);
  }

  renderShield(ctx, shield) {
    if (!shield.active) return;
    const pulse = 1 + Math.sin(this.time * 3) * 0.03;
    const r = shield.radius * pulse;
    const ratio = shield.kind === 'em' ? 1 : shield.hp / shield.maxHp;
    const palettes = {
      normal: { inner: '255,220,120', mid: '255,200,80', outer: '255,180,60', edge: '255,220,130', low: '255,120,80', crack: '255,90,70' },
      erosion: { inner: '120,20,30', mid: '150,30,40', outer: '190,45,55', edge: '255,110,120', low: '255,80,90', crack: '255,70,80' },
      em: { inner: '170,90,255', mid: '160,70,255', outer: '150,60,235', edge: '210,150,255', low: '255,150,120', crack: '255,120,90' },
    };
    const pal = palettes[shield.kind] || palettes.normal;
    const grad = ctx.createRadialGradient(shield.enemy.x, shield.enemy.y, r * 0.2, shield.enemy.x, shield.enemy.y, r);
    grad.addColorStop(0, `rgba(${pal.inner},0.10)`);
    grad.addColorStop(0.8, `rgba(${pal.mid},0.18)`);
    grad.addColorStop(1, `rgba(${pal.outer},0.34)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(shield.enemy.x, shield.enemy.y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = ratio > 0.5 ? `rgba(${pal.edge},0.55)` : `rgba(${pal.low},0.7)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shield.enemy.x, shield.enemy.y, r, 0, TAU);
    ctx.stroke();
    if (ratio < 0.5) {
      ctx.strokeStyle = `rgba(${pal.crack},0.45)`;
      for (let i = 0; i < 5; i += 1) {
        const a = (i * TAU) / 5 + this.time * 0.4;
        ctx.beginPath();
        ctx.moveTo(shield.enemy.x + Math.cos(a) * r * 0.75, shield.enemy.y + Math.sin(a) * r * 0.75);
        ctx.lineTo(shield.enemy.x + Math.cos(a) * r, shield.enemy.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
  }

  renderPickup(ctx, pickup) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    const pulse = 1 + Math.sin(this.time * 6) * 0.12;
    ctx.scale(pulse, pulse);
    if (pickup.type === 'shield') {
      ctx.fillStyle = '#2f7fe0';
      ctx.shadowColor = '#4da6ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dff0ff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('盾', 0, 5);
    } else if (pickup.type === 'heart') {
      ctx.fillStyle = '#ff6f91';
      ctx.shadowColor = '#ff6f91';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-10, -2, -7, -12, 0, -6);
      ctx.bezierCurveTo(7, -12, 10, -2, 0, 8);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f7c948';
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('必', 0, 6);
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  renderHud(ctx) {
      if (this.coop && this.player2) {
        drawCoopHud(ctx, { stage: this.stage.id }, this.player, this.player2, this.hostName || 'P1', this.guestName || 'P2');
      } else {
        drawHud(ctx, this.player, { stage: this.stage.id });
      }
      if (
        this.boss &&
        this.boss.custom === 'twinGuards' &&
        (this.state === 'miniBossWarning' || this.state === 'miniBoss' || this.state === 'miniBossDeath')
      ) {
        drawTwinBossHud(ctx, this.boss);
      } else if (this.boss && (this.state === 'boss' || this.state === 'bossDeath' || this.state === 'bossWarning')) {
        drawBossHud(ctx, this.boss);
      }
    }

  renderIntro(ctx) {
    if (this.state !== 'intro' || this.introTimer <= 0) return;
    const alpha = Math.min(1, this.introTimer / 0.9);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(12,8,4,0.72)';
    ctx.fillRect(0, 470, 720, 130);
    ctx.fillStyle = '#fff8e8';
    ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    const main = this.stage.title;
    ctx.fillText(main, 360, 545);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  renderBombFx(ctx) {
    if (this.bombTextTimer > 0) {
      const alpha = Math.min(1, this.bombTextTimer / 0.35);
      ctx.globalAlpha = Math.min(1, alpha * 0.85);
      ctx.fillStyle = 'rgba(8,12,24,0.38)';
      ctx.fillRect(190, 470, 340, 180);
      ctx.globalAlpha = alpha;
      drawInkTitle(ctx, '全域清扫', 360, 560, 76);
      ctx.globalAlpha = 1;
    }
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, this.screenFlash).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
  }
}

module.exports = StageScene;

  });
  register("src/scenes/stageclear.js", function (module, exports, require) {
const { drawButton, drawPanel } = require('../ui/menu.js');
const { getDifficulty } = require('../config/difficulty.js');
const { getStage } = require('../config/stages.js');

const TOP_RECT = { x: 170, y: 720, w: 380, h: 64 };
const BOTTOM_RECT = { x: 170, y: 810, w: 380, h: 64 };

class StageClearScene {
  constructor(game) {
    this.game = game;
    this.params = {};
    this.stage = 1;
    this.hasNext = false;
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.params = params || {};
    this.stage = this.params.stage || 1;
    this.progress = this.params.progress || null;
    const difficulty = getDifficulty(this.params.difficulty || 'easy');
    const nextStage = this.stage + 1;
    this.hasNext = nextStage <= difficulty.stageCount && !!getStage(nextStage).enabled;
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, TOP_RECT)) {
      if (this.hasNext) {
        this.game.audio.pickup();
        this.game.go('story', { difficulty: this.params.difficulty || 'easy', stage: this.stage + 1, progress: this.progress });
      } else {
        this.game.go('title');
      }
      return;
    }
    if (this.inRect(tap, BOTTOM_RECT)) {
      if (this.hasNext) {
        this.game.go('title');
      } else {
        this.game.go('stage', { mode: 'new', difficulty: this.params.difficulty || 'easy', stage: this.stage });
      }
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#182438');
    sky.addColorStop(0.5, '#31465f');
    sky.addColorStop(1, '#1a2637');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 56px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd36b';
    ctx.shadowBlur = 20;
    ctx.fillText(`Stage ${this.stage} Clear`, 360, 430);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e9eefc';
    ctx.font = '26px sans-serif';
    ctx.fillText(`Score ${String(this.params.score || 0).padStart(7, '0')}`, 360, 530);
    ctx.fillStyle = 'rgba(220,232,255,0.75)';
    ctx.font = '18px sans-serif';
    const stage = getStage(this.stage);
    ctx.fillText(`${stage.title} · ${stage.subtitle}`, 360, 600);
    if (this.hasNext) {
      ctx.fillText('云海深处仍有异动，继续追击', 360, 640);
    } else {
      ctx.fillText('天阙重归宁静，云阙飞戈凯旋', 360, 640);
    }

    if (this.hasNext) {
      drawButton(ctx, TOP_RECT, '下一关');
      drawButton(ctx, BOTTOM_RECT, 'Return to Title');
    } else {
      drawButton(ctx, TOP_RECT, 'Return to Title');
      drawButton(ctx, BOTTOM_RECT, 'Replay Stage');
    }
  }
}

module.exports = StageClearScene;
  });
  register("src/scenes/story.js", function (module, exports, require) {
const { drawButton, drawPanel } = require('../ui/menu.js');

const STORY_BOOKS = {
  1: {
    title: '钢铁来袭',
    lines: [
      '黄土群山之上，天空被一片不祥的钢铁云层笼罩。',
      '未知机群越过重峦叠嶂，闯入防线，沿途播撒等离子弹幕。',
      '前线雷达接连失守，通讯里只剩下断断续续的警报。',
      '你是「云阙飞戈」中队最后的王牌，驾驶飞戈-1 截击机升空。',
      '穿过峡谷，越过山脊，目标：入侵机群核心——巨型轰炸机「荒原之矛」。',
      '击落它，让天空重新安静下来。',
    ],
  },
  2: {
    title: '雷暴云海',
    lines: [
      '钢铁机群溃散后，残影却消失在雷暴云海深处。',
      '云层之下露出古老浮城的轮廓，断塔与轨道环绕着幽蓝闪电。',
      '通讯被雷暴撕碎，雷达只剩一片雪花。',
      '你驾驶飞戈-1 压低高度，穿过闪电与雨幕。',
      '目标：风暴中心那艘吞噬云海的巡洋舰「云海之眼」。',
      '击穿它，找回被吞没的天空。',
    ],
  },
  3: {
    title: '天穹王座',
    lines: [
      '雷暴止息，云海尽头升起一座悬于天穹的金色王座。',
      '所有入侵机群都只是前哨，真正的意志高居九天之上。',
      '神域大门缓缓开启，金甲舰队倾巢而出。',
      '你以一人一机，逆着光柱直冲王座核心。',
      '最后的敌影「天阙主宰」正等待你的到来。',
      '击碎它，让天阙重归宁静。',
    ],
  },
};

const SKIP_RECT = { x: 580, y: 1180, w: 112, h: 52 };

class StoryScene {
  constructor(game) {
    this.game = game;
    this.difficulty = 'easy';
    this.stage = 1;
    this.progress = null;
    this.invincible = false;
    this.challenge = false;
    this.book = STORY_BOOKS[1];
    this.lineIndex = 0;
    this.chars = 0;
    this.timer = 0;
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.difficulty = params.difficulty || 'easy';
    this.stage = params.stage || 1;
    this.progress = params.progress || null;
    this.invincible = !!(params && params.invincible);
    this.challenge = !!(params && params.challenge);
    this.boost = !!(params && params.boost);
    this.book = STORY_BOOKS[this.stage] || STORY_BOOKS[1];
    this.lineIndex = 0;
    this.chars = 0;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
    const current = this.book.lines[this.lineIndex];
    if (this.chars < current.length) {
      this.chars = Math.min(current.length, this.chars + dt * 26);
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, SKIP_RECT)) {
      this.finish();
      return;
    }
    if (this.chars < current.length) {
      this.chars = current.length;
      return;
    }
    if (this.lineIndex < this.book.lines.length - 1) {
      this.lineIndex += 1;
      this.chars = 0;
    } else {
      this.finish();
    }
  }

  finish() {
    this.game.audio.pickup();
    this.game.go('stage', {
      mode: 'new',
      difficulty: this.difficulty,
      stage: this.stage,
      progress: this.progress,
      invincible: this.invincible,
      challenge: this.challenge,
      boost: this.boost,
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#2a1e12');
    sky.addColorStop(0.7, '#4b3520');
    sky.addColorStop(1, '#201610');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#d9b98a';
    for (let i = 0; i < 14; i += 1) {
      const x = (i * 173) % 720;
      const y = (i * 211) % 1280;
      ctx.beginPath();
      ctx.moveTo(x - 70, y + 40);
      ctx.quadraticCurveTo(x, y - 50, x + 70, y + 40);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawPanel(ctx, { x: 60, y: 180, w: 600, h: 820 });
    ctx.fillStyle = '#f4e8c8';
    ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.book.title, 360, 250);
    ctx.strokeStyle = 'rgba(244,232,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(260, 272);
    ctx.lineTo(460, 272);
    ctx.stroke();

    const current = this.book.lines[this.lineIndex];
    const visible = current.slice(0, Math.ceil(this.chars));
    ctx.fillStyle = '#e9eefc';
    ctx.font = '25px "STKaiti","KaiTi","SimSun",serif';
    ctx.textAlign = 'left';
    const lines = this.wrapText(ctx, visible, 520);
    lines.forEach((line, index) => {
      ctx.fillText(line, 100, 350 + index * 42);
    });

    ctx.fillStyle = 'rgba(230,238,255,0.65)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${this.lineIndex + 1} / ${this.book.lines.length} 段，点击继续`, 360, 940);

    drawButton(ctx, SKIP_RECT, '跳过', { font: 'bold 20px sans-serif' });
  }
}

StoryScene.BOOKS = STORY_BOOKS;

module.exports = StoryScene;

  });
  register("src/scenes/title.js", function (module, exports, require) {
const storage = require('../core/storage.js');
const achievements = require('../core/achievements.js');
const platform = require('../core/platform.js');
const { drawButton, drawPanel, drawLogo } = require('../ui/menu.js');
const AmbientField = require('../ui/ambient.js');
const { clamp, easeOutCubic } = require('../utils/math.js');

const CONVENTIONAL_RECT = { x: 210, y: 620, w: 300, h: 64 };
const CHALLENGE_RECT = { x: 210, y: 720, w: 300, h: 64 };
const NEW_RECT = { x: 210, y: 620, w: 300, h: 64 };
const CONTINUE_RECT = { x: 210, y: 720, w: 300, h: 64 };
const ACHIEVEMENT_RECT = { x: 210, y: 920, w: 300, h: 64 };
const EXIT_RECT = { x: 210, y: 1020, w: 300, h: 64 };
const COOP_RECT = { x: 210, y: 820, w: 300, h: 64 };
const CONFIRM_YES = { x: 190, y: 700, w: 140, h: 56 };
const CONFIRM_NO = { x: 390, y: 700, w: 140, h: 56 };
const CONTACT_RECT = { x: 24, y: 24, w: 120, h: 48 };
const CONTACT_PANEL = { x: 90, y: 460, w: 540, h: 360 };
const CONTACT_CLOSE = { x: 260, y: 730, w: 200, h: 56 };
const DEBUG_RECT = { x: 576, y: 24, w: 120, h: 48 };
 const DEBUG_PANEL = { x: 90, y: 500, w: 540, h: 330 };

const TITLE_PALETTE = {
  skyTop: [8, 16, 36],
  skyMid: [25, 38, 66],
  skyLow: [13, 21, 38],
  starColor: [234, 242, 255],
  cloudColor: [245, 235, 210],
  mountains: [
    [42, 52, 86],
    [25, 32, 56],
    [14, 19, 34],
  ],
  accent: [255, 211, 107],
  haze: [224, 233, 255],
};

const TITLE_PALETTE_ALT = {
  skyTop: [30, 24, 48],
  skyMid: [82, 62, 78],
  skyLow: [36, 27, 44],
  starColor: [255, 235, 208],
  cloudColor: [255, 221, 168],
  mountains: [
    [58, 45, 72],
    [40, 31, 56],
    [23, 18, 34],
  ],
  accent: [255, 196, 96],
  haze: [255, 218, 184],
};

class TitleScene {
  constructor(game) {
    this.game = game;
    this.hasSave = false;
    this.menuLevel = 1;
    this.confirmOverwrite = false;
    this.showContact = false;
    this.contactTime = 0;
    this.time = 0;
    this.menuIn = 0;
    this.overlayTime = 0;
    this.ambient = new AmbientField({
      palette: TITLE_PALETTE,
      paletteAlt: TITLE_PALETTE_ALT,
      moon: { x: 560, y: 158, r: 46, color: '#f7efd8' },
      fighterCount: 3,
    });
  }

  enter() {
    this.game.audio.playTitleBgm();
    this.hasSave = storage.hasSave();
    this.menuLevel = 1;
    this.confirmOverwrite = false;
    this.showContact = false;
    this.contactTime = 0;
    this.time = 0;
    this.menuIn = 0;
    this.overlayTime = 0;
    this.debugUnlocked = achievements.isDebugUnlocked();
    this.debugConfirm = false;
    this.ambient.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.menuIn = Math.min(1, this.menuIn + dt * 0.55);
    this.ambient.update(dt);
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.confirmOverwrite) {
      if (this.inRect(tap, CONFIRM_YES)) {
        this.confirmOverwrite = false;
        storage.clearSave();
        this.game.go('difficulty');
      } else if (this.inRect(tap, CONFIRM_NO)) {
        this.confirmOverwrite = false;
      }
      return;
    }
    if (this.showContact) {
      if (this.inRect(tap, CONTACT_CLOSE) || !this.inRect(tap, CONTACT_PANEL)) {
        this.showContact = false;
      }
      return;
    }
    if (this.debugConfirm) {
      if (this.inRect(tap, CONFIRM_YES)) {
        this.debugConfirm = false;
        this.startDebugAd();
      } else if (this.inRect(tap, CONFIRM_NO)) {
        this.debugConfirm = false;
      }
      return;
    }
    if (this.inRect(tap, DEBUG_RECT)) {
      this.game.audio.pickup();
      if (this.debugUnlocked) {
        this.game.go('debugstage');
      } else {
        this.debugConfirm = true;
        this.overlayTime = this.time;
      }
      return;
    }
    if (this.inRect(tap, CONTACT_RECT)) {
      if (this.menuLevel === 1) {
        this.showContact = true;
        this.contactTime = this.time;
        this.game.audio.pickup();
      } else {
        this.menuLevel = 1;
        this.menuIn = 0;
        this.game.audio.pickup();
      }
      return;
    }
    if (this.menuLevel === 1) {
      if (this.inRect(tap, CONVENTIONAL_RECT)) {
        this.menuLevel = 2;
        this.menuIn = 0;
        this.game.audio.pickup();
        return;
      }
      if (this.inRect(tap, CHALLENGE_RECT)) {
        this.game.go('difficulty', { challenge: true });
        return;
      }
      if (this.inRect(tap, COOP_RECT)) {
        this.game.go('mpname');
        return;
      }
      if (this.inRect(tap, ACHIEVEMENT_RECT)) {
        this.game.audio.pickup();
        this.game.go('achievement');
        return;
      }
      if (this.inRect(tap, EXIT_RECT)) {
        platform.exitApp();
      }
      return;
    }
    if (this.inRect(tap, NEW_RECT)) {
      if (this.hasSave) {
        this.confirmOverwrite = true;
        this.overlayTime = this.time;
      } else {
        this.game.go('difficulty');
      }
      return;
    }
    if (this.hasSave && this.inRect(tap, CONTINUE_RECT)) {
      const save = storage.loadSave();
      if (!save || save.difficulty === undefined) {
        storage.clearSave();
        this.hasSave = false;
        return;
      }
      this.game.go('stage', { mode: 'continue', save });
    }
  }

  startDebugAd() {
    this.game.go('ad', {
      duration: 15,
      headline: '解锁内测跳关',
      onDone: () => {
        achievements.setDebugUnlocked();
        achievements.unlock('debugUnlock');
        this.debugUnlocked = true;
        this.game.go('debugstage');
      },
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    this.ambient.render(ctx);

    drawLogo(ctx, 360, 380, { time: this.time, float: true, wings: true, glow: 20 });

    ctx.textAlign = 'center';
    ctx.font = '17px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(this.time * 1.8);
    ctx.fillText('云海之上，浮空神域', 360, 476);
    ctx.globalAlpha = 1;

    const dividerY = 590;
    ctx.strokeStyle = 'rgba(255,211,107,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, dividerY);
    ctx.lineTo(470, dividerY);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(360 + Math.sin(this.time * 1.4) * 90, dividerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const buttons = [];
    if (this.menuLevel === 1) {
      buttons.push(
        {
          rect: CONVENTIONAL_RECT,
          label: 'Conventional Mode',
          pulse: 0.2 + 0.14 * Math.sin(this.time * 1.6),
          accent: 'rgba(140,200,255,0.9)',
        },
        {
          rect: CHALLENGE_RECT,
          label: 'Challenge Mode',
          pulse: 0.16 + 0.12 * Math.sin(this.time * 1.7 + 0.5),
          accent: 'rgba(255,120,140,0.9)',
        },
        {
          rect: COOP_RECT,
          label: 'Local PK',
          font: 'bold 20px sans-serif',
          pulse: 0.14 + 0.1 * Math.sin(this.time * 1.8 + 1.2),
          accent: 'rgba(140,220,255,0.9)',
        },
        {
          rect: ACHIEVEMENT_RECT,
          label: 'Achievement',
          font: 'bold 20px sans-serif',
          pulse: 0.14 + 0.1 * Math.sin(this.time * 1.9 + 1.6),
          accent: 'rgba(255,211,107,0.9)',
        },
        { rect: EXIT_RECT, label: 'Exit' }
      );
    } else {
      buttons.push({
        rect: NEW_RECT,
        label: 'New Game',
        gold: this.hasSave,
        pulse: this.hasSave ? 0.5 + 0.35 * Math.sin(this.time * 2.2) : 0,
        primary: this.hasSave,
      });
      if (this.hasSave) {
        buttons.push({
          rect: CONTINUE_RECT,
          label: 'Continue Game',
          gold: true,
          primary: true,
          pulse: 0.5 + 0.35 * Math.sin(this.time * 2.2 + 0.5),
        });
      }
    }
    buttons.forEach((button, index) => {
      const t = easeOutCubic(clamp(this.menuIn * 2 - index * 0.22, 0, 1));
      const offsetY = (1 - t) * 54;
      const opts = {
        alpha: t,
        offsetY,
        pulse: button.pulse || 0,
        accent: button.primary ? 'rgba(255,211,107,0.95)' : undefined,
        glowColor: '#ffd36b',
      };
      if (button.gold) {
        const blink = Math.floor(this.time * 6) % 2 === 0 ? 1 : 0.3;
        opts.frame = `rgba(255,211,107,${blink})`;
        opts.fill = `rgba(255,211,107,${(0.12 * blink).toFixed(3)})`;
        opts.frameWidth = 3;
      }
      drawButton(ctx, button.rect, button.label, opts);
    });

    if (!this.debugUnlocked) {
      drawButton(ctx, DEBUG_RECT, '内测跳关', {
        font: 'bold 18px sans-serif',
        color: 'rgba(220,232,255,0.65)',
        frame: 'rgba(255,211,107,0.85)',
        accent: 'rgba(255,211,107,0.9)',
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,211,107,0.9)';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('看广告解锁', DEBUG_RECT.x + DEBUG_RECT.w / 2, DEBUG_RECT.y + DEBUG_RECT.h + 15);
      ctx.textAlign = 'left';
    } else {
      drawButton(ctx, DEBUG_RECT, '内测跳关', {
        font: 'bold 20px sans-serif',
        pulse: 0.1 + 0.08 * Math.sin(this.time * 1.7 + 0.4),
        accent: 'rgba(255,150,170,0.9)',
      });
    }

    drawButton(ctx, CONTACT_RECT, this.menuLevel === 1 ? 'Contact' : '返回', {
      font: 'bold 20px sans-serif',
      pulse: 0.1 + 0.08 * Math.sin(this.time * 1.6),
      accent: 'rgba(140,200,255,0.9)',
    });

    if (this.confirmOverwrite) {
      const appear = clamp((this.time - this.overlayTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 680);
      ctx.scale(scale, scale);
      ctx.translate(-360, -680);
      drawPanel(ctx, { x: 90, y: 540, w: 540, h: 280 });
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已有存档', 360, 620);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('New Game 将覆盖当前进度，确认继续？', 360, 665);
      ctx.restore();
      drawButton(ctx, CONFIRM_YES, '覆盖', { alpha: eased, accent: 'rgba(255,120,120,0.9)' });
      drawButton(ctx, CONFIRM_NO, '取消', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }

    if (this.showContact) {
      const appear = clamp((this.time - this.contactTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 640);
      ctx.scale(scale, scale);
      ctx.translate(-360, -640);
      drawPanel(ctx, CONTACT_PANEL);
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('创作者联系方式', 360, 528);
      ctx.fillStyle = '#f2f6ff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Kairi Wang', 360, 592);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('QQ邮箱：3295262408@qq.com', 360, 648);
      ctx.fillText('Wechat：PKQ_ol-20071027', 360, 704);
      ctx.restore();
      drawButton(ctx, CONTACT_CLOSE, '关闭', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }

    if (this.debugConfirm) {
      const appear = clamp((this.time - this.overlayTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 640);
      ctx.scale(scale, scale);
      ctx.translate(-360, -640);
      drawPanel(ctx, DEBUG_PANEL);
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('解锁内测跳关', 360, 566);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('首次解锁需观看 15 秒广告', 360, 622);
      ctx.fillText('解锁后永久开放 · 成就 Hello,World', 360, 656);
      ctx.restore();
      drawButton(ctx, CONFIRM_YES, '观看广告', { alpha: eased, accent: 'rgba(255,211,107,0.9)' });
      drawButton(ctx, CONFIRM_NO, '取消', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }
  }
}

module.exports = TitleScene;



  });
  register("src/scenes/trueending.js", function (module, exports, require) {
const achievements = require('../core/achievements.js');
const PAGES = [
  {
    key: 'he01',
    text: '异形母舰最后的猩红核心被彻底击穿，整艘血肉舰船停止所有机能。厚重的舰体从内部开始连锁崩解，无数增生肉质组织、机械炮舱、异形组件瞬间失活。狂暴的炮火与弹幕彻底停息，持续整场战役的压迫感骤然消散，漆黑太空终于回归死寂。',
  },
  {
    key: 'he02',
    text: '曾经试图逃逸的猩红光点，不再具备任何再生、逃逸、寄宿的力量。本源能量在核心爆炸中层层湮灭，红色脉动彻底熄灭、消散、归零。没有残留、没有潜伏、没有后手，这场异形入侵的根源被完全根除，不再有任何未来威胁。',
  },
  {
    key: 'he03',
    text: '漫天漂浮的敌机残骸、破碎舰片、残余感染物质逐渐在真空之中静默飘散。所有被异形侵蚀的空域彻底净化，诡异的血色雾气尽数褪去。遥远星河重新亮起清澈的白光，被污染的宇宙区域恢复原本安宁的秩序。',
  },
  {
    key: 'he04',
    text: '玩家的战机满身弹痕、装甲斑驳，引擎微微发烫，独自悬停在肃清后的战场中央。历经四关绝境鏖战，机身上每一道伤痕都是对抗异形入侵的证明。战机缓缓减速，紧绷全程的战斗姿态彻底松弛，代表战斗正式落幕。',
  },
  {
    key: 'he05',
    text: '深邃星空澄澈明朗，危险彻底终结。战机调转航向，朝向蔚蓝母星的方向平稳返航。战火熄灭、灾厄终结、星海重安。',
  },
];

const END_TITLE = '云海归宁，万劫终熄';
const END_SUBTITLE = '结局B · 星海烬余安';

class TrueEndingScene {
  constructor(game) {
    this.game = game;
    this.images = {};
    this.ready = false;
    this.page = 0;
    this.chars = 0;
    this.phase = 'fadein';
    this.timer = 0;
    this.fadeTimer = 0;
    this.pageFade = 0;
  }

  enter(params) {
    this.params = params || {};
    this.page = 0;
    this.chars = 0;
    this.phase = 'fadein';
    this.timer = 0;
    this.fadeTimer = 0;
    this.pageFade = 0;
    this.images = {};
    for (const page of PAGES) {
      this.images[page.key] = this.game.artBank ? this.game.artBank.get(page.key) : null;
    }
    this.ready = true;
    if (this.params.difficulty === 'insane') achievements.unlock('insaneClear');
    this.game.audio.playHeBgm();
  }

  update(dt) {
    if (!this.ready) return;
    if (this.phase === 'fadein') {
      this.fadeTimer += dt;
      if (this.fadeTimer >= 1.2) this.phase = 'story';
      return;
    }
    if (this.phase === 'story') {
      this.pageFade = Math.min(1, this.pageFade + dt / 0.5);
      const current = PAGES[this.page];
      if (this.chars < current.text.length) {
        this.chars = Math.min(current.text.length, this.chars + dt * 26);
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.chars < current.text.length) {
        this.chars = current.text.length;
        return;
      }
      if (this.page < PAGES.length - 1) {
        this.page += 1;
        this.chars = 0;
        this.pageFade = 0;
      } else {
        this.phase = 'final';
        this.timer = 0;
      }
      return;
    }
    this.timer += dt;
    if (this.timer >= 5.7) {
      this.game.audio.stopBgm();
      this.game.go('title');
    }
  }

  wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  drawImageCover(ctx, img, alpha) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const scale = Math.max(720 / img.width, 1280 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (720 - w) / 2, (1280 - h) / 2, w, h);
    ctx.restore();
  }

  render(ctx) {
    ctx.fillStyle = '#03030a';
    ctx.fillRect(0, 0, 720, 1280);
    if (!this.ready) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('影像载入中…', 360, 640);
      ctx.textAlign = 'left';
      return;
    }
    if (this.phase === 'fadein' || this.phase === 'story') {
      const current = PAGES[this.page];
      const img = this.images[current.key];
      this.drawImageCover(ctx, img, this.pageFade);
      ctx.fillStyle = `rgba(5,4,12,${(0.42 * this.pageFade).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = 'rgba(6,5,14,0.78)';
      ctx.fillRect(40, 930, 640, 250);
      ctx.strokeStyle = 'rgba(255,220,150,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40.5, 930.5, 639, 249);

      const visible = current.text.slice(0, Math.ceil(this.chars));
      ctx.fillStyle = '#f6ecd4';
      ctx.font = '24px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'left';
      const lines = this.wrapText(ctx, visible, 600);
      lines.forEach((line, index) => {
        ctx.fillText(line, 70, 980 + index * 36);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`点击继续 ${this.page + 1} / ${PAGES.length}`, 360, 1240);
      ctx.textAlign = 'left';

      if (this.phase === 'fadein') {
        const blackAlpha = Math.max(0, 1 - this.fadeTimer / 1.2);
        ctx.fillStyle = `rgba(0,0,0,${blackAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, 720, 1280);
      }
      return;
    }

    const t = this.timer;
    const whiteAlpha = Math.min(1, t / 1.5);
    const titleAlpha = t >= 1.5 && t < 3.8 ? Math.min(1, (t - 1.5) / 0.5, (3.8 - t) / 0.5) : 0;
    const subAlpha = t >= 2.5 ? Math.min(1, (t - 2.5) / 0.5) : 0;
    const darkAlpha = t >= 4.2 ? Math.min(1, (t - 4.2) / 1.5) : 0;

    ctx.fillStyle = `rgba(255,250,235,${whiteAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (titleAlpha > 0) {
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = '#2a1538';
      ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d8b6ff';
      ctx.shadowBlur = 18;
      ctx.fillText(END_TITLE, 360, 610);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (subAlpha > 0) {
      ctx.globalAlpha = subAlpha;
      ctx.fillStyle = '#7a4a8c';
      ctx.font = 'bold 28px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'center';
      ctx.fillText(END_SUBTITLE, 360, 690);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(0,0,0,${darkAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.textAlign = 'left';
  }
}

TrueEndingScene.PAGES = PAGES;

module.exports = TrueEndingScene;

  });
  register("src/ui/ambient.js", function (module, exports, require) {
const { TAU, rand, clamp } = require('../utils/math.js');

const DESIGN_W = 720;
const DESIGN_H = 1280;

const DEFAULT_PALETTE = {
  skyTop: [10, 18, 38],
  skyMid: [29, 43, 74],
  skyLow: [16, 24, 42],
  starColor: [234, 242, 255],
  cloudColor: [245, 235, 210],
  mountains: [
    [42, 52, 86],
    [25, 32, 56],
    [14, 19, 34],
  ],
  accent: [255, 211, 107],
  haze: [224, 233, 255],
};

const DEFAULT_PALETTE_ALT = {
  skyTop: [30, 24, 48],
  skyMid: [82, 62, 78],
  skyLow: [36, 27, 44],
  starColor: [255, 235, 208],
  cloudColor: [255, 221, 168],
  mountains: [
    [58, 45, 72],
    [40, 31, 56],
    [23, 18, 34],
  ],
  accent: [255, 196, 96],
  haze: [255, 218, 184],
};

function css(color) {
  return `rgb(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])})`;
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

class AmbientField {
  constructor(options) {
    const opts = options || {};
    this.paletteA = opts.palette || DEFAULT_PALETTE;
    this.paletteB = opts.paletteAlt || DEFAULT_PALETTE_ALT;
    this.time = 0;
    this.starCount = opts.starCount || 80;
    this.stars = [];
    for (let i = 0; i < this.starCount; i += 1) {
      this.stars.push({
        x: rand(0, DESIGN_W),
        y: rand(0, DESIGN_H * 0.82),
        size: rand(0.7, 2.2),
        phase: rand(0, TAU),
        speed: rand(0.6, 2.2),
      });
    }
    this.clouds = [];
    for (let i = 0; i < 8; i += 1) {
      this.clouds.push({
        x: rand(-220, DESIGN_W),
        y: rand(140, DESIGN_H - 180),
        w: rand(130, 340),
        alpha: rand(0.35, 0.85),
        speed: rand(4, 14),
        phase: rand(0, TAU),
      });
    }
    this.ridges = [
      { base: 830, amp: 150, freq: 0.006, speed: 8, offset: rand(0, TAU), phase: rand(0, TAU) },
      { base: 990, amp: 210, freq: 0.005, speed: 18, offset: rand(0, TAU), phase: rand(0, TAU) },
      { base: 1180, amp: 250, freq: 0.004, speed: 30, offset: rand(0, TAU), phase: rand(0, TAU) },
    ];
    this.fighters = [];
    const fighterCount = opts.fighterCount === undefined ? 3 : opts.fighterCount;
    for (let i = 0; i < fighterCount; i += 1) {
      this.fighters.push(this.makeFighter(true));
    }
    this.shooting = null;
    this.nextShooting = rand(2.0, 5.0);
    this.moon = opts.moon || null;
  }

  makeFighter(initial) {
    const leftToRight = Math.random() < 0.5;
    return {
      x: initial ? rand(-80, DESIGN_W + 80) : rand(-80, 200),
      y: rand(150, 760),
      scale: rand(0.55, 0.95),
      speed: rand(70, 150),
      angle: leftToRight ? 0.08 : Math.PI - 0.08,
      alpha: rand(0.4, 0.75),
      leftToRight,
      phase: rand(0, TAU),
      trail: [],
    };
  }

  palette() {
    const t = 0.5 + 0.5 * Math.sin(this.time * 0.07);
    const a = this.paletteA;
    const b = this.paletteB;
    return {
      skyTop: css(mix(a.skyTop, b.skyTop, t)),
      skyMid: css(mix(a.skyMid, b.skyMid, t)),
      skyLow: css(mix(a.skyLow, b.skyLow, t)),
      starColor: css(mix(a.starColor, b.starColor, t)),
      cloudColor: css(mix(a.cloudColor, b.cloudColor, t)),
      mountains: a.mountains.map((color, index) => css(mix(color, b.mountains[index], t))),
      accent: css(mix(a.accent, b.accent, t)),
      haze: css(mix(a.haze, b.haze, t)),
    };
  }

  update(dt) {
    this.time += dt;
    for (const star of this.stars) {
      star.phase += star.speed * dt;
    }
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x - cloud.w > DESIGN_W + 60) {
        cloud.x = -cloud.w;
        cloud.y = rand(140, DESIGN_H - 180);
      }
    }
    for (const ridge of this.ridges) {
      ridge.offset += ridge.speed * dt;
    }
    for (const fighter of this.fighters) {
      fighter.x += fighter.speed * (fighter.leftToRight ? 1 : -1) * dt;
      fighter.y += Math.sin(this.time * 0.8 + fighter.phase) * 9 * dt;
      fighter.trail.push({ x: fighter.x, y: fighter.y });
      if (fighter.trail.length > 7) fighter.trail.shift();
      if (fighter.x > DESIGN_W + 90 || fighter.x < -90) {
        fighter.trail.length = 0;
        const reset = this.makeFighter(false);
        fighter.x = reset.x;
        fighter.y = reset.y;
        fighter.scale = reset.scale;
        fighter.speed = reset.speed;
        fighter.angle = reset.angle;
        fighter.alpha = reset.alpha;
        fighter.leftToRight = reset.leftToRight;
        fighter.phase = reset.phase;
      }
    }
    if (this.shooting) {
      const s = this.shooting;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -80 || s.x > DESIGN_W + 80 || s.y > DESIGN_H + 80) {
        this.shooting = null;
      }
    } else {
      this.nextShooting -= dt;
      if (this.nextShooting <= 0) {
        this.spawnShooting();
        this.nextShooting = rand(2.5, 6.0);
      }
    }
  }

  spawnShooting() {
    const fromLeft = Math.random() < 0.5;
    this.shooting = {
      x: rand(-40, 220),
      y: rand(60, 420),
      vx: fromLeft ? rand(300, 460) : -rand(300, 460),
      vy: rand(150, 230),
      life: rand(0.55, 0.95),
      maxLife: 1,
    };
  }

  render(ctx) {
    const p = this.palette();
    const sky = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(0.45, p.skyMid);
    sky.addColorStop(0.82, p.skyLow);
    sky.addColorStop(1, p.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    if (this.moon) {
      const m = this.moon;
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 0.9);
      ctx.save();
      ctx.globalAlpha = 0.16 * pulse;
      ctx.fillStyle = p.cloudColor;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 1.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = p.cloudColor;
      ctx.shadowBlur = 26;
      ctx.fillStyle = m.color || '#f7efd8';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = p.skyLow;
      ctx.beginPath();
      ctx.arc(m.x - m.r * 0.28, m.y + m.r * 0.18, m.r * 0.18, 0, TAU);
      ctx.fill();
      ctx.arc(m.x + m.r * 0.22, m.y - m.r * 0.22, m.r * 0.13, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const star of this.stars) {
      const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(star.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = p.starColor;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = p.cloudColor;
    for (const cloud of this.clouds) {
      this.drawCloud(ctx, cloud, p);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < this.ridges.length; i += 1) {
      ctx.fillStyle = p.mountains[i];
      this.drawRidge(ctx, this.ridges[i]);
    }

    for (const fighter of this.fighters) {
      this.drawFighter(ctx, fighter, p);
    }
    ctx.globalAlpha = 1;

    if (this.shooting) {
      this.drawShooting(ctx, p);
    }

    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#000';
    for (let y = 0; y < DESIGN_H; y += 4) {
      ctx.fillRect(0, y, DESIGN_W, 1);
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(360, 640, 220, 360, 640, 780);
    vignette.addColorStop(0, 'rgba(5,8,16,0)');
    vignette.addColorStop(1, 'rgba(5,8,16,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  }

  drawCloud(ctx, cloud, p) {
    const w = cloud.w;
    const h = 13 + (cloud.w % 9);
    const x = cloud.x;
    const y = cloud.y + Math.sin(cloud.phase + this.time * 0.35) * 5;
    ctx.save();
    ctx.globalAlpha = 0.055 * cloud.alpha;
    ctx.beginPath();
    ctx.ellipse(x - w * 0.3, y, w * 0.34, h, 0, 0, TAU);
    ctx.ellipse(x, y - h * 0.35, w * 0.4, h * 1.15, 0, 0, TAU);
    ctx.ellipse(x + w * 0.3, y, w * 0.34, h, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    void p;
  }

  drawRidge(ctx, ridge) {
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_H);
    for (let x = 0; x <= DESIGN_W; x += 16) {
      const t = ridge.offset + x * ridge.freq;
      const secondary = Math.sin(x * 0.017 + ridge.phase);
      const y = ridge.base + Math.sin(t) * ridge.amp * (0.55 + 0.45 * secondary) + Math.sin(x * 0.031 + ridge.phase * 2) * ridge.amp * 0.2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(DESIGN_W, DESIGN_H);
    ctx.closePath();
    ctx.fill();
  }

  drawFighter(ctx, fighter, p) {
    const trail = fighter.trail;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i += 1) {
      const t = i / trail.length;
      ctx.globalAlpha = fighter.alpha * t * 0.28;
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * t;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = fighter.alpha;
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.angle);
    ctx.scale(fighter.scale, fighter.scale);
    ctx.fillStyle = 'rgba(8,12,22,0.86)';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = fighter.alpha * 0.85;
    ctx.fillRect(4, -2.5, 8, 5);
    ctx.restore();
  }

  drawShooting(ctx, p) {
    const s = this.shooting;
    const tailX = s.x - s.vx * 0.16;
    const tailY = s.y - s.vy * 0.16;
    const alpha = clamp(s.life / s.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = p.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7e2';
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    ctx.restore();
  }
}

module.exports = AmbientField;

  });
  register("src/ui/hud.js", function (module, exports, require) {
const { clamp } = require('../utils/math.js');

function bar(ctx, x, y, w, h, ratio, color, back) {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(ratio, 0, 1), h);
  ctx.strokeStyle = 'rgba(20,28,45,0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
}

function drawHud(ctx, player, run) {
  const px = 24;
  const barW = 220;
  ctx.fillStyle = '#ff7d8f';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HP', px, 20);
  bar(ctx, px, 24, barW, 14, player.hp / player.maxHp, '#e5486b', 'rgba(10,16,30,0.65)');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.max(0, Math.round(player.hp))}/${player.maxHp}`, px + barW, 35);

  if (player.maxShield > 0) {
    ctx.fillStyle = '#7cc4ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHIELD', px, 52);
    bar(ctx, px, 56, barW, 12, player.shield / player.maxShield, '#4da6ff', 'rgba(10,16,30,0.65)');
    ctx.fillStyle = '#dff0ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(player.shield)}/${player.maxShield}`, px + barW, 66);
  }

  const expRatio = Math.min(1, player.exp / player.expToNext());
  ctx.fillStyle = '#8fe8a4';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`EXP LV${player.level}`, px, 80);
  bar(ctx, px, 84, barW, 12, expRatio, '#4fd97a', 'rgba(10,16,30,0.65)');
  ctx.fillStyle = '#e6fff0';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(player.exp)), px + barW, 94);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`残机：${player.invincible ? '∞' : player.lives}`, px, 112);

  if (player.lifeFlash > 0) {
    const alpha = Math.min(1, player.lifeFlash / 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd36b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('奖命 +1', px, 102);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE ${String(player.score).padStart(7, '0')}`, 360, 30);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f6dff2';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Level ${run.stage}`, 690, 1230);
  ctx.textAlign = 'left';

  ctx.save();
  ctx.fillStyle = '#d9365f';
  ctx.shadowColor = '#ff8fb0';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(76, 1202, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.invincible ? '∞' : String(player.bombs), 76, 1210);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '12px sans-serif';
  ctx.fillText('BOMB', 76, 1240);
  ctx.textAlign = 'left';

  ctx.save();
  ctx.translate(680, 40);
  const ps = 14;
  const pr = 6;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-ps + pr, -ps);
  ctx.arcTo(ps, -ps, ps, ps, pr);
  ctx.arcTo(ps, ps, -ps, ps, pr);
  ctx.arcTo(-ps, ps, -ps, -ps, pr);
  ctx.arcTo(-ps, -ps, ps, -ps, pr);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-7, -8, 4, 16);
  ctx.fillRect(3, -8, 4, 16);
  ctx.restore();
}

function drawCoopHud(ctx, run, p1, p2, name1, name2) {
  const px = 24;
  const barW = 180;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE ${String(p1.score).padStart(7, '0')}`, 360, 26);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`EXP LV${p1.level}`, 360, 44);
  ctx.textAlign = 'left';
  const rows = [
    { name: name1 || 'P1', p: p1, color: '#ff7d8f' },
    { name: name2 || 'P2', p: p2, color: '#ffb347' },
  ];
  rows.forEach((row, index) => {
    const y = 58 + index * 56;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(row.name || '').slice(0, 8), px, y + 4);
    ctx.fillStyle = row.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`残机 ${row.p.invincible ? '∞' : Math.max(0, row.p.lives)}`, px + 150, y + 4);
    bar(ctx, px, y + 12, barW, 10, row.p.hp / row.p.maxHp, row.color, 'rgba(10,16,30,0.65)');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, Math.round(row.p.hp))}/${row.p.maxHp}`, px + barW, y + 21);
    ctx.textAlign = 'left';
    if (row.p.lifeFlash > 0) {
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('奖命 +1', px + 220, y + 4);
    }
  });
  ctx.fillStyle = '#f6dff2';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Level ${run.stage}`, 690, 1230);
  ctx.textAlign = 'left';
  ctx.save();
  ctx.fillStyle = '#d9365f';
  ctx.shadowColor = '#ff8fb0';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(76, 1202, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p1.invincible ? '∞' : String(p1.bombs), 76, 1210);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '12px sans-serif';
  ctx.fillText('BOMB', 76, 1240);
  ctx.textAlign = 'left';
}


function drawBossHud(ctx, boss) {
  const w = 420;
  const x = (720 - w) / 2;
  const y = 96;
  bar(ctx, x, y, w, 14, boss.hp / boss.maxHp, '#c64bb0', 'rgba(10,16,30,0.7)');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${boss.config.name}  ${boss.config.title}`, 360, y - 8);
  if (boss.custom === 'finalLord') {
    ctx.fillStyle = '#e6c9ff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`相位 ${boss.phase} / 4`, 360, y + 32);
    boss.turrets.forEach((turret, i) => {
      const podX = i === 0 ? 60 : 400;
      const podW = 260;
      bar(
        ctx,
        podX,
        y + 44,
        podW,
        10,
        turret.hp / turret.maxHp,
        turret.broken ? '#555a66' : i === 0 ? '#ffb347' : '#d86bff',
        'rgba(10,16,30,0.7)'
      );
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(turret.broken ? `${turret.name} 已击毁` : turret.name, podX + podW / 2, y + 56);
    });
  }
  if (boss.custom === 'alienMothership') {
    ctx.fillStyle = '#ffd9e6';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`相位 ${boss.phase} / 4`, 360, y + 32);
    boss.turrets.forEach((turret, i) => {
      const podX = i === 0 ? 70 : 390;
      const podW = 260;
      bar(
        ctx,
        podX,
        y + 44,
        podW,
        10,
        turret.hp / turret.maxHp,
        turret.broken ? '#555a66' : i === 0 ? '#ffb347' : '#d86bff',
        'rgba(10,16,30,0.7)'
      );
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(turret.broken ? `${turret.name} 已击毁` : turret.name, podX + podW / 2, y + 56);
    });
  }
  if (boss.bannerTimer > 0) {
    const alpha = Math.min(1, boss.bannerTimer * 1.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffe6f3';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowColor = '#ff6fa5';
    ctx.shadowBlur = 14;
    ctx.fillText(boss.spellBanner, 360, y - 30);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = 'left';
}

function drawTwinBossHud(ctx, boss) {
  const w = 300;
  const xLeft = 40;
  const xRight = 380;
  const y = 96;
  boss.parts.forEach((part, i) => {
    const x = i === 0 ? xLeft : xRight;
    const color = i === 0 ? '#ffb347' : '#d86bff';
    bar(ctx, x, y, w, 14, part.hp / part.maxHp, color, 'rgba(10,16,30,0.7)');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${part.name}  ${part.title}`, x + w / 2, y - 8);
    ctx.textAlign = 'left';
  });
  if (boss.bannerTimer > 0) {
    const alpha = Math.min(1, boss.bannerTimer * 1.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff3cf';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.fillText(boss.spellBanner, 360, y - 32);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
}

module.exports = {
  drawHud,
  drawCoopHud,
  drawBossHud,
  drawTwinBossHud,
  bar,
};

  });
  register("src/ui/menu.js", function (module, exports, require) {
function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawButton(ctx, rect, label, opts) {
  const options = opts || {};
  const active = !!options.active;
  const alpha = options.alpha === undefined ? 1 : options.alpha;
  const offsetY = options.offsetY || 0;
  const pulse = options.pulse || 0;
  const glowColor = options.glowColor || '#ffd36b';
  const accent = options.accent;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (pulse > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8 + pulse * 16;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * (0.18 + pulse * 0.28);
    roundedRectPath(ctx, rect.x - 5, rect.y + offsetY - 5, rect.w + 10, rect.h + 10, 11);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha;
  }
  ctx.fillStyle = options.fill || (active ? 'rgba(190,214,244,0.22)' : 'rgba(12,20,38,0.52)');
  ctx.strokeStyle = options.frame || (active ? '#ffe9b8' : 'rgba(232,240,255,0.75)');
  ctx.lineWidth = options.frameWidth || (active ? 2.5 : 1.5);
  roundedRectPath(ctx, rect.x, rect.y + offsetY, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  if (accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rect.x + 13, rect.y + 11 + offsetY);
    ctx.lineTo(rect.x + 13, rect.y + rect.h - 11 + offsetY);
    ctx.stroke();
  }
  ctx.fillStyle = options.color || '#f2f6ff';
  ctx.font = options.font || 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1 + offsetY);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawPanel(ctx, rect) {
  ctx.fillStyle = 'rgba(10,18,34,0.86)';
  ctx.strokeStyle = 'rgba(222,232,255,0.7)';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.stroke();
}

function drawLogo(ctx, cx, y, opts) {
  const options = opts || {};
  const time = options.time || 0;
  const floatY = options.float ? Math.sin(time * 1.6) * 7 : 0;
  const glow = options.glow === undefined ? 18 : options.glow;
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.25);
  const scale = options.scale || 1;
  ctx.save();
  ctx.translate(cx, y + floatY);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  if (options.wings) {
    const wingColor = options.wingColor || 'rgba(255,211,107,0.9)';
    ctx.strokeStyle = wingColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.72 + pulse * 0.2;
    ctx.beginPath();
    ctx.moveTo(-10, 24);
    ctx.quadraticCurveTo(-150, 42, -268, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 24);
    ctx.quadraticCurveTo(150, 42, 268, 14);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35 + pulse * 0.2;
    ctx.beginPath();
    ctx.moveTo(-14, 30);
    ctx.quadraticCurveTo(-120, 50, -210, 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, 30);
    ctx.quadraticCurveTo(120, 50, 210, 34);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffd36b';
    ctx.save();
    ctx.translate(0, 45);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#ffd36b';
  ctx.shadowBlur = glow + pulse * 8;
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 78px "STKaiti","KaiTi","SimSun",serif';
  ctx.fillText('云阙飞戈', 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd36b';
  ctx.font = 'bold 16px "STKaiti","KaiTi",serif';
  ctx.fillText('Lances of Cloudspire', 0, 34);
  ctx.restore();
}

function drawInkTitle(ctx, text, cx, cy, size) {
  ctx.save();
  ctx.textAlign = 'center';
  const font = `bold ${size}px "STKaiti","KaiTi","SimSun",serif`;
  ctx.font = font;
  for (let i = 5; i >= 1; i -= 1) {
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#000';
    ctx.fillText(text, cx + i * 2, cy + i * 2);
  }
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#1b1f2e';
  ctx.fillText(text, cx + 3, cy + 4);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(8,12,24,0.92)';
  ctx.lineWidth = 4;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = '#f0f4ff';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(360, 640, 180, 360, 640, 760);
  g.addColorStop(0, 'rgba(8,12,24,0)');
  g.addColorStop(1, 'rgba(8,12,24,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 720, 1280);
}

module.exports = {
  drawButton,
  drawPanel,
  drawLogo,
  drawInkTitle,
  drawVignette,
};
  });
  register("src/utils/idcard.js", function (module, exports, require) {
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = '10X98765432';

function validateName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}

function checksumOf(id) {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(id[i]) * WEIGHTS[i];
  }
  return CHECK_CODES[sum % 11];
}

function parseBirthday(id) {
  const year = Number(id.slice(6, 10));
  const month = Number(id.slice(10, 12));
  const day = Number(id.slice(12, 14));
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return { year, month, day, valid };
}

function calcAge(birth, now) {
  let age = now.getFullYear() - birth.year;
  const monthDiff = now.getMonth() + 1 - birth.month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.day)) {
    age -= 1;
  }
  return age;
}

function validateIdCard(id, now) {
  const today = now || new Date();
  const normalized = typeof id === 'string' ? id.trim().toUpperCase() : '';
  if (!/^\d{17}[\dX]$/.test(normalized)) {
    return { ok: false, reason: '身份证格式不正确' };
  }
  if (checksumOf(normalized) !== normalized[17]) {
    return { ok: false, reason: '身份证校验位不正确' };
  }
  const birth = parseBirthday(normalized);
  if (!birth.valid) {
    return { ok: false, reason: '身份证出生日期无效' };
  }
  const age = calcAge(birth, today);
  if (age < 18) {
    return { ok: false, reason: '未满18岁无法进入' };
  }
  return { ok: true, birthday: birth, age };
}

function validateAuth(name, id, now) {
  if (!validateName(name)) {
    return { ok: false, reason: '姓名需为2-20个字符' };
  }
  const idResult = validateIdCard(id, now);
  if (!idResult.ok) return idResult;
  return { ok: true, name: name.trim(), ...idResult };
}

module.exports = {
  validateName,
  validateIdCard,
  validateAuth,
  calcAge,
  checksumOf,
};

  });
  register("src/utils/math.js", function (module, exports, require) {
const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function dist2(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  return dist2(x1, y1, x2, y2) <= (r1 + r2) * (r1 + r2);
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function normalizeAngle(angle) {
  while (angle < -Math.PI) angle += TAU;
  while (angle > Math.PI) angle -= TAU;
  return angle;
}

module.exports = {
  TAU,
  clamp,
  lerp,
  rand,
  randInt,
  dist2,
  circlesOverlap,
  angleTo,
  easeOutCubic,
  normalizeAngle,
};

  });
  register("src/utils/rng.js", function (module, exports, require) {
function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setGlobalSeed(seed) {
  const rng = mulberry32(seed);
  Math.random = rng;
  return rng;
}

module.exports = { mulberry32, setGlobalSeed };

  });
  register("src/utils/tint.js", function (module, exports, require) {
function tintSprite(img, color) {
  if (!img) return null;
  let canvas = null;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
  } else {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (wxApi) {
      if (wxApi.createOffscreenCanvas) canvas = wxApi.createOffscreenCanvas({ type: '2d' });
      else if (wxApi.createCanvas) canvas = wxApi.createCanvas();
    }
  }
  if (!canvas) return null;
  canvas.width = img.width || 64;
  canvas.height = img.height || 72;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = color || 'rgba(255,60,60,0.9)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

module.exports = { tintSprite };

  });

  makeRequire('game.js')('game.js');
})();
