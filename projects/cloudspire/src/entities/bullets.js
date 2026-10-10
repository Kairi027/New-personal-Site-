const { TAU, angleTo, rand } = require('../utils/math.js');

// Default beam payload: 20 damage per hit, one hit every 0.4s (=50 damage per second).
// Callers can override per beam via fireLaser options (boss4 uses 52 / 0.4s = 130 per second).
const BEAM_DAMAGE = 20;
const BEAM_HIT_INTERVAL = 0.4;

class BulletManager {
  constructor(artBank) {
    this.artBank = artBank || null;
    this.enemy = [];
    this.player = [];
    this.beams = [];
  }

  firePlayer(x, y, angle, speed, damage, opts) {
    const options = opts || {};
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.player.push({
      x,
      y,
      vx,
      vy,
      angle: Math.atan2(vy, vx) + Math.PI / 2,
      r: options.r || 10,
      damage,
      color: options.color || '#5fd7ff',
      life: 2.4,
      spin: Math.random() * TAU,
    });
  }

  fireEnemy(x, y, angle, speed, opts) {
    const options = opts || {};
    const large = !!options.large;
    const medium = !!options.medium;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.enemy.push({
      x,
      y,
      vx,
      vy,
      angle: Math.atan2(vy, vx) + Math.PI / 2,
      r: large ? 15 : medium ? 11 : 8,
      large,
      medium,
      life: options.life || 11,
      spin: Math.random() * TAU,
      color: options.color || '#ff6a3d',
      sprite: options.sprite || (large ? 'enemy_bullet_large' : medium ? 'enemy_bullet_medium' : 'enemy_bullet_small'),
      tracking: options.tracking || null,
      fragment: options.fragment || null,
      destructible: !!options.destructible,
      hp: options.hp || 0,
      maxHp: options.hp || 0,
    });
  }

  fireLaser(x, y, width, duration, sprite, opts) {
    const options = opts || {};
    this.beams.push({
      x,
      y,
      width,
      timer: 0,
      duration,
      hitTimer: 0,
      damage: options.damage === undefined ? BEAM_DAMAGE : options.damage,
      hitInterval: options.hitInterval === undefined ? BEAM_HIT_INTERVAL : options.hitInterval,
      sprite: sprite || 'boss_laser',
      direction: options.direction || 'vertical',
      charge: options.charge || 0,
      vx: options.vx || 0,
      vy: options.vy || 0,
      style: options.style || null,
      color: options.color || null,
      follow: options.follow || null,
    });
  }

  update(dt, player) {
    for (let i = this.player.length - 1; i >= 0; i -= 1) {
      const b = this.player[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.spin += dt * 10;
      b.life -= dt;
      if (b.y < -30 || b.x < -40 || b.x > 760 || b.life <= 0) {
        this.player.splice(i, 1);
      }
    }
    for (let i = this.enemy.length - 1; i >= 0; i -= 1) {
      const b = this.enemy[i];
      if (b.tracking) {
        this.updateTracking(b, dt, player);
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      b.spin += dt * 4;
      b.life -= dt;
      if (b.y < -40 || b.y > 1340 || b.x < -50 || b.x > 770 || b.life <= 0) {
        if (b.fragment) this.spawnFragments(b);
        this.enemy.splice(i, 1);
      }
    }
    for (let i = this.beams.length - 1; i >= 0; i -= 1) {
      const beam = this.beams[i];
      beam.timer += dt;
      beam.hitTimer -= dt;
      if (beam.follow) {
        beam.x = beam.follow.x();
        beam.y = beam.follow.y();
      } else {
        beam.x += beam.vx * dt;
        beam.y += beam.vy * dt;
      }
      if (beam.timer >= beam.duration) this.beams.splice(i, 1);
    }
  }

  updateTracking(b, dt, player) {
    const tracking = b.tracking;
    if (!tracking.lockedAngle) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const dx = b.x - tracking.originX;
      const dy = b.y - tracking.originY;
      if (Math.sqrt(dx * dx + dy * dy) >= tracking.radius) {
        if (player) {
          tracking.lockedAngle = angleTo(b.x, b.y, player.x, player.y);
        } else {
          tracking.lockedAngle = Math.atan2(b.vy, b.vx);
        }
        b.vx = Math.cos(tracking.lockedAngle) * tracking.lockSpeed;
        b.vy = Math.sin(tracking.lockedAngle) * tracking.lockSpeed;
        b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      }
    } else {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
  }

  clearEnemy() {
    this.enemy = [];
    this.beams = [];
  }

  spawnFragments(bullet) {
    const fragment = bullet.fragment;
    if (!fragment) return;
    const angles = fragment.angles || Array.from({ length: fragment.count || 4 }, (_, i) => (i / (fragment.count || 4)) * TAU + rand(0, 0.35));
    for (const angle of angles) {
      const speed = rand(fragment.speed * 0.8, fragment.speed * 1.2);
      this.fireEnemy(bullet.x, bullet.y, angle, speed, {
        color: fragment.color || '#ff5f6b',
        sprite: fragment.sprite || 'boss_bullet_5',
        medium: !!fragment.medium,
        large: !!fragment.large,
      });
    }
  }

  renderEnemy(ctx) {
    for (const b of this.enemy) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.saturate ? 'rgba(255,255,255,0.08)' : 'rgba(255,165,70,0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.5, 0, TAU);
      ctx.fill();
      const img = this.artBank ? this.artBank.get(b.sprite) : null;
      if (img) {
        ctx.rotate(b.angle);
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (b.r * 2.9) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#fff3d6';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.62, b.r, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.34, b.r * 0.72, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderPlayer(ctx) {
    const img = this.artBank ? this.artBank.get('player_bullet') : null;
    for (const b of this.player) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(140,232,255,0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 2.0, 0, TAU);
      ctx.fill();
      if (img && (!b.color || b.color === '#5fd7ff')) {
        ctx.rotate(b.angle);
        const maxDim = Math.max(img.width, img.height) || 1;
        const scale = (b.r * 2.6) / maxDim;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = b.color || '#dffbff';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 0.45, b.r * 1.35, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = b.color || '#5fd7ff';
        ctx.beginPath();
        ctx.ellipse(0, b.r * 0.45, b.r * 0.25, b.r * 0.8, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderBeams(ctx) {
    for (const beam of this.beams) {
      const charging = beam.timer < beam.charge;
      const img = this.artBank ? this.artBank.get(beam.sprite) : null;
      if (charging) {
        const progress = Math.max(0, Math.min(1, beam.timer / beam.charge));
        ctx.save();
        ctx.globalAlpha = 0.25 + progress * 0.45;
        ctx.strokeStyle = beam.color || '#ff4b5f';
        ctx.lineWidth = 3 + progress * 5;
        ctx.beginPath();
        if (beam.direction === 'horizontal') {
          ctx.moveTo(0, beam.y);
          ctx.lineTo(720, beam.y);
        } else {
          ctx.moveTo(beam.x, beam.y);
          ctx.lineTo(beam.x, 1280);
        }
        ctx.stroke();
        ctx.restore();
        continue;
      }
      if (beam.style === 'orbs') {
        this.renderOrbBeam(ctx, beam);
        continue;
      }
      const alpha = 0.6 + Math.sin(beam.timer * 30) * 0.25;
      ctx.globalAlpha = Math.max(0.25, alpha);
      if (beam.direction === 'horizontal') {
        if (img) {
          ctx.drawImage(img, 0, beam.y - beam.width / 2, 720, beam.width);
        } else {
          const grad = ctx.createLinearGradient(0, 0, 720, 0);
          grad.addColorStop(0, 'rgba(255,60,20,0.15)');
          grad.addColorStop(0.35, 'rgba(255,90,30,0.75)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
          grad.addColorStop(0.65, 'rgba(255,90,30,0.75)');
          grad.addColorStop(1, 'rgba(255,60,20,0.15)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, beam.y - beam.width / 2, 720, beam.width);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(0, beam.y - 6, 720, 12);
        }
      } else {
        const startY = beam.y || 0;
        if (img) {
          ctx.drawImage(img, beam.x - beam.width / 2, startY, beam.width, 1280 - startY);
        } else {
          const grad = ctx.createLinearGradient(0, startY, 0, 1280);
          grad.addColorStop(0, 'rgba(255,255,255,0.95)');
          grad.addColorStop(0.12, 'rgba(255,180,80,0.9)');
          grad.addColorStop(0.35, 'rgba(255,90,30,0.75)');
          grad.addColorStop(1, 'rgba(255,60,20,0.15)');
          ctx.fillStyle = grad;
          ctx.fillRect(beam.x - beam.width / 2, startY, beam.width, 1280 - startY);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(beam.x - 6, startY, 12, 1280 - startY);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  renderOrbBeam(ctx, beam) {
    const color = beam.color || '#ff4b5f';
    const orbR = Math.max(6, beam.width * 0.42);
    const spacing = Math.max(10, orbR * 0.85);
    const pulse = 0.75 + 0.25 * Math.sin(beam.timer * 22);
    ctx.save();
    if (beam.direction === 'horizontal') {
      for (let x = 0; x <= 720; x += spacing) {
        const g = ctx.createRadialGradient(x, beam.y, 1, x, beam.y, orbR);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.35, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, beam.y, orbR, 0, TAU);
        ctx.fill();
      }
    } else {
      for (let y = beam.y; y <= 1280; y += spacing) {
        const g = ctx.createRadialGradient(beam.x, y, 1, beam.x, y, orbR);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.35, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(beam.x, y, orbR, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

module.exports = BulletManager;
