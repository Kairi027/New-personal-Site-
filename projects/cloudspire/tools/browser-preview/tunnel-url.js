// 从隧道日志中提取第一个匹配的公网地址
// 用法: node tunnel-url.js <日志文件> <正则1> [正则2 ...]
const fs = require('fs');

const [, , logPath, ...patterns] = process.argv;
if (!logPath || patterns.length === 0) {
  console.error('用法: node tunnel-url.js <日志文件> <正则1> [正则2 ...]');
  process.exit(2);
}

try {
  const log = fs.readFileSync(logPath, 'utf8');
  for (const p of patterns) {
    const m = log.match(new RegExp(p));
    if (m) {
      console.log(m[0]);
      process.exit(0);
    }
  }
} catch (e) {
  // 日志文件尚未生成，等待下一次轮询
}
process.exit(1);
