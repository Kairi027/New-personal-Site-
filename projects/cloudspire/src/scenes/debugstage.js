const { DIFFICULTIES, ORDER } = require('../config/difficulty.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const { clamp } = require('../utils/math.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const START_RECT = { x: 210, y: 1120, w: 300, h: 64 };
const DIFF_RECTS = ORDER.map((id, index) => ({
  id,
  rect: { x: 60 + index * 150, y: 300, w: 140, h: 64 },
}));
const STAGE_RECTS = [1, 2, 3, 4].map((stage) => ({
  stage,
  rect: { x: 150 + (stage - 1) * 105, y: 440, w: 90, h: 64 },
}));
const LV_MINUS = { x: 180, y: 580, w: 70, h: 56 };
const LV_PLUS = { x: 470, y: 580, w: 70, h: 56 };
const BOMB_MINUS = { x: 180, y: 700, w: 70, h: 56 };
const BOMB_PLUS = { x: 470, y: 700, w: 70, h: 56 };
const INV_RECT = { x: 210, y: 830, w: 300, h: 64 };

class DebugStageScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
  }

  enter() {
    this.difficulty = 'easy';
    this.stage = 1;
    this.level = 1;
    this.bombs = 3;
    this.invincible = false;
    this.time = 0;
    this.game.audio.playTitleBgm();
  }

  stageMax() {
    return DIFFICULTIES[this.difficulty].stageCount;
  }

  update(dt) {
    this.time += dt;
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, BACK_RECT)) {
      this.game.audio.pickup();
      this.game.go('title');
      return;
    }
    if (this.inRect(tap, START_RECT)) {
      this.game.audio.pickup();
      const maxHp = 100 + 12 * (this.level - 1);
      this.game.go('stage', {
        mode: 'new',
        difficulty: this.difficulty,
        stage: this.stage,
        invincible: this.invincible,
        noSave: true,
        debugStage: true,
        progress: {
          level: this.level,
          exp: 0,
          expTotal: 0,
          bombs: this.bombs,
          lives: 3,
          invincible: this.invincible,
          hp: maxHp,
          maxHp,
          score: 0,
          claimedExtras: [],
        },
      });
      return;
    }
    for (const diff of DIFF_RECTS) {
      if (this.inRect(tap, diff.rect)) {
        this.difficulty = diff.id;
        this.stage = Math.min(this.stage, this.stageMax());
        this.game.audio.pickup();
        return;
      }
    }
    for (const st of STAGE_RECTS) {
      if (st.stage <= this.stageMax() && this.inRect(tap, st.rect)) {
        this.stage = st.stage;
        this.game.audio.pickup();
        return;
      }
    }
    if (this.inRect(tap, LV_MINUS)) {
      this.level = clamp(this.level - 1, 1, 26);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, LV_PLUS)) {
      this.level = clamp(this.level + 1, 1, 26);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, BOMB_MINUS)) {
      this.bombs = clamp(this.bombs - 1, 0, 5);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, BOMB_PLUS)) {
      this.bombs = clamp(this.bombs + 1, 0, 5);
      this.game.audio.pickup();
      return;
    }
    if (this.inRect(tap, INV_RECT)) {
      this.invincible = !this.invincible;
      this.game.audio.pickup();
    }
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.6, '#16233a');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    drawInkTitle(ctx, '内测跳关', 360, 150, 54);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,232,255,0.75)';
    ctx.font = '18px sans-serif';
    ctx.fillText('选择难度 / 关卡 / 初始状态', 360, 215);

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('难度', 360, 275);
    for (const diff of DIFF_RECTS) {
      drawButton(ctx, diff.rect, DIFFICULTIES[diff.id].label, {
        font: 'bold 20px sans-serif',
        active: this.difficulty === diff.id,
        accent: this.difficulty === diff.id ? 'rgba(255,211,107,0.9)' : undefined,
      });
    }

    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('关卡', 360, 415);
    for (const st of STAGE_RECTS) {
      const locked = st.stage > this.stageMax();
      drawButton(ctx, st.rect, String(st.stage), {
        font: 'bold 22px sans-serif',
        active: !locked && this.stage === st.stage,
        fill: locked ? 'rgba(20,28,44,0.35)' : undefined,
        frame: locked ? 'rgba(220,232,255,0.25)' : undefined,
        color: locked ? 'rgba(220,232,255,0.35)' : undefined,
      });
    }

    this.drawStepper(ctx, '自机等级', this.level, 26, LV_MINUS, LV_PLUS, 555);
    this.drawStepper(ctx, '炸弹数', this.bombs, 5, BOMB_MINUS, BOMB_PLUS, 675);

    drawButton(ctx, INV_RECT, `无敌模式：${this.invincible ? '开' : '关'}`, {
      font: 'bold 22px sans-serif',
      active: this.invincible,
      accent: this.invincible ? 'rgba(140,255,190,0.9)' : undefined,
      glowColor: '#7dffc0',
    });
    ctx.fillStyle = 'rgba(255,179,161,0.9)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('此模式无法保存进度', 360, 925);
    if (this.invincible) {
      ctx.fillStyle = 'rgba(157,255,200,0.85)';
      ctx.font = '16px sans-serif';
      ctx.fillText('炸弹无限 · 残机无限', 360, 945);
    }

    drawButton(ctx, START_RECT, '开始作战', {
      font: 'bold 26px sans-serif',
      pulse: 0.15 + 0.1 * Math.sin(this.time * 1.8),
      accent: 'rgba(255,120,140,0.9)',
    });
    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });
  }

  drawStepper(ctx, label, value, max, minusRect, plusRect, labelY) {
    ctx.fillStyle = '#ffe9b8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 360, labelY);
    drawButton(ctx, minusRect, '-', { font: 'bold 26px sans-serif' });
    drawButton(ctx, plusRect, '+', { font: 'bold 26px sans-serif' });
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`${value} / ${max}`, 360, labelY + 52);
  }
}

module.exports = DebugStageScene;
