const achievements = require('../core/achievements.js');
const PAGES = [
  {
    key: 'he01',
    text: '异形母舰最后的猩红核心被彻底击穿，整艘血肉舰船停止所有机能。厚重的舰体从内部开始连锁崩解，无数增生肉质组织、机械炮舱、异形组件瞬间失活。狂暴的炮火与弹幕彻底停息，持续整场战役的压迫感骤然消散，漆黑太空终于回归死寂。',
  },
  {
    key: 'he02',
    text: '曾经试图逃逸的猩红光点，不再具备任何再生、逃逸、寄宿的力量。本源能量在核心爆炸中层层湮灭，红色脉动彻底熄灭、消散、归零。没有残留、没有潜伏、没有后手，这场异形入侵的根源被完全根除，不再有任何未来威胁。',
  },
  {
    key: 'he03',
    text: '漫天漂浮的敌机残骸、破碎舰片、残余感染物质逐渐在真空之中静默飘散。所有被异形侵蚀的空域彻底净化，诡异的血色雾气尽数褪去。遥远星河重新亮起清澈的白光，被污染的宇宙区域恢复原本安宁的秩序。',
  },
  {
    key: 'he04',
    text: '玩家的战机满身弹痕、装甲斑驳，引擎微微发烫，独自悬停在肃清后的战场中央。历经四关绝境鏖战，机身上每一道伤痕都是对抗异形入侵的证明。战机缓缓减速，紧绷全程的战斗姿态彻底松弛，代表战斗正式落幕。',
  },
  {
    key: 'he05',
    text: '深邃星空澄澈明朗，危险彻底终结。战机调转航向，朝向蔚蓝母星的方向平稳返航。战火熄灭、灾厄终结、星海重安。',
  },
];

const END_TITLE = '云海归宁，万劫终熄';
const END_SUBTITLE = '结局B · 星海烬余安';

class TrueEndingScene {
  constructor(game) {
    this.game = game;
    this.images = {};
    this.ready = false;
    this.page = 0;
    this.chars = 0;
    this.phase = 'fadein';
    this.timer = 0;
    this.fadeTimer = 0;
    this.pageFade = 0;
  }

  enter(params) {
    this.params = params || {};
    this.page = 0;
    this.chars = 0;
    this.phase = 'fadein';
    this.timer = 0;
    this.fadeTimer = 0;
    this.pageFade = 0;
    this.images = {};
    for (const page of PAGES) {
      this.images[page.key] = this.game.artBank ? this.game.artBank.get(page.key) : null;
    }
    this.ready = true;
    if (this.params.difficulty === 'insane') achievements.unlock('insaneClear');
    this.game.audio.playHeBgm();
  }

  update(dt) {
    if (!this.ready) return;
    if (this.phase === 'fadein') {
      this.fadeTimer += dt;
      if (this.fadeTimer >= 1.2) this.phase = 'story';
      return;
    }
    if (this.phase === 'story') {
      this.pageFade = Math.min(1, this.pageFade + dt / 0.5);
      const current = PAGES[this.page];
      if (this.chars < current.text.length) {
        this.chars = Math.min(current.text.length, this.chars + dt * 26);
      }
      const tap = this.game.input.consumeTap();
      if (!tap) return;
      if (this.chars < current.text.length) {
        this.chars = current.text.length;
        return;
      }
      if (this.page < PAGES.length - 1) {
        this.page += 1;
        this.chars = 0;
        this.pageFade = 0;
      } else {
        this.phase = 'final';
        this.timer = 0;
      }
      return;
    }
    this.timer += dt;
    if (this.timer >= 5.7) {
      this.game.audio.stopBgm();
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
    if (this.phase === 'fadein' || this.phase === 'story') {
      const current = PAGES[this.page];
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
      ctx.fillText(`点击继续 ${this.page + 1} / ${PAGES.length}`, 360, 1240);
      ctx.textAlign = 'left';

      if (this.phase === 'fadein') {
        const blackAlpha = Math.max(0, 1 - this.fadeTimer / 1.2);
        ctx.fillStyle = `rgba(0,0,0,${blackAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, 720, 1280);
      }
      return;
    }

    const t = this.timer;
    const whiteAlpha = Math.min(1, t / 1.5);
    const titleAlpha = t >= 1.5 && t < 3.8 ? Math.min(1, (t - 1.5) / 0.5, (3.8 - t) / 0.5) : 0;
    const subAlpha = t >= 2.5 ? Math.min(1, (t - 2.5) / 0.5) : 0;
    const darkAlpha = t >= 4.2 ? Math.min(1, (t - 4.2) / 1.5) : 0;

    ctx.fillStyle = `rgba(255,250,235,${whiteAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    if (titleAlpha > 0) {
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = '#2a1538';
      ctx.font = 'bold 46px "STKaiti","KaiTi",serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d8b6ff';
      ctx.shadowBlur = 18;
      ctx.fillText(END_TITLE, 360, 610);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (subAlpha > 0) {
      ctx.globalAlpha = subAlpha;
      ctx.fillStyle = '#7a4a8c';
      ctx.font = 'bold 28px "STKaiti","KaiTi","SimSun",serif';
      ctx.textAlign = 'center';
      ctx.fillText(END_SUBTITLE, 360, 690);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(0,0,0,${darkAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.textAlign = 'left';
  }
}

TrueEndingScene.PAGES = PAGES;

module.exports = TrueEndingScene;
