// 用法: node qr.js "<内容>" <输出PNG路径> [缩放倍数] [纠错级别L/M/Q/H]
const fs = require('fs');
const path = require('path');
const { generate } = require('./vendor/qrcode.js');

const [, , text, out, scaleArg, levelArg] = process.argv;
if (!text || !out) {
  console.error('用法: node qr.js "<内容>" <输出PNG路径> [缩放倍数] [纠错级别L/M/Q/H]');
  process.exit(2);
}

try {
  const scale = Math.max(1, parseInt(scaleArg, 10) || 8);
  const png = generate(text, { scale, ecLevel: levelArg || 'M' }).png();
  fs.writeFileSync(out, png);
  console.log('已生成: ' + path.resolve(out));
} catch (e) {
  console.error('[错误] ' + e.message);
  process.exit(1);
}
