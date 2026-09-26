#!/usr/bin/env python3
"""Пиксель-арт спрайты для «супер-сюрприза» (матрёшка подарков + главный приз).

Стиль совпадает с gen_sprites2.py: рисуем по «глифам» на сетке клеток PX,
вокруг каждого объекта — тёмный outline. seed фиксирован для воспроизводимости.

Результат (96x96 логических пикселя -> PNG):
  assets/gift-bear.png     — медвежонок   (слой 🧸)
  assets/gift-candy.png    — конфетка     (слой 🍬)
  assets/gift-sparkle.png  — светящаяся коробочка (слой ✨)
  assets/gift-trophy.png   — кубок чемпиона (гранд-финал)
"""
import random
from PIL import Image, ImageDraw

random.seed(21)
PX = 4            # размер логического пикселя
GRID = 24         # спрайт 24x24 клетки => 96x96 px
OUT = "/workspace/assets"

# тёплая палитра
BROWN = (176, 108, 60); BROWN_D = (122, 70, 36); BROWN_L = (222, 156, 96)
CREAM = (255, 228, 180)
RED = (232, 74, 94); RED_D = (168, 42, 62); RED_L = (255, 138, 154)
PINK = (255, 170, 200)
GOLD = (255, 206, 84); GOLD_D = (198, 140, 30); GOLD_L = (255, 240, 160)
MINT = (110, 232, 176); MINT_D = (52, 160, 116)
VIOLET = (168, 111, 232); VIOLET_D = (104, 60, 160)
WHITE = (255, 250, 244)
OUTLINE = (28, 14, 40)


def new_img():
    return Image.new("RGBA", (GRID * PX, GRID * PX), (0, 0, 0, 0))


def px(img, x, y, color):
    if 0 <= x < GRID and 0 <= y < GRID:
        d = ImageDraw.Draw(img)
        d.rectangle([x * PX, y * PX, (x + 1) * PX - 1, (y + 1) * PX - 1], fill=color)


def rect(img, x0, y0, x1, y1, color):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(img, x, y, color)


def disc(img, cx, cy, r, color):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px(img, x, y, color)


def add_outline(img):
    """Тёмный outline вокруг каждого непрозрачного объекта отдельно."""
    src = img.load()
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = out.load()
    W, H = img.size
    for y in range(H):
        for x in range(W):
            if src[x, y][3] > 0:
                continue
            near = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and src[nx, ny][3] > 0:
                    near = True
                    break
            if near:
                od[x, y] = OUTLINE + (255,)
    out.paste(img, (0, 0), img)
    return out


# ---------- МЕДВЕЖОНОК ----------
def draw_bear():
    im = new_img()
    # уши
    disc(im, 8, 6, 3, BROWN); disc(im, 16, 6, 3, BROWN)
    disc(im, 8, 6, 1, PINK);  disc(im, 16, 6, 1, PINK)
    # голова
    disc(im, 12, 10, 6, BROWN)
    # мордочка
    disc(im, 12, 12, 3, CREAM)
    px(im, 12, 11, OUTLINE); px(im, 11, 12, RED_D); px(im, 13, 12, RED_D)
    # глаза
    px(im, 10, 9, OUTLINE); px(im, 14, 9, OUTLINE)
    px(im, 10, 8, WHITE);   px(im, 14, 8, WHITE)
    # туловище + лапки
    disc(im, 12, 18, 5, BROWN)
    disc(im, 12, 18, 3, CREAM)
    disc(im, 6, 17, 2, BROWN); disc(im, 18, 17, 2, BROWN)
    disc(im, 9, 22, 2, BROWN); disc(im, 15, 22, 2, BROWN)
    # бантик на шее
    rect(im, 10, 14, 14, 15, RED)
    px(im, 12, 14, RED_L); px(im, 12, 15, RED_D)
    return add_outline(im)


# ---------- КОНФЕТКА ----------
def draw_candy():
    im = new_img()
    disc(im, 12, 12, 6, MINT)
    disc(im, 12, 12, 6, MINT)  # база
    # диагональные полоски
    for i in range(-6, 7, 3):
        for t in range(13):
            x, y = 12 + i + t - 6, 12 + t - 6
            if (x - 12) ** 2 + (y - 12) ** 2 <= 30:
                px(im, x, y, WHITE)
    disc(im, 12, 12, 6, (0, 0, 0, 0)) if False else None
    # хвостики обёртки
    for s in (-1, 1):
        for (dx, dy) in [(7, 0), (6, -1), (6, 1), (5, -2), (5, 2), (4, 0)]:
            px(im, 12 + s * dx, 12 + dy, RED)
        px(im, 12 + s * 7, 12, RED_L)
    # блик
    px(im, 9, 9, WHITE); px(im, 10, 8, WHITE)
    return add_outline(im)


# ---------- СВЕТЯЩАЯСЯ КОРОБОЧКА ----------
def draw_sparkle_box():
    im = new_img()
    # корпус
    rect(im, 6, 12, 18, 20, VIOLET)
    rect(im, 6, 12, 18, 13, VIOLET_D)
    rect(im, 5, 9, 19, 12, RED)          # крышка
    rect(im, 5, 9, 19, 9, RED_L)
    # лента
    rect(im, 11, 9, 13, 20, GOLD)
    rect(im, 5, 10, 19, 10, GOLD_L) if False else None
    # бантик
    disc(im, 9, 7, 2, GOLD); disc(im, 15, 7, 2, GOLD)
    px(im, 12, 8, GOLD_D); px(im, 12, 7, GOLD_L)
    # искры вокруг щели крышки
    for (sx, sy) in [(3, 8), (20, 7), (2, 14), (21, 15), (12, 4), (7, 4), (17, 4)]:
        px(im, sx, sy, GOLD_L)
        px(im, sx - 1, sy, (255, 240, 160, 140)); px(im, sx + 1, sy, (255, 240, 160, 140))
        px(im, sx, sy - 1, (255, 240, 160, 140)); px(im, sx, sy + 1, (255, 240, 160, 140))
    # свет из-под крышки
    rect(im, 6, 12, 18, 12, GOLD)
    return add_outline(im)


# ---------- КУБОК ЧЕМПИОНА ----------
def draw_trophy():
    im = new_img()
    # чаша
    for y in range(5, 13):
        w = 8 - (y - 5) // 2
        rect(im, 12 - w, y, 12 + w, y, GOLD)
    rect(im, 4, 5, 20, 6, GOLD_L)
    # ручки
    for s in (-1, 1):
        for (dx, dy) in [(9, 2), (9, 3), (9, 4), (8, 3)]:
            px(im, 12 + s * dx, 7 + dy, GOLD_D)
    # ствол и постамент
    rect(im, 11, 13, 13, 15, GOLD_D)
    rect(im, 8, 16, 16, 18, VIOLET)
    rect(im, 7, 19, 17, 20, VIOLET_D)
    # звезда на чаше
    px(im, 12, 9, WHITE); px(im, 11, 10, WHITE); px(im, 13, 10, WHITE)
    px(im, 10, 11, WHITE); px(im, 14, 11, WHITE)
    # блеск
    px(im, 8, 7, GOLD_L); px(im, 7, 8, GOLD_L)
    return add_outline(im)


if __name__ == "__main__":
    jobs = [
        ("gift-bear.png", draw_bear()),
        ("gift-candy.png", draw_candy()),
        ("gift-sparkle.png", draw_sparkle_box()),
        ("gift-trophy.png", draw_trophy()),
    ]
    for name, img in jobs:
        img.save(f"{OUT}/{name}")
        print(name, img.size)
