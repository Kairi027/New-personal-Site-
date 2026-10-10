const { drawButton, drawPanel } = require('../ui/menu.js');

const RESUME_RECT = { x: 210, y: 500, w: 300, h: 62 };
const SAVE_RECT = { x: 210, y: 590, w: 300, h: 62 };
const EXIT_RECT = { x: 210, y: 680, w: 300, h: 62 };
const EXIT_RECT_INV = { x: 210, y: 590, w: 300, h: 62 };

class PauseScene {
  constructor(game) {
    this.game = game;
  }

  update(input, invincible, noSave, pk) {
      const saveDisabled = invincible || !!noSave;
      const tap = input.consumeTap();
      if (!tap) return null;
      if (this.inRect(tap, RESUME_RECT)) return 'resume';
      if (pk) {
        if (this.inRect(tap, EXIT_RECT_INV)) return 'escape';
        return null;
      }
      if (!saveDisabled && this.inRect(tap, SAVE_RECT)) return 'save-exit';
      if (this.inRect(tap, saveDisabled ? EXIT_RECT_INV : EXIT_RECT)) return 'exit';
      return null;
    }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx, snapshot, invincible, noSave, pk) {
      const saveDisabled = invincible || !!noSave;
      ctx.fillStyle = 'rgba(4,8,18,0.78)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, { x: 110, y: 350, w: 500, h: 480 });
      ctx.fillStyle = '#f2e7c8';
      ctx.font = 'bold 42px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂停', 360, 440);
      ctx.fillStyle = 'rgba(220,232,255,0.8)';
      ctx.font = '17px sans-serif';
      ctx.fillText(`${snapshot.difficulty.toUpperCase()} · Stage ${snapshot.stage} · Score ${snapshot.score}`, 360, 478);
      drawButton(ctx, RESUME_RECT, 'Resume');
      if (pk) {
        drawButton(ctx, EXIT_RECT_INV, 'Escape', { color: '#ff9d80' });
      } else if (saveDisabled) {
        drawButton(ctx, EXIT_RECT_INV, 'Exit', { color: '#ffb3c1' });
      } else {
        drawButton(ctx, SAVE_RECT, 'Save and exit');
        drawButton(ctx, EXIT_RECT, 'Exit', { color: '#ffb3c1' });
      }
    }
}

module.exports = PauseScene;
