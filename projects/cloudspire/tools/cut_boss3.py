from collections import deque
import os

from PIL import Image, ImageFilter

SRC = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images\boss3.jpg"
OUT = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images\cut\boss3.png"
WEB = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images\web\boss3.png"
THRESHOLD = 30 ** 2
PAD = 12


def color_distance(c1, c2):
    return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2


def main():
    image = Image.open(SRC).convert("RGB")
    w, h = image.size
    pixels = image.load()
    bg = (255, 255, 255)

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

    alpha = alpha.filter(ImageFilter.GaussianBlur(1.6))
    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rgba.paste(image, (0, 0), alpha)

    bbox = rgba.getbbox()
    left, top, right, bottom = bbox
    left = max(0, left - PAD)
    top = max(0, top - PAD)
    right = min(w - 1, right + PAD)
    bottom = min(h - 1, bottom + PAD)
    cropped = rgba.crop((left, top, right + 1, bottom + 1))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    os.makedirs(os.path.dirname(WEB), exist_ok=True)
    cropped.save(OUT)

    cw, ch = cropped.size
    scale = min(1.0, 512 / max(cw, ch))
    web = cropped.resize((int(cw * scale), int(ch * scale)), Image.LANCZOS)
    web.save(WEB, optimize=True)
    print("cut", cropped.size, "web", web.size)


if __name__ == "__main__":
    main()
