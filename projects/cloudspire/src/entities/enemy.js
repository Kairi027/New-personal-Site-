const { TAU, clamp, rand, angleTo } = require('../utils/math.js');

function getStart(side, options) {
  if (options && typeof options.x === 'number' && typeof options.y === 'number') {
    return { x: options.x, y: options.y };
  }
  if (side === 'left') return { x: -60, y: rand(120, 420) };
  if (side === 'right') return { x: 780, y: rand(120, 420) };
  if (side === 'bottom') return { x: rand(60, 660), y: 1330 };
  if (side === 'topLeft') return { x: -50, y: -50 };
  if (side === 'topRight') return { x: 770, y: -50 };
  return { x: rand(60, 660), y: -50 };
}

class Enemy {
  constructor(def, options, difficulty, waveId) {
    this.def = def;
    this.type = def.type;
    this.difficulty = difficulty;
    this.waveId = waveId;
    this.options = options || {};
    this.path = this.options.path || 'dive';
    this.side = this.options.side || 'top';
    this.lane = this.options.lane || 0;
    this.flashing = !!(this.options.flashing || this.options.bombCarrier);
    const start = getStart(this.side, this.options);
    this.x = start.x;
    this.y = start.y;
    this.prevX = this.x;
    this.prevY = this.y;
    this.t = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = Math.PI;
    this.hp = Math.round(def.hp * difficulty.enemyHp);
    this.maxHp = this.hp;
    this.exp = def.exp;
    this.score = def.score;
    this.r = def.radius;
    this.dead = false;
    this.art = null;
    this.off = false;
    this.phase = 'move';
    this.fireTimer = rand(def.fireInterval || 2.2, (def.fireInterval || 2.2) + 0.8);
    if (this.path === 'loop') {
      this.phase = 'enter';
      this.loopConfig = this.options.loopConfig || {
        centerX: 300,
        radius: 72,
        loopDuration: 2.8,
      };
      this.loopStartAngle = this.side === 'left' ? Math.PI : 0;
      this.loopProgress = 0;
    } else if (this.path === 'hold') {
      this.holdPhase = 'enter';
      this.holdTimer = 0;
      this.holdY = this.options.holdY || this.def.holdY || 180;
      this.holdTime = this.options.holdTime || this.def.holdTime || 6;
    } else if (this.path === 'group') {
      this.groupConfig = this.options.groupConfig || { vy: 120 };
      this.groupPhase = 'descend';
    } else if (this.path === 'angleDive') {
      this.angleDiveAngle = this.options.angle !== undefined ? this.options.angle : Math.PI / 2;
    } else if (this.path === 'converge') {
      this.convergePhase = 'in';
    }
  }

  update(dt, bullets, player, difficulty, time) {
    this.t += dt;
    if (this.path === 'loop') {
      this.updateLoop(dt);
    } else if (this.path === 'kamikaze') {
      this.updateKamikaze(dt, player);
    } else if (this.path === 'hold') {
      this.updateHold(dt);
    } else if (this.path === 'group') {
      this.updateGroup(dt);
    } else if (this.path === 'angleDive') {
      this.updateAngleDive(dt);
    } else if (this.path === 'converge') {
      this.updateConverge(dt);
    } else {
      this.updateMove(dt);
    }
    this.angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    if (this.def.fireInterval && this.y > 40 && this.y < 900) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.def.fireInterval;
        this.fire(bullets, player, difficulty);
      }
    }
    this.off = this.isOff();
  }

  updateMove(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.side === 'left') {
      this.vx = speed;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane || (this.y + Math.sin(this.t * 2.2) * 24 * dt);
      return;
    }
    if (this.side === 'right') {
      this.vx = -speed;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane || (this.y + Math.sin(this.t * 2.2) * 24 * dt);
      return;
    }
    if (this.side === 'topLeft') {
      this.vx = speed * 0.8;
      this.vy = speed;
    } else if (this.side === 'topRight') {
      this.vx = -speed * 0.8;
      this.vy = speed;
    } else {
      this.vx = Math.sin(this.t * 2.4) * speed * 0.12;
      this.vy = speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateKamikaze(dt, player) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (!this.kamikazeAngle) {
      this.kamikazeAngle = player && player.alive ? angleTo(this.x, this.y, player.x, player.y) : Math.PI / 2;
    }
    this.vx = Math.cos(this.kamikazeAngle) * speed;
    this.vy = Math.sin(this.kamikazeAngle) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateHold(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.holdPhase === 'enter') {
      this.vy = speed;
      this.y += this.vy * dt;
      if (this.y >= this.holdY) {
        this.y = this.holdY;
        this.holdPhase = 'hold';
        this.holdTimer = 0;
      }
      return;
    }
    if (this.holdPhase === 'hold') {
      this.holdTimer += dt;
      this.vx = Math.sin(this.t * 1.3) * 22;
      this.vy = Math.sin(this.t * 2.1) * 10;
      this.x += this.vx * dt;
      if (this.holdTimer >= this.holdTime) {
        this.holdPhase = 'leave';
      }
      return;
    }
    this.vx = Math.sin(this.t * 2.4) * speed * 0.12;
    this.vy = speed * 1.15;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateGroup(dt) {
    const cfg = this.groupConfig || {};
    const speed = this.def.speed * this.difficulty.enemySpeed;
    const vy = cfg.vy !== undefined ? cfg.vy : speed;
    const vx = cfg.vx || 0;
    if (this.groupPhase === 'descend') {
      this.vx = vx;
      this.vy = vy;
      this.x += vx * dt;
      this.y += vy * dt;
      if (cfg.splitAtY && this.y >= cfg.splitAtY) {
        this.groupPhase = 'split';
        this.splitAngle = this.x < 360 ? 2.35 : Math.PI - 2.35;
      }
      return;
    }
    this.splitAngle = this.splitAngle === undefined ? Math.PI / 2 : this.splitAngle;
    this.vx = Math.cos(this.splitAngle) * speed * 1.35;
    this.vy = Math.sin(this.splitAngle) * speed * 1.35;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateAngleDive(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed;
    const a = this.angleDiveAngle;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateConverge(dt) {
    const speed = this.def.speed * this.difficulty.enemySpeed * 1.15;
    const cx = 360;
    const cy = 620;
    if (this.convergePhase === 'in') {
      const dx = cx - this.x;
      const dy = cy - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
      }
      this.convergePhase = 'out';
    }
    const a =
      this.side === 'left' ? 2.2 :
      this.side === 'right' ? Math.PI - 2.2 :
      this.side === 'bottom' ? Math.PI / 2 : 2.4;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateLoop(dt) {
    const cfg = this.loopConfig;
    const sign = this.side === 'left' ? 1 : -1;
    const speed = this.def.speed * this.difficulty.enemySpeed;
    if (this.phase === 'enter') {
      this.vx = sign * speed * 1.25;
      this.vy = 0;
      this.x += this.vx * dt;
      this.y = this.lane;
      const reached = sign > 0 ? this.x >= cfg.centerX - cfg.radius : this.x <= cfg.centerX + cfg.radius;
      if (reached) {
        this.phase = 'loop';
        this.loopProgress = 0;
      }
      return;
    }
    if (this.phase === 'loop') {
      this.prevX = this.x;
      this.prevY = this.y;
      this.loopProgress += dt / cfg.loopDuration;
      const angle = this.loopStartAngle - this.loopProgress * TAU;
      this.x = cfg.centerX + Math.cos(angle) * cfg.radius;
      this.y = this.lane + Math.sin(angle) * cfg.radius;
      this.vx = (this.x - this.prevX) / Math.max(dt, 0.001);
      this.vy = (this.y - this.prevY) / Math.max(dt, 0.001);
      if (this.loopProgress >= 1) {
        this.phase = 'exit';
        this.x = cfg.centerX;
        this.y = this.lane;
      }
      return;
    }
    this.vx = sign * speed * 1.6;
    this.vy = 0;
    this.x += this.vx * dt;
    this.y = this.lane;
  }

  fire(bullets, player, difficulty) {
    const speed = this.def.bulletSpeed * difficulty.bulletSpeed;
    const base = angleTo(this.x, this.y, player.x, player.y);
    const color = this.def.bulletColor;
    if (this.def.pattern === 'snipe') {
      bullets.fireEnemy(this.x, this.y + 8, base, speed * 1.25, {
        color: color || '#ffd36b',
        sprite: 'enemy_bullet_medium',
        medium: true,
      });
      return;
    }
    if (this.def.pattern === 'snipe5') {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(this.x, this.y + 8, base + i * 0.055, speed * 1.45, {
          color: color || '#b26bff',
          sprite: 'enemy_bullet_medium',
          medium: true,
        });
      }
      return;
    }
    if (this.def.pattern === 'single') {
      bullets.fireEnemy(this.x, this.y + 10, base, speed, { color: color || '#ff5f6b', sprite: 'enemy_bullet_small' });
      return;
    }
    if (this.def.pattern === 'ring') {
      for (let i = 0; i < 10; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, i * (TAU / 10), speed * 0.9, { color: color || '#c26bff', sprite: 'enemy_bullet_medium', medium: true });
      }
      return;
    }
    if (this.def.pattern === 'ringSmall') {
      for (let i = 0; i < 12; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, i * (TAU / 12), speed * 0.85, { color: color || '#c26bff', sprite: 'enemy_bullet_small' });
      }
      return;
    }
    if (this.def.pattern === 'fanWide') {
      for (let i = -4; i <= 4; i += 1) {
        bullets.fireEnemy(this.x, this.y + 14, base + i * 0.15, speed * 0.95, { color: color || '#c26bff', sprite: 'enemy_bullet_medium', medium: true });
      }
      return;
    }
    if (this.def.pattern === 'fan3') {
      for (let i = -1; i <= 1; i += 1) {
        bullets.fireEnemy(this.x, this.y + 12, base + i * 0.24, speed, { color: color || '#ff8a4a', sprite: 'enemy_bullet_small' });
      }
      return;
    }
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(this.x, this.y + 14, base + i * 0.2, speed * 0.96, { color: color || '#ff8a4a', sprite: 'enemy_bullet_medium', medium: true });
    }
  }

  damage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  isOff() {
    return this.y > 1360 || this.x > 820 || this.x < -100 || this.y < -160;
  }

  offScreen() {
    return this.off;
  }

  render(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.flashing) {
      const pulse = 0.5 + Math.sin(time * 12) * 0.5;
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 16 + pulse * 18;
    } else if (this.glow) {
      const pulse = 0.5 + Math.sin(time * 10) * 0.5;
      ctx.shadowColor = this.glow === 'yellow' ? '#ffd36b' : '#4da6ff';
      ctx.shadowBlur = 14 + pulse * 16;
    }
    ctx.rotate(this.angle);
    if (this.art) {
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 3.4) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
    } else {
      this.drawJet(ctx, time);
    }
    ctx.restore();
    ctx.shadowBlur = 0;

    if (this.hp < this.maxHp && this.hp > 0) {
      ctx.fillStyle = 'rgba(10,12,8,0.7)';
      ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2, 4);
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2 * clamp(this.hp / this.maxHp, 0, 1), 4);
    }
  }

  drawJet(ctx, time) {
    const exhaust = 0.65 + Math.sin(time * 16) * 0.25;
    if (this.type === 'U' || this.type === 'UV') {
      const s = this.type === 'UV' ? 1.5 : 1;
      ctx.fillStyle = '#5a4a72';
      ctx.strokeStyle = '#2c1f42';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8f7bb8';
      ctx.beginPath();
      ctx.ellipse(0, -6 * s, 10 * s, 7 * s, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#c26bff';
      ctx.beginPath();
      ctx.arc(0, -6 * s, 4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e8b9ff';
      ctx.fillRect(-14 * s, -2 * s, 4, 2);
      ctx.fillRect(10 * s, -2 * s, 4, 2);
      ctx.fillStyle = 'rgba(190,120,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 10 * s, 6 * s, 3 * s, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'UG') {
      ctx.fillStyle = '#3a3050';
      ctx.strokeStyle = '#17102a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(10, -8);
      ctx.lineTo(16, 18);
      ctx.lineTo(6, 26);
      ctx.lineTo(-6, 26);
      ctx.lineTo(-16, 18);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c26bff';
      ctx.shadowColor = '#c26bff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -4, 6, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, -4, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(194,107,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 8, 3, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'ES') {
      ctx.fillStyle = '#4a2a5a';
      ctx.strokeStyle = '#1d0d2b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(6, -4);
      ctx.lineTo(16, 8);
      ctx.lineTo(4, 6);
      ctx.lineTo(2, 16);
      ctx.lineTo(-2, 16);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-16, 8);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b26bff';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2.5, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EM') {
      ctx.fillStyle = '#3d2450';
      ctx.strokeStyle = '#160b24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(9, -8);
      ctx.lineTo(20, 6);
      ctx.lineTo(22, 14);
      ctx.lineTo(8, 9);
      ctx.lineTo(6, 20);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-8, 9);
      ctx.lineTo(-22, 14);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7a4a9a';
      ctx.fillRect(-16, 8, 5, 7);
      ctx.fillRect(11, 8, 5, 7);
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(-13, 16, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(13, 16, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EH') {
      ctx.fillStyle = '#331f44';
      ctx.strokeStyle = '#12071f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(10, -10);
      ctx.lineTo(30, 4);
      ctx.lineTo(34, 16);
      ctx.lineTo(14, 12);
      ctx.lineTo(10, 26);
      ctx.lineTo(-10, 26);
      ctx.lineTo(-14, 12);
      ctx.lineTo(-34, 16);
      ctx.lineTo(-30, 4);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5a6e';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(6, -6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9a5ab8';
      ctx.fillRect(-24, 10, 8, 8);
      ctx.fillRect(16, 10, 8, 8);
      ctx.fillStyle = 'rgba(178,107,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(-20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(0, 28, 2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EK') {
      ctx.fillStyle = '#5a2240';
      ctx.strokeStyle = '#26091a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(5, 0);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(194,107,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'EN') {
      ctx.fillStyle = '#4a2a6a';
      ctx.strokeStyle = '#180b2e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6a3a9a';
      ctx.fillRect(-4, -8, 8, 18);
      ctx.fillStyle = '#d9aaff';
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(178,107,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2.4, 7, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'ED') {
      ctx.fillStyle = '#6a2020';
      ctx.strokeStyle = '#2b0606';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(14, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-14, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a2626';
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff6a6a';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,90,60,0.95)';
      ctx.beginPath();
      ctx.ellipse(-15, 15, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(15, 15, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'K') {
      ctx.fillStyle = '#c2394a';
      ctx.strokeStyle = '#4a0d16';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(5, 0);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,90,50,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2, 6, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'D') {
      ctx.fillStyle = '#d8b64a';
      ctx.strokeStyle = '#4d3b0f';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(14, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-14, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4d7dff';
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f7e9b8';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.95)';
      ctx.beginPath();
      ctx.ellipse(-15, 15, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(15, 15, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'N') {
      ctx.fillStyle = '#c7a54a';
      ctx.strokeStyle = '#3a2f0c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6c1d';
      ctx.fillRect(-4, -8, 8, 18);
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,220,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2.4, 7, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'F') {
      ctx.fillStyle = '#e0c05a';
      ctx.strokeStyle = '#4a3a10';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(8, -4);
      ctx.lineTo(18, 6);
      ctx.lineTo(4, 4);
      ctx.lineTo(2, 14);
      ctx.lineTo(-2, 14);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(0, -4, 3.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'G') {
      ctx.fillStyle = '#c9a94e';
      ctx.strokeStyle = '#3c2f0d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(12, -14);
      ctx.lineTo(24, -4);
      ctx.lineTo(26, 12);
      ctx.lineTo(12, 14);
      ctx.lineTo(8, 24);
      ctx.lineTo(-8, 24);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-26, 12);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-12, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5a6e';
      ctx.beginPath();
      ctx.arc(-7, -10, 3, 0, TAU);
      ctx.arc(7, -10, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,150,40,0.9)';
      ctx.beginPath();
      ctx.ellipse(-16, 18, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(16, 18, 2.2, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (this.type === 'S') {
      ctx.fillStyle = '#6f7c86';
      ctx.strokeStyle = '#303b45';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(6, -4);
      ctx.lineTo(16, 8);
      ctx.lineTo(4, 6);
      ctx.lineTo(2, 16);
      ctx.lineTo(-2, 16);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-16, 8);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#26333d';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,120,50,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 2.5, 6, 0, 0, TAU);
      ctx.fill();
    } else if (this.type === 'M') {
      ctx.fillStyle = '#4f5b45';
      ctx.strokeStyle = '#222b1e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(9, -8);
      ctx.lineTo(20, 6);
      ctx.lineTo(22, 14);
      ctx.lineTo(8, 9);
      ctx.lineTo(6, 20);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-8, 9);
      ctx.lineTo(-22, 14);
      ctx.lineTo(-20, 6);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#314037';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(5, -2);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#788b6b';
      ctx.fillRect(-16, 8, 5, 7);
      ctx.fillRect(11, 8, 5, 7);
      ctx.fillStyle = 'rgba(255,120,50,0.9)';
      ctx.beginPath();
      ctx.ellipse(-13, 16, 2.2, 5, 0, 0, TAU);
      ctx.ellipse(13, 16, 2.2, 5, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#6d5f50';
      ctx.strokeStyle = '#2e251d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(10, -10);
      ctx.lineTo(30, 4);
      ctx.lineTo(34, 16);
      ctx.lineTo(14, 12);
      ctx.lineTo(10, 26);
      ctx.lineTo(-10, 26);
      ctx.lineTo(-14, 12);
      ctx.lineTo(-34, 16);
      ctx.lineTo(-30, 4);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3f3c33';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(6, -6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9a8870';
      ctx.fillRect(-24, 10, 8, 8);
      ctx.fillRect(16, 10, 8, 8);
      ctx.fillStyle = 'rgba(255,110,40,0.85)';
      ctx.beginPath();
      ctx.ellipse(-20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(20, 20, 2.5, 6, 0, 0, TAU);
      ctx.ellipse(0, 28, 2, 5, 0, 0, TAU);
      ctx.fill();
    }
  }
}

module.exports = Enemy;
