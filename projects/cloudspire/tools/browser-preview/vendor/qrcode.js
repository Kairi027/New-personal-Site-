// 纯 JavaScript 二维码编码器（无外部依赖），用于离线生成游戏分享二维码。
// 支持版本 1-10、纠错级别 L/M/Q/H、字节模式，输出 PNG（Buffer）。
'use strict';

// ---------- GF(256) 有限域（QR 规范本原多项式 0x11D） ----------
function makeGF(primitive) {
  const exp = new Array(512);
  const log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= primitive;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  return {
    exp,
    log,
    mul(a, b) {
      if (a === 0 || b === 0) return 0;
      return exp[log[a] + log[b]];
    },
  };
}
const GF = makeGF(0x11d);

// ---------- 纠错块表（版本 1-10）----------
// 每项: [组1块数, 组1每块数据码字数, 组2块数, 组2每块数据码字数, 每块纠错码字数]
// 每版本 4 项，顺序: L, M, Q, H
const EC_BLOCKS = [
  [[1, 19, 0, 19, 7], [1, 16, 0, 16, 10], [1, 13, 0, 13, 13], [1, 9, 0, 9, 17]],
  [[1, 34, 0, 34, 10], [1, 28, 0, 28, 16], [1, 22, 0, 22, 22], [1, 16, 0, 16, 28]],
  [[1, 55, 0, 55, 15], [1, 44, 0, 44, 26], [2, 17, 0, 17, 18], [2, 13, 0, 13, 22]],
  [[1, 80, 0, 80, 20], [2, 32, 0, 32, 18], [2, 24, 0, 24, 26], [4, 9, 0, 9, 16]],
  [[1, 108, 0, 108, 26], [2, 43, 0, 43, 24], [2, 15, 2, 16, 18], [2, 11, 2, 12, 22]],
  [[2, 68, 0, 68, 18], [4, 27, 0, 27, 16], [4, 19, 0, 19, 24], [4, 15, 0, 15, 28]],
  [[2, 78, 0, 78, 20], [4, 31, 0, 31, 18], [2, 14, 4, 15, 18], [4, 13, 1, 14, 26]],
  [[2, 97, 0, 97, 24], [2, 38, 2, 39, 22], [4, 18, 2, 19, 22], [4, 14, 2, 15, 26]],
  [[2, 116, 0, 116, 30], [3, 36, 2, 37, 22], [4, 16, 4, 17, 20], [4, 12, 4, 13, 24]],
  [[2, 68, 2, 69, 18], [4, 43, 1, 44, 26], [6, 19, 2, 20, 24], [6, 15, 2, 16, 28]],
];

// 校正图形中心坐标（版本 2-10）
const ALIGN_POS = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

const EC_LEVELS = ['L', 'M', 'Q', 'H'];
const EC_LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

// ---------- 数据编码（字节模式） ----------
function encodeDataBytes(text, version) {
  const bytes = Buffer.from(text, 'utf8');
  const countBits = version <= 9 ? 8 : 16;
  const bits = [];
  const push = (value, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4); // 字节模式指示符
  push(bytes.length, countBits); // 字符计数
  for (const b of bytes) push(b, 8);
  return bits;
}

// ---------- Reed-Solomon 纠错 ----------
function rsGeneratorPoly(ecLen) {
  let g = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= GF.mul(g[j], GF.exp[i]);
      next[j + 1] ^= g[j];
    }
    g = next;
  }
  return g;
}

function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen).reverse(); // 除法需要高次到低次的系数顺序
  const buf = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = buf[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        buf[i + j] ^= GF.mul(gen[j], coef);
      }
    }
  }
  return buf.slice(data.length);
}

// ---------- 生成数据码字并分块交织 ----------
function buildCodewords(text, version, ecLevel) {
  const [b1, d1, b2, d2, ec] = EC_BLOCKS[version - 1][EC_LEVELS.indexOf(ecLevel)];
  const dataCapacity = b1 * d1 + b2 * d2;

  const bits = encodeDataBytes(text, version);
  const totalBits = dataCapacity * 8;
  const term = Math.min(4, totalBits - bits.length);
  for (let i = 0; i < term; i++) bits.push(0);
  while (bits.length % 8 !== 0 && bits.length < totalBits) bits.push(0);

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | (bits[i + j] || 0);
    bytes.push(v);
  }
  const pads = [0xec, 0x11];
  let pi = 0;
  while (bytes.length < dataCapacity) {
    bytes.push(pads[pi]);
    pi ^= 1;
  }

  const blocks = [];
  let offset = 0;
  for (let i = 0; i < b1; i++) {
    blocks.push(bytes.slice(offset, offset + d1));
    offset += d1;
  }
  for (let i = 0; i < b2; i++) {
    blocks.push(bytes.slice(offset, offset + d2));
    offset += d2;
  }
  const ecc = blocks.map((blk) => rsEncode(blk, ec));

  const out = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) {
    for (let k = 0; k < blocks.length; k++) {
      if (i < blocks[k].length) out.push(blocks[k][i]);
    }
  }
  for (let i = 0; i < ec; i++) {
    for (let k = 0; k < ecc.length; k++) out.push(ecc[k][i]);
  }
  return out;
}

// ---------- 掩码与惩罚评分 ----------
const MASK_FORMULAS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix, mask, reserved) {
  const size = matrix.length;
  const out = matrix.map((row) => row.slice());
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && matrix[r][c] !== null) {
        out[r][c] = matrix[r][c] !== MASK_FORMULAS[mask](r, c);
      }
    }
  }
  return out;
}

function penalty(matrix) {
  const size = matrix.length;
  let score = 0;

  // 规则1：行/列中连续 5 个及以上同色模块
  const countRuns = (line) => {
    let s = 0;
    let run = 0;
    let prev = null;
    for (const v of line) {
      if (v === prev) {
        run++;
      } else {
        if (run >= 5) s += 3 + (run - 5);
        prev = v;
        run = 1;
      }
    }
    if (run >= 5) s += 3 + (run - 5);
    return s;
  };
  for (let r = 0; r < size; r++) score += countRuns(matrix[r]);
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) col.push(matrix[r][c]);
    score += countRuns(col);
  }

  // 规则2：2x2 同色块
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) score += 3;
    }
  }

  // 规则3：1011101 且任一侧有 4 个浅色模块
  const checkLine = (line) => {
    let s = 0;
    for (let i = 0; i + 6 < line.length; i++) {
      if (!(line[i] && !line[i + 1] && line[i + 2] && line[i + 3] && line[i + 4] && !line[i + 5] && line[i + 6])) continue;
      let before = true;
      if (i - 4 >= 0) {
        for (let j = i - 4; j < i; j++) {
          if (line[j]) {
            before = false;
            break;
          }
        }
      } else {
        before = false;
      }
      let after = true;
      if (i + 11 <= line.length) {
        for (let j = i + 7; j < i + 11; j++) {
          if (line[j]) {
            after = false;
            break;
          }
        }
      } else {
        after = false;
      }
      if (before || after) s += 40;
    }
    return s;
  };
  for (let r = 0; r < size; r++) score += checkLine(matrix[r]);
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) col.push(matrix[r][c]);
    score += checkLine(col);
  }

  // 规则4：暗色模块比例偏离 50%
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) dark++;
    }
  }
  const pct = (dark / (size * size)) * 100;
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

// ---------- 格式信息 / 版本信息 ----------
function formatInfo(ecLevel, mask) {
  const data = (EC_LEVEL_BITS[ecLevel] << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function versionInfo(version) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) rem ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | rem;
}

// ---------- 矩阵构建 ----------
function buildMatrix(version, ecLevel, codewords) {
  const size = 17 + 4 * version;
  const matrix = [];
  const reserved = [];
  for (let r = 0; r < size; r++) {
    matrix.push(new Array(size).fill(null));
    reserved.push(new Array(size).fill(false));
  }

  const set = (r, c, v) => {
    matrix[r][c] = v;
    reserved[r][c] = true;
  };

  // 定位图形 + 分隔区
  const drawFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inFinder = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const dark =
          inFinder &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        set(rr, cc, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 时序图形
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    set(i, 6, dark);
    set(6, i, dark);
  }

  // 校正图形
  const pos = ALIGN_POS[version - 1];
  const len = pos.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === len - 1) || (i === len - 1 && j === 0)) continue;
      const rr = pos[i];
      const cc = pos[j];
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const dark = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
          set(rr + r, cc + c, dark);
        }
      }
    }
  }

  // 预留格式信息与版本信息区域
  for (let i = 0; i < 15; i++) {
    const vr = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
    reserved[vr][8] = true;
    const hc = i < 8 ? size - 1 - i : i < 9 ? 7 : 15 - 1 - i;
    reserved[8][hc] = true;
  }
  reserved[size - 8][8] = true; // 固定暗模块
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3 + size - 11;
      reserved[r][c] = true;
      reserved[c][r] = true;
    }
  }

  // 数据放置（自右下角起，每两列向上/向下蛇形）
  const bits = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b--) bits.push((cw >> b) & 1);
  }
  let bit = 0;
  let row = size - 1;
  let col = size - 1;
  let dir = -1;
  while (col > 0) {
    if (col === 6) col--;
    while (row >= 0 && row < size) {
      for (let i = 0; i < 2; i++) {
        const c = col - i;
        if (!reserved[row][c] && matrix[row][c] === null) {
          matrix[row][c] = bits[bit++] === 1;
        }
      }
      row += dir;
    }
    dir = -dir;
    row += dir;
    col -= 2;
  }

  // 选择惩罚分最低的掩码
  let bestMask = 0;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, m, reserved);
    const s = penalty(masked);
    if (s < bestScore) {
      bestScore = s;
      bestMask = m;
    }
  }

  const final = applyMask(matrix, bestMask, reserved);

  // 格式信息
  const fbits = formatInfo(ecLevel, bestMask);
  for (let i = 0; i < 15; i++) {
    const v = ((fbits >> i) & 1) === 1;
    const vr = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
    final[vr][8] = v;
    const hc = i < 8 ? size - 1 - i : i < 9 ? 7 : 15 - 1 - i;
    final[8][hc] = v;
  }
  final[size - 8][8] = true;

  // 版本信息（版本 7 及以上）
  if (version >= 7) {
    const vbits = versionInfo(version);
    for (let i = 0; i < 18; i++) {
      const v = ((vbits >> i) & 1) === 1;
      const r = Math.floor(i / 3);
      const c = i % 3 + size - 11;
      final[r][c] = v;
      final[c][r] = v;
    }
  }

  return final;
}

// ---------- 版本选择 ----------
function chooseVersion(text, ecLevel) {
  const bytes = Buffer.byteLength(text, 'utf8');
  for (let v = 1; v <= 10; v++) {
    const [b1, d1, b2, d2] = EC_BLOCKS[v - 1][EC_LEVELS.indexOf(ecLevel)];
    const dataCapacity = b1 * d1 + b2 * d2;
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + bytes * 8 <= dataCapacity * 8) return v;
  }
  throw new Error('内容过长，无法生成二维码（最多约 270 字节）');
}

// ---------- PNG 输出 ----------
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function toPng(matrix, scale, quiet) {
  const n = matrix.length;
  const q = quiet == null ? 4 : quiet;
  const dim = (n + q * 2) * scale;
  const raw = Buffer.alloc(dim * (dim * 3 + 1)); // 每行 1 个过滤器字节 + RGB
  for (let y = 0; y < dim; y++) {
    const rowStart = y * (dim * 3 + 1);
    raw[rowStart] = 0;
    const my = Math.floor(y / scale) - q;
    for (let x = 0; x < dim; x++) {
      const mx = Math.floor(x / scale) - q;
      const dark = my >= 0 && my < n && mx >= 0 && mx < n && matrix[my][mx];
      const i = rowStart + 1 + x * 3;
      if (!dark) {
        raw[i] = 255;
        raw[i + 1] = 255;
        raw[i + 2] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dim, 0);
  ihdr.writeUInt32BE(dim, 4);
  ihdr[8] = 8; // 位深
  ihdr[9] = 2; // 颜色类型: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 对外接口 ----------
function generate(text, options = {}) {
  const ecLevel = (options.ecLevel || 'M').toUpperCase();
  if (EC_LEVELS.indexOf(ecLevel) < 0) throw new Error('不支持的纠错级别: ' + ecLevel);
  const version = options.version || chooseVersion(text, ecLevel);
  const codewords = buildCodewords(text, version, ecLevel);
  const matrix = buildMatrix(version, ecLevel, codewords);
  const scale = options.scale || 8;
  const quiet = options.quiet == null ? 4 : options.quiet;
  return { matrix, png: () => toPng(matrix, scale, quiet) };
}

module.exports = { generate };
