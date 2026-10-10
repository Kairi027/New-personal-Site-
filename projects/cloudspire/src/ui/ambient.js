const { TAU, rand, clamp } = require('../utils/math.js');

const DESIGN_W = 720;
const DESIGN_H = 1280;

const DEFAULT_PALETTE = {
  skyTop: [10, 18, 38],
  skyMid: [29, 43, 74],
  skyLow: [16, 24, 42],
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

const DEFAULT_PALETTE_ALT = {
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

function css(color) {
  return `rgb(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])})`;
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

class AmbientField {
  constructor(options) {
    const opts = options || {};
    this.paletteA = opts.palette || DEFAULT_PALETTE;
    this.paletteB = opts.paletteAlt || DEFAULT_PALETTE_ALT;
    this.time = 0;
    this.starCount = opts.starCount || 80;
    this.stars = [];
    for (let i = 0; i < this.starCount; i += 1) {
      this.stars.push({
        x: rand(0, DESIGN_W),
        y: rand(0, DESIGN_H * 0.82),
        size: rand(0.7, 2.2),
        phase: rand(0, TAU),
        speed: rand(0.6, 2.2),
      });
    }
    this.clouds = [];
    for (let i = 0; i < 8; i += 1) {
      this.clouds.push({
        x: rand(-220, DESIGN_W),
        y: rand(140, DESIGN_H - 180),
        w: rand(130, 340),
        alpha: rand(0.35, 0.85),
        speed: rand(4, 14),
        phase: rand(0, TAU),
      });
    }
    this.ridges = [
      { base: 830, amp: 150, freq: 0.006, speed: 8, offset: rand(0, TAU), phase: rand(0, TAU) },
      { base: 990, amp: 210, freq: 0.005, speed: 18, offset: rand(0, TAU), phase: rand(0, TAU) },
      { base: 1180, amp: 250, freq: 0.004, speed: 30, offset: rand(0, TAU), phase: rand(0, TAU) },
    ];
    this.fighters = [];
    const fighterCount = opts.fighterCount === undefined ? 3 : opts.fighterCount;
    for (let i = 0; i < fighterCount; i += 1) {
      this.fighters.push(this.makeFighter(true));
    }
    this.shooting = null;
    this.nextShooting = rand(2.0, 5.0);
    this.moon = opts.moon || null;
  }

  makeFighter(initial) {
    const leftToRight = Math.random() < 0.5;
    return {
      x: initial ? rand(-80, DESIGN_W + 80) : rand(-80, 200),
      y: rand(150, 760),
      scale: rand(0.55, 0.95),
      speed: rand(70, 150),
      angle: leftToRight ? 0.08 : Math.PI - 0.08,
      alpha: rand(0.4, 0.75),
      leftToRight,
      phase: rand(0, TAU),
      trail: [],
    };
  }

  palette() {
    const t = 0.5 + 0.5 * Math.sin(this.time * 0.07);
    const a = this.paletteA;
    const b = this.paletteB;
    return {
      skyTop: css(mix(a.skyTop, b.skyTop, t)),
      skyMid: css(mix(a.skyMid, b.skyMid, t)),
      skyLow: css(mix(a.skyLow, b.skyLow, t)),
      starColor: css(mix(a.starColor, b.starColor, t)),
      cloudColor: css(mix(a.cloudColor, b.cloudColor, t)),
      mountains: a.mountains.map((color, index) => css(mix(color, b.mountains[index], t))),
      accent: css(mix(a.accent, b.accent, t)),
      haze: css(mix(a.haze, b.haze, t)),
    };
  }

  update(dt) {
    this.time += dt;
    for (const star of this.stars) {
      star.phase += star.speed * dt;
    }
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x - cloud.w > DESIGN_W + 60) {
        cloud.x = -cloud.w;
        cloud.y = rand(140, DESIGN_H - 180);
      }
    }
    for (const ridge of this.ridges) {
      ridge.offset += ridge.speed * dt;
    }
    for (const fighter of this.fighters) {
      fighter.x += fighter.speed * (fighter.leftToRight ? 1 : -1) * dt;
      fighter.y += Math.sin(this.time * 0.8 + fighter.phase) * 9 * dt;
      fighter.trail.push({ x: fighter.x, y: fighter.y });
      if (fighter.trail.length > 7) fighter.trail.shift();
      if (fighter.x > DESIGN_W + 90 || fighter.x < -90) {
        fighter.trail.length = 0;
        const reset = this.makeFighter(false);
        fighter.x = reset.x;
        fighter.y = reset.y;
        fighter.scale = reset.scale;
        fighter.speed = reset.speed;
        fighter.angle = reset.angle;
        fighter.alpha = reset.alpha;
        fighter.leftToRight = reset.leftToRight;
        fighter.phase = reset.phase;
      }
    }
    if (this.shooting) {
      const s = this.shooting;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -80 || s.x > DESIGN_W + 80 || s.y > DESIGN_H + 80) {
        this.shooting = null;
      }
    } else {
      this.nextShooting -= dt;
      if (this.nextShooting <= 0) {
        this.spawnShooting();
        this.nextShooting = rand(2.5, 6.0);
      }
    }
  }

  spawnShooting() {
    const fromLeft = Math.random() < 0.5;
    this.shooting = {
      x: rand(-40, 220),
      y: rand(60, 420),
      vx: fromLeft ? rand(300, 460) : -rand(300, 460),
      vy: rand(150, 230),
      life: rand(0.55, 0.95),
      maxLife: 1,
    };
  }

  render(ctx) {
    const p = this.palette();
    const sky = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(0.45, p.skyMid);
    sky.addColorStop(0.82, p.skyLow);
    sky.addColorStop(1, p.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    if (this.moon) {
      const m = this.moon;
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 0.9);
      ctx.save();
      ctx.globalAlpha = 0.16 * pulse;
      ctx.fillStyle = p.cloudColor;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 1.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = p.cloudColor;
      ctx.shadowBlur = 26;
      ctx.fillStyle = m.color || '#f7efd8';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = p.skyLow;
      ctx.beginPath();
      ctx.arc(m.x - m.r * 0.28, m.y + m.r * 0.18, m.r * 0.18, 0, TAU);
      ctx.fill();
      ctx.arc(m.x + m.r * 0.22, m.y - m.r * 0.22, m.r * 0.13, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const star of this.stars) {
      const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(star.phase));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = p.starColor;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = p.cloudColor;
    for (const cloud of this.clouds) {
      this.drawCloud(ctx, cloud, p);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < this.ridges.length; i += 1) {
      ctx.fillStyle = p.mountains[i];
      this.drawRidge(ctx, this.ridges[i]);
    }

    for (const fighter of this.fighters) {
      this.drawFighter(ctx, fighter, p);
    }
    ctx.globalAlpha = 1;

    if (this.shooting) {
      this.drawShooting(ctx, p);
    }

    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#000';
    for (let y = 0; y < DESIGN_H; y += 4) {
      ctx.fillRect(0, y, DESIGN_W, 1);
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(360, 640, 220, 360, 640, 780);
    vignette.addColorStop(0, 'rgba(5,8,16,0)');
    vignette.addColorStop(1, 'rgba(5,8,16,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  }

  drawCloud(ctx, cloud, p) {
    const w = cloud.w;
    const h = 13 + (cloud.w % 9);
    const x = cloud.x;
    const y = cloud.y + Math.sin(cloud.phase + this.time * 0.35) * 5;
    ctx.save();
    ctx.globalAlpha = 0.055 * cloud.alpha;
    ctx.beginPath();
    ctx.ellipse(x - w * 0.3, y, w * 0.34, h, 0, 0, TAU);
    ctx.ellipse(x, y - h * 0.35, w * 0.4, h * 1.15, 0, 0, TAU);
    ctx.ellipse(x + w * 0.3, y, w * 0.34, h, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    void p;
  }

  drawRidge(ctx, ridge) {
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_H);
    for (let x = 0; x <= DESIGN_W; x += 16) {
      const t = ridge.offset + x * ridge.freq;
      const secondary = Math.sin(x * 0.017 + ridge.phase);
      const y = ridge.base + Math.sin(t) * ridge.amp * (0.55 + 0.45 * secondary) + Math.sin(x * 0.031 + ridge.phase * 2) * ridge.amp * 0.2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(DESIGN_W, DESIGN_H);
    ctx.closePath();
    ctx.fill();
  }

  drawFighter(ctx, fighter, p) {
    const trail = fighter.trail;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i += 1) {
      const t = i / trail.length;
      ctx.globalAlpha = fighter.alpha * t * 0.28;
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * t;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = fighter.alpha;
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate(fighter.angle);
    ctx.scale(fighter.scale, fighter.scale);
    ctx.fillStyle = 'rgba(8,12,22,0.86)';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = fighter.alpha * 0.85;
    ctx.fillRect(4, -2.5, 8, 5);
    ctx.restore();
  }

  drawShooting(ctx, p) {
    const s = this.shooting;
    const tailX = s.x - s.vx * 0.16;
    const tailY = s.y - s.vy * 0.16;
    const alpha = clamp(s.life / s.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = p.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7e2';
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    ctx.restore();
  }
}

module.exports = AmbientField;
