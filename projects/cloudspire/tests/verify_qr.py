"""独立校验 tests 用的二维码生成结果。

按 QR 规范重新采样 PNG、读取格式/版本信息、还原数据并做 Reed-Solomon 校验。
用法: python tests/verify_qr.py <png> [期望内容]
"""
import sys

from PIL import Image

# (版本, 纠错级别) -> (组1块数, 组1每块数据码字数, 组2块数, 组2每块数据码字数, 每块纠错码字数)
EC_BLOCKS = {
    (1, "L"): (1, 19, 0, 19, 7), (1, "M"): (1, 16, 0, 16, 10), (1, "Q"): (1, 13, 0, 13, 13), (1, "H"): (1, 9, 0, 9, 17),
    (2, "L"): (1, 34, 0, 34, 10), (2, "M"): (1, 28, 0, 28, 16), (2, "Q"): (1, 22, 0, 22, 22), (2, "H"): (1, 16, 0, 16, 28),
    (3, "L"): (1, 55, 0, 55, 15), (3, "M"): (1, 44, 0, 44, 26), (3, "Q"): (2, 17, 0, 17, 18), (3, "H"): (2, 13, 0, 13, 22),
    (4, "L"): (1, 80, 0, 80, 20), (4, "M"): (2, 32, 0, 32, 18), (4, "Q"): (2, 24, 0, 24, 26), (4, "H"): (4, 9, 0, 9, 16),
    (5, "L"): (1, 108, 0, 108, 26), (5, "M"): (2, 43, 0, 43, 24), (5, "Q"): (2, 15, 2, 16, 18), (5, "H"): (2, 11, 2, 12, 22),
    (6, "L"): (2, 68, 0, 68, 18), (6, "M"): (4, 27, 0, 27, 16), (6, "Q"): (4, 19, 0, 19, 24), (6, "H"): (4, 15, 0, 15, 28),
    (7, "L"): (2, 78, 0, 78, 20), (7, "M"): (4, 31, 0, 31, 18), (7, "Q"): (2, 14, 4, 15, 18), (7, "H"): (4, 13, 1, 14, 26),
    (8, "L"): (2, 97, 0, 97, 24), (8, "M"): (2, 38, 2, 39, 22), (8, "Q"): (4, 18, 2, 19, 22), (8, "H"): (4, 14, 2, 15, 26),
    (9, "L"): (2, 116, 0, 116, 30), (9, "M"): (3, 36, 2, 37, 22), (9, "Q"): (4, 16, 4, 17, 20), (9, "H"): (4, 12, 4, 13, 24),
    (10, "L"): (2, 68, 2, 69, 18), (10, "M"): (4, 43, 1, 44, 26), (10, "Q"): (6, 19, 2, 20, 24), (10, "H"): (6, 15, 2, 16, 28),
}

ALIGN_POS = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
]

ECL_BY_BITS = {1: "L", 0: "M", 3: "Q", 2: "H"}
FORMAT_MASK = 0b101010000010010
FORMAT_GEN = 0b10100110111
VERSION_GEN = 0b1111100100101


def mask_cond(mask, r, c):
    if mask == 0:
        return (r + c) % 2 == 0
    if mask == 1:
        return r % 2 == 0
    if mask == 2:
        return c % 3 == 0
    if mask == 3:
        return (r + c) % 3 == 0
    if mask == 4:
        return (r // 2 + c // 3) % 2 == 0
    if mask == 5:
        return ((r * c) % 2 + (r * c) % 3) == 0
    if mask == 6:
        return ((r * c) % 2 + (r * c) % 3) % 2 == 0
    if mask == 7:
        return ((r + c) % 2 + (r * c) % 3) % 2 == 0
    raise ValueError(mask)


def bch(data, data_bits, gen):
    """data 占 data_bits 位，用 gen 做长除法，返回纠错位（不含数据位）。"""
    gen_bits = gen.bit_length()
    rem = data << (gen_bits - 1)
    for i in range(data_bits + gen_bits - 2, gen_bits - 2, -1):
        if (rem >> i) & 1:
            rem ^= gen << (i - (gen_bits - 1))
    return rem


def reserved_map(n, version):
    res = [[False] * n for _ in range(n)]

    def mark(r, c):
        if 0 <= r < n and 0 <= c < n:
            res[r][c] = True

    for fr, fc in ((0, 0), (0, n - 7), (n - 7, 0)):
        for r in range(fr - 1, fr + 8):
            for c in range(fc - 1, fc + 8):
                mark(r, c)
    for i in range(8, n - 8):
        mark(i, 6)
        mark(6, i)
    pos = ALIGN_POS[version - 1]
    length = len(pos)
    for i in range(length):
        for j in range(length):
            if (i == 0 and j == 0) or (i == 0 and j == length - 1) or (i == length - 1 and j == 0):
                continue
            for r in range(pos[i] - 2, pos[i] + 3):
                for c in range(pos[j] - 2, pos[j] + 3):
                    mark(r, c)
    for i in range(15):
        vr = i if i < 6 else (i + 1 if i < 8 else n - 15 + i)
        mark(vr, 8)
        hc = n - 1 - i if i < 8 else (7 if i < 9 else 15 - 1 - i)
        mark(8, hc)
    mark(n - 8, 8)
    if version >= 7:
        for i in range(18):
            r = i // 3
            c = i % 3 + n - 11
            mark(r, c)
            mark(c, r)
    return res


def make_gf():
    exp = [0] * 512
    log = [0] * 256
    x = 1
    for i in range(255):
        exp[i] = x
        log[x] = i
        x <<= 1
        if x & 0x100:
            x ^= 0x11D
    for i in range(255, 512):
        exp[i] = exp[i - 255]

    def mul(a, b):
        if a == 0 or b == 0:
            return 0
        return exp[log[a] + log[b]]

    return exp, mul


def check_syndromes(block, ec, exp, mul):
    for j in range(ec):
        s = 0
        for coef in block:
            s = mul(s, exp[j]) ^ coef
        if s != 0:
            return False
    return True


def main():
    path = sys.argv[1]
    expected = sys.argv[2] if len(sys.argv) > 2 else None

    img = Image.open(path).convert("L")
    w, h = img.size
    px = img.load()

    # 定位: 第一个深色像素即左上角定位图形的外边框顶点
    x0 = y0 = None
    for y in range(h):
        for x in range(w):
            if px[x, y] < 128:
                x0, y0 = x, y
                break
        if x0 is not None:
            break
    assert x0 is not None, "未找到深色像素"
    x = x0
    while x < w and px[x, y0] < 128:
        x += 1
    run = x - x0
    scale = round(run / 7)
    quiet = y0 // scale
    n = (w - 2 * quiet * scale) // scale
    assert (n + 2 * quiet) * scale == w == h, (scale, quiet, n, w)

    def module(r, c):
        return px[quiet * scale + c * scale + scale // 2, quiet * scale + r * scale + scale // 2] < 128

    m = [[module(r, c) for c in range(n)] for r in range(n)]
    version = (n - 17) // 4
    assert 17 + 4 * version == n, n

    # 格式信息
    fmt = 0
    for i in range(15):
        vr = i if i < 6 else (i + 1 if i < 8 else n - 15 + i)
        hc = n - 1 - i if i < 8 else (7 if i < 9 else 15 - 1 - i)
        a, b = m[vr][8], m[8][hc]
        bit = 1 if (a and b) else (0 if (not a and not b) else (1 if a else 0))
        fmt |= bit << i
    unmasked = fmt ^ FORMAT_MASK
    data5 = unmasked >> 10
    mask = data5 & 0b111
    ecl = ECL_BY_BITS[data5 >> 3]
    expected_fmt = ((data5 << 10) | bch(data5, 5, FORMAT_GEN)) ^ FORMAT_MASK
    assert fmt == expected_fmt, (bin(fmt), bin(expected_fmt))

    # 版本信息
    if version >= 7:
        v1 = v2 = 0
        for i in range(18):
            r = i // 3
            c = i % 3 + n - 11
            v1 |= (1 if m[r][c] else 0) << i
            v2 |= (1 if m[c][r] else 0) << i
        assert v1 == v2, (v1, v2)
        expected_v = (version << 12) | bch(version, 6, VERSION_GEN)
        assert v1 == expected_v, (bin(v1), bin(expected_v))

    # 读取数据位（跳过功能图形，应用掩码还原）
    res = reserved_map(n, version)
    bits = []
    row, col, direction = n - 1, n - 1, -1
    while col > 0:
        if col == 6:
            col -= 1
        while 0 <= row < n:
            for i in range(2):
                c = col - i
                if not res[row][c]:
                    bits.append(1 if m[row][c] != mask_cond(mask, row, c) else 0)
            row += direction
        direction = -direction
        row += direction
        col -= 2

    b1, d1, b2, d2, ec = EC_BLOCKS[(version, ecl)]
    total = b1 + b2
    data_cap = b1 * d1 + b2 * d2
    total_codewords = data_cap + total * ec
    codewords = []
    for i in range(0, total_codewords * 8, 8):
        v = 0
        for j in range(8):
            v = (v << 1) | bits[i + j]
        codewords.append(v)
    assert len(codewords) == total_codewords, len(codewords)

    # 反交织
    blocks = [[] for _ in range(total)]
    for k in range(total):
        blocks[k] = [0] * (d1 if k < b1 else d2)
    idx = 0
    for i in range(max(d1, d2)):
        for k in range(total):
            if i < len(blocks[k]):
                blocks[k][i] = codewords[idx]
                idx += 1
    ecc = [[] for _ in range(total)]
    for i in range(ec):
        for k in range(total):
            ecc[k].append(codewords[idx])
            idx += 1

    exp, mul = make_gf()
    for k in range(total):
        assert check_syndromes(blocks[k] + ecc[k], ec, exp, mul), f"block {k} RS 校验失败"

    # 解析内容（字节模式）
    mode = 0
    for i in range(4):
        mode = (mode << 1) | bits[i]
    assert mode == 0b0100, bin(mode)
    count_bits = 8 if version <= 9 else 16
    count = 0
    for i in range(4, 4 + count_bits):
        count = (count << 1) | bits[i]
    text_bytes = bytearray()
    for i in range(count):
        v = 0
        for j in range(8):
            v = (v << 1) | bits[4 + count_bits + i * 8 + j]
        text_bytes.append(v)
    text = text_bytes.decode("utf-8")

    print(f"OK  version={version} ecl={ecl} mask={mask} scale={scale} text={text!r}")
    if expected is not None and text != expected:
        print(f"FAIL 期望 {expected!r}，实际 {text!r}")
        sys.exit(1)
    print("RS 校验全部通过")


if __name__ == "__main__":
    main()
