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
