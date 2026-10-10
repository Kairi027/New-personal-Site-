const { rand, TAU } = require('../utils/math.js');

const PHASE_DURATION = 30;

// stage3 遮挡层云：固定使用完全展开的大尺寸（约 2400px 宽），不再随进度放大。
const OCC_CLOUD_SCALE = 2.17;
const OCC_CLOUD_INTERVAL_MIN = 6;
const OCC_CLOUD_INTERVAL_MAX = 12;

const TIME_PHASES = [
  {
    skyTop: [214, 168, 124],
    skyMid: [196, 158, 118],
    terrainFar: [184, 142, 102],
    terrainNear: [176, 126, 86],
  },
  {
    skyTop: [226, 186, 134],
    skyMid: [212, 170, 118],
    terrainFar: [198, 148, 98],
    terrainNear: [192, 132, 84],
  },
  {
    skyTop: [208, 172, 136],
    skyMid: [198, 164, 130],
    terrainFar: [194, 152, 116],
    terrainNear: [188, 138, 98],
  },
];

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function scaleColor(color, factor) {
  return color.map((v) => Math.round(Math.min(255, v * factor)));
}

function css(color) {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function makeCanvas(width, height) {
  const wxApi = typeof wx !== 'undefined' ? wx : null;
  if (wxApi && wxApi.createCanvas && typeof document === 'undefined') {
    const c = wxApi.createCanvas();
    c.width = width;
    c.height = height;
    return c;
  }
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function smoothStep(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function makeMountains(count, minW, maxW, minH, maxH) {
  const mountains = [];
  for (let i = 0; i < count; i += 1) {
    mountains.push({
      x: rand(-40, 720),
      y: rand(-700, 1280),
      w: rand(minW, maxW),
      h: rand(minH, maxH),
      curve: rand(0.15, 0.35),
      seed: Math.floor(rand(0, 100000)),
      rock: rand(0.4, 1.6),
    });
  }
  return mountains;
}

class MountainBackground {
  constructor(options) {
    const opts = options || {};
    this.fixed = opts.fixed || null;
    this.rain = opts.rain ? this.makeRain() : null;
    this.sea = !!opts.sea;
    this.cloudtop = !!opts.cloudtop;
    if (this.sea) {
      this.makeSea();
      return;
    }
    if (this.cloudtop) {
      this.makeCloudtop();
      return;
    }
    this.terrain = !!opts.terrain;
    if (this.terrain && this.makeTerrain()) {
      return;
    }
    this.terrain = false;
    this.space = !!opts.space;
    if (this.space) {
      this.makeSpace();
      return;
    }
    this.layers = [
      {
        speed: 16,
        alpha: 0.55,
        mountains: makeMountains(8, 150, 280, 160, 380),
      },
      {
        speed: 36,
        alpha: 0.85,
        mountains: makeMountains(7, 130, 260, 220, 480),
      },
      {
        speed: 64,
        alpha: 1,
        mountains: makeMountains(6, 110, 240, 260, 560),
      },
    ];
    this.haze = [];
    for (let i = 0; i < 8; i += 1) {
      this.haze.push({ x: rand(0, 720), y: rand(0, 1280), w: rand(120, 260) });
    }
    this.time = 0;
  }

  makeSpace() {
    this.time = 0;
    this.starLayers = [
      { speed: 18, stars: this.makeStars(55, 0.4, 1.1, 0.35) },
      { speed: 45, stars: this.makeStars(45, 0.7, 1.6, 0.5) },
      { speed: 85, stars: this.makeStars(30, 1.0, 2.2, 0.8) },
    ];
    const nebColors = ['74,42,138', '42,58,154', '122,42,106', '42,74,122'];
    this.nebulae = [];
    for (let i = 0; i < 5; i += 1) {
      this.nebulae.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        r: rand(210, 330),
        color: nebColors[i % nebColors.length],
        speed: rand(7, 14),
        alpha: rand(0.15, 0.28),
      });
    }
    this.dustLanes = [];
    for (let i = 0; i < 4; i += 1) {
      this.dustLanes.push({
        x: rand(80, 640),
        y: rand(0, 1280),
        r: rand(180, 320),
        alpha: rand(0.24, 0.4),
        speed: rand(5, 12),
        ph: rand(0, TAU),
      });
    }
    this.debris = [];
    for (let i = 0; i < 16; i += 1) {
      this.debris.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        w: rand(8, 40),
        h: rand(5, 15),
        spin: rand(-1.4, 1.4),
        vx: rand(-12, 12),
        vy: rand(22, 55),
        angle: rand(0, TAU),
      });
    }
    this.celestials = [];
    for (let i = 0; i < 4; i += 1) {
      const planet = i % 2 === 0;
      this.celestials.push({
        kind: planet ? 'planet' : 'moon',
        ring: planet && i === 0,
        x: rand(100, 620),
        y: planet ? rand(120, 980) : rand(-420, 260),
        r: planet ? rand(58, 105) : rand(34, 58),
        speed: rand(10, 18),
        phase: rand(0, TAU),
      });
    }
    this.shooting = null;
    this.shootTimer = rand(2, 5);
  }

  makeStars(count, minR, maxR, bright) {
    const list = [];
    const palette = [
      [232, 238, 255],
      [255, 255, 255],
      [255, 234, 196],
      [201, 242, 255],
      [201, 162, 255],
    ];
    for (let i = 0; i < count; i += 1) {
      const c = palette[Math.floor(rand(0, palette.length))];
      list.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        r: rand(minR, maxR),
        phase: rand(0, TAU),
        bright: bright + rand(0, 0.3),
        rgb: c,
        color: `rgb(${c[0]},${c[1]},${c[2]})`,
        glint: Math.random() < 0.25,
        glow: Math.random() < 0.18,
      });
    }
    return list;
  }

  makeRain() {
    const drops = [];
    for (let i = 0; i < 90; i += 1) {
      drops.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        len: rand(14, 26),
        speed: rand(700, 1000),
        alpha: rand(0.25, 0.5),
      });
    }
    return drops;
  }

  palette() {
    if (this.fixed) {
      return {
        skyTop: this.fixed.skyTop,
        skyMid: this.fixed.skyMid,
        far: this.fixed.mountains[0],
        mid: this.fixed.mountains[1],
        near: this.fixed.mountains[2],
        haze: this.fixed.haze || this.fixed.skyMid,
      };
    }
    const total = TIME_PHASES.length * PHASE_DURATION;
    const cycle = (this.time % total) / PHASE_DURATION;
    const index = Math.floor(cycle) % TIME_PHASES.length;
    const t = cycle - Math.floor(cycle);
    const a = TIME_PHASES[index];
    const b = TIME_PHASES[(index + 1) % TIME_PHASES.length];
    const terrainFar = mixColor(a.terrainFar, b.terrainFar, t);
    const terrainNear = mixColor(a.terrainNear, b.terrainNear, t);
    return {
      skyTop: mixColor(a.skyTop, b.skyTop, t),
      skyMid: mixColor(a.skyMid, b.skyMid, t),
      far: mixColor(terrainFar, terrainNear, 0.3),
      mid: scaleColor(mixColor(terrainFar, terrainNear, 0.55), 0.82),
      near: scaleColor(terrainNear, 0.62),
      haze: mixColor(mixColor(a.skyMid, b.skyMid, t), [255, 255, 255], 0.6),
    };
  }

  update(dt) {
    this.time += dt;
    if (this.sea) {
      this.updateSea(dt);
      return;
    }
    if (this.cloudtop) {
      this.updateCloudtop(dt);
      return;
    }
    if (this.terrain) {
      this.updateTerrain(dt);
      return;
    }
    if (this.space) {
      for (const layer of this.starLayers) {
        for (const star of layer.stars) {
          star.y += layer.speed * dt;
          if (star.y > 1310) {
            star.y = -10;
            star.x = rand(0, 720);
          }
        }
      }
      for (const neb of this.nebulae) {
        neb.y += neb.speed * dt;
        if (neb.y > 1280 + neb.r) {
          neb.y = -neb.r;
          neb.x = rand(0, 720);
        }
      }
      for (const lane of this.dustLanes) {
        lane.y += lane.speed * dt;
        lane.x += Math.sin(this.time * 0.1 + lane.ph) * 2 * dt;
        if (lane.y > 1280 + lane.r) {
          lane.y = -lane.r;
          lane.x = rand(80, 640);
        }
      }
      for (const d of this.debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.angle += d.spin * dt;
        if (d.y > 1320 || d.x > 760 || d.x < -60) {
          d.x = rand(0, 720);
          d.y = -30;
          d.vy = rand(22, 55);
        }
      }
      for (const c of this.celestials) {
        c.y += c.speed * dt;
        if (c.y > 1380) {
          c.y = -c.r * 2;
          c.x = rand(120, 600);
        }
      }
      if (this.shooting) {
        this.shooting.x += this.shooting.vx * dt;
        this.shooting.y += this.shooting.vy * dt;
        this.shooting.life -= dt;
        if (this.shooting.life <= 0 || this.shooting.y > 700) this.shooting = null;
      } else {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
          this.shooting = {
            x: rand(120, 560),
            y: rand(-90, -30),
            vx: rand(-300, -180),
            vy: rand(420, 560),
            life: rand(0.5, 0.8),
          };
          this.shootTimer = rand(3, 7);
        }
      }
      return;
    }
    for (const layer of this.layers) {
      for (const mountain of layer.mountains) {
        mountain.y += layer.speed * dt;
        if (mountain.y > 1280 + mountain.h) {
          mountain.y = -mountain.h * 1.6;
          mountain.x = rand(-40, 720);
        }
      }
    }
    for (const haze of this.haze) {
      haze.y += 42 * dt;
      haze.x += Math.sin(this.time + haze.w) * 3 * dt;
      if (haze.y > 1320) {
        haze.y = -80;
        haze.x = rand(0, 720);
      }
    }
    if (this.rain) {
      for (const drop of this.rain) {
        drop.y += drop.speed * dt;
        drop.x += 26 * dt;
        if (drop.y > 1320) {
          drop.y = -20;
          drop.x = rand(0, 720);
        }
      }
    }
  }

  render(ctx, fx) {
    const effect = fx || {};
    if (this.sea) {
      this.renderSea(ctx, effect);
      return;
    }
    if (this.cloudtop) {
      this.renderCloudtop(ctx, effect);
      return;
    }
    if (this.terrain) {
      this.renderTerrain(ctx);
      return;
    }
    if (this.space) {
      this.renderSpace(ctx);
      return;
    }
    const p = this.palette();
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, css(p.skyTop));
    sky.addColorStop(0.45, css(p.skyMid));
    sky.addColorStop(0.8, css(p.far));
    sky.addColorStop(1, css(p.near));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    const layerColors = [
      mixColor(p.far, [176, 186, 202], 0.42),
      mixColor(p.mid, p.far, 0.1),
      p.near,
    ];
    for (let i = 0; i < this.layers.length; i += 1) {
      const layer = this.layers[i];
      ctx.globalAlpha = layer.alpha;
      for (const mountain of layer.mountains) {
        this.drawMountain(ctx, mountain, layerColors[i], i === 2);
      }
    }

    for (const haze of this.haze) {
      const g = ctx.createRadialGradient(haze.x, haze.y, 4, haze.x, haze.y, haze.w);
      g.addColorStop(0, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0.16)`);
      g.addColorStop(0.7, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0.07)`);
      g.addColorStop(1, `rgba(${p.haze[0]},${p.haze[1]},${p.haze[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(haze.x, haze.y, haze.w, haze.w * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.rain) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(185,215,238,0.9)';
      for (const drop of this.rain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 5, drop.y + drop.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    for (let i = 0; i < 340; i += 1) {
      const x = (i * 263 + 37) % 720;
      const y = (i * 97) % 1280;
      const light = i % 3 !== 0;
      ctx.globalAlpha = 0.02 + ((i * 7) % 3) * 0.009;
      ctx.fillStyle = light ? '#fff0d4' : '#2b1606';
      ctx.fillRect(x, y, 1 + ((i * 13) % 2), 1);
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(360, 640, 200, 360, 640, 760);
    vignette.addColorStop(0, 'rgba(20,12,4,0)');
    vignette.addColorStop(1, 'rgba(20,12,4,0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderSpace(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1280);
    sky.addColorStop(0, '#04020c');
    sky.addColorStop(0.45, '#0b0618');
    sky.addColorStop(0.8, '#140b24');
    sky.addColorStop(1, '#0a0614');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 720, 1280);

    for (let ni = 0; ni < this.nebulae.length; ni += 1) {
      const neb = this.nebulae[ni];
      const puffs = [
        { dx: 0, dy: 0, r: neb.r, a: 0.85 },
        { dx: Math.cos(ni * 2.399) * neb.r * 0.42, dy: -neb.r * 0.18, r: neb.r * 0.62, a: 0.5 },
        { dx: Math.sin(ni * 1.7) * neb.r * 0.5, dy: neb.r * 0.28, r: neb.r * 0.5, a: 0.4 },
      ];
      for (const puff of puffs) {
        const g = ctx.createRadialGradient(neb.x + puff.dx, neb.y + puff.dy, puff.r * 0.08, neb.x + puff.dx, neb.y + puff.dy, puff.r);
        g.addColorStop(0, `rgba(${neb.color},${(neb.alpha * puff.a).toFixed(3)})`);
        g.addColorStop(0.62, `rgba(${neb.color},${(neb.alpha * puff.a * 0.55).toFixed(3)})`);
        g.addColorStop(1, `rgba(${neb.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(neb.x + puff.dx, neb.y + puff.dy, puff.r, 0, TAU);
        ctx.fill();
      }
      const coreColor = ni % 2 === 0 ? '238,232,255' : '255,240,252';
      const core = ctx.createRadialGradient(neb.x, neb.y, 2, neb.x, neb.y, neb.r * 0.4);
      core.addColorStop(0, `rgba(${coreColor},${(0.22 + neb.alpha * 0.8).toFixed(3)})`);
      core.addColorStop(0.4, `rgba(${coreColor},${(neb.alpha * 0.5).toFixed(3)})`);
      core.addColorStop(1, `rgba(${coreColor},0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.r * 0.4, 0, TAU);
      ctx.fill();
    }
    for (const lane of this.dustLanes) {
      const g = ctx.createRadialGradient(lane.x, lane.y, lane.r * 0.2, lane.x, lane.y, lane.r);
      g.addColorStop(0, `rgba(4,3,12,${(lane.alpha * 0.7).toFixed(3)})`);
      g.addColorStop(0.7, `rgba(8,5,18,${(lane.alpha * 0.3).toFixed(3)})`);
      g.addColorStop(1, 'rgba(8,5,18,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lane.x, lane.y, lane.r, 0, TAU);
      ctx.fill();
    }

    for (const layer of this.starLayers) {
      for (const star of layer.stars) {
        const tw = star.bright * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * (1.5 + star.phase) + star.phase)));
        ctx.globalAlpha = Math.min(1, tw);
        if (star.glow && star.r > 1 && star.rgb) {
          const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 5.5);
          g.addColorStop(0, `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},${(tw * 0.26).toFixed(3)})`);
          g.addColorStop(1, `rgba(${star.rgb[0]},${star.rgb[1]},${star.rgb[2]},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 5.5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = star.color || '#e8ecff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, TAU);
        ctx.fill();
        if (star.glint && star.r > 1.5) {
          ctx.strokeStyle = star.color || '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(star.x - star.r * 2.4, star.y);
          ctx.lineTo(star.x + star.r * 2.4, star.y);
          ctx.moveTo(star.x, star.y - star.r * 2.4);
          ctx.lineTo(star.x, star.y + star.r * 2.4);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.save();
    for (let i = 0; i < 240; i += 1) {
      const x = (i * 173 + 53) % 720;
      const y = (i * 109) % 1280;
      const tone = i % 4;
      ctx.globalAlpha = 0.03 + ((i * 7) % 4) * 0.02;
      if (tone === 0) ctx.fillStyle = '#dfe8ff';
      else if (tone === 1) ctx.fillStyle = '#ffd9f0';
      else if (tone === 2) ctx.fillStyle = '#c9b8ff';
      else ctx.fillStyle = '#9adcff';
      ctx.fillRect(x, y, 1 + ((i * 13) % 2), 1 + ((i * 17) % 2));
    }
    ctx.restore();

    for (const c of this.celestials) {
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.kind === 'planet') {
        const glow = ctx.createRadialGradient(0, 0, c.r * 0.4, 0, 0, c.r * 1.6);
        glow.addColorStop(0, 'rgba(150,120,240,0.22)');
        glow.addColorStop(0.6, 'rgba(110,80,200,0.08)');
        glow.addColorStop(1, 'rgba(110,80,200,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, c.r * 1.6, 0, TAU);
        ctx.fill();
        const body = ctx.createRadialGradient(-c.r * 0.45, -c.r * 0.45, c.r * 0.08, 0, 0, c.r);
        body.addColorStop(0, '#9c88d8');
        body.addColorStop(0.5, '#57468f');
        body.addColorStop(0.85, '#2c2258');
        body.addColorStop(1, '#120c30');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.clip();
        ctx.fillStyle = 'rgba(20,12,46,0.16)';
        for (let b = 0; b < 3; b += 1) {
          const by = -c.r * 0.5 + b * c.r * 0.3;
          ctx.fillRect(-c.r, by, c.r * 2, c.r * 0.11);
        }
        const term = ctx.createRadialGradient(c.r * 0.5, 0, c.r * 0.1, c.r * 0.5, 0, c.r * 1.35);
        term.addColorStop(0, 'rgba(6,3,18,0.55)');
        term.addColorStop(0.7, 'rgba(6,3,18,0.2)');
        term.addColorStop(1, 'rgba(6,3,18,0)');
        ctx.fillStyle = term;
        ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
        ctx.restore();
        if (c.ring) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, c.r, 0, TAU);
          ctx.clip();
          ctx.fillStyle = 'rgba(6,3,18,0.42)';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.r * 1.7, c.r * 0.5, -0.35, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = c.ring ? 'rgba(222,204,255,0.55)' : 'rgba(215,195,255,0.4)';
        ctx.lineWidth = c.ring ? 7 : 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 1.7, c.r * 0.5, -0.35, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(160,130,235,0.35)';
        ctx.lineWidth = c.ring ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 1.82, c.r * 0.54, -0.35, 0, TAU);
        ctx.stroke();
      } else {
        const glow = ctx.createRadialGradient(0, 0, c.r * 0.5, 0, 0, c.r * 1.8);
        glow.addColorStop(0, 'rgba(220,214,255,0.2)');
        glow.addColorStop(1, 'rgba(220,214,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, c.r * 1.8, 0, TAU);
        ctx.fill();
        const body = ctx.createRadialGradient(-c.r * 0.35, -c.r * 0.35, c.r * 0.1, 0, 0, c.r);
        body.addColorStop(0, '#f0ecfa');
        body.addColorStop(0.6, '#c3bce0');
        body.addColorStop(1, '#8d86b8');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.clip();
        const craters = [
          { dx: -0.25, dy: 0.15, r: 0.2 },
          { dx: 0.28, dy: -0.18, r: 0.16 },
          { dx: 0.1, dy: 0.38, r: 0.12 },
        ];
        for (const crater of craters) {
          ctx.fillStyle = 'rgba(60,45,110,0.28)';
          ctx.beginPath();
          ctx.arc(crater.dx * c.r, crater.dy * c.r, crater.r * c.r, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(28,18,62,0.3)';
          ctx.beginPath();
          ctx.arc(crater.dx * c.r - crater.r * c.r * 0.25, crater.dy * c.r - crater.r * c.r * 0.2, crater.r * c.r * 0.72, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(236,230,255,0.6)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(
            crater.dx * c.r + crater.r * c.r * 0.22,
            crater.dy * c.r + crater.r * c.r * 0.18,
            crater.r * c.r * 0.8,
            Math.PI * 0.1,
            Math.PI * 1.25
          );
          ctx.stroke();
        }
        const shade = ctx.createRadialGradient(c.r * 0.4, c.r * 0.45, c.r * 0.1, 0, 0, c.r * 1.3);
        shade.addColorStop(0, 'rgba(12,6,30,0.35)');
        shade.addColorStop(1, 'rgba(12,6,30,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
        ctx.restore();
      }
      ctx.restore();
    }

    for (const d of this.debris) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.fillStyle = '#3a2c3e';
      ctx.strokeStyle = 'rgba(160,110,220,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-d.w / 2, -d.h / 2);
      ctx.lineTo(d.w / 2, -d.h / 3);
      ctx.lineTo(d.w / 3, d.h / 2);
      ctx.lineTo(-d.w / 3, d.h / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.shooting) {
      const s = this.shooting;
      const alpha = Math.max(0, Math.min(1, s.life * 2));
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.06, s.y - s.vy * 0.06);
      g.addColorStop(0, `rgba(255,240,255,${(0.9 * alpha).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,240,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.06, s.y - s.vy * 0.06);
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(360, 640, 220, 360, 640, 780);
    vignette.addColorStop(0, 'rgba(10,4,24,0)');
    vignette.addColorStop(1, 'rgba(10,4,24,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 720, 1280);
  }

  makeTerrain() {
    this.time = 0;
    this.terrainScroll = 0;
    try {
      this.terrainTile = this.buildTerrainTile();
    } catch (err) {
      this.terrainTile = null;
    }
    this.ridges = [];
    for (let i = 0; i < 84; i += 1) {
      this.ridges.push(this.spawnRidge(i, true));
    }
    return !!this.terrainTile;
  }

  spawnRidge(index, initial) {
    return {
      y: initial ? -320 + rand(0, 1680) : -340,
      cx: rand(20, 700),
      len: rand(100, 480),
      tilt: rand(-0.55, 0.55),
      amp: rand(5, 34),
      w: rand(8, 30),
      seed: Math.floor(rand(0, 100000)),
      ph: rand(0, TAU),
      dark: rand(0.5, 1),
      index,
    };
  }

  buildTerrainTile() {
    const W = 480;
    const H = 800;
    const canvas = makeCanvas(W, H);
    const c = canvas.getContext('2d');
    if (!c || !c.createImageData) return null;
    const hash = (ix, iy, seed) => {
      const v = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const vnoise = (px, py, cx, cy, seed) => {
      const u = (px / W) * cx;
      const v = (py / H) * cy;
      const x0 = Math.floor(u) % cx;
      const y0 = Math.floor(v) % cy;
      const fx = u - Math.floor(u);
      const fy = v - Math.floor(v);
      const x1 = (x0 + 1) % cx;
      const y1 = (y0 + 1) % cy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = hash(x0, y0, seed);
      const b = hash(x1, y0, seed);
      const cc = hash(x0, y1, seed);
      const d = hash(x1, y1, seed);
      return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy;
    };
    const height = new Float32Array(W * H);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const n1 = vnoise(x, y, 10, 17, 11) * 0.5;
        const n2 = vnoise(x, y, 20, 34, 23) * 0.3;
        const n3 = vnoise(x, y, 40, 68, 41) * 0.2;
        const r1 = vnoise(x, y, 13, 22, 57);
        const r2 = vnoise(x, y, 26, 44, 71);
        const rid1 = 1 - Math.abs(2 * r1 - 1);
        const rid2 = 1 - Math.abs(2 * r2 - 1);
        let h = 0.5 + (n1 + n2 + n3 - 0.5) * 0.9 + (rid1 * rid1 * 0.62 + rid2 * rid2 * 0.28 - 0.45) * 0.9;
        if (h < 0) h = 0;
        if (h > 1) h = 1;
        height[y * W + x] = h;
      }
    }
    const image = c.createImageData(W, H);
    const data = image.data;
    const ramp = (t) => {
      const stops = [
        { t: 0, c: [66, 60, 44] },
        { t: 0.38, c: [136, 108, 74] },
        { t: 0.7, c: [198, 158, 112] },
        { t: 1, c: [224, 188, 134] },
      ];
      if (t <= 0) return stops[0].c.slice();
      for (let i = 1; i < stops.length; i += 1) {
        if (t <= stops[i].t) {
          const a = stops[i - 1];
          const b = stops[i];
          const k = (t - a.t) / (b.t - a.t);
          return [
            a.c[0] + (b.c[0] - a.c[0]) * k,
            a.c[1] + (b.c[1] - a.c[1]) * k,
            a.c[2] + (b.c[2] - a.c[2]) * k,
          ];
        }
      }
      return stops[stops.length - 1].c.slice();
    };
    const lx = -0.62;
    const ly = -0.55;
    const lz = 0.56;
    const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = y * W + x;
        const hc = height[i];
        const hL = height[y * W + ((x + W - 1) % W)];
        const hR = height[y * W + ((x + 1) % W)];
        const hU = height[((y + H - 1) % H) * W + x];
        const hD = height[((y + 1) % H) * W + x];
        const hx = (hR - hL) * 6;
        const hy = (hD - hU) * 6;
        const nx = -hx;
        const ny = -hy;
        const nz = 1;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const shade = (nx * lx + ny * ly + nz * lz) / (nl * ll);
        let lit = 0.5 + 0.5 * shade;
        lit = 0.5 + (lit - 0.5) * 1.55;
        if (lit < 0) lit = 0;
        if (lit > 1) lit = 1;
        const base = ramp(hc);
        const glow = Math.min(1, Math.max(0, (hc - 0.62) * 2.4));
        const r = Math.min(255, (base[0] * (0.62 + 0.72 * lit)) * (1 + glow * 0.18));
        const g = Math.min(255, (base[1] * (0.62 + 0.72 * lit)) * (1 + glow * 0.16));
        const b = Math.min(255, (base[2] * (0.62 + 0.72 * lit)) * (1 + glow * 0.12));
        const o = i * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      }
    }
    c.putImageData(image, 0, 0);
    const tile = makeCanvas(720, 1280);
    const tc = tile.getContext('2d');
    if (!tc) return null;
    tc.imageSmoothingEnabled = true;
    tc.drawImage(canvas, 0, 0, 720, 1280);
    return tile;
  }

  updateTerrain(dt) {
    this.terrainScroll = (this.terrainScroll + 96 * dt) % 1280;
    for (const ridge of this.ridges) {
      ridge.y += 96 * dt;
      if (ridge.y > 1700) {
        const r = this.spawnRidge(ridge.index, false);
        ridge.y = r.y;
        ridge.cx = r.cx;
        ridge.len = r.len;
        ridge.tilt = r.tilt;
        ridge.amp = r.amp;
        ridge.w = r.w;
        ridge.seed = r.seed;
        ridge.ph = r.ph;
        ridge.dark = r.dark;
      }
    }
  }

  drawTerrainRidges(ctx) {
    for (const ridge of this.ridges) {
      const x0 = ridge.cx - ridge.len / 2;
      const x1 = ridge.cx + ridge.len / 2;
      const pts = [];
      for (let x = x0; x <= x1; x += 6) {
        const t = (x - ridge.cx) / ridge.len;
        pts.push({
          x: x + Math.sin(x * 0.02 + ridge.seed) * 2,
          y:
            ridge.y +
            Math.sin(x * 0.012 + ridge.ph) * ridge.amp +
            Math.sin(x * 0.031 + ridge.ph * 1.7) * ridge.amp * 0.4 +
            t * ridge.len * ridge.tilt,
        });
      }
      const band = (dxA, dyA, dxB, dyB, fillStyle) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 1) {
          const p = pts[i];
          if (i === 0) ctx.moveTo(p.x + dxA, p.y + dyA);
          else ctx.lineTo(p.x + dxA, p.y + dyA);
        }
        for (let i = pts.length - 1; i >= 0; i -= 1) {
          const p = pts[i];
          ctx.lineTo(p.x + dxB, p.y + dyB);
        }
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      };
      const halfW = ridge.w * 0.5;
      band(halfW * 0.9, halfW * 0.65, -halfW * 0.3, -halfW * 0.18, `rgba(30,15,5,${(0.4 + 0.2 * ridge.dark).toFixed(3)})`);
      band(-halfW * 0.62, -halfW * 0.5, halfW * 0.55, halfW * 0.4, `rgba(238,192,132,${(0.24 + 0.14 * ridge.dark).toFixed(3)})`);
      ctx.strokeStyle = `rgba(255,222,170,${(0.16 + 0.1 * ridge.dark).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 1) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
  }

  renderTerrain(ctx) {
    const tile = this.terrainTile;
    const y = this.terrainScroll;
    if (tile) {
      ctx.drawImage(tile, 0, y - 1280, 720, 1280);
      ctx.drawImage(tile, 0, y, 720, 1280);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, 1280);
      g.addColorStop(0, '#8a7357');
      g.addColorStop(1, '#5b4a35');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 720, 1280);
    }
    ctx.fillStyle = 'rgba(28,15,5,0.3)';
    ctx.fillRect(0, 0, 720, 1280);
    this.drawTerrainRidges(ctx);
    ctx.save();
    for (let i = 0; i < 260; i += 1) {
      const x = (i * 181 + 47) % 720;
      const yy = (i * 113) % 1280;
      const light = i % 2 === 0;
      ctx.globalAlpha = 0.02 + ((i * 5) % 4) * 0.01;
      ctx.fillStyle = light ? '#fff3d8' : '#2a1a08';
      ctx.fillRect(x, yy, 1 + ((i * 11) % 2), 1);
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(360, 640, 240, 360, 640, 820);
    vg.addColorStop(0, 'rgba(20,10,2,0)');
    vg.addColorStop(1, 'rgba(20,10,2,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 720, 1280);
  }

  triggerLightning(x) {
    if (!this.sea) return;
    this.strikeX = Math.max(40, Math.min(680, x == null ? this.strikeX : x));
    this.strikeY = rand(120, 980);
  }

  makeSea() {
    this.time = 0;
    this.horizon = 0;
    this.waterH = 1280 - this.horizon;
    this.strikeX = 360;
    this.strikeY = 560;
    this.boltSeed = Math.floor(rand(0, 1000));
    this.rows = [];
    const N = 30;
    for (let i = 0; i < N; i += 1) {
      this.rows.push({
        u: (i + Math.random()) / N,
        ph1: rand(0, TAU),
        ph2: rand(0, TAU),
        ph3: rand(0, TAU),
        roller: Math.random(),
        size: rand(0.35, 1.65),
        seed: Math.floor(rand(0, 100000)),
      });
    }
    this.rows.sort((a, b) => a.u - b.u);
    this.rain = this.makeRainLayer(46, 10, 18, 620, 840, 0.08, 0.22);
    this.nearRain = this.makeRainLayer(28, 20, 34, 860, 1150, 0.25, 0.46);
    this.splashes = [];
    this.splashTimer = rand(0.05, 0.15);
    this.skyPuffs = [];
    for (let i = 0; i < 8; i += 1) {
      this.skyPuffs.push({
        x: rand(-140, 780),
        y: rand(6, 205),
        rx: rand(90, 250),
        ry: rand(22, 60),
        a: rand(0.22, 0.48),
        drift: rand(2, 7),
        ph: rand(0, TAU),
        light: Math.random() < 0.5,
      });
    }
  }

  makeRainLayer(count, minLen, maxLen, minSpeed, maxSpeed, minAlpha, maxAlpha) {
    const drops = [];
    for (let i = 0; i < count; i += 1) {
      drops.push({
        x: rand(0, 720),
        y: rand(0, 1280),
        len: rand(minLen, maxLen),
        speed: rand(minSpeed, maxSpeed),
        alpha: rand(minAlpha, maxAlpha),
      });
    }
    return drops;
  }

  seaT(u) {
    return Math.max(u, 0.00001);
  }

  seaY(u) {
    return this.horizon + this.seaT(u) * this.waterH;
  }

  updateSea(dt) {
    for (const row of this.rows) {
      const t = this.seaT(row.u);
      row.u += 0.068 * dt;
      if (row.u >= 1) {
        row.u -= 1;
        row.ph1 = rand(0, TAU);
        row.ph2 = rand(0, TAU);
        row.ph3 = rand(0, TAU);
        row.roller = Math.random();
        row.size = rand(0.35, 1.65);
        row.seed = Math.floor(rand(0, 100000));
      }
      row.ph1 += (0.05 + 0.35 * t) * dt;
      row.ph2 += (0.09 + 0.55 * t) * dt;
    }
    if (this.rain) {
      for (const drop of this.rain) {
        drop.y += drop.speed * dt;
        drop.x += 18 * dt;
        if (drop.y > 1320) {
          drop.y = -20;
          drop.x = rand(0, 720);
        }
      }
    }
    if (this.nearRain) {
      for (const drop of this.nearRain) {
        drop.y += drop.speed * dt;
        drop.x += 42 * dt;
        if (drop.y > 1320) {
          drop.y = -30;
          drop.x = rand(0, 720);
        }
      }
    }
    this.splashTimer -= dt;
    while (this.splashTimer <= 0) {
      this.splashTimer += rand(0.035, 0.11);
      const depth = Math.random();
      this.splashes.push({
        x: rand(24, 696),
        y: this.horizon + 12 + depth * (this.waterH - 60),
        t: 0,
        dur: rand(0.26, 0.6),
        size: rand(5, 14),
        vx: rand(-8, 8),
      });
    }
    if (this.splashes.length > 36) {
      this.splashes.splice(0, this.splashes.length - 36);
    }
    for (const sp of this.splashes) sp.t += dt;
    this.splashes = this.splashes.filter((sp) => sp.t < sp.dur);
    for (const c of this.skyPuffs) {
      c.x += (c.drift + Math.sin(this.time * 0.35 + c.ph) * 5) * dt;
      if (c.x > 900) c.x = -c.rx * 1.2;
      if (c.x < -c.rx * 1.4) c.x = 900;
    }
  }

  renderStormSky(ctx, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const g = ctx.createLinearGradient(0, 0, 0, this.horizon + 18);
    g.addColorStop(0, css(scaleColor([12, 18, 24], 1 + 0.4 * f)));
    g.addColorStop(0.4, css(scaleColor([30, 42, 51], 1 + 0.38 * f)));
    g.addColorStop(0.8, css(scaleColor([64, 78, 86], 1 + 0.46 * f)));
    g.addColorStop(1, css(scaleColor([108, 122, 130], 1 + 0.58 * f)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 720, this.horizon + 14);

    for (const c of this.skyPuffs) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(1, c.ry / c.rx);
      const body = ctx.createRadialGradient(0, 0, 0, 0, 0, c.rx);
      const a = Math.min(0.6, c.a * (1 + 0.3 * f));
      const core = c.light ? scaleColor([88, 104, 114], 1 + 0.28 * f) : scaleColor([46, 59, 69], 1 + 0.22 * f);
      const edge = c.light ? scaleColor([46, 60, 70], 1 + 0.25 * f) : scaleColor([22, 32, 41], 1 + 0.25 * f);
      body.addColorStop(0, `rgba(${core[0]},${core[1]},${core[2]},${(a * 0.8).toFixed(3)})`);
      body.addColorStop(0.55, `rgba(${core[0]},${core[1]},${core[2]},${a.toFixed(3)})`);
      body.addColorStop(0.85, `rgba(${edge[0]},${edge[1]},${edge[2]},${(a * 0.35).toFixed(3)})`);
      body.addColorStop(1, 'rgba(20,30,38,0)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, c.rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < Math.min(4, this.skyPuffs.length); i += 1) {
      const c = this.skyPuffs[i];
      if (c.y + c.ry * 1.4 < 120 || c.y > 190) continue;
      const topY = c.y + c.ry * 1.1;
      const shaftW = 20 + ((i * 43) % 36);
      const shaft = ctx.createLinearGradient(0, topY, 0, this.horizon);
      shaft.addColorStop(0, `rgba(196,220,234,${(0.04 + Math.sin(this.time * 0.6 + i * 1.9) * 0.018).toFixed(3)})`);
      shaft.addColorStop(1, 'rgba(186,212,226,0)');
      ctx.fillStyle = shaft;
      ctx.fillRect(c.x - shaftW / 2 + 30, topY, shaftW, Math.max(10, this.horizon - topY));
    }

    const haze = ctx.createLinearGradient(0, this.horizon - 14, 0, this.horizon + 34);
    haze.addColorStop(0, 'rgba(198,214,222,0)');
    haze.addColorStop(0.6, `rgba(196,212,220,${(0.24 + 0.28 * f).toFixed(3)})`);
    haze.addColorStop(1, 'rgba(190,208,216,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.horizon - 14, 720, 50);
  }

  renderSeaBase(ctx, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const g = ctx.createLinearGradient(0, this.horizon, 0, 1280);
    g.addColorStop(0, css(scaleColor([64, 86, 96], 1 + 0.4 * f)));
    g.addColorStop(0.28, css(scaleColor([46, 66, 76], 1 + 0.28 * f)));
    g.addColorStop(0.6, css(scaleColor([32, 50, 60], 1 + 0.16 * f)));
    g.addColorStop(1, css(scaleColor([24, 40, 50], 1 + 0.08 * f)));
    ctx.fillStyle = g;
    ctx.fillRect(0, this.horizon, 720, 1280 - this.horizon + 2);
  }

  drawSeaRow(ctx, row, nextY, flash) {
    const f = Math.min(1, Math.max(0, flash || 0));
    const y = this.seaY(row.u);
    if (y < 2) return;
    const size = row.size || 1;
    const amp = 0.7 + 7.5 * size;
    const freq = 0.018 + 0.014 * ((row.seed % 100) / 100);
    const x0 = -60;
    const x1 = 780;
    const wob = (x) =>
      Math.sin(x * freq + row.ph1) * amp +
      Math.sin(x * freq * 2.9 + row.ph2) * amp * 0.34 +
      Math.sin(x * freq * 0.53 + row.ph3) * amp * 0.22;
    const base = mixColor([66, 88, 97], [40, 60, 70], Math.min(0.5, (y / 1280) * 0.38));
    const crest = mixColor(base, [198, 214, 223], Math.min(0.75, 0.1 + 0.5 * f));
    const deep = mixColor(base, [3, 8, 13], 0.44);
    const bandH = Math.max(3, nextY - y + 4);
    const a0 = Math.min(0.62, 0.1 + 0.15 * size + 0.3 * f);
    const grad = ctx.createLinearGradient(0, y - amp, 0, y + bandH);
    grad.addColorStop(0, `rgba(${crest[0]},${crest[1]},${crest[2]},${a0.toFixed(3)})`);
    grad.addColorStop(0.18, `rgba(${base[0]},${base[1]},${base[2]},${(a0 * 0.5).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${deep[0]},${deep[1]},${deep[2]},${(a0 * 0.18).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${deep[0]},${deep[1]},${deep[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) {
      const wy = y + wob(x);
      if (x === x0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    for (let x = x1; x >= x0; x -= 6) {
      ctx.lineTo(x, y + bandH + wob(x) * 0.25);
    }
    ctx.closePath();
    ctx.fill();

    const segs = 2 + Math.floor(size * 2.6) + (row.roller > 0.85 ? 2 : 0);
    const rimA = Math.min(0.9, (0.1 + 0.2 * size + 0.32 * f) * (0.5 + 0.5 * Math.sin(row.ph1 * 2 + this.time * 2)));
    ctx.globalAlpha = rimA;
    ctx.strokeStyle = css(mixColor(crest, [255, 255, 255], 0.2 + f * 0.4));
    ctx.lineWidth = Math.max(0.8, 0.8 + size * 1.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const rndR = (n) => {
      const v = Math.sin(n * 127.1 + row.seed * 0.618 + 17.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let s = 0; s < segs; s += 1) {
      const sx = -30 + rndR(s + 1) * 740;
      const sl = 22 + rndR(s + 44) * 130;
      let first = true;
      for (let x = sx; x <= sx + sl; x += 4) {
        const wy = y + wob(x);
        if (first) {
          ctx.moveTo(x, wy);
          first = false;
        } else {
          ctx.lineTo(x, wy);
        }
      }
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1;

    if (size > 1.1) {
      const foam = 2 + Math.floor((size - 1) * 4);
      const rnd = (n) => {
        const v = Math.sin(n * 127.1 + row.seed * 0.618 + 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      ctx.lineCap = 'round';
      for (let k = 0; k < foam; k += 1) {
        const cx = -20 + rnd(k + 1) * 720;
        const len = 16 + rnd(k + 60) * 60;
        const fa = Math.min(0.8, 0.18 + size * 0.2 + f * 0.35);
        ctx.strokeStyle = `rgba(226,239,245,${fa.toFixed(3)})`;
        ctx.lineWidth = 1 + size;
        ctx.beginPath();
        let first = true;
        for (let x = cx; x <= cx + len; x += 4) {
          const wy = y + wob(x) - 1;
          if (first) {
            ctx.moveTo(x, wy);
            first = false;
          } else {
            ctx.lineTo(x, wy);
          }
        }
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
  }

  renderSeaRain(ctx) {
    if (this.rain) {
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(176,206,225,0.8)';
      for (const drop of this.rain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.3, drop.y + drop.len);
        ctx.stroke();
      }
    }
    if (this.nearRain) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(198,224,240,0.9)';
      for (const drop of this.nearRain) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.42, drop.y + drop.len);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  renderBolt(ctx, flash) {
    if (flash < 0.78) return;
    const a = Math.min(1, (flash - 0.78) / 0.22);
    const seed = this.boltSeed;
    const rnd = (n) => {
      const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const sx = this.strikeX;
    const pts = [];
    let x = sx;
    let y = -12;
    for (let i = 0; i < 11; i += 1) {
      pts.push({ x, y });
      x += (rnd(i * 7 + 1) - 0.5) * 30;
      y += 22 + rnd(i * 13 + 2) * 22;
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(190,225,255,0.95)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(240,250,255,0.96)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 1) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(225,242,255,0.85)';
    ctx.beginPath();
    const b1 = pts[4];
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b1.x - 20 - rnd(3) * 34, b1.y + 30 + rnd(4) * 28);
    ctx.lineTo(b1.x - 34 - rnd(5) * 24, b1.y + 42 + rnd(6) * 22);
    const b2 = pts[8];
    ctx.moveTo(b2.x, b2.y);
    ctx.lineTo(b2.x + 24 + rnd(8) * 36, b2.y + 34 + rnd(9) * 30);
    ctx.stroke();
    ctx.restore();
  }

  renderSeaGlare(ctx, flash) {
    if (flash <= 0.02) return;
    const sx = this.strikeX;
    const g = ctx.createLinearGradient(sx - 170, 0, sx + 170, 0);
    g.addColorStop(0, 'rgba(216,234,244,0)');
    g.addColorStop(0.5, `rgba(220,237,247,${(0.34 * flash).toFixed(3)})`);
    g.addColorStop(1, 'rgba(216,234,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - 170, 0, 340, 1280);
    const vertical = ctx.createLinearGradient(0, 0, 0, 1280);
    vertical.addColorStop(0, `rgba(240,249,255,${(0.5 * flash).toFixed(3)})`);
    vertical.addColorStop(0.3, `rgba(226,242,252,${(0.3 * flash).toFixed(3)})`);
    vertical.addColorStop(1, 'rgba(214,233,245,0)');
    ctx.fillStyle = vertical;
    ctx.fillRect(sx - 26, 0, 52, 1280);
    const bloom = ctx.createRadialGradient(sx, this.strikeY, 2, sx, this.strikeY, 190);
    bloom.addColorStop(0, `rgba(244,250,255,${(0.9 * flash).toFixed(3)})`);
    bloom.addColorStop(0.28, `rgba(226,242,252,${(0.5 * flash).toFixed(3)})`);
    bloom.addColorStop(1, 'rgba(216,234,244,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(sx - 190, this.strikeY - 190, 380, 380);
    ctx.strokeStyle = `rgba(230,244,252,${(0.4 * flash).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, this.strikeY, 90 + flash * 90, 34, 0, 0, TAU);
    ctx.stroke();
  }

  renderSea(ctx, fx) {
    const f = Math.min(1, Math.max(0, fx.lightning || 0));
    this.renderSeaBase(ctx, f);
    const sorted = this.rows.slice().sort((a, b) => a.u - b.u);
    for (let i = 0; i < sorted.length; i += 1) {
      const row = sorted[i];
      const next = sorted[i + 1];
      const y = this.seaY(row.u);
      const t = this.seaT(row.u);
      const nextY = next ? this.seaY(next.u) : Math.max(1245, y + 120 + t * 120);
      this.drawSeaRow(ctx, row, nextY, f);
    }
    this.renderSeaRain(ctx);
    this.renderSeaSplashes(ctx);
    this.renderSeaGlints(ctx);
    if (f > 0.02) this.renderSeaGlare(ctx, f);
    const vg = ctx.createRadialGradient(360, 640, 240, 360, 640, 820);
    vg.addColorStop(0, 'rgba(5,9,12,0)');
    vg.addColorStop(1, 'rgba(5,9,12,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderSeaSplashes(ctx) {
    for (const sp of this.splashes) {
      const k = sp.t / sp.dur;
      const r = sp.size * (0.35 + k * 1.45);
      const a = (1 - k) * 0.5;
      ctx.strokeStyle = `rgba(204,226,238,${a.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, 2.4 * (1 - k) + 0.8);
      ctx.beginPath();
      ctx.ellipse(sp.x + sp.vx * sp.t, sp.y, r * 1.45, r * 0.3, 0, 0, TAU);
      ctx.stroke();
      if (k < 0.35) {
        ctx.fillStyle = `rgba(216,234,244,${((1 - k / 0.35) * 0.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sp.x + sp.vx * sp.t, sp.y, 1.6, 0, TAU);
        ctx.fill();
      }
    }
  }

  renderSeaGlints(ctx) {
    const time = this.time;
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i += 1) {
      const ph = i * 2.399;
      const x = (Math.sin(i * 127.1 + 3.7) * 0.5 + 0.5) * 660 + 20;
      const depth = Math.sin(i * 73.7 + 1.3) * 0.5 + 0.5;
      const y = this.horizon + 10 + depth * (this.waterH - 60);
      const tw = 0.5 + 0.5 * Math.sin(time * (0.7 + depth * 1.4) + ph);
      const alpha = (0.04 + 0.1 * depth) * Math.max(0, tw);
      if (alpha < 0.02) continue;
      const len = (9 + depth * 34) * (0.6 + 0.4 * Math.sin(time * 1.7 + ph));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(222,238,248,0.9)';
      ctx.lineWidth = 0.8 + depth * 1.2;
      ctx.beginPath();
      ctx.moveTo(x - len / 2, y);
      ctx.lineTo(x + len / 2, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  makeCloudtop() {
    this.time = 0;
    this.deckTop = 0;
    this.deckH = 1280 - this.deckTop;
    this.rows = [];
    const N = 26;
    for (let i = 0; i < N; i += 1) {
      this.rows.push({
        u: (i + Math.random()) / N,
        ph1: rand(0, TAU),
        ph2: rand(0, TAU),
        roller: Math.random(),
        seed: Math.floor(rand(0, 100000)),
      });
    }
    this.rows.sort((a, b) => a.u - b.u);
    this.cloudCells = [];
    for (let i = 0; i < 100; i += 1) {
      this.cloudCells.push({
        u: Math.random(),
        x: rand(30, 690),
        seed: Math.floor(rand(0, 100000)),
        ph: rand(0, TAU),
      });
    }
    this.cirrus = [];
    for (let i = 0; i < 9; i += 1) {
      this.cirrus.push({
        x: rand(-120, 760),
        y: rand(60, 460),
        len: rand(150, 330),
        slope: rand(-0.06, 0.06),
        alpha: rand(0.1, 0.24),
        speed: rand(2, 7),
        ph: rand(0, TAU),
      });
    }
    this.sun = { x: 150, y: 472, r: 25 };
    this.blobWhite = this.makeBlobSprite(1, 0);
    this.blobFar = this.makeBlobSprite(0.74, 1);
    this.occTimer = rand(OCC_CLOUD_INTERVAL_MIN, OCC_CLOUD_INTERVAL_MAX);
    this.occClouds = [];
    this.occElapsed = 0;
    this.occDuration = 0;
    this.occVeil = 0;
    this.foreSprites = [];
    const scales = [0.72, 0.58, 0.66];
    for (const s of scales) {
      const sprite = this.makeCloudSprite(s);
      if (sprite) this.foreSprites.push(sprite);
    }
  }

  makeBlobSprite(opacity, mode) {
    let canvas;
    try {
      canvas = makeCanvas(220, 150);
    } catch (err) {
      return null;
    }
    const c = canvas.getContext('2d');
    if (!c) return null;
    const rx = 96;
    c.save();
    c.translate(110, 88);
    c.scale(1, 0.66);
    const g = c.createRadialGradient(-rx * 0.3, -rx * 0.24, rx * 0.04, 0, 0, rx * 1.02);
    const cool = mode ? [216, 228, 238] : [235, 244, 250];
    g.addColorStop(0, `rgba(255,255,255,${(0.95 * opacity).toFixed(3)})`);
    g.addColorStop(0.5, `rgba(250,252,253,${(0.9 * opacity).toFixed(3)})`);
    g.addColorStop(0.82, `rgba(${cool[0]},${cool[1]},${cool[2]},${(0.55 * opacity).toFixed(3)})`);
    g.addColorStop(1, `rgba(${cool[0]},${cool[1]},${cool[2]},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, rx, 0, TAU);
    c.fill();
    const shadeColor = mode ? [128, 152, 172] : [188, 205, 220];
    const sh = c.createRadialGradient(rx * 0.4, rx * 0.5, rx * 0.06, rx * 0.16, rx * 0.5, rx * 1.0);
    sh.addColorStop(0, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},${(0.34 * opacity).toFixed(3)})`);
    sh.addColorStop(0.5, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},${(0.17 * opacity).toFixed(3)})`);
    sh.addColorStop(1, `rgba(${shadeColor[0]},${shadeColor[1]},${shadeColor[2]},0)`);
    c.fillStyle = sh;
    c.beginPath();
    c.arc(0, 0, rx, 0, TAU);
    c.fill();
    c.restore();
    return canvas;
  }

  makeCloudSprite(alphaScale) {
    let canvas;
    try {
      canvas = makeCanvas(1100, 660);
    } catch (err) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const lobes = [
      { x: 550, y: 460, rx: 320, ry: 125 },
      { x: 250, y: 465, rx: 200, ry: 88 },
      { x: 845, y: 470, rx: 215, ry: 92 },
      { x: 390, y: 330, rx: 165, ry: 78 },
      { x: 715, y: 340, rx: 180, ry: 82 },
      { x: 545, y: 300, rx: 150, ry: 72 },
      { x: 165, y: 350, rx: 125, ry: 62 },
      { x: 950, y: 360, rx: 130, ry: 62 },
      { x: 70, y: 330, rx: 120, ry: 58 },
      { x: 1030, y: 330, rx: 115, ry: 56 },
    ];
    for (const lobe of lobes) {
      ctx.save();
      ctx.translate(lobe.x, lobe.y);
      ctx.scale(1, lobe.ry / lobe.rx);
      const g = ctx.createRadialGradient(0, -lobe.ry * 0.5, 0, 0, 0, lobe.rx);
      g.addColorStop(0, `rgba(232,240,247,${(0.96 * alphaScale).toFixed(3)})`);
      g.addColorStop(0.42, `rgba(210,225,237,${(0.9 * alphaScale).toFixed(3)})`);
      g.addColorStop(0.8, `rgba(188,208,224,${(0.5 * alphaScale).toFixed(3)})`);
      g.addColorStop(1, 'rgba(180,202,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, lobe.rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const shade = ctx.createLinearGradient(0, 250, 0, 620);
    shade.addColorStop(0, 'rgba(140,168,190,0)');
    shade.addColorStop(0.7, `rgba(150,176,198,${(0.2 * alphaScale).toFixed(3)})`);
    shade.addColorStop(1, `rgba(150,176,198,${(0.3 * alphaScale).toFixed(3)})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 250, 1100, 370);
    return canvas;
  }

  updateCloudtop(dt) {
    for (const row of this.rows) {
      const t = this.cloudT(row.u);
      row.u += 0.05 * dt;
      if (row.u >= 1) {
        row.u -= 1;
        row.ph1 = rand(0, TAU);
        row.ph2 = rand(0, TAU);
        row.roller = Math.random();
        row.seed = Math.floor(rand(0, 100000));
      }
      row.ph1 += (0.04 + 0.14 * t) * dt;
      row.ph2 += (0.06 + 0.2 * t) * dt;
    }
    for (const cell of this.cloudCells) {
      cell.u += 0.042 * dt;
      if (cell.u >= 1) {
        cell.u -= 1;
        cell.x = rand(30, 690);
        cell.seed = Math.floor(rand(0, 100000));
        cell.ph = rand(0, TAU);
      }
    }
    for (const c of this.cirrus) {
      c.x -= c.speed * dt;
      c.ph += dt * 0.4;
      if (c.x + c.len < -60) {
        c.x = 820 + rand(0, 60);
        c.y = rand(60, 460);
      }
    }

    let wasActive = this.occClouds.length > 0;
    if (!wasActive) {
      this.occTimer -= dt;
      if (this.occTimer <= 0) {
        const maxDur = rand(5.4, 7.6);
        this.occDuration = maxDur;
        this.occElapsed = 0;
        // 每次只来一团云：固定从屏幕正上方（中线）以大尺寸垂直下落。
        this.occClouds.push({
          delay: 0,
          prog: -0.12,
          speed: rand(0.185, 0.235),
          x: 360,
          sway: rand(50, 150),
          swayPh: rand(0, TAU),
          swaySpeed: rand(0.35, 0.7),
          alpha: rand(0.78, 0.94),
          sprite: 0,
        });
      }
    }
    for (const cl of this.occClouds) {
      if (cl.delay > 0) {
        cl.delay -= dt;
      } else {
        cl.prog += cl.speed * dt;
      }
    }
    this.occClouds = this.occClouds.filter((cl) => cl.delay <= 0 && cl.prog < 1.18);
    if (wasActive && this.occClouds.length === 0) {
      this.occTimer = rand(OCC_CLOUD_INTERVAL_MIN, OCC_CLOUD_INTERVAL_MAX);
    }
    const veilTarget = this.occClouds.length ? 0.26 : 0;
    const rate = veilTarget > this.occVeil ? 0.35 : 0.8;
    this.occVeil += (veilTarget - this.occVeil) * Math.min(1, rate * dt);
    if (Math.abs(this.occVeil - veilTarget) < 0.002) this.occVeil = veilTarget;
  }

  cloudT(u) {
    return Math.max(u, 0.00001);
  }

  cloudY(u) {
    return this.deckTop + this.cloudT(u) * this.deckH;
  }

  drawFarCloudMist(ctx) {
    if (!this.blobFar) return;
    const rnd = (n) => {
      const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 40; i += 1) {
      const p = i / 40;
      const hy = this.deckTop - 8 + Math.pow(p, 1.9) * 128;
      const x = -30 + rnd(i * 3 + 1) * 780;
      const r = 3.5 + Math.pow(p, 1.5) * 26;
      ctx.globalAlpha = 0.14 + p * 0.22 + Math.sin(this.time * 0.9 + i) * 0.03;
      const w = r * 2;
      const h = w * 0.68;
      ctx.drawImage(this.blobFar, x - r, hy - h * 0.5, w, h);
    }
    ctx.globalAlpha = 1;
  }

  drawCloudDeckRow(ctx, row) {
    const t = this.cloudT(row.u);
    if (t < 0.3) return;
    const y = this.cloudY(row.u);
    const seed = row.seed;
    const rnd = (n) => {
      const v = Math.sin(n * 127.1 + seed * 78.233 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const rBase = 4 + 108 * Math.pow(t, 2.3);
    const spacing = Math.max(18, rBase * (1.9 + 0.42 * rnd(1)));
    const rowA = Math.min(0.97, 0.42 + 0.55 * t);
    const sprite = t < 0.55 ? this.blobFar : this.blobWhite;
    let cx = -90 + ((seed % 89) / 89) * spacing * 1.2;
    let k = 0;
    while (cx < 830 && k < 36) {
      const rr = rBase * (0.5 + 0.95 * rnd(k + 3));
      const jy = y + (rnd(k + 41) - 0.5) * rBase * 1.9 + Math.sin(k * 1.9 + row.ph1) * rBase * 0.35;
      const a = rowA * (0.55 + 0.45 * rnd(k + 77));
      if (sprite) {
        ctx.globalAlpha = Math.min(1, a);
        const w = rr * 2;
        const h = w * 0.68;
        ctx.drawImage(sprite, cx - rr, jy - h * 0.55, w, h);
      }
      k += 1;
      cx += spacing * (0.34 + 1.25 * rnd(k + 11));
    }
    ctx.globalAlpha = 1;
  }

  drawCloudCells(ctx) {
    const time = this.time;
    for (const cell of this.cloudCells) {
      const t = this.cloudT(cell.u);
      const y = this.cloudY(cell.u);
      const seed = cell.seed;
      const rnd = (n) => {
        const v = Math.sin(n * 127.1 + seed * 78.233 + 41.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const r = Math.max(8, (16 + 42 * rnd(1) + 22 * t) * (rnd(5) > 0.92 ? 1.7 : 1));
      const sprite = rnd(6) < 0.3 ? this.blobFar : this.blobWhite;
      if (!sprite) continue;
      const cx = cell.x + Math.sin(time * 0.5 + cell.ph) * r * 0.5;
      const cy = y + (rnd(2) - 0.5) * r * 0.9;
      const a = Math.min(0.96, 0.62 + 0.3 * rnd(3) + t * 0.06);
      ctx.globalAlpha = Math.min(1, a * (0.55 + 0.45 * rnd(3)));
      const w = r * 2;
      const h = w * 0.68;
      ctx.drawImage(sprite, cx - r, cy - h * 0.55, w, h);
    }
    ctx.globalAlpha = 1;
  }

  renderCloudtop(ctx, fx) {
    const deck = ctx.createLinearGradient(0, 0, 0, 1280);
    deck.addColorStop(0, 'rgba(214,238,252,1)');
    deck.addColorStop(0.3, 'rgba(198,228,248,1)');
    deck.addColorStop(0.62, 'rgba(180,218,244,1)');
    deck.addColorStop(1, 'rgba(170,208,238,1)');
    ctx.fillStyle = deck;
    ctx.fillRect(0, 0, 720, 1280);
    this.drawCloudCells(ctx);
    const skyTint = ctx.createLinearGradient(0, 0, 0, 1280);
    skyTint.addColorStop(0, 'rgba(140,205,250,0.2)');
    skyTint.addColorStop(0.45, 'rgba(130,192,242,0.12)');
    skyTint.addColorStop(1, 'rgba(120,180,230,0.05)');
    ctx.fillStyle = skyTint;
    ctx.fillRect(0, 0, 720, 1280);
  }

  renderCloudForeground(ctx) {
    if (!this.cloudtop || !this.foreSprites.length) return;
    if (this.occVeil > 0.004) {
      ctx.fillStyle = `rgba(240,246,251,${this.occVeil.toFixed(3)})`;
      ctx.fillRect(0, 0, 720, 1280);
    }
    const time = this.time;
    for (const cl of this.occClouds) {
      if (cl.delay > 0) continue;
      const prog = Math.max(0, Math.min(1, cl.prog));
      const fadeIn = smoothStep(-0.1, 0.06, cl.prog);
      const fadeOut = 1 - smoothStep(1.02, 1.16, cl.prog);
      const sprite = this.foreSprites[cl.sprite] || this.foreSprites[0];
      const y = -340 + prog * 1640;
      // 尺寸恒定：一出现就是完全展开的大云，只做平移，不做缩放。
      const scale = OCC_CLOUD_SCALE;
      const x = cl.x + Math.sin(time * cl.swaySpeed + cl.swayPh) * cl.sway;
      const w = 1100 * scale;
      const h = 660 * scale * 0.78;
      ctx.globalAlpha = Math.max(0, cl.alpha * fadeIn * fadeOut);
      ctx.drawImage(sprite, x - w / 2, y - h * 0.62, w, h);
    }
    ctx.globalAlpha = 1;
  }

  renderForeground(ctx) {
    if (this.cloudtop) this.renderCloudForeground(ctx);
  }

  drawMountain(ctx, mountain, color, nearLayer) {
    const m = mountain;
    if (!color) color = [122, 94, 74];
    const topY = m.y;
    const baseY = m.y + m.h;
    const cx = m.x;
    const half = m.w / 2;
    const seed = m.seed || 0;
    const rock = m.rock || 1;
    const jit = (n) => {
      const v = Math.sin(n * 127.1 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const grad = ctx.createLinearGradient(0, topY, 0, baseY + 40);
    grad.addColorStop(0, css(scaleColor(color, 1.3)));
    grad.addColorStop(0.4, css(scaleColor(color, 1.02)));
    grad.addColorStop(0.8, css(scaleColor(color, 0.72)));
    grad.addColorStop(1, css(scaleColor(color, 0.5)));
    ctx.fillStyle = grad;
    ctx.beginPath();
    const jag = m.h * 0.03 * rock;
    const curveY = (u, c) =>
      (1 - u) * (1 - u) * baseY +
      2 * (1 - u) * u * (topY + m.h * c) +
      u * u * topY;
    ctx.moveTo(cx - half - 4, baseY + 10);
    const L = 9;
    for (let i = 1; i <= L; i += 1) {
      const u = i / L;
      ctx.lineTo(cx - half + half * u, curveY(u, m.curve) + (jit(i * 3 + 1) - 0.5) * jag);
    }
    for (let i = L - 1; i >= 1; i -= 1) {
      const u = i / L;
      ctx.lineTo(cx + half * u, curveY(u, m.curve) + (jit(i * 3 + 2) - 0.5) * jag * 0.9);
    }
    ctx.lineTo(cx + half + 4, baseY + 10);
    ctx.closePath();
    ctx.fill();

    // warm lit edge on the left slope
    ctx.strokeStyle = nearLayer ? 'rgba(255,214,150,0.14)' : 'rgba(255,214,150,0.07)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= L; i += 1) {
      const u = i / L;
      const x = cx - half + half * u + (nearLayer ? 6 : 3);
      const y = curveY(u, m.curve) + (jit(i * 5 + 3) - 0.5) * jag * 0.7;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // darker right slope shade
    ctx.fillStyle = nearLayer ? 'rgba(22,11,5,0.16)' : 'rgba(22,11,5,0.08)';
    ctx.beginPath();
    const inset = half * (nearLayer ? 0.24 : 0.3);
    for (let i = 0; i <= L; i += 1) {
      const u = i / L;
      ctx.lineTo(cx + inset * u, curveY(u, m.curve) + 1);
    }
    for (let i = L - 1; i >= 0; i -= 1) {
      const u = i / L;
      ctx.lineTo(cx + half * u, curveY(u, m.curve) + 1 + (jit(i * 7 + 1) - 0.5) * jag);
    }
    ctx.closePath();
    ctx.fill();

    // broken ravines on the shaded side
    const ravines = nearLayer ? 9 : 2;
    ctx.lineCap = 'round';
    for (let r = 0; r < ravines; r += 1) {
      const u0 = 0.1 + (r / ravines) * 0.52;
      ctx.strokeStyle = `rgba(20,10,4,${nearLayer ? 0.1 : 0.06})`;
      ctx.lineWidth = 0.7 + rock * 0.4;
      ctx.beginPath();
      let first = true;
      for (let s = 0; s <= 7; s += 1) {
        const u = u0 + (s / 7) * (0.55 - u0);
        const x = cx + half * (u * 0.7) + (jit(r * 11 + s + 20) - 0.5) * half * 0.14;
        const y = curveY(u, m.curve) + 6 + (jit(r * 13 + s + 30) - 0.5) * jag * 0.8;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
}

module.exports = MountainBackground;
