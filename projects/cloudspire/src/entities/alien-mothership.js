const { TAU, angleTo, clamp } = require('../utils/math.js');

// 母舰全部光束：52 伤害 / 0.4 秒 = 130 伤害每秒（boss1 的广域激光仍为 20 / 0.4 秒）。
const MOTHERSHIP_BEAM_DAMAGE = 52;
const MOTHERSHIP_BEAM_HIT_INTERVAL = 0.4;

function initAlienMothership(boss, config, difficulty) {
  boss.targetY = 320;
  boss.y = -520;
  boss.r = config.radius || 210;
  boss.maxHp = Math.round(config.hp * difficulty.bossHp);
  boss.hp = boss.maxHp;
  boss.entering = true;
  boss.phase = 1;
  boss.transitioning = false;
  boss.transitionTimer = 0;
  boss.transitionIndex = 0;
  boss.finalDiveState = 'idle';
  boss.finalDiveTimer = 8;
  boss.finalDiveBaseY = boss.targetY;
  boss.smoke = [];
  boss.chargeGlow = 0;
  boss.beamSide = 'left';
  boss.summonTimer = 10;
  boss.artScale = config.artScale || 3.0;
  boss.phaseBoost = difficulty.id === 'hard' || difficulty.id === 'insane' ? 1.15 : 1;
  boss.intervalBoost = difficulty.id === 'insane' ? 0.78 : difficulty.id === 'hard' ? 0.88 : 1;
  boss.turrets = (config.turrets || []).map((turret) => {
    const hp = Math.round((turret.hp || 15000) * difficulty.bossHp);
    return {
      side: turret.side,
      name: turret.name || (turret.side === 'left' ? '左副炮舱' : '右副炮舱'),
      hp,
      maxHp: hp,
      broken: false,
      damaged: false,
    };
  });
  boss.phases = config.phases || [];
  boss.attackTimers = {
    fan: 1.0,
    swarm: 3.0,
    missile: 2.4,
    beam: 2.2,
    split: 1.5,
    cross: 1.2,
    ring: 2.0,
    laser: 2.4,
    p4Beam: 3.5,
    p4Split: 0.8,
    p4Missile: 3.5,
    dive: 6.0,
  };
}

const alienMothershipMethods = {
  updateAlienMothership(dt, bullets, player) {
    this.t += dt;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);

    if (this.entering) {
      this.y += 260 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.showSpell('异形母舰·降临');
      }
      return;
    }

    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 50 * dt;
      if (Math.random() < dt * 8) this.addSmoke(3);
      return;
    }

    if (this.transitioning) {
      this.transitionTimer -= dt;
      this.x = 360 + Math.sin(this.t * 0.35) * 40;
      this.y = this.targetY + Math.sin(this.t * 0.3) * 8;
      if (Math.random() < dt * 6) this.addSmoke(2);
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
        this.summonTimer = 10;
        this.showSpell('异形母舰·相位' + this.phase);
      }
      return;
    }

    if (this.phase === 1 && this.turrets.every((t) => t.broken)) {
      this.phase = 2;
      this.transitionIndex = 1;
      this.transitioning = true;
      this.transitionTimer = 1.8;
      this.hp = Math.max(0, Math.round(this.maxHp * 0.70));
      this.shake = 1;
      this.addSmoke(14);
      bullets.clearEnemy();
      this.showSpell('副炮损毁·外壳开裂');
      return;
    }

    const ratio = this.hp / this.maxHp;
    const next = this.phases[this.transitionIndex];
    if (next && ratio <= next.threshold) {
      this.phase = Math.min(4, this.phase + 1);
      this.transitionIndex += 1;
      this.transitioning = true;
      this.transitionTimer = next.duration || 1.8;
      this.shake = 1;
      this.addSmoke(12);
      bullets.clearEnemy();
      this.showSpell(next.text || '异形母舰·形态变化');
      return;
    }

    if (this.phase === 4) {
      this.x = 360;
      this.y = 300 + Math.sin(this.t * 0.5) * 6;
      this.updateFinalDiveAlien(dt);
    } else {
      const speed = this.phase === 1 ? 0.26 : this.phase === 2 ? 0.42 : 0.50;
      const amp = this.phase === 1 ? 120 : 150;
      this.x = 360 + Math.sin(this.t * speed) * amp;
      this.y = this.targetY + Math.sin(this.t * 0.24) * 8;
    }

    const timers = this.attackTimers;
    for (const key of Object.keys(timers)) timers[key] -= dt;
    const activeTimers = this.phase === 1
      ? [timers.fan, timers.swarm, timers.missile]
      : this.phase === 2
        ? [timers.beam, timers.split, timers.swarm]
        : this.phase === 3
          ? [timers.cross, timers.ring, timers.laser]
          : [timers.p4Beam, timers.p4Split, timers.p4Missile, timers.dive];
    const nearest = Math.min(...activeTimers);
    this.chargeGlow = clamp(1 - nearest / 0.8, 0, 1);

    if (this.phase === 1) this.runAlienPhase1(dt, bullets, player);
    else if (this.phase === 2) this.runAlienPhase2(dt, bullets, player);
    else if (this.phase === 3) this.runAlienPhase3(dt, bullets, player);
    else this.runAlienPhase4(dt, bullets, player);
  },

  damageAlienMothership(amount) {
    if (this.entering) return;
    if (this.turrets.some((t) => !t.broken)) {
      this.flash = Math.min(1, this.flash + 0.25);
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deathTimer = 0;
    }
  },

  alienTurretPoint(side) {
    const dir = side === 'left' ? -1 : 1;
    return { x: this.x + dir * 330, y: this.y + 130 };
  },

  runAlienPhase1(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.fan <= 0) {
      const side = this.beamSide;
      this.beamSide = side === 'left' ? 'right' : 'left';
      const point = this.alienTurretPoint(side);
      const dir = side === 'left' ? -1 : 1;
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(point.x, point.y, Math.PI / 2 + dir * 0.22 + i * 0.18, 250 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_3',
          large: true,
        });
      }
      timers.fan = 1.0 * this.intervalBoost;
    }
    if (timers.swarm <= 0 && this.summonCallback) {
      this.summonCallback(['ES', 'ES', 'ES', 'ES']);
      timers.swarm = 5 * this.intervalBoost;
    }
    if (timers.missile <= 0) {
      for (let i = 0; i < 3; i += 1) {
        const angle = Math.PI / 2 + (i - 1) * 0.35;
        bullets.fireEnemy(this.x, this.y + 170, angle, 150 * bs, {
          sprite: 'boss_bullet_4',
          color: '#ffb13d',
          large: true,
          destructible: true,
          hp: 260,
          life: 9,
          tracking: {
            originX: this.x,
            originY: this.y + 170,
            radius: 140,
            lockSpeed: 300 * bs,
          },
        });
      }
      timers.missile = 3.0 * this.intervalBoost;
    }
    void dt;
    void player;
  },

  runAlienPhase2(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.beam <= 0) {
      const side = this.beamSide;
      this.beamSide = side === 'left' ? 'right' : 'left';
      const point = this.alienTurretPoint(side);
      bullets.fireLaser(point.x, 0, 85, 2.4, 'boss_laser', {
        style: 'orbs',
        charge: 1.0,
        direction: 'vertical',
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.beam = 2.4 * this.intervalBoost;
    }
    if (timers.split <= 0) {
      const travel = (640 - (this.y + 170)) / (230 * bs);
      bullets.fireEnemy(this.x, this.y + 170, Math.PI / 2, 230 * bs, {
        large: true,
        color: '#c26bff',
        sprite: 'boss_bullet_6',
        life: Math.max(0.6, travel),
        fragment: {
          angles: [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4],
          speed: 280 * bs,
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        },
      });
      timers.split = 1.7 * this.intervalBoost;
    }
    if (timers.swarm <= 0 && this.summonCallback) {
      this.summonCallback(['ES', 'ES', 'EM']);
      timers.swarm = 5 * this.intervalBoost;
    }
    void dt;
    void player;
  },

  alienSummon() {
    if (!this.summonCallback) return;
    const erosion = ['ES', 'EM', 'EH', 'ED'].slice().sort(() => Math.random() - 0.5);
    const ufo = ['U', 'UV', 'UG'][Math.floor(Math.random() * 3)];
    this.summonCallback([erosion[0], erosion[1], ufo]);
    this.summonTimer = 10;
  },

  alienSummon() {
    if (!this.summonCallback) return;
    const erosion = ['ES', 'EM', 'EH', 'ED'].slice().sort(() => Math.random() - 0.5);
    const ufo = ['U', 'UV', 'UG'][Math.floor(Math.random() * 3)];
    this.summonCallback([erosion[0], erosion[1], ufo]);
    this.summonTimer = 10;
  },

  runAlienPhase3(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.cross <= 0) {
      for (const side of ['left', 'right']) {
        const point = this.alienTurretPoint(side);
        const dir = side === 'left' ? -1 : 1;
        for (let i = 0; i < 3; i += 1) {
          bullets.fireEnemy(point.x, point.y, Math.PI / 2 + dir * (0.38 + i * 0.16), 330 * bs, {
            color: '#ff8a4a',
            sprite: 'boss_bullet_2',
            large: true,
          });
        }
      }
      timers.cross = 1.2 * this.intervalBoost;
    }
    if (timers.ring <= 0) {
      const count = 12;
      const gap = Math.floor(Math.random() * count);
      for (let i = 0; i < count; i += 1) {
        if (i === gap || i === (gap + 1) % count) continue;
        bullets.fireEnemy(this.x, this.y + 140, (i / count) * TAU, 210 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        });
      }
      timers.ring = 2.2 * this.intervalBoost;
    }
    if (timers.laser <= 0 && player) {
      bullets.fireLaser(player.x, 0, 30, 1.3, 'boss_laser', {
        style: 'orbs',
        charge: 0.75,
        direction: 'vertical',
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.laser = 2.6 * this.intervalBoost;
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) this.alienSummon();
    void dt;
  },

  runAlienPhase4(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.p4Beam <= 0) {
      bullets.fireLaser(120, 0, 75, 5.0, 'boss_laser', {
        style: 'orbs',
        charge: 0.9,
        direction: 'vertical',
        vx: 115,
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      bullets.fireLaser(this.x, 430, 70, 5.0, 'boss_laser', {
        style: 'orbs',
        charge: 0.9,
        direction: 'horizontal',
        vy: 95,
        color: '#ff4b5f',
        damage: MOTHERSHIP_BEAM_DAMAGE,
        hitInterval: MOTHERSHIP_BEAM_HIT_INTERVAL,
      });
      timers.p4Beam = 5.0 * this.intervalBoost;
    }
    if (timers.p4Split <= 0) {
      const travel = (620 - (this.y + 170)) / (310 * bs);
      bullets.fireEnemy(this.x, this.y + 170, Math.PI / 2, 310 * bs, {
        large: true,
        color: '#c26bff',
        sprite: 'boss_bullet_6',
        life: Math.max(0.5, travel),
        fragment: {
          angles: [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4],
          speed: 340 * bs,
          color: '#ff5f6b',
          sprite: 'boss_bullet_5',
          medium: true,
        },
      });
      timers.p4Split = 0.8 * this.intervalBoost;
    }
    if (timers.p4Missile <= 0) {
      for (let i = 0; i < 8; i += 1) {
        const angle = Math.PI / 2 + (i - 3.5) * 0.18;
        bullets.fireEnemy(this.x + (i - 3.5) * 45, this.y + 180, angle, 145 * bs, {
          sprite: 'boss_bullet_4',
          color: '#ffb13d',
          large: true,
          destructible: true,
          hp: 240,
          life: 9,
          tracking: {
            originX: this.x + (i - 3.5) * 45,
            originY: this.y + 180,
            radius: 155,
            lockSpeed: 320 * bs,
          },
        });
      }
      timers.p4Missile = 5.0 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startAlienFinalDive();
      timers.dive = 7.0 * this.intervalBoost;
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) this.alienSummon();
    void dt;
    void player;
  },

  startAlienFinalDive() {
    if (this.finalDiveState !== 'idle') return;
    this.finalDiveBaseY = this.y;
    this.finalDiveState = 'charge';
    this.finalDiveTimer = 1.2;
    this.showSpell('濒死冲击');
  },

  updateFinalDiveAlien(dt) {
    if (this.finalDiveState === 'charge') {
      this.finalDiveTimer -= dt;
      this.chargeGlow = Math.min(1, 1 - this.finalDiveTimer / 1.2);
      if (this.finalDiveTimer <= 0) {
        this.finalDiveState = 'dive';
      }
      return;
    }
    if (this.finalDiveState === 'dive') {
      this.y += 280 * dt;
      if (this.y >= this.finalDiveBaseY + 220) {
        this.y = this.finalDiveBaseY + 220;
        this.finalDiveState = 'retreat';
      }
      return;
    }
    if (this.finalDiveState === 'retreat') {
      this.y -= 390 * dt;
      if (this.y <= this.finalDiveBaseY) {
        this.y = this.finalDiveBaseY;
        this.finalDiveState = 'idle';
      }
    }
  },

  isAlienDiving() {
    return this.finalDiveState === 'dive';
  },

  renderAlienMothership(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 12 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    const aura = ctx.createRadialGradient(0, 0, 40, 0, 0, 420 + pulse * 40);
    aura.addColorStop(0, 'rgba(120,20,30,0.28)');
    aura.addColorStop(0.65, 'rgba(70,12,20,0.12)');
    aura.addColorStop(1, 'rgba(30,6,10,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 450, 0, TAU);
    ctx.fill();

    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.72;
      const scale = this.artScale || 3.0;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#4b1f2c';
      ctx.strokeStyle = '#1c0a12';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.lineTo(220, -80);
      ctx.lineTo(330, 60);
      ctx.lineTo(220, 180);
      ctx.lineTo(0, 240);
      ctx.lineTo(-220, 180);
      ctx.lineTo(-330, 60);
      ctx.lineTo(-220, -80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    this.renderAlienCore(ctx, time);
    this.renderAlienTurret(ctx, 'left');
    this.renderAlienTurret(ctx, 'right');

    if (this.phase >= 2) this.renderAlienCracks(ctx);
    if (this.phase >= 4) this.renderAlienRage(ctx, time);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.55;
      ctx.fillStyle = '#2a1830';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  renderAlienCore(ctx, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    const glow = 0.35 + this.chargeGlow * 0.55 + pulse * 0.1;
    const grad = ctx.createRadialGradient(0, 90, 8, 0, 90, 90 + pulse * 20);
    grad.addColorStop(0, `rgba(255,90,90,${glow.toFixed(3)})`);
    grad.addColorStop(0.5, `rgba(180,30,50,${(glow * 0.55).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(80,10,20,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 90, 115, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,180,170,${(0.55 + this.chargeGlow * 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 90, 22 + this.chargeGlow * 14, 34 + this.chargeGlow * 20, 0, 0, TAU);
    ctx.fill();
  },

  renderAlienTurret(ctx, side) {
    const turret = this.turrets.find((t) => t.side === side);
    if (!turret) return;
    const point = this.alienTurretPoint(side);
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    ctx.save();
    ctx.translate(dx, dy);
    if (turret.broken) {
      ctx.fillStyle = '#2a1c35';
      ctx.strokeStyle = '#120a1c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-38, -18);
      ctx.lineTo(24, -28);
      ctx.lineTo(34, 20);
      ctx.lineTo(-28, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,80,0.55)';
      ctx.beginPath();
      ctx.arc(-4, 4, 10, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#7a3b47';
      ctx.strokeStyle = '#241017';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-40, -24);
      ctx.lineTo(16, -36);
      ctx.lineTo(44, -8);
      ctx.lineTo(34, 30);
      ctx.lineTo(-30, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d8a0a8';
      ctx.beginPath();
      ctx.arc(2, 0, 13, 0, TAU);
      ctx.fill();
      if (turret.damaged) {
        ctx.fillStyle = 'rgba(30,15,40,0.7)';
        ctx.beginPath();
        ctx.arc(-10, 10, 16, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  renderAlienCracks(ctx) {
    ctx.strokeStyle = 'rgba(255,120,100,0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 80, 90 + Math.sin(a) * 55);
      ctx.lineTo(Math.cos(a) * 180, 90 + Math.sin(a) * 115);
      ctx.stroke();
    }
  },

  renderAlienRage(ctx, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 10);
    ctx.strokeStyle = `rgba(255,60,60,${(0.35 + pulse * 0.35).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 90, 145 + pulse * 18, 0, TAU);
    ctx.stroke();
  },
};

module.exports = {
  initAlienMothership,
  alienMothershipMethods,
};
