#!/usr/bin/env python3
"""Генератор высококачественных пиксель-арт спрайтов для congrats.html.
Пиксели рисуются квадратными блоками (px_size) на большом холсте -> чёткие края."""
import math, random
from PIL import Image, ImageDraw, ImageFont

random.seed(42)
PX = 4  # размер одного "пикселя" в выходном изображении

def px(img, x, y, color):
    """Закрасить логический пиксель (x,y) квадратом PX*PX."""
    d = ImageDraw.Draw(img)
    d.rectangle([x*PX, y*PX, (x+1)*PX-1, (y+1)*PX-1], fill=color)

def line(img, x0, y0, x1, y1, color, width=1):
    """Линия Брезенхэма из квадратных пикселей."""
    dx = abs(x1-x0); dy = -abs(y1-y0)
    sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        for w in range(width):
            px(img, x0, y0+w if sy>0 else y0-w, color)
        if x0 == x1 and y0 == y1: break
        e2 = 2*err
        if e2 >= dy: err += dy; x0 += sx
        if e2 <= dx: err += dx; y0 += sy

def dither_rect(img, x0, y0, x1, y1, c1, c2):
    """Шахматный дизеринг между двумя цветами — даёт мягкий градиент без блюра."""
    for y in range(y0, y1+1):
        for x in range(x0, x1+1):
            px(img, x, y, c1 if (x+y) % 2 == 0 else c2)

# ---------------- ФОН: ночное праздничное небо ----------------
W, H = 320, 180   # логических пикселей -> 1280x720
bg = Image.new("RGB", (W*PX, H*PX))

# вертикальный градиент с дизерингом (тёмно-фиолетовый -> тёплый горизонт)
stops = [(0,(10,6,30)), (60,(26,12,58)), (110,(58,22,72)), (150,(120,45,60)), (180,(190,90,55))]
def grad_color(y):
    for i in range(len(stops)-1):
        a, ca = stops[i]; b, cb = stops[i+1]
        if a <= y <= b:
            t = (y-a)/(b-a)
            return tuple(int(ca[j]+(cb[j]-ca[j])*t) for j in range(3))
    return stops[-1][1]
for y in range(H):
    c = grad_color(y)
    c2 = tuple(min(255, v+8) for v in c)
    for x in range(W):
        px(bg, x, y, c if (x + (y//2)) % 3 else c2)

# крупные звёзды-блинки + россыпь мелких
for _ in range(240):
    x, y = random.randint(0, W-1), random.randint(0, int(H*0.72))
    b = random.choice([(255,255,255),(255,240,200),(200,220,255)])
    shade = tuple(max(0,int(v*f)) for v in b for f in [random.uniform(0.35,1.0)][0]) if False else b
    a = random.uniform(0.3, 1.0)
    col = tuple(int(20+v*a) for v in shade)
    px(bg, x, y, col)
for _ in range(14):  # большие 4-лучевые звёзды
    cx, cy = random.randint(10, W-10), random.randint(8, int(H*0.55))
    n = random.randint(3, 5)
    white = (255, 250, 230)
    px(bg, cx, cy, white)
    for d in range(1, n):
        f = int(255*(1-d/n))+60
        c = (f, f, min(255,f))
        px(bg, cx+d, cy, c); px(bg, cx-d, cy, c); px(bg, cx, cy+d, c); px(bg, cx, cy-d, c)

# луна с кратерами и светящимся ореолом (дизеринг)
mx, my, mr = 255, 38, 16
for r in range(mr+7, mr, -1):
    t = (r-mr)/7
    halo = tuple(int(70+(185-70)*(1-t)) for _ in range(3))
    for ang in range(0, 360, 3):
        x = mx+int(r*math.cos(math.radians(ang))); y = my+int(r*math.sin(math.radians(ang)))
        if 0<=x<W and 0<=y<H:
            if random.random() > t:  # разрежаем внешние кольца
                px(bg, x, y, halo)
for yy in range(my-mr, my+mr+1):
    for xx in range(mx-mr, mx+mr+1):
        d2 = (xx-mx)**2+(yy-my)**2
        if d2 <= mr*mr:
            base = (252, 245, 214)
            # затенение к нижнему краю
            sh = 1.0 - 0.25*((yy-(my-mr))/(2*mr))
            col = tuple(int(v*sh) for v in base)
            px(bg, xx, yy, col)
for (cx, cy, cr) in [(mx-5,my-3,3),(mx+4,my+5,2),(mx+6,my-6,2),(mx-2,my+7,1)]:
    for yy in range(cy-cr, cy+cr+1):
        for xx in range(cx-cr, cx+cr+1):
            if (xx-cx)**2+(yy-cy)**2 <= cr*cr:
                px(bg, xx, yy, (214, 202, 165))

# падающая звезда
sx0, sy0 = 60, 22
for i in range(16):
    f = 255 - i*12
    px(bg, sx0+i, sy0+int(i*0.45), (f, f, max(80,f-40)))
px(bg, sx0, sy0, (255,255,255))

# силуэт холмов/города тёмно-фиолетовым
skyline_y = int(H*0.86)
hills = []
for x in range(W):
    hgt = skyline_y + int(6*math.sin(x/38.0)+4*math.sin(x/17.0+2))
    hills.append(hgt)
for x in range(W):
    for y in range(hills[x], H):
        deep = (14, 8, 34) if y > hills[x]+6 else (24, 14, 52)
        px(bg, x, y, deep)
# огоньки в «домах»
for _ in range(26):
    x = random.randint(4, W-4)
    y = random.randint(hills[min(x,W-1)]+2, H-3)
    px(bg, x, y, random.choice([(255,200,90),(255,150,70),(180,220,255)]))

bg.save("/workspace/assets/birthday-bg-party.png")
print("bg:", bg.size)

# ---------------- ВЫВЕСКА «С ДНЁМ РОЖДЕНИЯ!» ----------------
# рисуем текст крупным шрифтом, бинаризуем в пиксельную сетку, красим неоновыми буквами
text = "С ДНЁМ РОЖДЕНИЯ!"
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
tmp = Image.new("L", (1400, 160)); td = ImageDraw.Draw(tmp)
td.text((10, 40), text, font=font, fill=255)
bbox = tmp.getbbox(); tmp = tmp.crop(bbox)
SCALE = 0.30  # 1 пиксель текста -> ~0.3 логического пикселя... подберём сетку
gw, gh = max(1,int(tmp.width*SCALE*0.42)), max(1,int(tmp.height*SCALE*0.42))
small = tmp.resize((gw, gh), Image.LANCZOS).convert("1")
BW, BH = gw+8, gh+10
sign = Image.new("RGBA", (BW*PX, BH*PX), (0,0,0,0))
# рамка-дощечка
wood1, wood2, edge = (58, 28, 74), (44, 20, 58), (28, 12, 40)
for y in range(BH):
    for x in range(BW):
        border = x<2 or y<2 or x>=BW-2 or y>=BH-2
        inner = 2<=x<BW-2 and 2<=y<BH-2
        if border: px(sign, x, y, edge)
        elif inner: px(sign, x, y, wood1 if (x//3+y//3)%2==0 else wood2)
# буквы: каждая своего цвета + белый «核心»highlight
palette = [(255,90,120),(255,170,60),(255,240,90),(120,255,150),(90,200,255),(200,120,255)]
mask = small.load()
letter_idx = -1; prev_on = False
colors_grid = {}
for gy in range(gh):
    on_letter = False
    for gx in range(gw):
        on = mask[gx, gy]
        if on and not prev_on_row_gx if False else False: pass
    # определим столбцы букв глобально
cols_used = [gx for gx in range(gw) if any(mask[gx,gy] for gy in range(gh))]
# группы столбцов = буквы
groups = []; cur = []
for gx in cols_used:
    if cur and gx - cur[-1] > 2:
        groups.append(cur); cur=[]
    cur.append(gx)
if cur: groups.append(cur)
gi_of_col = {}
for i, g in enumerate(groups):
    for gx in g: gi_of_col[gx] = i
for gy in range(gh):
    for gx in range(gw):
        if mask[gx, gy]:
            i = gi_of_col.get(gx, 0)
            base = palette[i % len(palette)]
            # внутренняя подсветка: если сосед сверху/слева пуст — темнее, центр ярче
            bright = True
            try:
                if not mask[gx, max(0,gy-1)]: bright=False
            except: pass
            col = (255,255,220) if (gy%3==0 and gx%3==0) else base
            px(sign, gx+4, gy+5, col)
# лампочки по периметру
bulb_cols = [(255,230,120),(255,120,140),(120,220,255),(150,255,160)]
n_bulbs = (BW+BH)*2//4; bi=0
for x in range(1, BW-1, 3):
    px(sign, x, 0, bulb_cols[bi%4]); px(sign, x, BH-1, bulb_cols[(bi+2)%4]); bi+=1
for y in range(1, BH-1, 3):
    px(sign, 0, y, bulb_cols[bi%4]); px(sign, BW-1, y, bulb_cols[(bi+2)%4]); bi+=1
# верёвочные ушки
for x in range(BW//2-14, BW//2+14, 2):
    yy = 0
sign.save("/workspace/assets/sign-hbd.png")
print("sign:", sign.size, "grid:", BW, BH, "letters:", len(groups))

# ---------------- ГИРЛЯНДА (провисающий провод с лампочками) ----------------
GW_, GH_ = 160, 34
gar = Image.new("RGBA", (GW_*PX, GH_*PX), (0,0,0,0))
wire = (40, 46, 70)
def catenary(t, sag=12, y0=3):
    return int(y0 + sag*4*t*(1-t))
prev = None
bulb_pal = [(255,90,110),(255,200,70),(110,255,150),(90,190,255),(220,120,255)]
xs = list(range(0, GW_))
pts = [(x, catenary(x/(GW_-1))) for x in xs]
for (x,y) in pts:
    px(gar, x, y, wire); px(gar, x, y+1, wire)
# лампочки каждые 10 px, висят на 2..5 ниже провода
bi = 0
for x in range(8, GW_-6, 10):
    ytop = catenary(x/(GW_-1)) + 2
    col = bulb_pal[bi % 5]; bi += 1
    dark = tuple(int(c*0.55) for c in col)
    lite = tuple(min(255,int(c+(255-c)*0.65)) for c in col)
    px(gar, x, ytop, (60,60,80))                      # цоколь
    # грушевидная лампа 5x7
    shape = [(1,0,3),(0,1,4),(0,2,4),(0,3,4),(1,4,3),(2,5,1)]
    for (dy, row) in enumerate(shape):
        rx, rw = row[0], row[1] if len(row)>1 else 0
    rows = [ (0,3,1),(1,5,0),(2,5,0),(3,5,0),(4,3,1),(5,1,2) ]  # (ширина, смещение)
    widths = [3,5,5,5,3,1]
    for k, wd in enumerate(widths):
        off = (5-wd)//2
        for j in range(wd):
            cx = x-2+off+j; cy = ytop+1+k
            c = lite if (j==0 and k<2) else (dark if (j==wd-1 or k==len(widths)-1) else col)
            px(gar, cx, cy, c)
    px(gar, x-1+ (5-widths[5])//2 + 1 if False else x, ytop+6, lite)
gar.save("/workspace/assets/garland.png")
print("garland:", gar.size)

# ---------------- ФЛАЖКИ (bunting) ----------------
FW, FH = 40, 64
bt = Image.new("RGBA", (FW*PX, FH*PX), (0,0,0,0))
tri_cols = [(255,90,110),(255,200,70),(110,255,150),(90,190,255),(220,120,255)]
# два провисающих ряда флажков
def flag(cx, topy, col):
    dark = tuple(int(c*0.6) for c in col); lite = tuple(min(255,c+90) for c in col)
    wdt = 11
    for i in range(12):
        ww = wdt - i
        for j in range(ww):
            fx = cx - ww//2 + j; fy = topy + i
            c = col
            if j == 0: c = lite
            if j == ww-1: c = dark
            px(bt, fx, fy, c)
    px(bt, cx, topy-1, (70,70,90))
row_pts = lambda t: int(4 + 6*4*t*(1-t))
idx=0
for n in range(4):
    x = 5 + n*10
    y = row_pts(x/(FW-1))
    # шнур
    if n: line(bt, x-10, prev_y+1, x, y, (70,76,100), 1)
    prev_y = y
    flag(x+2, y+1, tri_cols[idx%5]); idx+=1
bt.save("/workspace/assets/bunting-side.png")
print("bunting:", bt.size)
