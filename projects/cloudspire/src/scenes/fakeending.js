const achievements = require('../core/achievements.js');
const PAGES = [
  {
    key: 'be01',
    text: '天阙主宰的巨型机体在猛烈炮火下轰然崩碎，暗黑装甲四分五裂，遍布全身的红色裂纹接连爆裂，包裹核心的异形大脑支离破碎。无数金属残骸裹挟金色火光，向着云海四处飘散。',
  },
  {
    key: 'be02',
    text: '破碎的异形大脑残块之中，一点刺目的猩红色光点挣脱残骸的束缚。',
  },
  {
    key: 'be03',
    text: '它没有随碎片一同坠落，反而冲破云层，不断向上加速，刺破大气层。',
  },
  {
    key: 'be04',
    text: '向着深邃漆黑的宇宙深空疾驰飞去，越变越小，最后化为天边一道转瞬即逝的暗红流光。',
  },
];

const END_TITLE = '结局A · 虚假的晴空';
const END_SUBTITLE = '它并未消亡，只是将火种送往更遥远的星海。';

const EXTRA_PAGES = [
  { key: 'he00', text: '你驾驶飞戈‑1，毅然调转航向，追入漆黑的宇宙虚空。' },
  { key: 'he00', text: '前方，是未知的星域，被侵染的机械与宇宙残骸，正静静等待着你的到来。' },
];

class FakeEndingScene {
  constructor(game) {
    this.game = game;
    this.images = { be01: null, be02: null, be03: null, be04: null };
    this.ready = false;
    this.page = 0;
    this.chars = 0;
    this.phase = 'story';
    this.timer = 0;
    this.pageFade = 0;
  }

  enter(params) {
    this.params = params || {};
    this.insane = this.params.difficulty === 'insane';
    this.pages = PAGES;
    this.page = 0;
    this.chars = 0;
    this.phase = 'story';
    this.timer = 0;
    this.pageFade = 0;
    this.images = {
      be01: this.game.artBank.get('be01'),
      be02: this.game.artBank.get('be02'),
      be03: this.game.artBank.get('be03'),
      be04: this.game.artBank.get('be04'),
      he00: this.game.artBank.get('he00'),
    };
    this.ready = true;
    if (this.params.difficulty === 'hard') achievements.unlock('hardClear');
  }

  update(dt) {
    if (!this.ready) return;
    if (this.phase === 'story' || this.phase === 'extra') {
      this.pageFade = Math.min(1, this.pageFade + dt / 0.5);
      const pages = this.phase === 'extra' ? EXTRA_PAGES : this.pages;
      const current = pages[this.page];
      if (this.chars < current.text.length) {
        this.chars = Math.min(current.text.length, this.chars + dt * 26);
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.chars < current.text.length) {
        this.chars = current.text.length;
        return;
      }
      if (this.page < pages.length - 1) {
        this.page += 1;
        this.chars = 0;
        this.pageFade = 0;
      } else if (this.phase === 'story') {
        if (this.insane) {
          this.phase = 'black';
          this.timer = 0;
        } else {
          this.phase = 'ending';
          this.timer = 0;
        }
      } else {
        this.game.audio.stopBgm();
        this.game.go('stage', {
          mode: 'new',
          difficulty: 'insane',
          stage: 4,
          progress: this.params.progress,
          invincible: this.params.invincible,
        });
      }
      return;
    }
    if (this.phase === 'black') {
      this.timer += dt;
      if (this.timer >= 1.2) {
        this.phase = 'extra';
        this.page = 0;
        this.chars = 0;
        this.pageFade = 0;
        this.game.audio.stopBgm();
      }
      return;
    }
    this.timer += dt;
    if (this.timer >= 10) {
      this.game.go('title');
    }
  }

  wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  drawImageCover(ctx, img, alpha) {
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const scale = Math.max(720 / img.width, 1280 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (720 - w) / 2, (1280 - h) / 2, w, h);
    ctx.restore();
  }

  render(ctx) {
    ctx.fillStyle = '#03030a';
    ctx.fillRect(0, 0, 720, 1280);
    if (!this.ready) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('影像载入中…', 360, 640);
      ctx.textAlign = 'left';
      return;
    }
    if (this.phase === 'story' || this.phase === 'extra') {
      const pages = this.phase === 'extra' ? EXTRA_PAGES : this.pages;
      const current = pages[this.page];
      const img = this.images[current.key];
      this.drawImageCover(ctx, img, this.pageFade);
      ctx.fillStyle = `rgba(5,4,12,${(0.42 * this.pageFade).toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = 'rgba(6,5,14,0.78)';
      ctx.fillRect(40, 930, 640, 250);
      ctx.strokeStyle = 'rgba(255,220,150,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40.5, 930.5, 639, 249);

      const visible = current.text.slice(0, Math.ceil(this.chars));
      ctx.fillStyle = '#f6ecd4';
      ctx.font = '24px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'left';
      const lines = this.wrapText(ctx, visible, 600);
      lines.forEach((line, index) => {
        ctx.fillText(line, 70, 980 + index * 36);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`点击继续 ${this.page + 1} / ${pages.length}`, 360, 1240);
      ctx.textAlign = 'left';
      return;
    }

    if (this.phase === 'black') {
      const blackAlpha = Math.min(1, this.timer / 0.9);
      ctx.fillStyle = `rgba(0,0,0,${blackAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
      return;
    }

    const t = this.timer;
    const whiteAlpha = Math.min(1, Math.max(0, t <= 4 ? t / 2 : 1 - (t - 4) / 2));
    const blackAlpha = Math.min(1, Math.max(0, (t - 4) / 2));
    const titleAlpha = t >= 2 && t < 4.6 ? Math.min(1, (t - 2) / 0.5, (4.6 - t) / 0.5) : 0;
    const subtitleAlpha = t >= 6 ? Math.min(1, (t - 6) / 0.8) : 0;

    ctx.fillStyle = `rgba(255,250,235,${whiteAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (titleAlpha > 0) {
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = '#2a1538';
      ctx.font = 'bold 44px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d8b6ff';
      ctx.shadowBlur = 18;
      ctx.fillText(END_TITLE, 360, 620);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(2,2,6,${blackAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (subtitleAlpha > 0) {
      ctx.globalAlpha = subtitleAlpha;
      ctx.fillStyle = '#cfc4dd';
      ctx.font = '24px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'center';
      ctx.fillText(END_SUBTITLE, 360, 640);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
}

FakeEndingScene.PAGES = PAGES;

module.exports = FakeEndingScene;
