const { drawButton, drawPanel } = require('../ui/menu.js');

const STORY_BOOKS = {
  1: {
    title: '钢铁来袭',
    lines: [
      '黄土群山之上，天空被一片不祥的钢铁云层笼罩。',
      '未知机群越过重峦叠嶂，闯入防线，沿途播撒等离子弹幕。',
      '前线雷达接连失守，通讯里只剩下断断续续的警报。',
      '你是「云阙飞戈」中队最后的王牌，驾驶飞戈-1 截击机升空。',
      '穿过峡谷，越过山脊，目标：入侵机群核心——巨型轰炸机「荒原之矛」。',
      '击落它，让天空重新安静下来。',
    ],
  },
  2: {
    title: '雷暴云海',
    lines: [
      '钢铁机群溃散后，残影却消失在雷暴云海深处。',
      '云层之下露出古老浮城的轮廓，断塔与轨道环绕着幽蓝闪电。',
      '通讯被雷暴撕碎，雷达只剩一片雪花。',
      '你驾驶飞戈-1 压低高度，穿过闪电与雨幕。',
      '目标：风暴中心那艘吞噬云海的巡洋舰「云海之眼」。',
      '击穿它，找回被吞没的天空。',
    ],
  },
  3: {
    title: '天穹王座',
    lines: [
      '雷暴止息，云海尽头升起一座悬于天穹的金色王座。',
      '所有入侵机群都只是前哨，真正的意志高居九天之上。',
      '神域大门缓缓开启，金甲舰队倾巢而出。',
      '你以一人一机，逆着光柱直冲王座核心。',
      '最后的敌影「天阙主宰」正等待你的到来。',
      '击碎它，让天阙重归宁静。',
    ],
  },
};

const SKIP_RECT = { x: 580, y: 1180, w: 112, h: 52 };

class StoryScene {
  constructor(game) {
    this.game = game;
    this.difficulty = 'easy';
    this.stage = 1;
    this.progress = null;
    this.invincible = false;
    this.challenge = false;
    this.book = STORY_BOOKS[1];
    this.lineIndex = 0;
    this.chars = 0;
    this.timer = 0;
  }

  enter(params) {
    this.game.audio.stopBgm();
    this.difficulty = params.difficulty || 'easy';
    this.stage = params.stage || 1;
    this.progress = params.progress || null;
    this.invincible = !!(params && params.invincible);
    this.challenge = !!(params && params.challenge);
    this.boost = !!(params && params.boost);
    this.book = STORY_BOOKS[this.stage] || STORY_BOOKS[1];
    this.lineIndex = 0;
    this.chars = 0;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
    const current = this.book.lines[this.lineIndex];
    if (this.chars < current.length) {
      this.chars = Math.min(current.length, this.chars + dt * 26);
    }
    const tap = this.game.input.consumeTap();
    if (!tap) return;
    if (this.inRect(tap, SKIP_RECT)) {
      this.finish();
      return;
    }
    if (this.chars < current.length) {
      this.chars = current.length;
      return;
    }
    if (this.lineIndex < this.book.lines.length - 1) {
      this.lineIndex += 1;
      this.chars = 0;
    } else {
      this.finish();
    }
  }

  finish() {
    this.game.audio.pickup();
    this.game.go('stage', {
      mode: 'new',
      difficulty: this.difficulty,
      stage: this.stage,
      progress: this.progress,
      invincible: this.invincible,
      challenge: this.challenge,
      boost: this.boost,
    });
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
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

  render(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#2a1e12');
    sky.addColorStop(0.7, '#4b3520');
    sky.addColorStop(1, '#201610');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#d9b98a';
    for (let i = 0; i < 14; i += 1) {
      const x = (i * 173) % 720;
      const y = (i * 211) % 1280;
      ctx.beginPath();
      ctx.moveTo(x - 70, y + 40);
      ctx.quadraticCurveTo(x, y - 50, x + 70, y + 40);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawPanel(ctx, { x: 60, y: 180, w: 600, h: 820 });
    ctx.fillStyle = '#f4e8c8';
    ctx.font = 'bold 30px "STKaiti","KaiTi",serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.book.title, 360, 250);
    ctx.strokeStyle = 'rgba(244,232,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(260, 272);
    ctx.lineTo(460, 272);
    ctx.stroke();

    const current = this.book.lines[this.lineIndex];
    const visible = current.slice(0, Math.ceil(this.chars));
    ctx.fillStyle = '#e9eefc';
    ctx.font = '25px "STKaiti","KaiTi","SimSun",serif';
    ctx.textAlign = 'left';
    const lines = this.wrapText(ctx, visible, 520);
    lines.forEach((line, index) => {
      ctx.fillText(line, 100, 350 + index * 42);
    });

    ctx.fillStyle = 'rgba(230,238,255,0.65)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${this.lineIndex + 1} / ${this.book.lines.length} 段，点击继续`, 360, 940);

    drawButton(ctx, SKIP_RECT, '跳过', { font: 'bold 20px sans-serif' });
  }
}

StoryScene.BOOKS = STORY_BOOKS;

module.exports = StoryScene;
