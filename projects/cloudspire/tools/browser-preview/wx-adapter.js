(function () {
  if (window.wx) return;

  const storage = window.localStorage;
  const canvas = document.getElementById('game');
  const input = document.getElementById('keyboard-input');
  const keyboard = {
    onInput: [],
    onConfirm: [],
    onComplete: [],
    show(options) {
      const opts = options || {};
      input.value = opts.defaultValue || '';
      input.maxLength = opts.maxLength || 30;
      input.style.display = 'block';
      input.focus();
    },
    hide() {
      input.style.display = 'none';
    },
  };

  function toTouch(clientX, clientY, id) {
    const rect = canvas.getBoundingClientRect();
    return {
      identifier: id,
      clientX: (clientX - rect.left) * (canvas.width / rect.width),
      clientY: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  const handlers = { start: [], move: [], end: [] };

  function dispatch(type, event) {
    const id = event.type.indexOf('touch') === 0 ? event.identifier || 0 : 0;
    const clientX = event.clientX;
    const clientY = event.clientY;
    const point = toTouch(clientX, clientY, id);
    const fakeEvent = {
      changedTouches: [point],
      touches: [point],
    };
    const list = handlers[type] || [];
    for (const cb of list) cb(fakeEvent);
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const point = {
        identifier: touch.identifier,
        clientX: (touch.clientX - rect.left) * (canvas.width / rect.width),
        clientY: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
      const fake = { changedTouches: [point], touches: [point] };
      for (const cb of handlers.start) cb(fake);
    }
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const point = {
        identifier: touch.identifier,
        clientX: (touch.clientX - rect.left) * (canvas.width / rect.width),
        clientY: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
      const fake = { changedTouches: [point], touches: [point] };
      for (const cb of handlers.move) cb(fake);
    }
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const point = {
        identifier: touch.identifier,
        clientX: (touch.clientX - rect.left) * (canvas.width / rect.width),
        clientY: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
      const fake = { changedTouches: [point], touches: [] };
      for (const cb of handlers.end) cb(fake);
    }
  });

  canvas.addEventListener('mousedown', (e) => dispatch('start', e));
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons > 0) dispatch('move', e);
  });
  canvas.addEventListener('mouseup', (e) => dispatch('end', e));

  function callAll(list, value) {
    for (const cb of list.slice()) cb({ value });
  }

  input.addEventListener('input', () => {
    callAll(keyboard.onInput, input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      callAll(keyboard.onConfirm, input.value);
      keyboard.hide();
    }
  });
  input.addEventListener('blur', () => {
    callAll(keyboard.onComplete, input.value);
    keyboard.hide();
  });

  window.__wxKeyboardStub = keyboard;

  window.wx = {
    getStorageSync(key) {
      const value = storage.getItem(key);
      if (!value) return '';
      try {
        return JSON.parse(value);
      } catch (err) {
        return value;
      }
    },
    setStorageSync(key, value) {
      storage.setItem(key, JSON.stringify(value));
    },
    removeStorageSync(key) {
      storage.removeItem(key);
    },
    createCanvas() {
      return canvas;
    },
    getSystemInfoSync() {
      return { windowWidth: 720, windowHeight: 1280, pixelRatio: 1 };
    },
    onTouchStart(cb) {
      handlers.start.push(cb);
    },
    onTouchMove(cb) {
      handlers.move.push(cb);
    },
    onTouchEnd(cb) {
      handlers.end.push(cb);
    },
    onTouchCancel(cb) {
      handlers.end.push(cb);
    },
    showKeyboard(options) {
      keyboard.show(options);
    },
    hideKeyboard() {
      keyboard.hide();
    },
    onKeyboardInput(cb) {
      keyboard.onInput.push(cb);
    },
    onKeyboardConfirm(cb) {
      keyboard.onConfirm.push(cb);
    },
    onKeyboardComplete(cb) {
      keyboard.onComplete.push(cb);
    },
    offKeyboardInput(cb) {
      keyboard.onInput = keyboard.onInput.filter((fn) => fn !== cb);
    },
    offKeyboardConfirm(cb) {
      keyboard.onConfirm = keyboard.onConfirm.filter((fn) => fn !== cb);
    },
    offKeyboardComplete(cb) {
      keyboard.onComplete = keyboard.onComplete.filter((fn) => fn !== cb);
    },
    createWebAudioContext() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      return Ctx ? new Ctx() : null;
    },
    exitMiniProgram() {
      window.location.reload();
    },
    vibrateShort() {},
  };
})();
