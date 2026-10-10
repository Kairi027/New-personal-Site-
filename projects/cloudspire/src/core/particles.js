const { TAU, rand, randInt, clamp } = require('../utils/math.js');

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.flash = 0;
  }

  burst(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const velocity = rand(speed * 0.3, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: rand(life * 0.5, life),
        maxLife: life,
        size: rand(size * 0.5, size),
        color,
        gravity: rand(20, 60),
      });
    }
  }

  sparkle(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(20, 90);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.2, 0.6),
        maxLife: 0.6,
        size: rand(1.5, 3.5),
        color,
        gravity: -10,
        sparkle: true,
      });
    }
  }

  ring(x, y, color, maxRadius, life, width) {
    this.rings.push({
      x,
      y,
      radius: 0,
      maxRadius,
      life,
      maxLife: life,
      color,
      width: width || 5,
    });
  }

  explosion(x, y, color) {
    this.burst(x, y, color, 26, 260, 0.7, 5);
    this.burst(x, y, '#fff7d9', 12, 180, 0.5, 4);
    this.ring(x, y, color, 90, 0.5, 6);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const r = this.rings[i];
      r.life -= dt;
      r.radius += (r.maxRadius / r.maxLife) * dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    this.flash = Math.max(0, this.flash - dt * 1.2);
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.sparkle) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }
    for (const r of this.rings) {
      const alpha = clamp(r.life / r.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }
}

module.exports = ParticleSystem;
