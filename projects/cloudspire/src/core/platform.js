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
