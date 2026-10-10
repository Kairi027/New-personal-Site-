from collections import deque
import os

from PIL import Image

SRC = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images\boss1.png"
OUT = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images\cut\boss.png"
BOX = (31, 164, 2017, 1966)
THRESHOLD = 55 ** 2
MIN_AREA = 1500


def color_distance(c1, c2):
    return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2


def corner_bg_color(image):
    pixels = image.load()
    w, h = image.size
    samples = []
    for x in range(0, 80, 4):
        for y in range(0, 80, 4):
            samples.append(pixels[x, y])
            samples.append(pixels[w - 1 - x, y])
            samples.append(pixels[x, h - 1 - y])
            samples.append(pixels[w - 1 - x, h - 1 - y])
    n = len(samples)
    return tuple(round(sum(c[i] for c in samples) / n) for i in range(3))


def main():
    original = Image.open(SRC).convert("RGB")
    bg = corner_bg_color(original)
    image = original.crop(BOX)
    w, h = image.size
    pixels = image.load()

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
                    idx = ny * w + nx
                    if not visited[idx] and color_distance(pixels[nx, ny], bg) < THRESHOLD:
                        visited[idx] = 1
                        queue.append((nx, ny))

    foreground = bytearray(w * h)
    for i in range(w * h):
        if not visited[i]:
            foreground[i] = 1

    seen = bytearray(w * h)
    keep = bytearray(w * h)
    for sy in range(h):
        for sx in range(w):
            idx = sy * w + sx
            if not foreground[idx] or seen[idx]:
                continue
            area = 0
            min_x = max_x = sx
            min_y = max_y = sy
            queue = deque([(sx, sy)])
            seen[idx] = 1
            comp = []
            while queue:
                x, y = queue.popleft()
                area += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            nidx = ny * w + nx
                            if foreground[nidx] and not seen[nidx]:
                                seen[nidx] = 1
                                queue.append((nx, ny))
            if area >= MIN_AREA:
                for x, y in comp:
                    keep[y * w + x] = 1

    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_px = rgba.load()
    for y in range(h):
        for x in range(w):
            if keep[y * w + x]:
                out_px[x, y] = pixels[x, y] + (255,)

    bbox = rgba.getbbox()
    pad = 8
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w - 1, right + pad)
    bottom = min(h - 1, bottom + pad)
    result = rgba.crop((left, top, right + 1, bottom + 1))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    result.save(OUT)
    print(OUT, result.size)


if __name__ == "__main__":
    main()
