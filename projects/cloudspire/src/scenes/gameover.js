const { drawButton, drawPanel, drawVignette } = require('../ui/menu.js');

const RETRY_RECT = { x: 170, y: 720, w: 380, h: 64 };
const TITLE_RECT = { x: 170, y: 810, w: 380, h: 64 };

class GameOverScene {
  constructor(game) {
    this.game = game;
    this.params = {};
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.params = params || {};
    this.challenge = !!(params && params.challenge);
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.challenge) {
      if (this.inRect(tap, RETRY_RECT)) this.game.go('title');
      return;
    }
    if (this.inRect(tap, RETRY_RECT)) {
      this.game.go('stage', { mode: 'new', difficulty: this.params.difficulty || 'easy', stage: this.params.stage || 1 });
    } else if (this.inRect(tap, TITLE_RECT)) {
      this.game.go('title');
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, 720, 1280);
    ctx.fillStyle = '#e5486b';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4060';
    ctx.shadowBlur = 24;
    ctx.fillText('GAME OVER', 360, 460);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#dce6ff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score ${String(this.params.score || 0).padStart(7, '0')}`, 360, 540);
    ctx.fillText(`难度 ${String(this.params.difficulty || 'easy').toUpperCase()}`, 360, 590);
    ctx.fillStyle = 'rgba(220,232,255,0.65)';
    ctx.font = '18px sans-serif';
    ctx.fillText(this.challenge ? '挑战失败 · 本局结束' : '境界已经消散，飞戈仍未折返', 360, 650);

    if (this.challenge) {
      drawButton(ctx, RETRY_RECT, 'Title', { color: '#ffb3c1' });
    } else {
      drawButton(ctx, RETRY_RECT, 'Retry Stage');
      drawButton(ctx, TITLE_RECT, 'Title');
    }
    drawVignette(ctx);
  }
}

module.exports = GameOverScene;
