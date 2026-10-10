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
