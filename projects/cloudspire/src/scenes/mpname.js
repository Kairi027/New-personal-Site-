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
