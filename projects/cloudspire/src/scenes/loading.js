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
