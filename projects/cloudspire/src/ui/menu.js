function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawButton(ctx, rect, label, opts) {
  const options = opts || {};
  const active = !!options.active;
  const alpha = options.alpha === undefined ? 1 : options.alpha;
  const offsetY = options.offsetY || 0;
  const pulse = options.pulse || 0;
  const glowColor = options.glowColor || '#ffd36b';
  const accent = options.accent;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (pulse > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8 + pulse * 16;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * (0.18 + pulse * 0.28);
    roundedRectPath(ctx, rect.x - 5, rect.y + offsetY - 5, rect.w + 10, rect.h + 10, 11);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha;
  }
  ctx.fillStyle = options.fill || (active ? 'rgba(190,214,244,0.22)' : 'rgba(12,20,38,0.52)');
  ctx.strokeStyle = options.frame || (active ? '#ffe9b8' : 'rgba(232,240,255,0.75)');
  ctx.lineWidth = options.frameWidth || (active ? 2.5 : 1.5);
  roundedRectPath(ctx, rect.x, rect.y + offsetY, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  if (accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rect.x + 13, rect.y + 11 + offsetY);
    ctx.lineTo(rect.x + 13, rect.y + rect.h - 11 + offsetY);
    ctx.stroke();
  }
  ctx.fillStyle = options.color || '#f2f6ff';
  ctx.font = options.font || 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1 + offsetY);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawPanel(ctx, rect) {
  ctx.fillStyle = 'rgba(10,18,34,0.86)';
  ctx.strokeStyle = 'rgba(222,232,255,0.7)';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.stroke();
}

function drawLogo(ctx, cx, y, opts) {
  const options = opts || {};
  const time = options.time || 0;
  const floatY = options.float ? Math.sin(time * 1.6) * 7 : 0;
  const glow = options.glow === undefined ? 18 : options.glow;
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.25);
  const scale = options.scale || 1;
  ctx.save();
  ctx.translate(cx, y + floatY);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  if (options.wings) {
    const wingColor = options.wingColor || 'rgba(255,211,107,0.9)';
    ctx.strokeStyle = wingColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.72 + pulse * 0.2;
    ctx.beginPath();
    ctx.moveTo(-10, 24);
    ctx.quadraticCurveTo(-150, 42, -268, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 24);
    ctx.quadraticCurveTo(150, 42, 268, 14);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35 + pulse * 0.2;
    ctx.beginPath();
    ctx.moveTo(-14, 30);
    ctx.quadraticCurveTo(-120, 50, -210, 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, 30);
    ctx.quadraticCurveTo(120, 50, 210, 34);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffd36b';
    ctx.save();
    ctx.translate(0, 45);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#ffd36b';
  ctx.shadowBlur = glow + pulse * 8;
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 78px "STKaiti","KaiTi","SimSun",serif';
  ctx.fillText('云阙飞戈', 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd36b';
  ctx.font = 'bold 16px "STKaiti","KaiTi",serif';
  ctx.fillText('Lances of Cloudspire', 0, 34);
  ctx.restore();
}

function drawInkTitle(ctx, text, cx, cy, size) {
  ctx.save();
  ctx.textAlign = 'center';
  const font = `bold ${size}px "STKaiti","KaiTi","SimSun",serif`;
  ctx.font = font;
  for (let i = 5; i >= 1; i -= 1) {
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#000';
    ctx.fillText(text, cx + i * 2, cy + i * 2);
  }
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#1b1f2e';
  ctx.fillText(text, cx + 3, cy + 4);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(8,12,24,0.92)';
  ctx.lineWidth = 4;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = '#f0f4ff';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(360, 640, 180, 360, 640, 760);
  g.addColorStop(0, 'rgba(8,12,24,0)');
  g.addColorStop(1, 'rgba(8,12,24,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 720, 1280);
}

module.exports = {
  drawButton,
  drawPanel,
  drawLogo,
  drawInkTitle,
  drawVignette,
};