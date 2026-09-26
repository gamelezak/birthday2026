#!/usr/bin/env python3
"""High-quality pixel-art sprite generator v2 (clean rewrite)."""
import math, random
from PIL import Image, ImageDraw

random.seed(7)
PX = 4
OUT = "/workspace/assets"

def new_img(w, h, mode="RGBA"):
    return Image.new(mode, (w*PX, h*PX), (0,0,0,0) if mode=="RGBA" else (0,0,0))

def px(img, x, y, color):
    d = ImageDraw.Draw(img)
    d.rectangle([x*PX, y*PX, (x+1)*PX-1, (y+1)*PX-1], fill=color)

def circle_fill(img, cx, cy, r, fn_color):
    for yy in range(cy-r, cy+r+1):
        for xx in range(cx-r, cx+r+1):
            dx, dy = xx-cx, yy-cy
            if dx*dx+dy*dy <= r*r:
                px(img, xx, yy, fn_color(xx, yy))

# ---------- BACKGROUND 640x360 logical -> 2560x1440 ----------
W, H = 640, 360
bg = new_img(W, H, "RGB")
stops = [(0,(8,5,26)), (90,(22,10,52)), (180,(52,20,70)), (260,(110,42,66)), (330,(178,84,52)), (360,(205,110,60))]
def grad(y):
    for i in range(len(stops)-1):
        a, ca = stops[i]; b, cb = stops[i+1]
        if a <= y <= b:
            t=(y-a)/(b-a); return tuple(int(ca[j]+(cb[j]-ca[j])*t) for j in range(3))
    return stops[-1][1]
for y in range(H):
    c = grad(y); c2 = tuple(min(255,v+6) for v in c)
    for x in range(W):
        px(bg, x, y, c if (x + y//2) % 4 else c2)

for _ in range(520):
    x = random.randint(0,W-1); y = random.randint(0,int(H*0.75))
    a = random.uniform(0.25, 1.0)
    tint = random.choice([(255,255,255),(255,244,214),(214,228,255)])
    px(bg, x, y, tuple(int(18+v*a) for v in tint))
for _ in range(26):
    cx = random.randint(14, W-14); cy = random.randint(10, int(H*0.6)); n = random.randint(3,6)
    px(bg, cx, cy, (255,252,235))
    for d in range(1,n+1):
        f = max(70, 255-int(200*d/n)); col=(f,f,min(255,f+10))
        px(bg,cx+d,cy,col); px(bg,cx-d,cy,col); px(bg,cx,cy+d,col); px(bg,cx,cy-d,col)

mx, my, mr = 505, 78, 34
for yy in range(my-mr-28, my+mr+28):
    for xx in range(mx-mr-28, mx+mr+28):
        if 0<=xx<W and 0<=yy<H:
            d = math.hypot(xx-mx, yy-my)
            t = max(0.0, 1-(d-mr)/26)
            if t>0:
                base = grad(max(0,min(H-1,int(yy))))
                px(bg, xx, yy, tuple(int(c+(232-c)*t*0.55) for c in base))
def moon_shade(x,y):
    base=(253,246,216)
    lit = max(0.0, min(1.0, 0.75 - 0.5*((x-mx)*0.6+(y-my)*0.8)/mr))
    sh = 1.0 - 0.28*max(0,lit)
    return tuple(int(v*sh) for v in base)
circle_fill(bg, mx, my, mr, moon_shade)
for (ox,oy,cr) in [(-12,-8,6),(9,12,5),(14,-13,4),(-6,16,3),(2,-2,3),(-18,6,2)]:
    def cf(x,y,ox=ox,oy=oy,cr=cr):
        e = math.hypot(x-(mx+ox), y-(my+oy)) > cr-1
        return (186,173,140) if e else (206,193,157)
    circle_fill(bg, mx+ox, my+oy, cr, cf)

sx0, sy0 = 130, 52
for i in range(34):
    f = 255-i*6
    px(bg, sx0+i, sy0+int(i*0.38), (f,f,max(90,f-50)))
px(bg, sx0, sy0, (255,255,255)); px(bg, sx0+1, sy0, (255,255,230))

def ridge(base_y, amp, freq, phase, col_top, col_bot):
    ys=[]
    for x in range(W):
        y = base_y + int(amp*math.sin(x/freq+phase)+amp*0.5*math.sin(x/(freq*0.37)+phase*2))
        ys.append(y)
    for x in range(W):
        for y in range(ys[x], H):
            depth = y-ys[x]
            px(bg, x, y, col_top if depth<4 else col_bot)
    return ys
ridge(318, 10, 70, 1.0, (30,18,58), (20,12,42))
near = ridge(336, 8, 46, 3.2, (16,9,32), (10,6,24))
for _ in range(46):
    x = random.randint(6, W-6); top = near[min(x,W-1)]
    y = random.randint(top+3, H-4)
    px(bg, x, y, random.choice([(255,204,100),(255,158,74),(186,222,255),(255,228,150)]))
bg.save(f"{OUT}/birthday-bg-party.png")
print("bg:", bg.size)

# ---------- SIGN with hand-made 5x7 Cyrillic pixel font ----------
FONT5X7 = {
 'С': ["01111","10000","10000","01000","00100","00010","11110"],
 'Д': ["00100","00110","00101","00100","00100","10100","11111"],
 'Н': ["10001","10001","10001","11111","10001","10001","10001"],
 'Ё': ["01010","00000","11111","10001","10001","10001","10001"],
 'М': ["10001","11011","10101","10101","10001","10001","10001"],
 'Р': ["11110","10001","10001","11110","10000","10000","10000"],
 'О': ["01110","10001","10001","10001","10001","10001","01110"],
 'Ж': ["10101","10101","10101","11111","10101","10101","10101"],
 'И': ["10001","10001","10011","10101","11001","10001","10001"],
 'Е': ["11111","10000","10000","11110","10000","10000","11111"],
 'Я': ["01110","10001","10001","01111","00010","00101","11110"],
 '!': ["00100","00100","00100","00100","00100","00000","00100"],
 ' ': ["00000"]*7,
}
words = ["С ДНЁМ", "РОЖДЕНИЯ!"]
LET, GAP, WSP, rows = 5, 2, 4, 7
def word_w(s):
    w=0
    for ch in s: w += WSP if ch==' ' else LET+GAP
    return w-GAP
line_w = max(word_w(words[0]), word_w(words[1]))
PADX, PADY, RIM = 8, 7, 2
BWl = line_w + PADX*2 + RIM*2
BHl = rows*2 + 6 + PADY*2 + RIM*2
sign = new_img(BWl, BHl)
w1,w2,w3,edge,edge_hi = (74,36,92),(62,28,80),(50,22,68),(30,12,44),(96,52,116)
for y in range(BHl):
    for x in range(BWl):
        corner = ((x<RIM-1 and y<RIM-1) or (x>=BWl-RIM+1 and y<RIM-1) or
                  (x<RIM-1 and y>=BHl-RIM+1) or (x>=BWl-RIM+1 and y>=BHl-RIM+1))
        if corner: continue
        if x<RIM or y<RIM or x>=BWl-RIM or y>=BHl-RIM:
            px(sign,x,y, edge)
        else:
            g = (x//2 + int(2*math.sin(y/5.0))) % 4
            px(sign,x,y,[w1,w2,w1,w3][g])
ix0, iy0, ix1, iy1 = RIM+3, RIM+3, BWl-RIM-4, BHl-RIM-4
for x in range(ix0, ix1+1):
    px(sign,x,iy0,w3); px(sign,x,iy1,w3)
for y in range(iy0, iy1+1):
    px(sign,ix0,y,w3); px(sign,ix1,y,w3)
palette=[(255,92,120),(255,176,64),(255,240,96),(110,236,150),(96,190,255),(206,130,255)]
def draw_text_row(s, y_base, ci_start):
    x = (BWl - word_w(s))//2
    ci = ci_start
    for ch in s:
        if ch==' ':
            x += WSP; continue
        glyph = FONT5X7[ch]
        col = palette[ci % len(palette)]; ci+=1
        hi = tuple(min(255,c+110) for c in col); dk = tuple(int(c*0.55) for c in col)
        for gy in range(rows):
            for gx in range(LET):
                if glyph[gy][gx]=='1':
                    up = gy==0 or glyph[gy-1][gx]!='1'
                    lf = gx==0 or glyph[gy][gx-1]!='1'
                    dn = gy==rows-1 or glyph[gy+1][gx]!='1'
                    c = hi if (up or lf) else (dk if dn else col)
                    px(sign, x+gx, y_base+gy*2, c)
                    px(sign, x+gx, y_base+gy*2+1, dk if dn else c)
        x += LET+GAP
    return ci
cy = RIM+PADY
draw_text_row(words[0], cy, 0)
draw_text_row(words[1], cy + rows*2 + 6, 3)
bulbs=[(255,236,140),(255,120,140),(120,214,255),(150,255,170)]
bi=0
def bulb(x,y,c):
    px(sign,x,y,(90,90,110))
    for dx in range(-1,2):
        for dy in range(0,3):
            if abs(dx)+dy<3:
                px(sign,x+dx,y+1+dy, tuple(int(v*0.6) for v in c) if (abs(dx)==1 and dy==2) else c)
perim  = [(x,RIM-2) for x in range(RIM+2,BWl-RIM-2,6)]
perim += [(x,BHl-RIM+1) for x in range(RIM+2,BWl-RIM-2,6)]
perim += [(RIM-2,y) for y in range(RIM+4,BHl-RIM-2,6)]
perim += [(BWl-RIM+1,y) for y in range(RIM+4,BHl-RIM-2,6)]
for (x,y) in perim:
    bulb(x,y,bulbs[bi%4]); bi+=1
sign.save(f"{OUT}/sign-hbd.png")
print("sign:", sign.size, "logical:", BWl, BHl)

# ---------- GARLAND 320x44 ----------
GW_, GH_ = 320, 44
gar = new_img(GW_, GH_)
wire=(46,52,78)
def sag(t, amp=13, y0=4): return y0 + amp*4*t*(1-t)
for x in range(GW_):
    y=int(sag(x/(GW_-1))); px(gar,x,y,wire); px(gar,x,y+1,wire)
pal=[(255,92,110),(255,204,80),(110,236,150),(96,186,255),(216,120,255),(255,150,90)]
bi=0
for x in range(14, GW_-10, 26):
    yt=int(sag(x/(GW_-1)))+2
    col=pal[bi%len(pal)]; bi+=1
    lite=tuple(min(255,int(c+(255-c)*0.7)) for c in col); dark=tuple(int(c*0.5) for c in col)
    px(gar,x,yt,(80,84,110)); px(gar,x,yt+1,(80,84,110))
    widths=[4,6,6,6,5,3]
    for k,wd in enumerate(widths):
        off=(6-wd)//2
        for j in range(wd):
            c = lite if j==0 else (dark if (j==wd-1 or k==5) else col)
            px(gar, x-3+off+j, yt+2+k, c)
    px(gar, x-1, yt+3, lite)
gar.save(f"{OUT}/garland.png")
print("garland:", gar.size)

# ---------- BUNTING 120x72 ----------
FW, FH = 120, 72
bt = new_img(FW, FH)
cols=[(255,92,110),(255,204,80),(110,236,150),(96,186,255),(216,120,255)]
cord=(74,80,108)
def cat(t, amp=8, y0=3): return y0+amp*4*t*(1-t)
for x in range(FW):
    y=int(cat(x/(FW-1))); px(bt,x,y,cord); px(bt,x,y+1,cord)
for i in range(6):
    cx=int((i+0.5)*FW/6); ty=int(cat(cx/(FW-1)))+2
    col=cols[i%len(cols)]; lite=tuple(min(255,c+90) for c in col); dark=tuple(int(c*0.55) for c in col)
    HGT, WD = 16, 15
    for r in range(HGT):
        ww=WD-int(r*WD/HGT)
        if ww<=0: break
        for j in range(ww):
            c = lite if j==0 else (dark if (j==ww-1 or r>HGT-3) else col)
            px(bt,cx-ww//2+j,ty+r,c)
    px(bt,cx,ty-1,(100,100,130))
bt.save(f"{OUT}/bunting-side.png")
print("bunting:", bt.size)

# ---------- GIFT BOX 48x48 ----------
gift = new_img(48, 48)
box_c=(226,70,96); box_d=(168,44,68); box_l=(255,140,160)
rib=(255,214,90); rib_d=(214,160,40); rib_l=(255,240,160)
for y in range(20,46):
    for x in range(8,40):
        c = box_l if (x==8 or y==20) else (box_d if (x==39 or y==45) else box_c)
        px(gift,x,y,c)
for y in range(14,21):
    for x in range(5,43):
        c = box_l if (x==5 or y==14) else (box_d if (x==42 or y==20) else box_c)
        px(gift,x,y,c)
for y in range(21,46):
    for x in range(21,27):
        px(gift,x,y, rib_l if x==21 else (rib_d if x==26 else rib))
for x in range(5,43):
    px(gift,x,17, rib_l); px(gift,x,18, rib); px(gift,x,19, rib_d)
# bow loops
for (bx,by) in [(16,10),(17,9),(18,8),(19,8),(20,9),(28,10),(29,9),(30,8),(31,8),(32,9),(33,10),
                (17,11),(18,11),(19,11),(20,11),(29,11),(30,11),(31,11),(32,11),
                (21,10),(22,10),(23,10),(24,10),(25,10),(26,10),(27,10)]:
    px(gift,bx,by, rib)
for (bx,by) in [(18,8),(19,8),(30,8),(31,8),(21,10),(22,10),(26,10),(27,10)]:
    px(gift,bx,by, rib_l)
for (bx,by) in [(16,10),(33,10),(20,11),(29,11)]:
    px(gift,bx,by, rib_d)
px(gift,23,12,rib_l); px(gift,24,12,rib); px(gift,25,12,rib_d)
gift.save(f"{OUT}/gift-box.png")
print("gift:", gift.size)
