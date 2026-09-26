#!/usr/bin/env python3
"""Пиксельный торт 80x64 лог. пикселя (PX=5 -> 400x320), два варианта: lit / blown."""
from PIL import Image, ImageDraw

PX = 5
W, H = 80, 64

def new():
    img = Image.new("RGBA", (W*PX, H*PX), (0,0,0,0))
    return img

def mk_px(img):
    d = ImageDraw.Draw(img)
    def px(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            d.rectangle([x*PX, y*PX, (x+1)*PX-1, (y+1)*PX-1], fill=c)
    return px

OUTLINE = (74, 30, 66, 255)

def shade(c, f):
    r = tuple(max(0, min(255, int(v*f))) for v in c[:3])
    return r + (c[3] if len(c) > 3 else 255,)

def rect(px, x0, y0, x1, y1, top, body, bot, out=True):
    """Прямоугольник ярусов с светлым верхом и тёмным низом + контур."""
    for y in range(y0, y1+1):
        for x in range(x0, x1+1):
            edge_out = out and (x==x0 or x==x1 or y==y0 or y==y1)
            if edge_out: c = OUTLINE
            elif y==y0+1: c = top
            elif y>=y1-1: c = bot
            else: c = body
            px(x, y, c)

def icing(px, x0, x1, y_top, n_blobs, color, hi, dk, depth=4):
    """Ряд «подтёки» глазури: полусферы разной длины."""
    step = (x1-x0)/n_blobs
    for i in range(n_blobs):
        cx = int(x0 + step*(i+0.5))
        r = max(2, int(step/2)-1)
        long = 3 if i % 2 == 0 else 1
        for dy in range(depth+long):
            for dx in range(-r, r+1):
                inside = (dx*dx)/(r*r) + (dy*dy)/((depth+long)**1.6) <= 1.0
                if inside:
                    c = color
                    if dx <= -r+1: c = hi
                    elif dx >= r-1 or dy == depth+long-1: c = dk
                    px(cx+dx, y_top+dy, c)

def plate(px):
    # тарелка
    rect(px, 6, 60, 73, 62, (240,240,250,255), (205,205,225,255), (160,160,190,255))
    rect(px, 10, 62, 69, 63, (190,190,215,255), (150,150,180,255), (120,120,150,255), out=False)

PINK   = ((255,225,240,255),(255,158,203,255),(233,120,175,255))
CREAM  = ((255,246,214,255),(255,205,120,255),(235,170,80,255))
PURPLE = ((243,224,255,255),(178,120,240,255),(140,85,205,255))
CHERRY = ((255,150,170,255),(224,40,80,255),(150,15,50,255))
GLAZE_P= (255,120,180,255); GLAZE_PH=(255,200,225,255); GLAZE_PD=(210,70,130,255)
GLAZE_C= (255,235,180,255); GLAZE_CH=(255,250,225,255); GLAZE_CD=(225,180,110,255)
GLAZE_V= (215,160,255,255); GLAZE_VH=(240,215,255,255); GLAZE_VD=(165,105,220,255)

def cake_base(px):
    plate(px)
    # ярусы (снизу вверх)
    rect(px, 12, 46, 67, 59, *PURPLE)          # нижний
    icing(px, 12, 68, 45, 7, GLAZE_V, GLAZE_VH, GLAZE_VD, depth=3)
    rect(px, 19, 34, 60, 45, *CREAM)           # средний
    icing(px, 19, 61, 33, 6, GLAZE_C, GLAZE_CH, GLAZE_CD, depth=3)
    rect(px, 26, 23, 53, 34, *PINK)            # верхний
    icing(px, 26, 54, 22, 5, GLAZE_P, GLAZE_PH, GLAZE_PD, depth=3)
    # вишенки на нижнем ярусе
    for cx in (20, 33, 47, 60):
        t,c,b = CHERRY
        for dy in range(4):
            for dx in range(4):
                if (dx-1.5)**2+(dy-1.5)**2 <= 2.4:
                    col = t if (dx<=0 and dy<=1) else (b if (dx>=3 or dy>=3) else c)
                    px(cx+dx, 51+dy, col)
    # конфетти-посыпка на глазури
    sprinkles = [(24,47,(255,90,120,255)),(40,48,(90,200,255,255)),(55,47,(255,220,90,255)),
                 (30,36,(120,255,160,255)),(45,37,(255,120,200,255)),(35,25,(90,220,255,255)),
                 (44,25,(255,230,110,255)),(21,50,(255,150,80,255)),(63,50,(150,120,255,255))]
    for (x,y,c) in sprinkles: px(x,y,c)

CANDLE_COLORS = [((255,120,170,255),(255,220,240,255)),   # розовая полоска
                 ((120,190,255,255),(240,250,255,255)),   # голубая
                 ((170,130,255,255),(240,225,255,255))]   # фиолетовая

def candles_lit(px):
    """Три свечи; flame=True рисует пиксельное пламя."""
    positions = [31, 39, 47]     # левый край каждой свечи (ширина 3)
    tops = [15, 12, 15]          # y верха свечей (средняя выше)
    for i,(cx,ty) in enumerate(zip(positions, tops)):
        body, stripe = CANDLE_COLORS[i]
        for y in range(ty, ty+8):
            for x in range(cx, cx+3):
                c = stripe if (y//2)%2==0 else body
                if x==cx: c = shade(body, .75)
                if x==cx+2: c = shade(body, .6)
                px(x,y,c)
        px(cx+1, ty-1, (60,40,60,255))  # фитиль
        # пламя: капля 5x7 с ореолом
        fx = cx+1; fy = ty-3
        flame = [(0,-4),(0,-3),(-1,-2),(0,-2),(1,-2),(-1,-1),(0,-1),(1,-1),(0,0)]
        for (dx,dy) in flame:
            d = abs(dx)+abs(dy+1)
            c = (255,255,220,255) if dy<=-3 else ((255,200,80,255) if dy<=-1 else (255,120,40,255))
            px(fx+dx, fy+dy, c)
        # ореол света (дизеринг шахматкой)
        for (dx,dy) in [(-2,-2),(2,-2),(-1,-4),(1,-4),(0,-5),(-2,-1),(2,-1)]:
            if (fx+dx+fy+dy)%2==0:
                px(fx+dx, fy+dy, (255,190,90,110))

def candles_blown(px):
    positions = [31, 39, 47]
    tops = [15, 12, 15]
    for i,(cx,ty) in enumerate(zip(positions, tops)):
        body, stripe = CANDLE_COLORS[i]
        for y in range(ty, ty+8):
            for x in range(cx, cx+3):
                c = stripe if (y//2)%2==0 else body
                if x==cx: c = shade(body, .75)
                if x==cx+2: c = shade(body, .6)
                px(x,y,c)
        px(cx+1, ty-1, (60,40,60,255))
        # лёгкий дымок — серые пиксели со смещением вправо-вверх
        for k,(dx,dy,a) in enumerate([(1,-2,200),(2,-4,150),(2,-6,100),(3,-8,60)]):
            px(cx+1+dx, ty-1+dy, (210,210,225,a))

img1 = new(); p1 = mk_px(img1); cake_base(p1); candles_lit(p1)
img1.save("/workspace/assets/cake-lit.png")
img2 = new(); p2 = mk_px(img2); cake_base(p2); candles_blown(p2)
img2.save("/workspace/assets/cake-blown.png")
print("cake sprites:", img1.size, img2.size)
