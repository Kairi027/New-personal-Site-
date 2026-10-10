const storage = require('../core/storage.js');
const achievements = require('../core/achievements.js');
const platform = require('../core/platform.js');
const { drawButton, drawPanel, drawLogo } = require('../ui/menu.js');
const AmbientField = require('../ui/ambient.js');
const { clamp, easeOutCubic } = require('../utils/math.js');

const CONVENTIONAL_RECT = { x: 210, y: 620, w: 300, h: 64 };
const CHALLENGE_RECT = { x: 210, y: 720, w: 300, h: 64 };
const NEW_RECT = { x: 210, y: 620, w: 300, h: 64 };
const CONTINUE_RECT = { x: 210, y: 720, w: 300, h: 64 };
const ACHIEVEMENT_RECT = { x: 210, y: 920, w: 300, h: 64 };
const EXIT_RECT = { x: 210, y: 1020, w: 300, h: 64 };
const COOP_RECT = { x: 210, y: 820, w: 300, h: 64 };
const CONFIRM_YES = { x: 190, y: 700, w: 140, h: 56 };
const CONFIRM_NO = { x: 390, y: 700, w: 140, h: 56 };
const CONTACT_RECT = { x: 24, y: 24, w: 120, h: 48 };
const CONTACT_PANEL = { x: 90, y: 460, w: 540, h: 360 };
const CONTACT_CLOSE = { x: 260, y: 730, w: 200, h: 56 };
const DEBUG_RECT = { x: 576, y: 24, w: 120, h: 48 };
 const DEBUG_PANEL = { x: 90, y: 500, w: 540, h: 330 };

const TITLE_PALETTE = {
  skyTop: [8, 16, 36],
  skyMid: [25, 38, 66],
  skyLow: [13, 21, 38],
  starColor: [234, 242, 255],
  cloudColor: [245, 235, 210],
  mountains: [
    [42, 52, 86],
    [25, 32, 56],
    [14, 19, 34],
  ],
  accent: [255, 211, 107],
  haze: [224, 233, 255],
};

const TITLE_PALETTE_ALT = {
  skyTop: [30, 24, 48],
  skyMid: [82, 62, 78],
  skyLow: [36, 27, 44],
  starColor: [255, 235, 208],
  cloudColor: [255, 221, 168],
  mountains: [
    [58, 45, 72],
    [40, 31, 56],
    [23, 18, 34],
  ],
  accent: [255, 196, 96],
  haze: [255, 218, 184],
};

class TitleScene {
  constructor(game) {
    this.game = game;
    this.hasSave = false;
    this.menuLevel = 1;
    this.confirmOverwrite = false;
    this.showContact = false;
    this.contactTime = 0;
    this.time = 0;
    this.menuIn = 0;
    this.overlayTime = 0;
    this.ambient = new AmbientField({
      palette: TITLE_PALETTE,
      paletteAlt: TITLE_PALETTE_ALT,
      moon: { x: 560, y: 158, r: 46, color: '#f7efd8' },
      fighterCount: 3,
    });
  }

  enter() {
    this.game.audio.playTitleBgm();
    this.hasSave = storage.hasSave();
    this.menuLevel = 1;
    this.confirmOverwrite = false;
    this.showContact = false;
    this.contactTime = 0;
    this.time = 0;
    this.menuIn = 0;
    this.overlayTime = 0;
    this.debugUnlocked = achievements.isDebugUnlocked();
    this.debugConfirm = false;
    this.ambient.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.menuIn = Math.min(1, this.menuIn + dt * 0.55);
    this.ambient.update(dt);
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.confirmOverwrite) {
      if (this.inRect(tap, CONFIRM_YES)) {
        this.confirmOverwrite = false;
        storage.clearSave();
        this.game.go('difficulty');
      } else if (this.inRect(tap, CONFIRM_NO)) {
        this.confirmOverwrite = false;
      }
      return;
    }
    if (this.showContact) {
      if (this.inRect(tap, CONTACT_CLOSE) || !this.inRect(tap, CONTACT_PANEL)) {
        this.showContact = false;
      }
      return;
    }
    if (this.debugConfirm) {
      if (this.inRect(tap, CONFIRM_YES)) {
        this.debugConfirm = false;
        this.startDebugAd();
      } else if (this.inRect(tap, CONFIRM_NO)) {
        this.debugConfirm = false;
      }
      return;
    }
    if (this.inRect(tap, DEBUG_RECT)) {
      this.game.audio.pickup();
      if (this.debugUnlocked) {
        this.game.go('debugstage');
      } else {
        this.debugConfirm = true;
        this.overlayTime = this.time;
      }
      return;
    }
    if (this.inRect(tap, CONTACT_RECT)) {
      if (this.menuLevel === 1) {
        this.showContact = true;
        this.contactTime = this.time;
        this.game.audio.pickup();
      } else {
        this.menuLevel = 1;
        this.menuIn = 0;
        this.game.audio.pickup();
      }
      return;
    }
    if (this.menuLevel === 1) {
      if (this.inRect(tap, CONVENTIONAL_RECT)) {
        this.menuLevel = 2;
        this.menuIn = 0;
        this.game.audio.pickup();
        return;
      }
      if (this.inRect(tap, CHALLENGE_RECT)) {
        this.game.go('difficulty', { challenge: true });
        return;
      }
      if (this.inRect(tap, COOP_RECT)) {
        this.game.go('mpname');
        return;
      }
      if (this.inRect(tap, ACHIEVEMENT_RECT)) {
        this.game.audio.pickup();
        this.game.go('achievement');
        return;
      }
      if (this.inRect(tap, EXIT_RECT)) {
        platform.exitApp();
      }
      return;
    }
    if (this.inRect(tap, NEW_RECT)) {
      if (this.hasSave) {
        this.confirmOverwrite = true;
        this.overlayTime = this.time;
      } else {
        this.game.go('difficulty');
      }
      return;
    }
    if (this.hasSave && this.inRect(tap, CONTINUE_RECT)) {
      const save = storage.loadSave();
      if (!save || save.difficulty === undefined) {
        storage.clearSave();
        this.hasSave = false;
        return;
      }
      this.game.go('stage', { mode: 'continue', save });
    }
  }

  startDebugAd() {
    this.game.go('ad', {
      duration: 15,
      headline: '解锁内测跳关',
      onDone: () => {
        achievements.setDebugUnlocked();
        achievements.unlock('debugUnlock');
        this.debugUnlocked = true;
        this.game.go('debugstage');
      },
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  render(ctx) {
    this.ambient.render(ctx);

    drawLogo(ctx, 360, 380, { time: this.time, float: true, wings: true, glow: 20 });

    ctx.textAlign = 'center';
    ctx.font = '17px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(this.time * 1.8);
    ctx.fillText('云海之上，浮空神域', 360, 476);
    ctx.globalAlpha = 1;

    const dividerY = 590;
    ctx.strokeStyle = 'rgba(255,211,107,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, dividerY);
    ctx.lineTo(470, dividerY);
    ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(360 + Math.sin(this.time * 1.4) * 90, dividerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const buttons = [];
    if (this.menuLevel === 1) {
      buttons.push(
        {
          rect: CONVENTIONAL_RECT,
          label: 'Conventional Mode',
          pulse: 0.2 + 0.14 * Math.sin(this.time * 1.6),
          accent: 'rgba(140,200,255,0.9)',
        },
        {
          rect: CHALLENGE_RECT,
          label: 'Challenge Mode',
          pulse: 0.16 + 0.12 * Math.sin(this.time * 1.7 + 0.5),
          accent: 'rgba(255,120,140,0.9)',
        },
        {
          rect: COOP_RECT,
          label: 'Local PK',
          font: 'bold 20px sans-serif',
          pulse: 0.14 + 0.1 * Math.sin(this.time * 1.8 + 1.2),
          accent: 'rgba(140,220,255,0.9)',
        },
        {
          rect: ACHIEVEMENT_RECT,
          label: 'Achievement',
          font: 'bold 20px sans-serif',
          pulse: 0.14 + 0.1 * Math.sin(this.time * 1.9 + 1.6),
          accent: 'rgba(255,211,107,0.9)',
        },
        { rect: EXIT_RECT, label: 'Exit' }
      );
    } else {
      buttons.push({
        rect: NEW_RECT,
        label: 'New Game',
        gold: this.hasSave,
        pulse: this.hasSave ? 0.5 + 0.35 * Math.sin(this.time * 2.2) : 0,
        primary: this.hasSave,
      });
      if (this.hasSave) {
        buttons.push({
          rect: CONTINUE_RECT,
          label: 'Continue Game',
          gold: true,
          primary: true,
          pulse: 0.5 + 0.35 * Math.sin(this.time * 2.2 + 0.5),
        });
      }
    }
    buttons.forEach((button, index) => {
      const t = easeOutCubic(clamp(this.menuIn * 2 - index * 0.22, 0, 1));
      const offsetY = (1 - t) * 54;
      const opts = {
        alpha: t,
        offsetY,
        pulse: button.pulse || 0,
        accent: button.primary ? 'rgba(255,211,107,0.95)' : undefined,
        glowColor: '#ffd36b',
      };
      if (button.gold) {
        const blink = Math.floor(this.time * 6) % 2 === 0 ? 1 : 0.3;
        opts.frame = `rgba(255,211,107,${blink})`;
        opts.fill = `rgba(255,211,107,${(0.12 * blink).toFixed(3)})`;
        opts.frameWidth = 3;
      }
      drawButton(ctx, button.rect, button.label, opts);
    });

    if (!this.debugUnlocked) {
      drawButton(ctx, DEBUG_RECT, '内测跳关', {
        font: 'bold 18px sans-serif',
        color: 'rgba(220,232,255,0.65)',
        frame: 'rgba(255,211,107,0.85)',
        accent: 'rgba(255,211,107,0.9)',
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,211,107,0.9)';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('看广告解锁', DEBUG_RECT.x + DEBUG_RECT.w / 2, DEBUG_RECT.y + DEBUG_RECT.h + 15);
      ctx.textAlign = 'left';
    } else {
      drawButton(ctx, DEBUG_RECT, '内测跳关', {
        font: 'bold 20px sans-serif',
        pulse: 0.1 + 0.08 * Math.sin(this.time * 1.7 + 0.4),
        accent: 'rgba(255,150,170,0.9)',
      });
    }

    drawButton(ctx, CONTACT_RECT, this.menuLevel === 1 ? 'Contact' : '返回', {
      font: 'bold 20px sans-serif',
      pulse: 0.1 + 0.08 * Math.sin(this.time * 1.6),
      accent: 'rgba(140,200,255,0.9)',
    });

    if (this.confirmOverwrite) {
      const appear = clamp((this.time - this.overlayTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 680);
      ctx.scale(scale, scale);
      ctx.translate(-360, -680);
      drawPanel(ctx, { x: 90, y: 540, w: 540, h: 280 });
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已有存档', 360, 620);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('New Game 将覆盖当前进度，确认继续？', 360, 665);
      ctx.restore();
      drawButton(ctx, CONFIRM_YES, '覆盖', { alpha: eased, accent: 'rgba(255,120,120,0.9)' });
      drawButton(ctx, CONFIRM_NO, '取消', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }

    if (this.showContact) {
      const appear = clamp((this.time - this.contactTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 640);
      ctx.scale(scale, scale);
      ctx.translate(-360, -640);
      drawPanel(ctx, CONTACT_PANEL);
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.fillText('创作者联系方式', 360, 528);
      ctx.fillStyle = '#f2f6ff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Kairi Wang', 360, 592);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('QQ邮箱：3295262408@qq.com', 360, 648);
      ctx.fillText('Wechat：PKQ_ol-20071027', 360, 704);
      ctx.restore();
      drawButton(ctx, CONTACT_CLOSE, '关闭', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }

    if (this.debugConfirm) {
      const appear = clamp((this.time - this.overlayTime) / 0.28, 0, 1);
      const eased = easeOutCubic(appear);
      ctx.fillStyle = `rgba(5,8,16,${0.5 * eased})`;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.save();
      const scale = 0.9 + 0.1 * eased;
      ctx.translate(360, 640);
      ctx.scale(scale, scale);
      ctx.translate(-360, -640);
      drawPanel(ctx, DEBUG_PANEL);
      ctx.fillStyle = '#ffe9b8';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('解锁内测跳关', 360, 566);
      ctx.fillStyle = '#dce6ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('首次解锁需观看 15 秒广告', 360, 622);
      ctx.fillText('解锁后永久开放 · 成就 Hello,World', 360, 656);
      ctx.restore();
      drawButton(ctx, CONFIRM_YES, '观看广告', { alpha: eased, accent: 'rgba(255,211,107,0.9)' });
      drawButton(ctx, CONFIRM_NO, '取消', { alpha: eased, accent: 'rgba(140,200,255,0.9)' });
    }
  }
}

module.exports = TitleScene;


