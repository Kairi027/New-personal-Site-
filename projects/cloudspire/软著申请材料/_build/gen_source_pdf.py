# -*- coding: utf-8 -*-
"""生成《源程序鉴别材料》PDF：源程序前30页 + 后30页，每页55行有效代码（打印时去除空行）。"""
import os, sys
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈"
OUT_DIR = os.path.join(ROOT, "软著申请材料")
OUT_PDF = os.path.join(OUT_DIR, "源程序鉴别材料-云阙飞戈LancesofCloudspire-V1.0-前30页后30页.pdf")

ORDER = [
    "game.js",
    "src/main.js",
    "src/core/platform.js", "src/core/scenes.js", "src/core/input.js",
    "src/core/storage.js", "src/core/audio.js", "src/core/artbank.js",
    "src/core/assets.js", "src/core/particles.js", "src/core/achievements.js",
    "src/core/mountain-background.js",
    "src/utils/math.js", "src/utils/rng.js", "src/utils/idcard.js", "src/utils/tint.js",
    "src/config/difficulty.js", "src/config/stages.js",
    "src/ui/menu.js", "src/ui/hud.js", "src/ui/ambient.js",
    "src/entities/player.js", "src/entities/bullets.js", "src/entities/enemy.js",
    "src/entities/boss.js", "src/entities/alien-mothership.js",
    "src/scenes/loading.js", "src/scenes/auth.js", "src/scenes/title.js",
    "src/scenes/difficulty.js", "src/scenes/story.js", "src/scenes/stage.js",
    "src/scenes/pause.js", "src/scenes/gameover.js", "src/scenes/stageclear.js",
    "src/scenes/fakeending.js", "src/scenes/trueending.js", "src/scenes/achievements.js",
    "src/scenes/ad.js", "src/scenes/mpname.js", "src/scenes/mproom.js",
    "src/scenes/debugstage.js",
    "src/net/multiplayer.js",
]

FONT = "SimSun"
pdfmetrics.registerFont(TTFont(FONT, r"C:\Windows\Fonts\simsun.ttc", subfontIndex=0))

PAGE_W, PAGE_H = 595.27, 841.89
ML, MR, MT, MB = 34.0, 34.0, 42.0, 36.0
CONTENT_W = PAGE_W - ML - MR
FONT_SIZE = 10.0
LEADING = 13.5
ROWS_PER_PAGE = 55                      # 每页有效代码行（>=50）
CODE_ROWS_PER_SECTION = ROWS_PER_PAGE * 30   # 一个 section 30 页 * 55 行

def load_lines():
    lines = []
    manifest = []
    for rel in ORDER:
        p = os.path.join(ROOT, rel.replace("/", os.sep))
        if not os.path.exists(p):
            print("skip missing:", rel, file=sys.stderr)
            continue
        with open(p, "r", encoding="utf-8-sig", errors="replace") as f:
            file_lines = [ln.rstrip() for ln in f.read().splitlines()]
        manifest.append((rel, len(file_lines)))
        lines.extend(file_lines)
    return lines, manifest

def wrap_row(line, maxw):
    if line == "":
        return [""]
    if pdfmetrics.stringWidth(line, FONT, FONT_SIZE) <= maxw:
        return [line]
    out, cur = [], ""
    for ch in line:
        if cur and pdfmetrics.stringWidth(cur + ch, FONT, FONT_SIZE) > maxw:
            out.append(cur); cur = ch
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out

def draw_page(c, rows):
    y = PAGE_H - MT
    for row in rows:
        c.setFont(FONT, FONT_SIZE)
        c.drawString(ML, y - LEADING, row)
        y -= LEADING

def main():
    src_lines, manifest = load_lines()
    # 打印时去除空行（仅排版处理，不改动代码内容），保证每页 55 行有效代码
    nonblank = [ln for ln in src_lines if ln.strip() != ""]
    flat = []
    for ln in nonblank:
        flat.extend(wrap_row(ln, CONTENT_W))
    print("source files:", len(manifest))
    print("source lines(total):", len(src_lines))
    print("non-blank lines:", len(nonblank))
    print("printable rows:", len(flat))
    secA = flat[:CODE_ROWS_PER_SECTION]
    secB = flat[-CODE_ROWS_PER_SECTION:] if len(flat) >= CODE_ROWS_PER_SECTION else flat
    pagesA = [secA[i*ROWS_PER_PAGE:(i+1)*ROWS_PER_PAGE] for i in range(30)]
    pagesB = [secB[i*ROWS_PER_PAGE:(i+1)*ROWS_PER_PAGE] for i in range(30)]
    print("pages A:", len(pagesA), "pages B:", len(pagesB),
          "| rows last page A:", len(pagesA[-1]), "rows last page B:", len(pagesB[-1]))
    assert all(len(p) == ROWS_PER_PAGE for p in pagesA + pagesB), "存在不足55行的页"

    c = canvas.Canvas(OUT_PDF, pagesize=(PAGE_W, PAGE_H))
    c.setTitle("云阙飞戈（Lances of Cloudspire）小游戏软件 V1.0 源程序鉴别材料")
    for pg in pagesA + pagesB:
        draw_page(c, pg)
        c.showPage()
    c.save()
    print("saved:", OUT_PDF)

if __name__ == "__main__":
    main()

