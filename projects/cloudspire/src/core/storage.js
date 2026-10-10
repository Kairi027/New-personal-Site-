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
