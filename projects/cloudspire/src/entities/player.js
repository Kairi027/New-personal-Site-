const { clamp, TAU } = require('../utils/math.js');

const EXTRA_LIFE_SCORES = [50000, 150000, 300000];
const MAX_LEVEL = 26;
const SHIELD_MAX = 100;
const SHIELD_REGEN_INTERVAL = 0.5;
const SHIELD_REGEN_COOLDOWN = 3;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 6;
    this.maxHp = 100;
    this.hp = 100;
    this.lives = 3;
    this.reviveUsed = 0;
    this.invincible = false;
    this.shield = 0;
    this.maxShield = 0;
    this.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
    this.shieldRegenCooldown = 0;
    this.lifeFlash = 0;
    this.level = 1;
    this.exp = 0;
    this.expTotal = 0;
    this.bombs = 3;
    this.score = 0;
    this.fireTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this.attack = 6;
    this.fireInterval = 0.13;
    this.claimedExtras = [];
    this.onLevelUp = null;
    this.respawnTimer = 0;
    this.spectating = false;
    this.tilt = 0;
    this.art = null;
  }

  static fromState(state) {
    const player = new Player(360, 1080);
    player.hp = state.hp || 100;
    player.maxHp = state.maxHp || 100;
    player.lives = state.lives === undefined ? 3 : state.lives;
    player.reviveUsed = state.reviveUsed || 0;
    player.invincible = !!state.invincible;
    player.shield = 0;
    player.maxShield = 0;
    player.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
    player.shieldRegenCooldown = 0;
    player.level = state.level || 1;
    player.exp = state.exp || 0;
    player.expTotal = state.expTotal || 0;
    player.bombs = state.bombs === undefined ? 3 : state.bombs;
    player.score = state.score || 0;
    player.claimedExtras = (state.claimedExtras || []).slice();
    player.spectating = !!state.spectating;
    player.recomputeCombatStats();
    player.shield = state.shield === undefined ? player.maxShield : Math.min(Math.max(0, state.shield), player.maxShield);
    if (player.maxShield > 0 && player.shield <= 0) player.shieldRegenCooldown = SHIELD_REGEN_COOLDOWN;
    return player;
  }

  toState() {
    return {
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      lives: this.lives,
      reviveUsed: this.reviveUsed || 0,
      spectating: this.spectating,
      invincible: this.invincible,
      shield: this.shield,
      maxShield: this.maxShield,
      level: this.level,
      exp: Math.round(this.exp),
      expTotal: Math.round(this.expTotal),
      bombs: this.bombs,
      score: this.score,
      claimedExtras: this.claimedExtras.slice(),
    };
  }

  expToNext() {
    return 100 + (this.level - 1) * 60;
  }

  recomputeCombatStats() {
    const level = clamp(this.level, 1, MAX_LEVEL);
    let attack = Math.max(6, Math.round(6 * Math.pow(1.08, level - 1)));
    if (level >= 20) attack *= 2;
    this.attack = attack;
    this.fireInterval = Math.max(0.07, 0.13 * Math.pow(0.94, level - 1));
    this.maxHp = 100 + 12 * (level - 1);
    const shieldMax = level >= 20 ? SHIELD_MAX : 0;
    if (this.maxShield !== shieldMax) {
      if (shieldMax > 0 && this.maxShield === 0) this.shield = SHIELD_MAX;
      this.maxShield = shieldMax;
      if (this.maxShield === 0) this.shield = 0;
    }
    this.shield = Math.min(this.shield, this.maxShield);
  }

  addExp(amount) {
    this.exp += amount;
    this.expTotal += amount;
    while (this.exp >= this.expToNext() && this.level < MAX_LEVEL) {
      this.exp -= this.expToNext();
      this.level += 1;
      const prevMax = this.maxHp;
      this.recomputeCombatStats();
      const gained = this.maxHp - prevMax;
      if (gained > 0) this.hp = Math.min(this.maxHp, this.hp + gained);
      if (this.onLevelUp) this.onLevelUp(this.level);
    }
  }

  addScore(amount) {
    this.score += amount;
    for (const threshold of EXTRA_LIFE_SCORES) {
      if (this.score >= threshold && this.claimedExtras.indexOf(threshold) === -1) {
        this.claimedExtras.push(threshold);
        this.lives += 1;
        this.lifeFlash = 2;
      }
    }
  }

  damage(amount) {
    if (!this.alive || this.invuln > 0) return false;
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (this.maxShield > 0 && this.shield <= 0) {
      this.shieldRegenCooldown = SHIELD_REGEN_COOLDOWN;
    }
    if (remaining > 0) this.hp -= remaining;
    if (this.hp <= 0) {
      this.hp = 0;
      this.miss();
    }
    return true;
  }

  miss() {
    if (!this.invincible) this.lives -= 1;
    this.alive = false;
    this.respawnTimer = 1.1;
  }

  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    this.invuln = 2;
    this.respawnTimer = 0;
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  addBomb(amount) {
    this.bombs = clamp(this.bombs + amount, 0, 5);
  }

  update(dt, moveTarget) {
    if (!this.alive) {
      if (this.respawnTimer > 0) this.respawnTimer -= dt;
      return;
    }
    if (moveTarget) {
      const dx = moveTarget.x - this.x;
      const dy = moveTarget.y - this.y;
      this.x = moveTarget.x;
      this.y = moveTarget.y;
      const targetTilt = clamp(dx * 0.003, -0.8, 0.8);
      this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 14);
    } else {
      this.tilt += (0 - this.tilt) * Math.min(1, dt * 5);
    }
    this.x = clamp(this.x, 28, 692);
    this.y = clamp(this.y, 70, 1230);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.lifeFlash > 0) this.lifeFlash = Math.max(0, this.lifeFlash - dt);
    if (this.maxShield > 0) {
      if (this.shieldRegenCooldown > 0) {
        this.shieldRegenCooldown = Math.max(0, this.shieldRegenCooldown - dt);
      } else {
        this.shieldRegenTimer -= dt;
        if (this.shieldRegenTimer <= 0) {
          this.shieldRegenTimer = SHIELD_REGEN_INTERVAL;
          if (this.shield < this.maxShield) this.shield = Math.min(this.maxShield, this.shield + 1);
        }
      }
    }
  }

  updateFire(dt, bullets) {
    if (!this.alive) return;
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;
    this.fireTimer = this.fireInterval;
    const shots = [];
    if (this.level < 3) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2 });
    } else if (this.level < 6) {
      shots.push({ x: this.x - 9, y: this.y - 20, angle: -Math.PI / 2 + 0.05 });
      shots.push({ x: this.x + 9, y: this.y - 20, angle: -Math.PI / 2 - 0.05 });
    } else if (this.level < 10) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2 });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12 });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12 });
    } else if (this.level < 15) {
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2, r: 18 });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12, r: 15 });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12, r: 15 });
      shots.push({ x: this.x - 30, y: this.y - 14, angle: -Math.PI / 2, r: 10, color: '#7dff8a' });
      shots.push({ x: this.x + 30, y: this.y - 14, angle: -Math.PI / 2, r: 10, color: '#7dff8a' });
    } else {
      const red = this.level >= 20 ? '#ff4d6b' : '#d9b3ff';
      const gold = this.level >= 20 ? '#ffd36b' : '#d9b3ff';
      const purple = this.level >= 20 ? '#b26bff' : '#d9b3ff';
      shots.push({ x: this.x, y: this.y - 24, angle: -Math.PI / 2, r: 20, color: gold });
      shots.push({ x: this.x - 13, y: this.y - 16, angle: -Math.PI / 2 + 0.12, r: 20, color: red });
      shots.push({ x: this.x + 13, y: this.y - 16, angle: -Math.PI / 2 - 0.12, r: 20, color: purple });
      shots.push({ x: this.x - 30, y: this.y - 14, angle: -Math.PI / 2, r: 20, color: red });
      shots.push({ x: this.x + 30, y: this.y - 14, angle: -Math.PI / 2, r: 20, color: purple });
    }
    for (const shot of shots) {
      bullets.firePlayer(shot.x, shot.y, shot.angle, 860, this.attack, { r: shot.r, color: shot.color });
    }
  }

  reviveFromSpectate() {
      this.spectating = false;
      this.alive = true;
      this.hp = this.maxHp;
      this.invuln = 3;
      this.respawnTimer = 0;
      this.x = 360;
      this.y = 1000;
      this.tilt = 0;
    }


  render(ctx, time) {
    if (!this.alive) {
      if (this.respawnTimer > 0) {
        const alpha = Math.min(1, this.respawnTimer * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff9d80';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('信号丢失', this.x, this.y + 44);
        ctx.globalAlpha = 1;
      }
      return;
    }
    if (this.invuln > 0 && Math.floor(time * 14) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.art) {
      ctx.rotate(this.tilt * 0.3);
      const w = 64;
      const h = 72;
      ctx.drawImage(this.art, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
      this.renderShield(ctx, time);
      return;
    }
    ctx.rotate(this.tilt * 0.3);

    ctx.fillStyle = 'rgba(20,16,8,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 24, 7, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#e7ecf2';
    ctx.strokeStyle = '#3d4650';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(9, -8);
    ctx.lineTo(24, 10);
    ctx.lineTo(26, 18);
    ctx.lineTo(9, 13);
    ctx.lineTo(5, 24);
    ctx.lineTo(-5, 24);
    ctx.lineTo(-9, 13);
    ctx.lineTo(-26, 18);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-9, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cf3f4f';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(7, -8);
    ctx.lineTo(16, 8);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#26333d';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5, -2);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(92,222,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -10, 4, 10, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,140,50,0.95)';
    ctx.beginPath();
    ctx.ellipse(0, 27, 3, 8, 0, 0, TAU);
    ctx.ellipse(-22, 20, 2, 5, 0, 0, TAU);
    ctx.ellipse(22, 20, 2, 5, 0, 0, TAU);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;

    this.renderShield(ctx, time);

    ctx.fillStyle = 'rgba(140,230,255,0.18)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 18 + Math.sin(time * 5) * 3, 0, TAU);
    ctx.fill();
  }
  renderShield(ctx, time) {
    if (this.shield <= 0) return;
    const ratio = Math.min(1, this.shield / Math.max(1, this.maxShield));
    const pulse = 1 + Math.sin(time * 5) * 0.04;
    const radius = (34 + ratio * 8) * pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
    grad.addColorStop(0, "rgba(140,220,255,0.05)");
    grad.addColorStop(0.75, "rgba(140,220,255,0.16)");
    grad.addColorStop(1, "rgba(190,240,255,0.38)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fill();
    const low = ratio < 0.25;
    const ringAlpha = low && Math.floor(time * 6) % 2 === 0 ? 0.35 : 0.9;
    ctx.strokeStyle = "rgba(160,228,255," + ringAlpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,240,255,0.55)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const start = (i / 3) * TAU + time * 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, start + 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

module.exports = Player;
Player.EXTRA_LIFE_SCORES = EXTRA_LIFE_SCORES;

