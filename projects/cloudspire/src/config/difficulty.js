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
