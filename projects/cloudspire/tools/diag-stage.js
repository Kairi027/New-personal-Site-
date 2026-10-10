const fs = require('fs');
const s = fs.readFileSync('src/scenes/stage.js', 'utf8');
function show(label, needle) {
  const i = s.indexOf(needle);
  console.log('--- ' + label + ' ---');
  if (i < 0) { console.log('NOT FOUND'); return; }
  console.log(JSON.stringify(s.slice(Math.max(0, i - 80), i + 220)));
}
show('beam', 'for (const beam of this.bullets.beams) {');
show('trybomb', "this.boss.damage(500)");
show('dive anchor', 'if (this.boss && this.boss.custom === \'twinGuards\')');
