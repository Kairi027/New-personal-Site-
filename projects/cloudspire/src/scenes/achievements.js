const achievements = require('../core/achievements.js');
const { drawButton, drawInkTitle } = require('../ui/menu.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const CARD_X = 70;
const CARD_W = 580;
const CARD_H = 150;
const CARD_YS = [270, 450, 630, 810];

const CARD_ACCENTS = ['#ffd36b', '#8fd8ff', '#ffb45e', '#c9a0ff'];

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawLock(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(220,232,255,0.55)';
  ctx.fillStyle = 'rgba(220,232,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -4, 5, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(-7, -3, 14, 11);
  ctx.restore();
}

class AchievementScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    this.time = 0;
    this.game.audio.playTitleBgm();
  }

  update(dt) {
    this.time += dt;
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.game.audio.pickup();
      this.game.go('title');
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.5, '#1b2440');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    drawInkTitle(ctx, '成就', 360, 150, 56);

    const unlocked = achievements.countUnlocked();
    const total = achievements.DEFINITIONS.length;
    ctx.textAlign = 'center';
    ctx.fillStyle = unlocked === total ? '#9fe8b8' : 'rgba(220,232,255,0.75)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`已达成 ${unlocked} / ${total}`, 360, 220);

    achievements.DEFINITIONS.forEach((def, index) => {
      const done = achievements.isUnlocked(def.id);
      const x = CARD_X;
      const y = CARD_YS[index];
      const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

      ctx.save();
      ctx.globalAlpha = done ? 1 : 0.6;
      ctx.fillStyle = done ? 'rgba(16,28,48,0.9)' : 'rgba(12,18,32,0.82)';
      ctx.strokeStyle = done ? accent : 'rgba(220,232,255,0.45)';
      ctx.lineWidth = done ? 2 : 1.2;
      roundedRect(ctx, x, y, CARD_W, CARD_H, 14);
      ctx.fill();
      ctx.stroke();

      const iconCx = x + 46;
      const iconCy = y + CARD_H / 2;
      if (done) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', iconCx, iconCy + 9);
      } else {
        ctx.strokeStyle = 'rgba(220,232,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(iconCx, iconCy, 22, 0, Math.PI * 2);
        ctx.stroke();
        drawLock(ctx, iconCx, iconCy);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = done ? '#fff3d6' : 'rgba(220,232,255,0.85)';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(def.title, x + 92, y + 62);

      ctx.fillStyle = done ? 'rgba(210,226,255,0.85)' : 'rgba(200,212,235,0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText(def.desc, x + 92, y + 106);

      ctx.textAlign = 'right';
      ctx.fillStyle = done ? '#9fe8b8' : 'rgba(220,232,255,0.45)';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(done ? '已达成' : '未达成', x + CARD_W - 24, y + CARD_H / 2 + 7);
      ctx.restore();
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,232,255,0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('达成条件后自动解锁', 360, 1010);
    ctx.textAlign = 'left';

    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });
  }
}

module.exports = AchievementScene;

