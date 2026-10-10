# -*- coding: utf-8 -*-
"""把用户手册 Markdown 渲染为 PDF（文档鉴别材料），每页>=30行文本。"""
import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

ROOT = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈"
OUT_DIR = os.path.join(ROOT, "软著申请材料")
OUT_PDF = os.path.join(OUT_DIR, "文档鉴别材料-用户操作手册-云阙飞戈LancesofCloudspire-V1.0.pdf")
MD = os.path.join(OUT_DIR, "_build", "doc_manual.md")

pdfmetrics.registerFont(TTFont("SimSun", r"C:\Windows\Fonts\simsun.ttc", subfontIndex=0))
pdfmetrics.registerFont(TTFont("SimHei", r"C:\Windows\Fonts\simhei.ttf"))

BODY = ParagraphStyle("body", fontName="SimSun", fontSize=10.5, leading=15,
                      alignment=TA_LEFT, spaceAfter=4, wordWrap="CJK")
META = ParagraphStyle("meta", fontName="SimHei", fontSize=10.5, leading=15, spaceAfter=4, wordWrap="CJK")
BULLET = ParagraphStyle("bullet", parent=BODY, leftIndent=16, bulletIndent=2, spaceAfter=2)
H1 = ParagraphStyle("h1", fontName="SimHei", fontSize=14.5, leading=19, spaceBefore=12, spaceAfter=6, keepWithNext=1, wordWrap="CJK")
H2 = ParagraphStyle("h2", fontName="SimHei", fontSize=12.5, leading=17, spaceBefore=9, spaceAfter=4, keepWithNext=1, wordWrap="CJK")
H3 = ParagraphStyle("h3", fontName="SimHei", fontSize=11.5, leading=16, spaceBefore=7, spaceAfter=3, keepWithNext=1, wordWrap="CJK")

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

META_PREFIXES = ("软件名称", "软件版本", "文档类型", "编写日期", "运行平台", "著作权人")

def parse_blocks(lines):
    blocks, cur = [], []
    def flush():
        nonlocal cur
        if cur:
            blocks.append(cur); cur = []
    for ln in lines:
        s = ln.rstrip()
        if s.strip() == "":
            flush()
        elif s.startswith("#"):
            flush()
            blocks.append([s])
        else:
            cur.append(s)
    flush()
    return blocks

def build_flow(blocks):
    flow = []
    for blk in blocks:
        first = blk[0]
        if first.startswith("# "):
            flow.append(Paragraph(esc(first[2:]), H1))
        elif first.startswith("## "):
            flow.append(Paragraph(esc(first[3:]), H2))
        elif first.startswith("### "):
            flow.append(Paragraph(esc(first[4:]), H3))
        elif all(b.startswith("- ") for b in blk):
            for b in blk:
                flow.append(Paragraph(esc(b[2:]), BULLET, bulletText="-"))
        elif all(b.startswith(META_PREFIXES) and re.match(r"^[^：]+：", b) for b in blk):
            for b in blk:
                flow.append(Paragraph(esc(b), META))
        else:
            # 普通段落：块内多行合并为一段
            text = "".join(esc(b) for b in blk)
            flow.append(Paragraph(text, BODY))
    return flow

def main():
    with open(MD, "r", encoding="utf-8-sig") as f:
        lines = f.read().splitlines()
    blocks = parse_blocks(lines)
    flow = build_flow(blocks)
    doc = SimpleDocTemplate(OUT_PDF, pagesize=A4,
                            leftMargin=2.2*cm, rightMargin=2.2*cm,
                            topMargin=2.2*cm, bottomMargin=2.2*cm,
                            title="云阙飞戈（Lances of Cloudspire）小游戏软件 V1.0 用户操作手册",
                            author="")
    doc.build(flow)
    print("saved:", OUT_PDF)

if __name__ == "__main__":
    main()

