import os

from PIL import Image, ImageEnhance, ImageFilter

BASE = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images"
PURPLE = (168, 96, 255)


def tint_keep_alpha(src, dst):
    img = Image.open(src).convert("RGBA")
    alpha = img.split()[3]
    rgb = Image.merge("RGB", img.split()[:3])
    gray = rgb.convert("L")
    tinted = Image.merge(
        "RGB",
        [
            gray.point(lambda v: int((v * PURPLE[0]) / 255)),
            gray.point(lambda v: int((v * PURPLE[1]) / 255)),
            gray.point(lambda v: int((v * PURPLE[2]) / 255)),
        ],
    )
    tinted = tinted.filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=2))
    tinted = ImageEnhance.Contrast(tinted).enhance(1.15)
    out = Image.merge("RGBA", (*tinted.split(), alpha))
    out.save(dst, optimize=True)


def main():
    for i in range(1, 7):
        src = os.path.join(BASE, "boss_bullet_{}.png".format(i))
        dst = os.path.join(BASE, "boss3_bullet_{}.png".format(i))
        tint_keep_alpha(src, dst)
        print(dst)


if __name__ == "__main__":
    main()
