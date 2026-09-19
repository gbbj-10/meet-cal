# -*- coding: utf-8 -*-
"""오행 캐릭터 OG 이미지 v2 — 다섯 마리가 한 무리로 달려나가는 구도.
아틀라스의 run_ 프레임(속성 이펙트가 살아 있는 동작)을 씁니다."""
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
FR = '/tmp/claude-0/-home-claude/21d8ffb2-13d7-5946-8aeb-02922ead56e2/scratchpad/og/frames/'
OUT = '/tmp/claude-0/-home-claude/21d8ffb2-13d7-5946-8aeb-02922ead56e2/scratchpad/og/'

COL = {'목': (79, 185, 95), '화': (232, 72, 60), '토': (201, 162, 39),
       '금': (170, 182, 201), '수': (63, 143, 224)}

# (속성, 중심x, 바닥y, 크기배율)  — 뒤에서 앞으로 그린다
PACK = [
    ('토', 526, 438, 1.00),   # 뒤쪽 왼편, 덩치
    ('금', 692, 436, 0.97),   # 뒤쪽 오른편
    ('목', 442, 542, 1.17),   # 앞쪽 왼편 — 1.3배 키움
    ('수', 754, 538, 0.90),   # 앞쪽 오른편
    ('화', 616, 574, 1.30),   # 맨 앞 중앙 (불꽃 꼬리가 길어 크게)
]
BASE_H = 214


def font(sz, weight='Bold'):
    p = subprocess.run(['fc-match', '-f', '%{file}',
                        f'Noto Sans CJK KR:style={weight}'],
                       capture_output=True, text=True).stdout.strip()
    return ImageFont.truetype(p, sz)


# ── 배경 ──
bg = Image.new('RGB', (W, H))
d = ImageDraw.Draw(bg)
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)],
           fill=(int(21 - 10 * t), int(27 - 12 * t), int(40 - 17 * t)))

# ── 무리 뒤쪽 공통 글로우 (가운데로 뭉치게) ──
glow = Image.new('RGB', (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
for name, cx, by, sc in PACK:
    c = COL[name]
    gd.ellipse([cx - 165, by - 225, cx + 165, by + 40],
               fill=tuple(int(v * 0.38) for v in c))
gd.ellipse([428, 300, 818, 600], fill=(28, 34, 50))
glow = glow.filter(ImageFilter.GaussianBlur(85))
bg = Image.fromarray(np.clip(np.asarray(bg, int) + np.asarray(glow, int),
                             0, 255).astype('uint8'))
d = ImageDraw.Draw(bg)

# ── 캐릭터 ──
for name, cx, by, sc in PACK:
    im = Image.open(FR + 'run_' + name + '.png').convert('RGBA')
    h = int(BASE_H * sc)
    r = h / im.height
    im = im.resize((max(1, int(im.width * r)), h), Image.LANCZOS)
    x, y = int(cx - im.width / 2), int(by - im.height)
    bg.paste(im, (x, y), im)

# ── 텍스트 ──
ft, fs, fu = font(56, 'Black'), font(26, 'Medium'), font(22, 'Bold')

title = '생년월일로 만드는 내 오행 캐릭터'
bb = d.textbbox((0, 0), title, font=ft)
tx, ty = (W - (bb[2] - bb[0])) / 2, 52
# 글자 뒤 어둡게 깔아 대비 확보
sha = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(sha).rounded_rectangle(
    [tx - 40, ty - 22, tx + (bb[2] - bb[0]) + 40, ty + 128],
    radius=40, fill=(8, 11, 17, 150))
bg = Image.alpha_composite(bg.convert('RGBA'),
                           sha.filter(ImageFilter.GaussianBlur(24))).convert('RGB')
d = ImageDraw.Draw(bg)
d.text((tx, ty), title, font=ft, fill=(255, 255, 255))

sub = '사주 여덟 글자가 정하는 다섯 가지 속성'
bb2 = d.textbbox((0, 0), sub, font=fs)
d.text(((W - (bb2[2] - bb2[0])) / 2, ty + 78), sub, font=fs, fill=(164, 178, 199))

url = 'meetcal.co.kr'
bb3 = d.textbbox((0, 0), url, font=fu)
tw, th = bb3[2] - bb3[0], bb3[3] - bb3[1]
rx, ry = W - 40, 40
d.rounded_rectangle([rx - tw - 32, ry, rx, ry + th + 22], radius=17,
                    fill=(255, 255, 255))
d.text((rx - tw - 16, ry + 11 - bb3[1]), url, font=fu, fill=(16, 20, 28))

bg.save(OUT + 'og-image.png')
print('saved', bg.size)
