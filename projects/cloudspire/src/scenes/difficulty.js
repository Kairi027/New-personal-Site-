const { DIFFICULTIES, ORDER } = require('../config/difficulty.js');
const net = require('../net/multiplayer.js');
const { drawButton, drawPanel, drawInkTitle } = require('../ui/menu.js');
const AmbientField = require('../ui/ambient.js');
const { clamp, easeOutCubic } = require('../utils/math.js');

const BACK_RECT = { x: 24, y: 24, w: 120, h: 48 };
const BOOST_PANEL = { x: 90, y: 470, w: 540, h: 360 };
const BOOST_YES = { x: 150, y: 730, w: 190, h: 60 };
const BOOST_NO = { x: 380, y: 730, w: 190, h: 60 };

const DIFF_PALETTE = {
  skyTop: [7, 18, 32],
  skyMid: [18, 44, 64],
  skyLow: [8, 20, 34],
  starColor: [220, 236, 255],
  cloudColor: [180, 220, 235],
  mountains: [
    [22, 44, 62],
    [14, 30, 46],
    [8, 17, 28],
  ],
  accent: [120, 210, 255],
  haze: [196, 228, 255],
};

const DIFF_PALETTE_ALT = {
  skyTop: [24, 22, 44],
  skyMid: [48, 64, 88],
  skyLow: [18, 24, 42],
  starColor: [232, 226, 255],
  cloudColor: [208, 216, 240],
  mountains: [
    [34, 40, 68],
    [22, 28, 52],
    [12, 16, 30],
  ],
  accent: [255, 190, 120],
  haze: [218, 222, 255],
};

const CARD_THEMES = {
  easy: {
    accent: '#7fd8c4',
    tagline: '巡境前哨',
    desc: '敌机稀疏、弹幕平缓，适合熟悉天空',
    stages: [1, null, null, null],
    badge: null,
  },
  normal: {
    accent: '#7fb4ff',
    tagline: '主力突袭',
    desc: '敌机更快更硬，弹幕开始织成罗网',
    stages: [1, 2, null, null],
    badge: '推荐',
  },
  hard: {
    accent: '#ffb45e',
    tagline: '全面战争',
    desc: '敌机密集、弹幕交叉，考验极限闪避',
    stages: [1, 2, 3, null],
    badge: null,
  },
  insane: {
    accent: '#ff5f78',
    tagline: '云阙禁忌',
    desc: '隐藏路线与未知敌影，通关后显现',
    stages: [1, 2, 3, 4],
    badge: '???',
  },
};

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

class DifficultyScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.invincible = false;
    this.ambient = new AmbientField({
      palette: DIFF_PALETTE,
      paletteAlt: DIFF_PALETTE_ALT,
      fighterCount: 2,
      moon: null,
    });
    this.cards = ORDER.map((id, index) => ({
      id,
      config: DIFFICULTIES[id],
      theme: CARD_THEMES[id] || { accent: '#9fb8ff', tagline: '', desc: '', stages: [], badge: null },
      rect: { x: 90, y: 280 + index * 200, w: 540, h: 170 },
    }));
    this.boostPrompt = false;
    this.boostCard = null;
    this.boostTime = 0;
  }

  enter(params) {
      this.pendingStart = false;
      this.pendingStartAt = 0;
      this.pendingStageParams = null;
      this.invincible = !!(params && params.invincible);
      this.challenge = !!(params && params.challenge);
      this.coop = !!(params && params.coop);
      this.pk = !!(params && params.pk);
      this.coopPlayerIndex = net.playerIndex || 1;
      this.waiting = false;
      this.boostPrompt = false;
      this.boostCard = null;
      this.boostTime = 0;
      this.game.audio.playTitleBgm();
      this.time = 0;
      this.ambient.time = 0;
      if (this.coop) {
        net.onMessage = (msg) => {
          if (msg.type === 'difficulty') {
            const startAt = typeof msg.startAt === 'number' ? msg.startAt : Date.now() + 500;
            this.pendingStartAt = startAt + (net.clockOffsetMs || 0);
            this.pendingStageParams = {
              mode: 'new',
              difficulty: msg.difficulty,
              stage: 1,
              coop: true,
              pk: this.pk,
              roomId: net.roomId,
              playerIndex: net.playerIndex,
              seed: msg.seed,
              startAtLocal: this.pendingStartAt,
              hostName: msg.hostName,
              guestName: msg.guestName,
            };
            this.pendingStart = true;
          }
        };
      }
    }

  update(dt) {
      this.time += dt;
      this.ambient.update(dt);
      if (this.coop && this.pendingStart) {
        if (Date.now() >= this.pendingStartAt) {
          const params = this.pendingStageParams;
          this.pendingStart = false;
          this.pendingStageParams = null;
          this.game.go('stage', params);
        }
        return;
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.boostPrompt) {
        if (this.inRect(tap, BOOST_YES)) {
          this.boostPrompt = false;
          this.startBoosted();
        } else if (this.inRect(tap, BOOST_NO)) {
          this.boostPrompt = false;
          this.startPlain();
        }
        return;
      }
      if (this.inRect(tap, BACK_RECT)) {
        if (this.coop) {
          this.pendingStart = false;
          this.pendingStageParams = null;
          net.onMessage = null;
          net.close();
        }
        this.game.go('title');
        return;
      }
      for (const card of this.cards) {
        if (this.inRect(tap, card.rect)) {
          if (this.coop) {
            if (this.coopPlayerIndex === 1) {
              this.game.audio.pickup();
              this.waiting = true;
              net.selectDifficulty(card.id);
            }
            return;
          }
          this.game.audio.pickup();
          this.boostCard = card;
          this.boostTime = this.time;
          this.boostPrompt = true;
          return;
        }
      }
    }

  startBoosted() {
    const card = this.boostCard;
    const self = this;
    this.game.go('ad', {
      duration: 15,
      headline: '战机升级',
      onDone: () => {
        self.goStory(card, true);
      },
    });
  }

  startPlain() {
    this.goStory(this.boostCard, false);
  }

  goStory(card, boost) {
    this.game.go('story', {
      difficulty: card.id,
      stage: 1,
      invincible: this.invincible,
      challenge: this.challenge,
      boost: !!boost,
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    this.ambient.render(ctx);

    drawInkTitle(ctx, '选择作战难度', 360, 145, 52);
    ctx.fillStyle = 'rgba(220,232,255,0.8)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('难度越高，敌人更快、更硬、弹幕更密', 360, 205);
    if (this.invincible) {
      ctx.fillStyle = '#9dffc8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('无敌模式 · 生命无限', 360, 232);
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('此模式不会保存游戏进度', 360, 256);
    }
    if (this.challenge) {
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('挑战模式 · 广告复活限 2 次', 360, 232);
      ctx.fillStyle = '#ffb3a0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('无法保存进度', 360, 256);
    }
    if (this.coop) {
      ctx.fillStyle = '#9fd8ff';
      ctx.font = 'bold 18px sans-serif';
      let coopLabel = '';
      if (this.pendingStart) {
        coopLabel = `即将开始 · ${Math.max(1, Math.ceil((this.pendingStartAt - Date.now()) / 1000))}`;
      } else if (this.coopPlayerIndex === 1) {
        coopLabel = this.waiting ? '已选择难度，等待开始…' : (this.pk ? 'PK 模式 · 由你选择难度' : '联机模式 · 由你选择难度');
      } else {
        coopLabel = this.pk ? 'PK 模式 · 等待房主选择难度…' : '联机模式 · 等待房主选择难度…';
      }
      ctx.fillText(coopLabel, 360, 232);
    }

    const lineY = 226;
    ctx.strokeStyle = 'rgba(127,180,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(230, lineY);
    ctx.lineTo(490, lineY);
    ctx.stroke();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.arc(360 + Math.sin(this.time * 1.6) * 95, lineY, 3, 0, Math.PI * 2);
    ctx.fill();

    for (const [index, card] of this.cards.entries()) {
      const delay = 0.18 * index;
      const t = easeOutCubic(clamp((this.time - delay) * 1.25, 0, 1));
      const scale = 0.94 + 0.06 * easeOutCubic(clamp((this.time - delay) * 1.0, 0, 1));
      const offsetY = (1 - t) * 70;
      this.drawCard(ctx, card, index, t, offsetY, scale);
    }

    ctx.fillStyle = '#dce6ff';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(this.time * 1.3);
    ctx.fillText('点击卡片，进入作战简报', 360, 1116);
    ctx.globalAlpha = 1;

    drawButton(ctx, BACK_RECT, '返回', { font: 'bold 20px sans-serif' });

    if (this.boostPrompt) {
      ctx.fillStyle = 'rgba(4,8,18,0.72)';
      ctx.fillRect(0, 0, 720, 1280);
      drawPanel(ctx, BOOST_PANEL);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('是否观看广告升级战机？', 360, 540);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('观看 15 秒广告，本局战机等级 +5', 360, 596);
      ctx.fillText('（含火力、射速与耐久提升）', 360, 630);
      ctx.fillStyle = 'rgba(220,232,255,0.7)';
      ctx.font = '18px sans-serif';
      ctx.fillText('点击否将直接进入游戏', 360, 676);
      drawButton(ctx, BOOST_YES, '观看广告', { accent: 'rgba(255,211,107,0.95)' });
      drawButton(ctx, BOOST_NO, '直接开始', { accent: 'rgba(140,200,255,0.95)' });
      ctx.textAlign = 'left';
    }
  }

  drawCard(ctx, card, index, t, offsetY, scale) {
    const rect = card.rect;
    const theme = card.theme;
    const accent = theme.accent;
    const y = rect.y + offsetY;
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(rect.x + rect.w / 2, y + rect.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(rect.x + rect.w / 2), -(y + rect.h / 2));

    ctx.strokeStyle = accent;
    ctx.globalAlpha = t * (0.12 + 0.06 * Math.sin(this.time * 1.5 + index * 1.3));
    ctx.lineWidth = 8;
    roundedRect(ctx, rect.x - 4, y - 4, rect.w + 8, rect.h + 8, 17);
    ctx.stroke();

    ctx.globalAlpha = t;
    ctx.fillStyle = 'rgba(10,18,34,0.84)';
    ctx.strokeStyle = 'rgba(222,232,255,0.55)';
    ctx.lineWidth = 1.5;
    roundedRect(ctx, rect.x, y, rect.w, rect.h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(rect.x + 14, y + 16, 6, rect.h - 32);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(card.config.label, rect.x + 44, y + 58);

    ctx.fillStyle = accent;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(theme.tagline || '', rect.x + 44, y + 92);

    ctx.fillStyle = 'rgba(230,238,255,0.78)';
    ctx.font = '15px sans-serif';
    const descText = theme.desc || card.config.rangeLabel;
    ctx.fillText(descText.slice(0, 9), rect.x + 44, y + 122);
    if (descText.length > 9) {
      ctx.fillText(descText.slice(9, 18), rect.x + 44, y + 144);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '19px sans-serif';
    ctx.fillText(card.config.rangeLabel, rect.x + rect.w - 26, y + 58);

    this.drawStages(ctx, rect, y, theme);

    if (theme.badge) {
      const badgeText = theme.badge;
      const badgeW = 70;
      ctx.textAlign = 'center';
      ctx.fillStyle = badgeText === '推荐' ? 'rgba(255,211,107,0.16)' : 'rgba(255,95,120,0.18)';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      roundedRect(ctx, rect.x + rect.w - 90, y + 14, badgeW, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(badgeText, rect.x + rect.w - 55, y + 35);
    }

    const scanY = y + 16 + ((this.time * 55 + index * 37) % (rect.h - 30));
    ctx.fillStyle = accent;
    ctx.globalAlpha = t * 0.12;
    ctx.fillRect(rect.x + 22, scanY, rect.w - 44, 2);
    ctx.restore();
  }

  drawStages(ctx, rect, y, theme) {
    const chipSize = 46;
    const gap = 14;
    const count = theme.stages.length;
    const total = count * chipSize + (count - 1) * gap;
    let x = rect.x + rect.w - 26 - total;
    ctx.textAlign = 'center';
    for (const stage of theme.stages) {
      const cy = y + 92;
      const cx = x + chipSize / 2;
      ctx.fillStyle = stage === null ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)';
      ctx.strokeStyle = stage === null ? 'rgba(220,232,255,0.2)' : 'rgba(220,232,255,0.4)';
      ctx.lineWidth = 1.2;
      roundedRect(ctx, x, cy - chipSize / 2, chipSize, chipSize, 9);
      ctx.fill();
      ctx.stroke();
      if (stage === null) {
        this.drawLock(ctx, cx, cy);
      } else if (stage === '?') {
        ctx.fillStyle = '#ff7d92';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('?', cx, cy + 7);
      } else {
        const open = stage === 1;
        ctx.fillStyle = open ? theme.accent : 'rgba(220,232,255,0.45)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(String(stage), cx, cy + 7);
      }
      x += chipSize + gap;
    }
  }

  drawLock(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(220,232,255,0.5)';
    ctx.fillStyle = 'rgba(220,232,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -4, 5, Math.PI, 0);
    ctx.stroke();
    ctx.fillRect(-7, -3, 14, 11);
    ctx.restore();
  }
}

module.exports = DifficultyScene;
