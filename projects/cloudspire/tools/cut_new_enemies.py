from collections import deque
import os

from PIL import Image, ImageFilter

SRC_DIR = r"C:\Users\32952\Downloads"
OUT_DIR = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images"
THRESHOLD = 28 ** 2
PAD = 12

SPRITES = {
    "1788079942281.png": "enemy_tuxi",
    "1788079945878.png": "enemy_hudun",
    "1788079950488.png": "enemy_juji",
    "1788079953398.png": "enemy_fengwei_b",
    "1788079958756.png": "enemy_fengwei_a",
}


def color_distance(c1, c2):
    return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2


def corner_bg_color(image):
    pixels = image.load()
    w, h = image.size
    samples = []
    for x in range(0, 32, 2):
        for y in range(0, 32, 2):
            samples.append(pixels[x, y])
            samples.append(pixels[w - 1 - x, y])
            samples.append(pixels[x, h - 1 - y])
            samples.append(pixels[w - 1 - x, h - 1 - y])
    n = len(samples)
    return tuple(round(sum(c[i] for c in samples) / n) for i in range(3))


def cut_sprite(src_path, out_path, web_path):
    image = Image.open(src_path).convert("RGB")
    w, h = image.size
    pixels = image.load()
    bg = corner_bg_color(image)

    visited = bytearray(w * h)
    queue = deque()

    def mark(x, y):
        idx = y * w + x
        if not visited[idx] and color_distance(pixels[x, y], bg) < THRESHOLD:
            visited[idx] = 1
            queue.append((x, y))

    for x in range(w):
        mark(x, 0)
        mark(x, h - 1)
    for y in range(h):
        mark(0, y)
        mark(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    nidx = ny * w + nx
                    if not visited[nidx] and color_distance(pixels[nx, ny], bg) < THRESHOLD:
                        visited[nidx] = 1
                        queue.append((nx, ny))

    alpha = Image.new("L", (w, h), 255)
    alpha_px = alpha.load()
    for y in range(h):
        for x in range(w):
            if visited[y * w + x]:
                alpha_px[x, y] = 0

    alpha = alpha.filter(ImageFilter.GaussianBlur(1.4))
    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rgba.paste(image, (0, 0), alpha)

    bbox = rgba.getbbox()
    left, top, right, bottom = bbox
    left = max(0, left - PAD)
    top = max(0, top - PAD)
    right = min(w - 1, right + PAD)
    bottom = min(h - 1, bottom + PAD)
    cropped = rgba.crop((left, top, right + 1, bottom + 1))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    os.makedirs(os.path.dirname(web_path), exist_ok=True)
    cropped.save(out_path)

    cw, ch = cropped.size
    scale = min(1.0, 512 / max(cw, ch))
    if scale < 1.0:
        web = cropped.resize((int(cw * scale), int(ch * scale)), Image.LANCZOS)
    else:
        web = cropped.copy()
    web.save(web_path, optimize=True)
    print(out_path, cropped.size, "->", web.size)


def main():
    for src_name, base in SPRITES.items():
        src = os.path.join(SRC_DIR, src_name)
        out = os.path.join(OUT_DIR, "cut", base + ".png")
        web = os.path.join(OUT_DIR, "web", base + ".png")
        cut_sprite(src, out, web)


if __name__ == "__main__":
    main()
