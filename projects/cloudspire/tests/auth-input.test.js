const assert = require('assert');

function makeElement(id) {
  const el = {
    id,
    value: '',
    maxLength: 0,
    style: {},
    focused: false,
    width: 720,
    height: 1280,
    handlers: {},
    addEventListener(type, cb) {
      (this.handlers[type] = this.handlers[type] || []).push(cb);
    },
    focus() {
      this.focused = true;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.width, height: this.height };
    },
  };
  return el;
}

function fire(el, type, event) {
  for (const cb of el.handlers[type] || []) cb(event || {});
}

const store = new Map();
global.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  removeItem(key) {
    store.delete(key);
  },
};

const win = { localStorage: global.localStorage };
global.window = win;

const canvas = makeElement('game');
const input = makeElement('keyboard-input');
global.document = {
  getElementById(id) {
    return id === 'game' ? canvas : input;
  },
};

require('../tools/browser-preview/wx-adapter.js');
global.wx = win.wx;

const AuthScene = require('../src/scenes/auth.js');

function makeGame() {
  const game = {
    lastGo: null,
    audio: {
      stopBgm() {},
      pickup() {},
    },
    input: {
      tap: null,
      consumeTap() {
        const t = this.tap;
        this.tap = null;
        return t;
      },
    },
    go(name) {
      this.lastGo = name;
    },
  };
  return game;
}

const game = makeGame();
const scene = new AuthScene(game);
scene.enter();

// Tap the 姓名 field and type a name.
game.input.tap = { x: 360, y: 554 };
scene.update();
assert.strictEqual(input.style.display, 'block', '点击姓名框后应弹出键盘');
assert.strictEqual(input.focused, true, '输入框应获得焦点');

input.value = '测试者';
fire(input, 'input');
assert.strictEqual(scene.name, '测试者', '输入的姓名应回传到游戏');

fire(input, 'keydown', { key: 'Enter' });

// Tap the 身份证号 field and type an ID.
game.input.tap = { x: 360, y: 674 };
scene.update();
assert.strictEqual(input.style.display, 'block', '点击身份证框后应再次弹出键盘');

input.value = '110105199001011232';
fire(input, 'input');
assert.strictEqual(scene.id, '110105199001011232', '输入的身份证号应回传到游戏');

fire(input, 'keydown', { key: 'Enter' });
assert.strictEqual(game.lastGo, 'title', '认证成功后应进入标题场景');

scene.exit();
assert.strictEqual(win.__wxKeyboardStub.onInput.length, 0, 'exit removes input listeners');
assert.strictEqual(win.__wxKeyboardStub.onConfirm.length, 0, 'exit removes confirm listeners');
assert.strictEqual(win.__wxKeyboardStub.onComplete.length, 0, 'exit removes complete listeners');

console.log('Auth input test passed');
