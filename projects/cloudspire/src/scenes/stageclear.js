const { drawButton, drawPanel } = require('../ui/menu.js');
const { getDifficulty } = require('../config/difficulty.js');
const { getStage } = require('../config/stages.js');

const TOP_RECT = { x: 170, y: 720, w: 380, h: 64 };
const BOTTOM_RECT = { x: 170, y: 810, w: 380, h: 64 };

class StageClearScene {
  constructor(game) {
    this.game = game;
    this.params = {};
    this.stage = 1;
    this.hasNext = false;
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.params = params || {};
    this.stage = this.params.stage || 1;
    this.progress = this.params.progress || null;
    const difficulty = getDifficulty(this.params.difficulty || 'easy');
    const nextStage = this.stage + 1;
    this.hasNext = nextStage <= difficulty.stageCount && !!getStage(nextStage).enabled;
  }

  update() {
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, TOP_RECT)) {
      if (this.hasNext) {
        this.game.audio.pickup();
        this.game.go('story', { difficulty: this.params.difficulty || 'easy', stage: this.stage + 1, progress: this.progress });
      } else {
        this.game.go('title');
      }
      return;
    }
    if (this.inRect(tap, BOTTOM_RECT)) {
      if (this.hasNext) {
        this.game.go('title');
      } else {
        this.game.go('stage', { mode: 'new', difficulty: this.params.difficulty || 'easy', stage: this.stage });
      }
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#182438');
    sky.addColorStop(0.5, '#31465f');
    sky.addColorStop(1, '#1a2637');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 56px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd36b';
    ctx.shadowBlur = 20;
    ctx.fillText(`Stage ${this.stage} Clear`, 360, 430);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e9eefc';
    ctx.font = '26px sans-serif';
    ctx.fillText(`Score ${String(this.params.score || 0).padStart(7, '0')}`, 360, 530);
    ctx.fillStyle = 'rgba(220,232,255,0.75)';
    ctx.font = '18px sans-serif';
    const stage = getStage(this.stage);
    ctx.fillText(`${stage.title} · ${stage.subtitle}`, 360, 600);
    if (this.hasNext) {
      ctx.fillText('云海深处仍有异动，继续追击', 360, 640);
    } else {
      ctx.fillText('天阙重归宁静，云阙飞戈凯旋', 360, 640);
    }

    if (this.hasNext) {
      drawButton(ctx, TOP_RECT, '下一关');
      drawButton(ctx, BOTTOM_RECT, 'Return to Title');
    } else {
      drawButton(ctx, TOP_RECT, 'Return to Title');
      drawButton(ctx, BOTTOM_RECT, 'Replay Stage');
    }
  }
}

module.exports = StageClearScene;