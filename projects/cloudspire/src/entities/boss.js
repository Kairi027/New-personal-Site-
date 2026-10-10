const { TAU, angleTo, rand, randInt, clamp } = require('../utils/math.js');
const { initAlienMothership, alienMothershipMethods } = require('./alien-mothership.js');

const DEG30 = Math.PI / 6;
const DEG4 = (4 * Math.PI) / 180;

class Boss {
  constructor(config, difficulty) {
    this.config = config;
    this.difficulty = difficulty;
    this.x = 360;
    this.y = -190;
    this.targetY = 426;
    this.r = config.radius;
    this.maxHp = Math.round(config.hp * difficulty.bossHp);
    this.hp = this.maxHp;
    this.entering = true;
    this.phase = 1;
    this.t = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.spellBanner = '';
    this.bannerTimer = 0;
    this.flash = 0;
    this.summonCallback = null;
    this.art = null;
    this.skillIndex = 0;
    this.skillPhase = 'active';
    this.skillTimer = 0;
    this.internalTimer = 0;
    this.rotationAngle = 0;
    this.laserFired = false;
    this.summoned = false;
    this.radialRounds = 0;
    this.trackRounds = 0;
    this.custom = config.custom || null;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboTransition = 0;
    this.nextCombo = 0;
    this.shake = 0;
    this.enterTimer = 0;
    this.turretExtend = 0;
    this.coreGlow = 0;
    this.speedBoost = 1;
    this.diveState = 'idle';
    this.diveTimer = 4.0;
    this.diveBaseY = this.targetY;
    this.wanderX = 360;
    this.wanderY = this.targetY;
    this.wanderTimer = 0;
    this.smoke = [];
    this.attackAngle = 0;
    this.heavyRound = 1;
    this.summonedB = false;
    this.turrets = this.custom === 'stormEye' ? [
      { side: 'left', hp: Math.round(700 * difficulty.bossHp), maxHp: Math.round(700 * difficulty.bossHp), broken: false, damaged: false },
      { side: 'right', hp: Math.round(700 * difficulty.bossHp), maxHp: Math.round(700 * difficulty.bossHp), broken: false, damaged: false },
    ] : [];
    this.attackTimers = this.custom === 'stormEye' ? {
      turret: 0.6,
      missile: 2.2,
      dive: 4.0,
      cross: 1.0,
      heavy: 3.2,
      kamikaze: 4.5,
      summon: 6.0,
      fan: 0.6,
    } : {};
    this.parts = [];
    if (this.custom === 'twinGuards') {
      this.parts = (config.parts || []).map((part, i) => ({
        key: part.key,
        name: part.name,
        title: part.title,
        artKey: part.artKey,
        art: null,
        hp: Math.round(part.hp * difficulty.bossHp),
        maxHp: Math.round(part.hp * difficulty.bossHp),
        x: part.targetX,
        y: -190,
        targetX: part.targetX,
        targetY: part.targetY,
        radius: part.radius,
        r: part.radius,
        dead: false,
        flash: 0,
        diveState: 'idle',
        diveTimer: 5 + i,
        diveBaseY: part.targetY,
        fireTimer: 0.8 + i * 0.3,
        sweepSign: i === 0 ? 1 : -1,
      }));
      this.entering = true;
      this.phase2 = false;
      this.combo = 0;
      this.comboTimer = 0;
      this.crossTimer = 1.2;
      this.maxHp = this.parts.reduce((sum, part) => sum + part.maxHp, 0);
      this.hp = this.maxHp;
    }
    if (this.custom === 'finalLord') {
      this.turrets = (config.turrets || []).map((turret) => {
        let hp = Math.round((turret.hp || 2500) * difficulty.bossHp);
        if (difficulty.id === 'hard' || difficulty.id === 'insane') {
          hp = Math.round(hp * 1.4);
        }
        return {
          side: turret.side,
          name: turret.name || turret.side + '翼炮舱',
          hp,
          maxHp: hp,
          broken: false,
          damaged: false,
        };
      });
      this.phases = config.phases || [];
      this.phase = 1;
      this.transitioning = false;
      this.transitionTimer = 0;
      this.transitionIndex = 0;
      this.finalDiveState = 'idle';
      this.finalDiveBaseY = this.targetY;
      this.sweepAngle = 0;
      this.sweepSide = 'left';
      this.phaseBoost = difficulty.id === 'hard' || difficulty.id === 'insane' ? 1.2 : 1;
      this.intervalBoost =
        difficulty.id === 'insane' ? 0.75 : difficulty.id === 'hard' ? 0.85 : 1;
      this.purple = config.bulletPrefix || 'boss3_bullet_';
      this.attackTimers = {
        wingFan: 1.0,
        cross: 1.6,
        main: 2.4,
        ring: 1.6,
        sweep: 2.2,
        matrix: 0.9,
        burst: 0.35,
        scatter: 1.2,
        dive: 7,
      };
      this.turretExtend = 1;
    }
    if (this.custom === 'alienMothership') {
      initAlienMothership(this, config, difficulty);
    }
  }

  currentPhase() {
    const ratio = this.hp / this.maxHp;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
  }

  getSkill() {
    return this.config.skills[this.skillIndex];
  }

  getDuration() {
    const id = this.getSkill().id;
    if (id === 'rotate') return 5.0;
    if (id === 'radial') return 2.1;
    if (id === 'laser') return 4.0;
    if (id === 'track') return 2.0;
    if (id === 'array') return 6.0;
    return 0.2;
  }

  getCooldown() {
    const id = this.getSkill().id;
    if (id === 'rotate') return 3.0;
    if (id === 'radial') return 2.0;
    if (id === 'laser') return 3.0;
    if (id === 'track') return 3.0;
    if (id === 'array') return 4.0;
    return 2.0;
  }

  nextSkill() {
    this.skillIndex = (this.skillIndex + 1) % this.config.skills.length;
    this.skillPhase = 'active';
    this.skillTimer = 0;
    this.internalTimer = 0;
    this.rotationAngle = 0;
    this.laserFired = false;
    this.summoned = false;
    this.radialRounds = 0;
    this.trackRounds = 0;
    this.showSpell(this.getSkill().label);
  }

  update(dt, bullets, player) {
    this.t += dt;
    if (this.custom === 'finalLord') {
      this.updateFinalLord(dt, bullets, player);
      return;
    }
    if (this.custom === 'alienMothership') {
      this.updateAlienMothership(dt, bullets, player);
      return;
    }
    if (this.custom === 'twinGuards') {
      this.updateTwinGuards(dt, bullets, player);
      return;
    }
    if (this.custom === 'stormEye') {
      this.updateStormEye(dt, bullets, player);
      return;
    }
    if (this.entering) {
      this.y += (this.targetY - this.y) * Math.min(1, dt * 1.1);
      if (Math.abs(this.targetY - this.y) < 1) {
        this.entering = false;
        this.showSpell(this.getSkill().label);
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      return;
    }

    const phase = this.currentPhase();
    if (phase !== this.phase) this.phase = phase;

    this.x = 360 + Math.sin(this.t * 0.42) * 200;
    this.y = this.targetY + Math.sin(this.t * 0.24) * 18;

    if (this.skillPhase === 'cooldown') {
      this.skillTimer -= dt;
      if (this.skillTimer <= 0) this.nextSkill();
    } else {
      this.skillTimer += dt;
      this.runSkill(this.getSkill().id, dt, bullets, player);
      if (this.skillTimer >= this.getDuration()) {
        this.skillPhase = 'cooldown';
        this.skillTimer = this.getCooldown();
      }
    }

    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
  }

  updateStormEye(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);
    if (this.entering) {
      this.enterTimer += dt;
      this.y += 120 * dt;
      this.turretExtend = Math.min(1, this.enterTimer * 0.5);
      this.coreGlow = Math.min(1, this.enterTimer * 0.8);
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.combo = 0;
        this.comboTimer = 0;
        this.showSpell('雷暴核心启动');
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 150 * dt;
      this.coreGlow = Math.max(0, this.coreGlow - dt * 0.7);
      if (Math.random() < dt * 6) this.addSmoke(2);
      return;
    }

    const ratio = this.hp / this.maxHp;
    const advance =
      (this.combo === 0 && (ratio < 0.7 || this.comboTimer >= 14)) ||
      (this.combo === 1 && (ratio < 0.4 || this.comboTimer >= 15)) ||
      (this.combo === 2 && (ratio < 0.15 || this.comboTimer >= 16));
    this.comboTimer += dt;

    if (this.comboTransition > 0) {
      this.comboTransition -= dt;
      this.shake = Math.max(0, this.shake - dt * 1.3);
      this.x = 360 + Math.sin(this.t * 0.42) * 180;
      this.y = this.targetY + Math.sin(this.t * 0.24) * 12;
      if (this.comboTransition <= 0) {
        this.combo = this.nextCombo;
        this.comboTimer = 0;
        this.diveState = 'idle';
        this.diveTimer = 4.0;
        this.diveBaseY = this.y;
        this.showSpell(['云海之眼·组合A', '云海之眼·组合B', '云海之眼·组合C', '云海之眼·狂暴'][this.combo]);
      }
      return;
    }

    if (advance && this.combo < 3) {
      this.startStormTransition(this.combo + 1);
      return;
    }

    if (this.combo === 1) {
      this.updateDive(dt);
    } else {
      this.updateWander(dt);
    }

    this.runStormAttacks(dt, bullets, player);
  }

  updateTwinGuards(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    const living = this.parts.filter((part) => !part.dead);
    if (living.length === 0) {
      this.dead = true;
      this.deathTimer += dt;
      return;
    }
    if (this.entering) {
      this.enterTimer += dt;
      let done = true;
      for (const part of this.parts) {
        if (part.dead) continue;
        part.y += 115 * dt;
        if (part.y >= part.targetY) {
          part.y = part.targetY;
        } else {
          done = false;
        }
      }
      if (done) {
        this.entering = false;
        this.showSpell('锋卫双骑 降临');
      }
      return;
    }

    const sumHp = living.reduce((sum, part) => sum + part.hp, 0);
    const sumMax = living.reduce((sum, part) => sum + part.maxHp, 0);
    if (!this.phase2 && sumHp / sumMax <= 0.5) {
      this.phase2 = true;
      this.showSpell('锋卫双骑·交叉神域');
    }

    const cycle = this.phase2 ? 4.2 : 5.5;
    this.comboTimer += dt;
    if (this.comboTimer >= cycle) {
      this.combo = (this.combo + 1) % 3;
      this.comboTimer = 0;
    }
    const bs = this.difficulty.bulletSpeed * (this.phase2 ? 1.15 : 1);
    const alpha = this.parts.find((part) => part.key === 'alpha');
    const beta = this.parts.find((part) => part.key === 'beta');

    if (this.combo === 0) {
      for (const part of this.parts) {
        if (part.dead) continue;
        part.x = part.targetX + Math.sin(this.t * 0.7 + (part.key === 'alpha' ? 0 : Math.PI)) * 170;
        part.y = part.targetY + Math.sin(this.t * 0.5 + part.sweepSign) * 8;
        part.fireTimer -= dt;
        if (part.fireTimer <= 0) {
          this.fireTwinSweep(part, bullets, bs);
          part.fireTimer = this.phase2 ? 0.5 : 0.7;
        }
      }
    } else if (this.combo === 1) {
      if (alpha && !alpha.dead) this.updateTwinDive(alpha, dt, player);
      if (beta && !beta.dead) {
        beta.x = beta.targetX + Math.sin(this.t * 0.6) * 120;
        beta.fireTimer -= dt;
        if (beta.fireTimer <= 0) {
          this.fireTwinFan(beta, bullets, bs);
          beta.fireTimer = this.phase2 ? 0.4 : 0.55;
        }
      }
    } else {
      if (beta && !beta.dead) this.updateTwinDive(beta, dt, player);
      if (alpha && !alpha.dead) {
        alpha.x = alpha.targetX + Math.sin(this.t * 0.6) * 120;
        alpha.fireTimer -= dt;
        if (alpha.fireTimer <= 0) {
          this.fireTwinBarrage(alpha, bullets, bs);
          alpha.fireTimer = this.phase2 ? 0.4 : 0.55;
        }
      }
    }

    if (this.phase2) {
      this.crossTimer -= dt;
      if (this.crossTimer <= 0) {
        this.fireTwinCross(bullets, bs);
        this.crossTimer = 0.9;
      }
    }
    for (const part of this.parts) {
      part.flash = Math.max(0, part.flash - dt * 3);
    }
  }

  updateTwinDive(part, dt, player) {
    if (part.diveState === 'idle') {
      part.diveTimer -= dt;
      if (part.diveTimer <= 0) {
        part.diveBaseY = part.y;
        part.diveState = 'dive';
      }
    } else if (part.diveState === 'dive') {
      const dx = player.x - part.x;
      const dy = player.y - part.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 480;
      part.x += (dx / dist) * speed * dt;
      part.y += (dy / dist) * speed * dt;
      if (part.y >= part.diveBaseY + 300) part.diveState = 'retreat';
    } else {
      part.y -= 520 * dt;
      if (part.y <= part.diveBaseY) {
        part.y = part.diveBaseY;
        part.diveState = 'idle';
        part.diveTimer = 5;
      }
    }
  }

  fireTwinSweep(part, bullets, bs) {
    const base = Math.PI / 2 + part.sweepSign * 0.35;
    for (let i = -1; i <= 1; i += 1) {
      bullets.fireEnemy(part.x, part.y + 16, base + i * 0.25, 230 * bs, {
        color: '#ffd36b',
        sprite: 'boss_bullet_1',
      });
    }
  }

  fireTwinFan(part, bullets, bs) {
    const base = Math.PI / 2;
    for (let i = -4; i <= 4; i += 1) {
      bullets.fireEnemy(part.x, part.y + 18, base + i * 0.24, 250 * bs, {
        color: '#ff9e3d',
        sprite: 'boss_bullet_3',
        medium: true,
      });
    }
  }

  fireTwinBarrage(part, bullets, bs) {
    const base = Math.PI / 2 + part.sweepSign * 0.5;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(part.x, part.y + 16, base + i * 0.2, 300 * bs, {
        color: '#ffb13d',
        sprite: 'boss_bullet_2',
      });
    }
  }

  fireTwinCross(bullets, bs) {
    const alpha = this.parts.find((part) => part.key === 'alpha');
    const beta = this.parts.find((part) => part.key === 'beta');
    if (alpha && !alpha.dead) {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(alpha.x, alpha.y + 16, Math.PI / 2 - 0.9 + i * 0.2, 280 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
    if (beta && !beta.dead) {
      for (let i = -2; i <= 2; i += 1) {
        bullets.fireEnemy(beta.x, beta.y + 16, Math.PI / 2 + 0.3 + i * 0.2, 280 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
  }

  updateFinalLord(dt, bullets, player) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.updateSmoke(dt);
    if (this.entering) {
      this.enterTimer += dt;
      this.y += 120 * dt;
      this.turretExtend = Math.min(1, this.enterTimer * 0.6);
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entering = false;
        this.showSpell('天阙主宰·相位一');
      }
      return;
    }
    if (this.dead) {
      this.deathTimer += dt;
      this.y -= 90 * dt;
      if (Math.random() < dt * 8) this.addSmoke(2);
      return;
    }
    if (this.transitioning) {
      this.transitionTimer -= dt;
      this.x = 360 + Math.sin(this.t * 0.35) * 60;
      this.y = this.targetY + Math.sin(this.t * 0.3) * 8;
      if (Math.random() < dt * 5) this.addSmoke(1);
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
        this.phase += 1;
        this.showSpell('天阙主宰·相位' + this.phase);
      }
      return;
    }

    this.x = 360 + Math.sin(this.t * 0.32) * 90;
    this.y = this.targetY + Math.sin(this.t * 0.22) * 10;

    const ratio = this.hp / this.maxHp;
    const next = this.phases[this.transitionIndex];
    if (next && ratio <= next.threshold) {
      this.hp = Math.max(0, Math.round(this.maxHp * next.threshold));
      this.startFinalTransition(next, bullets);
      return;
    }

    for (const key of Object.keys(this.attackTimers)) this.attackTimers[key] -= dt;
    if (this.phase === 1) {
      this.runFinalPhase1(dt, bullets, player);
    } else if (this.phase === 2) {
      this.runFinalPhase2(dt, bullets, player);
    } else if (this.phase === 3) {
      this.runFinalPhase3(dt, bullets, player);
    } else {
      this.runFinalPhase4(dt, bullets, player);
    }
  }

  startFinalTransition(next, bullets) {
    this.transitioning = true;
    this.transitionTimer = next.duration || 1.6;
    this.transitionIndex += 1;
    this.shake = 1;
    this.addSmoke(10);
    bullets.clearEnemy();
    this.showSpell(next.text || '天阙之力解放');
  }

  finalBullet(bullets, x, y, angle, speed, opts) {
    const options = opts || {};
    bullets.fireEnemy(x, y, angle, speed * this.phaseBoost, {
      color: options.color || '#c88bff',
      sprite: options.sprite || this.purple + '1',
      medium: !!options.medium,
      large: !!options.large,
      saturate: !!options.saturate,
    });
  }

  isTurretBroken(side) {
    const turret = this.turrets.find((t) => t.side === side);
    return !turret || turret.broken;
  }

  runFinalPhase1(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.wingFan <= 0) {
      if (!this.isTurretBroken('left')) {
        const point = this.turretPoint('left');
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + 0.35 + i * 0.16, 230, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      if (!this.isTurretBroken('right')) {
        const point = this.turretPoint('right');
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 - 0.35 - i * 0.16, 230, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      timers.wingFan = 1.6 * this.intervalBoost;
    }
    if (timers.cross <= 0) {
      if (!this.isTurretBroken('left')) {
        const point = this.turretPoint('left');
        for (let i = 0; i < 3; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + 0.35 + i * 0.15, 300, {
            sprite: this.purple + '1',
          });
        }
      }
      if (!this.isTurretBroken('right')) {
        const point = this.turretPoint('right');
        for (let i = 0; i < 3; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 - 0.35 - i * 0.15, 300, {
            sprite: this.purple + '1',
          });
        }
      }
      timers.cross = 2.0 * this.intervalBoost;
    }
    if (timers.main <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      for (let i = 0; i < 2; i += 1) {
        this.finalBullet(bullets, this.x, this.y - 30, base + (i === 0 ? -0.04 : 0.04), 380, {
          sprite: this.purple + '6',
          large: true,
          color: '#ffd36b',
        });
      }
      timers.main = 2.8 * this.intervalBoost;
    }
    void dt;
  }

  runFinalPhase2(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (const side of ['left', 'right']) {
        if (this.isTurretBroken(side)) continue;
        const point = this.turretPoint(side);
        for (let i = 0; i < 8; i += 1) {
          this.finalBullet(bullets, point.x, point.y, (i / 10) * TAU, 200, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      timers.ring = 2.3 * this.intervalBoost;
    }
    if (timers.sweep <= 0) {
      if (!this.isTurretBroken(this.sweepSide)) {
        const point = this.turretPoint(this.sweepSide);
        const dir = this.sweepSide === 'left' ? -1 : 1;
        this.sweepAngle += dir * 0.22;
        const base = Math.PI / 2 + dir * (0.4 + Math.sin(this.sweepAngle) * 0.8);
        for (let i = -2; i <= 2; i += 1) {
          this.finalBullet(bullets, point.x, point.y, base + i * 0.2, 260, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      this.sweepSide = this.sweepSide === 'left' ? 'right' : 'left';
      timers.sweep = 1.4 * this.intervalBoost;
    }
    if (timers.main <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      for (let i = 0; i < 2; i += 1) {
        this.finalBullet(bullets, this.x, this.y - 30, base + (i - 1) * 0.05, 420, {
          sprite: this.purple + '6',
          large: true,
          color: '#ffd36b',
        });
      }
      timers.main = 2.6 * this.intervalBoost;
    }
    void dt;
  }

  runFinalPhase3(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (let layer = 0; layer < 2; layer += 1) {
        for (let i = 0; i < 10; i += 1) {
          this.finalBullet(bullets, this.x, this.y + 8, (i / 12) * TAU + layer * 0.3, 150 + layer * 42, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      timers.ring = 2.0 * this.intervalBoost;
    }
    if (timers.matrix <= 0) {
      const muzzles = [
        { x: this.x - 30, y: this.y + 18 },
        { x: this.x + 30, y: this.y + 18 },
      ];
      for (const muzzle of muzzles) {
        for (let i = 0; i < 2; i += 1) {
          this.finalBullet(bullets, muzzle.x, muzzle.y, Math.PI / 2 + i * 0.2, 300, {
            sprite: this.purple + '5',
          });
        }
      }
      timers.matrix = 1.4 * this.intervalBoost;
    }
    if (timers.burst <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      this.finalBullet(bullets, this.x, this.y - 30, base, 460, {
        sprite: this.purple + '6',
        large: true,
        color: '#ffd36b',
      });
      timers.burst = 0.42 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startFinalDive();
      timers.dive = 8 * this.intervalBoost;
    }
    this.updateFinalDive(dt, bullets);
    void player;
  }

  runFinalPhase4(dt, bullets, player) {
    const timers = this.attackTimers;
    const bs = this.difficulty.bulletSpeed * this.phaseBoost;
    if (timers.ring <= 0) {
      for (let layer = 0; layer < 2; layer += 1) {
        for (let i = 0; i < 10; i += 1) {
          this.finalBullet(bullets, this.x, this.y + 8, (i / 14) * TAU + layer * 0.25, 170 + layer * 45, {
            sprite: this.purple + '2',
            medium: true,
          });
        }
      }
      for (const side of ['left', 'right']) {
        if (this.isTurretBroken(side)) continue;
        const point = this.turretPoint(side);
        const dir = side === 'left' ? -1 : 1;
        for (let i = -4; i <= 4; i += 1) {
          this.finalBullet(bullets, point.x, point.y, Math.PI / 2 + dir * (0.25 + i * 0.15), 250, {
            sprite: this.purple + '3',
            medium: true,
          });
        }
      }
      timers.ring = 1.6 * this.intervalBoost;
    }
    if (timers.scatter <= 0) {
      const base = angleTo(this.x, this.y, player.x, player.y);
      for (let i = 0; i < 4; i += 1) {
        const offset = (Math.random() - 0.5) * 0.6;
        this.finalBullet(bullets, this.x + (Math.random() - 0.5) * 90, this.y + 12, base + offset, 270 + Math.random() * 60, {
          sprite: this.purple + '5',
        });
      }
      timers.scatter = 1.7 * this.intervalBoost;
    }
    if (timers.burst <= 0) {
      const base = angleTo(this.x, this.y - 30, player.x, player.y);
      this.finalBullet(bullets, this.x, this.y - 30, base, 500, {
        sprite: this.purple + '6',
        large: true,
        color: '#ffd36b',
      });
      timers.burst = 0.3 * this.intervalBoost;
    }
    if (timers.dive <= 0) {
      this.startFinalDive();
      timers.dive = 5 * this.intervalBoost;
    }
    this.updateFinalDive(dt, bullets);
    void player;
  }

  startFinalDive() {
    this.finalDiveBaseY = this.y;
    this.finalDiveState = 'dive';
  }

  updateFinalDive(dt, bullets) {
    if (this.finalDiveState === 'dive') {
      this.y += 300 * dt;
      if (this.y >= this.finalDiveBaseY + 240) {
        this.y = this.finalDiveBaseY + 240;
        if (bullets) {
          for (let i = 0; i < 12; i += 1) {
            this.finalBullet(bullets, this.x, this.y + 10, (i / 12) * TAU, 190, {
              sprite: this.purple + '2',
              medium: true,
            });
          }
        }
        this.finalDiveState = 'retreat';
      }
    } else if (this.finalDiveState === 'retreat') {
      this.y -= 420 * dt;
      if (this.y <= this.finalDiveBaseY) {
        this.y = this.finalDiveBaseY;
        this.finalDiveState = 'idle';
      }
    }
  }

  damagePart(key, amount) {
    const part = this.parts.find((p) => p.key === key);
    if (!part || part.dead) return;
    part.hp = Math.max(0, part.hp - amount);
    part.flash = 1;
    if (part.hp <= 0) part.dead = true;
  }

  startStormTransition(next) {
    this.comboTransition = 1.1;
    this.nextCombo = next;
    this.shake = 1;
    this.addSmoke(10);
    if (next === 1) {
      const damaged = this.turrets.find((t) => !t.broken);
      if (damaged) damaged.damaged = true;
    } else if (next === 2) {
      for (const t of this.turrets) t.broken = true;
      this.addSmoke(14);
    } else if (next === 3) {
      this.speedBoost = 1.22;
    }
  }

  updateDive(dt) {
    if (this.diveState === 'idle') {
      this.diveTimer -= dt;
      this.updateWander(dt);
      if (this.diveTimer <= 0) {
        this.diveBaseY = this.y;
        this.diveState = 'dive';
      }
    } else if (this.diveState === 'dive') {
      this.y += 430 * dt;
      if (this.y >= this.diveBaseY + 250) this.diveState = 'retreat';
    } else {
      this.y -= 520 * dt;
      if (this.y <= this.diveBaseY) {
        this.y = this.diveBaseY;
        this.diveState = 'idle';
        this.diveTimer = 4.5;
      }
    }
  }

  updateWander(dt) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderX = rand(80, 640);
      this.wanderY = rand(250, 540);
      this.wanderTimer = rand(2.5, 4.5);
    }
    const dx = this.wanderX - this.x;
    const dy = this.wanderY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 90;
    if (dist > 4) {
      const step = Math.min(speed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    this.y += Math.sin(this.t * 0.5) * 6 * dt;
  }

  runStormAttacks(dt, bullets, player) {
    const timers = this.attackTimers;
    for (const key of Object.keys(timers)) timers[key] -= dt;
    const bs = this.difficulty.bulletSpeed * this.speedBoost;
    if (this.combo === 0) {
      if (timers.turret <= 0) {
        const side = Math.floor(this.t * 0.9) % 2 === 0 ? 'left' : 'right';
        this.fireTurretFan(bullets, side, bs);
        timers.turret = 0.9;
      }
      if (timers.missile <= 0) {
        this.fireTrackingMissiles(bullets, player, bs);
        timers.missile = 2.6;
      }
      return;
    }
    if (this.combo === 1) {
      const intact = this.turrets.find((t) => !t.broken && !t.damaged) || this.turrets.find((t) => !t.broken);
      if (intact && timers.turret <= 0) {
        this.fireDiagonalBurst(bullets, intact.side, bs);
        timers.turret = 0.45;
      }
      if (timers.cross <= 0) {
        this.fireCrossFire(bullets, bs);
        timers.cross = 1.0;
      }
      if (!this.summonedB && this.summonCallback) {
        this.summonCallback(['S', 'S']);
        this.summonedB = true;
      }
      return;
    }
    if (this.combo === 2) {
      if (timers.fan <= 0) {
        this.fireSweepFan(bullets, bs);
        timers.fan = 0.55;
      }
      if (timers.heavy <= 0) {
        this.fireHeavyBurst(bullets, bs, 8, 190);
        timers.heavy = 3.2;
      }
      if (timers.kamikaze <= 0 && this.summonCallback) {
        this.summonCallback(['K', 'K']);
        timers.kamikaze = 4.5;
      }
      return;
    }
    if (this.combo === 3) {
      if (timers.fan <= 0) {
        this.fireSweepFan(bullets, bs);
        timers.fan = 0.5;
      }
      if (timers.cross <= 0) {
        this.fireCrossFire(bullets, bs);
        timers.cross = 1.1;
      }
      if (timers.heavy <= 0) {
        this.fireHeavyBurst(bullets, bs, this.heavyRound === 1 ? 12 : 8, 150);
        this.heavyRound = this.heavyRound === 1 ? 2 : 1;
        timers.heavy = 2.6;
      }
      if (timers.kamikaze <= 0 && this.summonCallback) {
        this.summonCallback(['K', 'K']);
        timers.kamikaze = 2.2;
      }
    }
  }

  fireTurretFan(bullets, side, bs) {
    const dir = side === 'left' ? -1 : 1;
    const point = this.turretPoint(side);
    const base = Math.PI / 2 + dir * 0.15;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(point.x, point.y, base + i * 0.22, 240 * bs, {
        color: '#ff5f6b',
        sprite: 'boss_bullet_2',
        medium: true,
      });
    }
  }

  fireTrackingMissiles(bullets, player, bs) {
    for (let i = 0; i < 2; i += 1) {
      const angle = Math.PI / 2 + (i === 0 ? -0.4 : 0.4);
      bullets.fireEnemy(this.x, this.y + 20, angle, 150 * bs, {
        sprite: 'boss_bullet_4',
        color: '#ffb13d',
        saturate: true,
        tracking: {
          originX: this.x,
          originY: this.y + 20,
          radius: 110,
          lockSpeed: 270 * bs,
        },
      });
    }
    void player;
  }

  fireDiagonalBurst(bullets, side, bs) {
    const dir = side === 'left' ? -1 : 1;
    const point = this.turretPoint(side);
    const base = Math.PI / 2 + dir * 0.5;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(point.x, point.y, base + i * 0.2, 320 * bs, {
        color: '#ff8a4a',
        sprite: 'boss_bullet_3',
        medium: true,
      });
    }
  }

  fireCrossFire(bullets, bs) {
    for (let group = 0; group < 2; group += 1) {
      const sign = group === 0 ? -1 : 1;
      for (let i = 0; i < 4; i += 1) {
        const angle = Math.PI / 2 + sign * (0.5 + i * 0.2);
        bullets.fireEnemy(this.x, this.y + 18, angle, 300 * bs, {
          color: '#ff5f6b',
          sprite: 'boss_bullet_1',
        });
      }
    }
  }

  fireSweepFan(bullets, bs) {
    this.attackAngle += 0.28;
    const base = Math.PI / 2 + Math.sin(this.attackAngle) * 0.9;
    for (let i = -2; i <= 2; i += 1) {
      bullets.fireEnemy(this.x, this.y + 18, base + i * 0.16, 280 * bs, {
        color: '#c26bff',
        sprite: 'boss_bullet_5',
      });
    }
  }

  fireHeavyBurst(bullets, bs, count, speed) {
    bullets.fireEnemy(this.x, this.y + 20, Math.PI / 2, speed * bs, {
      large: true,
      color: '#ff3d55',
      sprite: 'boss_bullet_6',
      life: 2.4,
      fragment: {
        count,
        speed: speed * 0.9,
        color: '#ff5f6b',
        sprite: 'boss_bullet_5',
      },
    });
  }

  turretPoint(turret) {
    const side = typeof turret === 'string' ? turret : turret.side;
    if (this.custom === 'alienMothership') return this.alienTurretPoint(side);
    const dir = side === 'left' ? -1 : 1;
    const offset = 78 + this.turretExtend * 46;
    return { x: this.x + dir * offset, y: this.y + 6 };
  }

  damageTurret(side, amount) {
    if (this.custom === 'alienMothership' && this.entering) return;
    const turret = this.turrets.find((t) => t.side === side);
    if (!turret || turret.broken) return;
    turret.hp -= amount;
    if (turret.hp <= 0) {
      turret.broken = true;
      this.addSmoke(6);
    }
  }

  hitTurret(x, y, r) {
    if (!this.turrets.length) return null;
    for (const turret of this.turrets) {
      if (turret.broken) continue;
      const point = this.turretPoint(turret);
      const dx = x - point.x;
      const dy = y - point.y;
      if (dx * dx + dy * dy <= (r + 22) * (r + 22)) return turret.side;
    }
    return null;
  }

  isDiving() {
    return this.custom === 'stormEye' && this.diveState === 'dive';
  }

  addSmoke(count) {
    for (let i = 0; i < count; i += 1) {
      this.smoke.push({
        x: rand(-110, 110),
        y: rand(-20, 50),
        size: rand(5, 14),
        life: rand(0.8, 1.5),
        maxLife: 1.5,
      });
    }
  }

  updateSmoke(dt) {
    for (let i = this.smoke.length - 1; i >= 0; i -= 1) {
      const puff = this.smoke[i];
      puff.life -= dt;
      puff.y -= 18 * dt;
      if (puff.life <= 0) this.smoke.splice(i, 1);
    }
  }

  renderStormEye(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 150 + pulse * 20);
    aura.addColorStop(0, 'rgba(120,20,30,' + (0.3 + this.coreGlow * 0.15) + ')');
    aura.addColorStop(0.7, 'rgba(70,12,20,0.12)');
    aura.addColorStop(1, 'rgba(30,6,10,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(8,4,8,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 76, 96, 22, 0, 0, TAU);
    ctx.fill();

    if (this.art) {
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.6) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = '#5a1f2b';
      ctx.strokeStyle = '#260a12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(34, -34);
      ctx.lineTo(126, -16);
      ctx.lineTo(136, 18);
      ctx.lineTo(40, 42);
      ctx.lineTo(0, 58);
      ctx.lineTo(-40, 42);
      ctx.lineTo(-136, 18);
      ctx.lineTo(-126, -16);
      ctx.lineTo(-34, -34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,120,120,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-110, 8);
      ctx.lineTo(110, 8);
      ctx.stroke();
    }

    const corePulse = 0.7 + 0.3 * Math.sin(time * 3);
    ctx.shadowColor = '#ff2a35';
    ctx.shadowBlur = 14 + this.coreGlow * 34 * corePulse;
    ctx.fillStyle = 'rgba(255,' + Math.round(30 + 40 * corePulse) + ',40,' + (0.75 + this.coreGlow * 0.25) + ')';
    ctx.beginPath();
    ctx.arc(0, 12, 13 + corePulse * 3, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    this.renderStormTurret(ctx, this.turrets[0], -1);
    this.renderStormTurret(ctx, this.turrets[1], 1);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.5;
      ctx.fillStyle = '#1b1518';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderStormTurret(ctx, turret, dir) {
    const point = this.turretPoint(turret.side);
    ctx.save();
    ctx.translate(point.x - this.x, point.y - this.y);
    if (turret.broken) {
      ctx.fillStyle = '#2b1218';
      ctx.strokeStyle = '#120509';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(10, -10);
      ctx.lineTo(12, 8);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.rotate(dir * (0.12 + this.turretExtend * 0.1));
    ctx.fillStyle = '#7a2a36';
    ctx.strokeStyle = '#260a12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(4, -18);
    ctx.lineTo(20, -10);
    ctx.lineTo(18, 12);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a43a48';
    ctx.fillRect(-4, -34, 8, 24);
    if (turret.damaged && !turret.broken) {
      ctx.fillStyle = 'rgba(20,8,10,0.75)';
      ctx.beginPath();
      ctx.arc(-6, 4, 10, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  runSkill(id, dt, bullets, player) {
    if (id === 'rotate') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.5) {
        this.fireRotating(bullets);
        this.rotationAngle += DEG4;
        this.internalTimer -= 0.5;
      }
      return;
    }
    if (id === 'radial') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.7 && this.radialRounds < 3) {
        this.fireRadial(bullets);
        this.radialRounds += 1;
        this.internalTimer -= 0.7;
      }
      return;
    }
    if (id === 'laser') {
      if (!this.laserFired) {
        bullets.fireLaser(this.x, this.y + 40, 68, 4.0, 'boss_laser', { style: 'orbs', color: '#5fff7a', follow: { x: () => this.x, y: () => this.y + 40 } });
        this.laserFired = true;
      }
      return;
    }
    if (id === 'track') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.5 && this.trackRounds < 4) {
        this.fireTracking(bullets, player);
        this.trackRounds += 1;
        this.internalTimer -= 0.5;
      }
      return;
    }
    if (id === 'array') {
      this.internalTimer += dt;
      while (this.internalTimer >= 0.2) {
        this.fireArray(bullets);
        this.internalTimer -= 0.2;
      }
      return;
    }
    if (id === 'summon' && !this.summoned) {
      this.summonEnemies();
      this.summoned = true;
    }
  }

  fireRotating(bullets) {
    const speed = 190 * this.difficulty.bulletSpeed;
    for (let i = 0; i < 12; i += 1) {
      const angle = this.rotationAngle + i * DEG30;
      bullets.fireEnemy(this.x, this.y + 30, angle, speed, {
        color: '#ff6a3d',
        sprite: 'boss_bullet_1',
        saturate: true,
      });
    }
  }

  fireRadial(bullets) {
    const speed = 300 * this.difficulty.bulletSpeed;
    for (let i = 0; i < 12; i += 1) {
      bullets.fireEnemy(this.x, this.y + 24, i * DEG30, speed, {
        large: true,
        color: '#ff9e3d',
        sprite: 'boss_bullet_2',
        saturate: true,
      });
    }
  }

  fireTracking(bullets, player) {
    const angle = rand(0, TAU);
    bullets.fireEnemy(this.x, this.y + 24, angle, 135 * this.difficulty.bulletSpeed, {
      sprite: 'boss_bullet_4',
      color: '#ffb13d',
      saturate: true,
      tracking: {
        originX: this.x,
        originY: this.y,
        radius: 150,
        lockSpeed: 290,
      },
    });
  }

  fireArray(bullets) {
    const count = randInt(10, 16);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(90, 230) * this.difficulty.bulletSpeed;
      bullets.fireEnemy(this.x, this.y + 20, angle, speed, {
        sprite: 'boss_bullet_5',
        color: '#ffd36b',
        saturate: true,
      });
    }
  }

  summonEnemies() {
    const count = Math.max(1, Math.round(randInt(5, 7) * this.difficulty.enemyCount));
    const types = [];
    for (let i = 0; i < count; i += 1) {
      const roll = Math.random();
      types.push(roll < 0.5 ? 'S' : roll < 0.85 ? 'M' : 'H');
    }
    if (this.summonCallback) this.summonCallback(types);
  }

  damage(amount) {
    if (this.transitioning) return;
    if (this.custom === 'alienMothership') {
      this.damageAlienMothership(amount);
      return;
    }
    if (this.custom === 'twinGuards') {
      for (const part of this.parts) {
        if (part.dead) continue;
        part.hp = Math.max(0, part.hp - amount);
        part.flash = 1;
        if (part.hp <= 0) part.dead = true;
      }
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deathTimer = 0;
    }
  }

  showSpell(name) {
    this.spellBanner = name;
    this.bannerTimer = 2.2;
  }

  render(ctx, time) {
    if (this.custom === 'finalLord') {
      this.renderFinalLord(ctx, time);
      return;
    }
    if (this.custom === 'alienMothership') {
      this.renderAlienMothership(ctx, time);
      return;
    }
    if (this.custom === 'twinGuards') {
      this.renderTwinGuards(ctx, time);
      return;
    }
    if (this.custom === 'stormEye') {
      this.renderStormEye(ctx, time);
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.72;
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.5) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    if (this.flash > 0) ctx.globalAlpha = 0.72;
    this.drawAura(ctx, time);
    this.drawBody(ctx, time);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  renderTwinGuards(ctx, time) {
    for (const part of this.parts) {
      if (part.dead) continue;
      ctx.save();
      ctx.translate(part.x, part.y);
      const pulse = 0.5 + 0.5 * Math.sin(time * 4 + (part.key === 'alpha' ? 0 : 1.2));
      const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, part.radius * 2.1 + pulse * 8);
      aura.addColorStop(0, 'rgba(255,190,90,0.26)');
      aura.addColorStop(0.7, 'rgba(255,160,60,0.10)');
      aura.addColorStop(1, 'rgba(255,140,50,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, part.radius * 2.1 + pulse * 8, 0, TAU);
      ctx.fill();
      if (part.art) {
        if (part.flash > 0) ctx.globalAlpha = 0.6;
        const maxDim = Math.max(part.art.width, part.art.height) || 1;
        const scale = (part.radius * 3.4) / maxDim;
        const w = part.art.width * scale;
        const h = part.art.height * scale;
        ctx.drawImage(part.art, -w / 2, -h / 2, w, h);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = part.key === 'alpha' ? '#d8b64a' : '#b8894a';
        ctx.strokeStyle = '#3c2f0d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -part.radius);
        ctx.lineTo(part.radius * 0.65, part.radius * 0.55);
        ctx.lineTo(-part.radius * 0.65, part.radius * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderFinalLord(ctx, time) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;
    ctx.save();
    ctx.translate(this.x + shakeX, this.y + shakeY);

    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 170 + pulse * 16);
    aura.addColorStop(0, 'rgba(168,96,255,0.30)');
    aura.addColorStop(0.7, 'rgba(120,60,200,0.12)');
    aura.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 170 + pulse * 16, 0, TAU);
    ctx.fill();

    if (this.art) {
      if (this.flash > 0) ctx.globalAlpha = 0.68;
      const maxDim = Math.max(this.art.width, this.art.height) || 1;
      const scale = (this.r * 2.55) / maxDim;
      const w = this.art.width * scale;
      const h = this.art.height * scale;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#7a5ac8';
      ctx.strokeStyle = '#2a1a55';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(34, -32);
      ctx.lineTo(124, -14);
      ctx.lineTo(134, 20);
      ctx.lineTo(38, 42);
      ctx.lineTo(0, 58);
      ctx.lineTo(-38, 42);
      ctx.lineTo(-134, 20);
      ctx.lineTo(-124, -14);
      ctx.lineTo(-34, -32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const charge = this.transitioning ? 0 : Math.max(0, 1 - this.attackTimers.main / 2.4);
    ctx.fillStyle = 'rgba(255,220,120,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -46, 18 + charge * 22, 8 + charge * 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.ellipse(0, -50, 5 + charge * 8, 10 + charge * 14, 0, 0, TAU);
    ctx.fill();

    this.renderFinalTurret(ctx, this.turrets.find((t) => t.side === 'left'), -1);
    this.renderFinalTurret(ctx, this.turrets.find((t) => t.side === 'right'), 1);

    for (const puff of this.smoke) {
      ctx.globalAlpha = clamp(puff.life / puff.maxLife, 0, 1) * 0.5;
      ctx.fillStyle = '#2a1830';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderFinalTurret(ctx, turret, dir) {
    if (!turret) return;
    const point = this.turretPoint(turret.side);
    ctx.save();
    ctx.translate(point.x - this.x, point.y - this.y);
    ctx.rotate(dir * 0.12);
    if (turret.broken) {
      ctx.fillStyle = '#2a1c35';
      ctx.strokeStyle = '#120a1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(12, -14);
      ctx.lineTo(16, 10);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,80,0.5)';
      ctx.beginPath();
      ctx.arc(-4, 2, 5, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#9a6fd8';
    ctx.strokeStyle = '#2a1a55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(5, -22);
    ctx.lineTo(24, -12);
    ctx.lineTo(22, 14);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8b6ff';
    ctx.beginPath();
    ctx.arc(2, -2, 7, 0, TAU);
    ctx.fill();
    if (turret.damaged) {
      ctx.fillStyle = 'rgba(30,15,40,0.75)';
      ctx.beginPath();
      ctx.arc(-6, 6, 9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAura(ctx, time) {
    const pulse = 0.5 + Math.sin(time * 4) * 0.5;
    const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 150 + pulse * 20);
    aura.addColorStop(0, 'rgba(120,70,30,0.34)');
    aura.addColorStop(0.7, 'rgba(70,40,16,0.12)');
    aura.addColorStop(1, 'rgba(30,16,6,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 155, 0, TAU);
    ctx.fill();
  }

  drawBody(ctx, time) {
    ctx.fillStyle = 'rgba(12,8,4,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 74, 66, 18, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#57534c';
    ctx.strokeStyle = '#1d1914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, -36);
    ctx.lineTo(-96, -12);
    ctx.lineTo(-108, 16);
    ctx.lineTo(-38, 10);
    ctx.lineTo(-26, 34);
    ctx.lineTo(26, 34);
    ctx.lineTo(38, 10);
    ctx.lineTo(108, 16);
    ctx.lineTo(96, -12);
    ctx.lineTo(30, -36);
    ctx.lineTo(0, -52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3c3932';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(10, -10);
    ctx.lineTo(22, 30);
    ctx.lineTo(-22, 30);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6e6a5f';
    ctx.fillRect(-92, 2, 22, 14);
    ctx.fillRect(70, 2, 22, 14);

    ctx.fillStyle = '#2f2c26';
    ctx.fillRect(-50, -22, 14, 20);
    ctx.fillRect(36, -22, 14, 20);

    ctx.fillStyle = 'rgba(255,90,30,0.9)';
    ctx.beginPath();
    ctx.ellipse(-81, 18, 3, 8, 0, 0, TAU);
    ctx.ellipse(81, 18, 3, 8, 0, 0, TAU);
    ctx.ellipse(0, 40, 3, 8, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#d9365f';
    ctx.beginPath();
    ctx.arc(-30, -2, 3, 0, TAU);
    ctx.arc(30, -2, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(0, 14, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2b241c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('荒', 0, 19);
  }
}

Object.assign(Boss.prototype, alienMothershipMethods);

module.exports = Boss;
