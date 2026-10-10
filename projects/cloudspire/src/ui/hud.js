const { clamp } = require('../utils/math.js');

function bar(ctx, x, y, w, h, ratio, color, back) {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(ratio, 0, 1), h);
  ctx.strokeStyle = 'rgba(20,28,45,0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
}

function drawHud(ctx, player, run) {
  const px = 24;
  const barW = 220;
  ctx.fillStyle = '#ff7d8f';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HP', px, 20);
  bar(ctx, px, 24, barW, 14, player.hp / player.maxHp, '#e5486b', 'rgba(10,16,30,0.65)');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.max(0, Math.round(player.hp))}/${player.maxHp}`, px + barW, 35);

  if (player.maxShield > 0) {
    ctx.fillStyle = '#7cc4ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHIELD', px, 52);
    bar(ctx, px, 56, barW, 12, player.shield / player.maxShield, '#4da6ff', 'rgba(10,16,30,0.65)');
    ctx.fillStyle = '#dff0ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(player.shield)}/${player.maxShield}`, px + barW, 66);
  }

  const expRatio = Math.min(1, player.exp / player.expToNext());
  ctx.fillStyle = '#8fe8a4';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`EXP LV${player.level}`, px, 80);
  bar(ctx, px, 84, barW, 12, expRatio, '#4fd97a', 'rgba(10,16,30,0.65)');
  ctx.fillStyle = '#e6fff0';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(player.exp)), px + barW, 94);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`残机：${player.invincible ? '∞' : player.lives}`, px, 112);

  if (player.lifeFlash > 0) {
    const alpha = Math.min(1, player.lifeFlash / 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd36b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('奖命 +1', px, 102);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE ${String(player.score).padStart(7, '0')}`, 360, 30);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f6dff2';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Level ${run.stage}`, 690, 1230);
  ctx.textAlign = 'left';

  ctx.save();
  ctx.fillStyle = '#d9365f';
  ctx.shadowColor = '#ff8fb0';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(76, 1202, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.invincible ? '∞' : String(player.bombs), 76, 1210);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '12px sans-serif';
  ctx.fillText('BOMB', 76, 1240);
  ctx.textAlign = 'left';

  ctx.save();
  ctx.translate(680, 40);
  const ps = 14;
  const pr = 6;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-ps + pr, -ps);
  ctx.arcTo(ps, -ps, ps, ps, pr);
  ctx.arcTo(ps, ps, -ps, ps, pr);
  ctx.arcTo(-ps, ps, -ps, -ps, pr);
  ctx.arcTo(-ps, -ps, ps, -ps, pr);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-7, -8, 4, 16);
  ctx.fillRect(3, -8, 4, 16);
  ctx.restore();
}

function drawCoopHud(ctx, run, p1, p2, name1, name2) {
  const px = 24;
  const barW = 180;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE ${String(p1.score).padStart(7, '0')}`, 360, 26);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`EXP LV${p1.level}`, 360, 44);
  ctx.textAlign = 'left';
  const rows = [
    { name: name1 || 'P1', p: p1, color: '#ff7d8f' },
    { name: name2 || 'P2', p: p2, color: '#ffb347' },
  ];
  rows.forEach((row, index) => {
    const y = 58 + index * 56;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(row.name || '').slice(0, 8), px, y + 4);
    ctx.fillStyle = row.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`残机 ${row.p.invincible ? '∞' : Math.max(0, row.p.lives)}`, px + 150, y + 4);
    bar(ctx, px, y + 12, barW, 10, row.p.hp / row.p.maxHp, row.color, 'rgba(10,16,30,0.65)');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, Math.round(row.p.hp))}/${row.p.maxHp}`, px + barW, y + 21);
    ctx.textAlign = 'left';
    if (row.p.lifeFlash > 0) {
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('奖命 +1', px + 220, y + 4);
    }
  });
  ctx.fillStyle = '#f6dff2';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Level ${run.stage}`, 690, 1230);
  ctx.textAlign = 'left';
  ctx.save();
  ctx.fillStyle = '#d9365f';
  ctx.shadowColor = '#ff8fb0';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(76, 1202, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p1.invincible ? '∞' : String(p1.bombs), 76, 1210);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '12px sans-serif';
  ctx.fillText('BOMB', 76, 1240);
  ctx.textAlign = 'left';
}


function drawBossHud(ctx, boss) {
  const w = 420;
  const x = (720 - w) / 2;
  const y = 96;
  bar(ctx, x, y, w, 14, boss.hp / boss.maxHp, '#c64bb0', 'rgba(10,16,30,0.7)');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${boss.config.name}  ${boss.config.title}`, 360, y - 8);
  if (boss.custom === 'finalLord') {
    ctx.fillStyle = '#e6c9ff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`相位 ${boss.phase} / 4`, 360, y + 32);
    boss.turrets.forEach((turret, i) => {
      const podX = i === 0 ? 60 : 400;
      const podW = 260;
      bar(
        ctx,
        podX,
        y + 44,
        podW,
        10,
        turret.hp / turret.maxHp,
        turret.broken ? '#555a66' : i === 0 ? '#ffb347' : '#d86bff',
        'rgba(10,16,30,0.7)'
      );
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(turret.broken ? `${turret.name} 已击毁` : turret.name, podX + podW / 2, y + 56);
    });
  }
  if (boss.custom === 'alienMothership') {
    ctx.fillStyle = '#ffd9e6';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`相位 ${boss.phase} / 4`, 360, y + 32);
    boss.turrets.forEach((turret, i) => {
      const podX = i === 0 ? 70 : 390;
      const podW = 260;
      bar(
        ctx,
        podX,
        y + 44,
        podW,
        10,
        turret.hp / turret.maxHp,
        turret.broken ? '#555a66' : i === 0 ? '#ffb347' : '#d86bff',
        'rgba(10,16,30,0.7)'
      );
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(turret.broken ? `${turret.name} 已击毁` : turret.name, podX + podW / 2, y + 56);
    });
  }
  if (boss.bannerTimer > 0) {
    const alpha = Math.min(1, boss.bannerTimer * 1.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffe6f3';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowColor = '#ff6fa5';
    ctx.shadowBlur = 14;
    ctx.fillText(boss.spellBanner, 360, y - 30);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  ctx.textAlign = 'left';
}

function drawTwinBossHud(ctx, boss) {
  const w = 300;
  const xLeft = 40;
  const xRight = 380;
  const y = 96;
  boss.parts.forEach((part, i) => {
    const x = i === 0 ? xLeft : xRight;
    const color = i === 0 ? '#ffb347' : '#d86bff';
    bar(ctx, x, y, w, 14, part.hp / part.maxHp, color, 'rgba(10,16,30,0.7)');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${part.name}  ${part.title}`, x + w / 2, y - 8);
    ctx.textAlign = 'left';
  });
  if (boss.bannerTimer > 0) {
    const alpha = Math.min(1, boss.bannerTimer * 1.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff3cf';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.fillText(boss.spellBanner, 360, y - 32);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
}

module.exports = {
  drawHud,
  drawCoopHud,
  drawBossHud,
  drawTwinBossHud,
  bar,
};
