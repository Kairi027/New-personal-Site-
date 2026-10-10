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
