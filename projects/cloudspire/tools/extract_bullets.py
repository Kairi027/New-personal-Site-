from PIL import Image
import os

SRC = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\reference\bullets.jpg"
OUT_DIR = r"C:\Users\32952\Documents\ChatGPT\云阙飞戈\assets\images"

LEFT_BOXES = {
    "player_bullet": (129, 112, 144, 193),
    "enemy_bullet_small": (274, 242, 295, 266),
    "enemy_bullet_medium": (450, 104, 469, 123),
    "enemy_bullet_large": (647, 87, 681, 126),
}

BOSS_BOXES = {
    "boss_bullet_1": (827, 67, 971, 300),
    "boss_bullet_2": (973, 67, 1115, 300),
    "boss_bullet_3": (1117, 67, 1258, 300),
    "boss_bullet_4": (827, 450, 971, 625),
    "boss_bullet_5": (973, 450, 1115, 625),
    "boss_bullet_6": (1117, 450, 1258, 625),
}


def make_transparent(img):
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if (r + g + b) / 3 < 48:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def trim(img, pad=4):
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    source = Image.open(SRC)
    for name, box in {**LEFT_BOXES, **BOSS_BOXES}.items():
        crop = source.crop(box)
        sprite = trim(make_transparent(crop))
        path = os.path.join(OUT_DIR, name + ".png")
        sprite.save(path)
        print(path, sprite.size)
    laser = Image.open(os.path.join(OUT_DIR, "boss_bullet_3.png"))
    laser.save(os.path.join(OUT_DIR, "boss_laser.png"))
    print(os.path.join(OUT_DIR, "boss_laser.png"), laser.size)


if __name__ == "__main__":
    main()