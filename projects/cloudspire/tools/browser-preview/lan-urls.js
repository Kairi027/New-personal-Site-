// 输出本机局域网 IPv4 地址列表（每行一个 http://<ip>:<port>），虚拟网卡排后面
const os = require('os');

const port = process.argv[2] || '5173';
const VIRTUAL = /virtualbox|vmware|vethernet|hyper-v|docker|loopback|wsl|蓝牙|bluetooth/i;

const entries = [];
const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal && net.address !== '127.0.0.1') {
      entries.push({ name, address: net.address });
    }
  }
}

entries.sort(
  (a, b) => (VIRTUAL.test(a.name) ? 1 : 0) - (VIRTUAL.test(b.name) ? 1 : 0)
);

for (const e of entries) {
  console.log(`http://${e.address}:${port}`);
}
