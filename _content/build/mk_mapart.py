# -*- coding: utf-8 -*-
"""지도 그림 만들기.

  python3 mk_mapart.py        → content/img/map/*.jpg

## 건물 (원형 메달리온)
`content/img/map/src/*.png` 다섯 장을 줄여서 씁니다. 이 원본은 ChatGPT 이미지
생성으로 뽑은 것이고, 건물 이름에 맞춘 프롬프트가 아래 PROMPT 에 그대로 있습니다.
다시 뽑고 싶으면 그 문장을 그대로 넣고, 받은 그림을 같은 파일명으로 덮으면 됩니다.

## 배경
`Game/bg/토.jpg` 의 넓은 풍경을 밤으로 물들여 씁니다.
"""
import os
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                       # content/
BG   = os.path.join(os.path.dirname(ROOT), 'bg')   # Game/bg/
OUT  = os.path.join(ROOT, 'img', 'map')
SRC  = os.path.join(OUT, 'src')

COMMON = ('Square 1:1. Highly detailed painted fantasy concept art, East Asian '
          '(Korean/Chinese) architecture, dramatic cinematic lighting, rich saturated '
          'color, no text, no letters, no people. Building centered, filling the frame.')

PROMPT = {
 'to':   '사주각 四柱閣 — "Hall of the Four Pillars": a grand two-story traditional '
         'pavilion standing on four massive stone pillars, golden ochre and earth tones, '
         'green tiled curved roofs, terraced stone platform carved into a mountaintop, '
         'warm amber light glowing from inside, drifting mist, sunset sky.',
 'su':   '십간의 전당 十干殿堂 — "Hall of the Ten Heavenly Stems": a wide low scholars\' '
         'hall with exactly ten slender columns across its front facade, deep indigo and '
         'jade-green tiled roof, hanging paper lanterns, beside a tall waterfall with '
         'rising mist, cool blue moonlight, night.',
 'geum': '명식의 탑 命式塔 — "Tower of the Destiny Chart": a tall nine-tier stone-and-'
         'silver pagoda alone on a frozen cliff, pale silver-grey and white, small metal '
         'bells on each tier\'s eaves, faint constellation patterns carved into the walls, '
         'falling snow, cold moonlight, night.',
 'hwa':  '십이지 궁 十二支宮 — "Palace of the Twelve Earthly Branches": a circular open-air '
         'arena palace ringed by twelve tall stone pillars, each crowned with a different '
         'carved zodiac animal statue, dark red and black lacquered gatehouse at the front, '
         'burning braziers, embers, volcanic red glow from below, stormy sky.',
 'gunghap': '궁합소 宮合所 — "House of Matched Hearts": an intimate twin pavilion — two small '
         'curved-roof pavilions joined by a covered wooden bridge, two ancient trees on either side '
         'whose branches intertwine into one canopy above the roofs, a long red silk thread tied '
         'between two stone lanterns, paired rose-pink and peach paper lanterns glowing, cherry '
         'blossom petals drifting, a small still pond reflecting a pink-violet twilight sky with a '
         'crescent moon, warm romantic glow.',
 # ↑ 2026-09-24 ChatGPT 로 뽑음(Flow 는 확장 권한 거부). 받은 그림 가운데를 잘라 480px 로 썼다.
 'mok':  '연의 저울 緣 — "Pavilion of the Scale of Fate": a small elegant green-roofed '
         'pavilion in a lush bamboo grove, a large ornate golden balance scale with two '
         'hanging brass pans suspended beneath its eaves, blossoming branches, moss-covered '
         'stone steps, soft green dawn light, drifting pollen.',
}

SIZE = 480          # 지도에서 가장 큰 메달리온이 176px 이라 이 정도면 충분히 선명하다


def medallions():
    for key in PROMPT:
        p = os.path.join(SRC, key + '.png')
        if not os.path.exists(p):
            print(f'  ! {key}: 원본이 없습니다 — {p}')
            continue
        im = Image.open(p).convert('RGB')
        # 가운데를 조금 당겨 자른다 — 원형으로 잘리면 네 귀퉁이가 어차피 사라지고,
        # 지름 176px 안에서 건물이 작아 보이는 것이 더 손해다.
        s = int(min(im.size) * 0.88)
        x0, y0 = (im.width - s) // 2, (im.height - s) // 2
        im = im.crop((x0, y0, x0 + s, y0 + s)).resize((SIZE, SIZE), Image.LANCZOS)
        im = ImageEnhance.Contrast(im).enhance(1.04)
        im.save(os.path.join(OUT, f'spot-{key}.jpg'), quality=85, optimize=True)


def backdrop():
    """토의 넓은 풍경을 밤으로. 너무 어두우면 그림이 죽고, 밝으면 글자가 안 읽힌다."""
    im = Image.open(os.path.join(BG, '토.jpg')).convert('RGB')
    W, H = im.size
    sw = int(H * 1000 / 620)                       # 지도 viewBox 비율에 맞춰 자른다
    x0 = (W - sw) // 2
    bg = im.crop((x0, 0, x0 + sw, H)).resize((1500, 930), Image.LANCZOS)
    bg = ImageEnhance.Brightness(bg).enhance(0.55)
    bg = ImageEnhance.Color(bg).enhance(0.62)
    bg = Image.blend(bg, Image.new('RGB', bg.size, (24, 34, 55)), 0.32)
    v = Image.new('L', bg.size, 0)
    ImageDraw.Draw(v).ellipse([-300, -240, 1800, 1170], fill=255)
    v = v.filter(ImageFilter.GaussianBlur(115))
    bg = Image.composite(bg, Image.new('RGB', bg.size, (9, 13, 21)), v)
    bg.save(os.path.join(OUT, 'map-bg.jpg'), quality=82, optimize=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    medallions()
    backdrop()
    for f in sorted(f for f in os.listdir(OUT) if f.endswith('.jpg')):
        print(f'  {f}  {os.path.getsize(os.path.join(OUT, f))//1024} KB')
