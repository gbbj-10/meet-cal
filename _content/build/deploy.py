#!/usr/bin/env python3
"""
배포본 생성 — www.meetcal.co.kr/ohaeng/ 에 그대로 올릴 폴더를 만듭니다.
  python3 deploy.py     →  content/deploy/ohaeng/   (이 폴더를 통째로 업로드)
                           content/deploy/sitemap.xml (사이트 루트의 것을 교체)

build.py 가 원본이고, 여기서는 경로만 배포용으로 바꿉니다.
  - 글 주소를  /ohaeng/posts/xxx.html  →  /ohaeng/xxx.html  로 평탄화
  - 목록 페이지를 blog.html → index.html 로 (그래야 /ohaeng/ 로 열립니다)
  - 게임 CTA 는 아직 게임이 없으므로 game.html(준비 중)로 보냅니다
"""
import os, sys, json, html, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build as B
import hub as HUB
import map as MAP
import iljin as ILJIN
import hunt as HUNT

SITE_ROOT = 'https://meetcal.co.kr'         # www 는 여기로 리다이렉트된다 (GitHub Pages CNAME = apex)
BASE      = SITE_ROOT + '/ohaeng'
LOVE      = SITE_ROOT + '/love/'            # 이성 조건 계산기 (루트에서 내려온 페이지)
ILJIN_URL = SITE_ROOT + '/iljin/'
# 사냥터 — 카카오/Supabase 키. 비워 두면 /hunt/ 는 데모 모드로 돈다.
KAKAO_JS_KEY = '60b71fcf9ec72aad11e6f5d62358c8db'
SUPABASE = ('', '')   # ('https://xxxx.supabase.co', 'anon public 키')           # 오늘의 일진 (매일 갱신)

OUT  = os.path.join(B.ROOT, 'deploy')
SITE = os.path.join(OUT, 'ohaeng')

def flatten(s, depth):
    """depth: 글 페이지=1(하위폴더 없음), 목록=0"""
    s = s.replace(BASE + '/posts/', BASE + '/')
    s = s.replace(BASE + '/blog.html', BASE + '/')
    s = s.replace('src="../img/', 'src="img/').replace('src="../data/', 'src="data/')
    s = s.replace('href="../../UI_화면시안.html"', 'href="game.html"')
    s = s.replace('href="../UI_화면시안.html"',   'href="game.html"')
    s = s.replace('href="blog.html"', 'href="index.html"')
    s = s.replace('href="posts/', 'href="')
    return s

GAME = """<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>준비 중입니다 — 오행 이야기</title>
<meta property="og:title" content="생년월일로 만드는 내 오행 캐릭터">
<meta property="og:description" content="사주 여덟 글자가 정하는 다섯 가지 속성. 준비 중입니다.">
<meta property="og:image" content="https://meetcal.co.kr/ohaeng/img/og-ohaeng.png">
<meta property="og:url" content="https://meetcal.co.kr/ohaeng/game.html">
<style>%s
.pend{max-width:560px;margin:80px auto;padding:0 20px;text-align:center}
.pend h1{font-size:26px;margin-bottom:14px}
.pend p{color:var(--mut);font-size:16px;line-height:1.8}
.pend a.back{display:inline-block;margin-top:26px;background:var(--acc);color:#fff;
  text-decoration:none;font-weight:700;padding:13px 24px;border-radius:10px}
</style>
%s
</head><body>
<main class="pend">
  <h1>사주 캐릭터, 준비 중입니다</h1>
  <p>생년월일시로 오행 캐릭터를 만들어 주는 기능을 만들고 있습니다.<br>
     지금은 글로 먼저 보여 드리고 있어요.</p>
  <a class="back" href="index.html" data-cta="pending_back">오행 이야기 더 보기</a>
</main>
<script>
if(window.gtag) gtag('event','pending_view',{page:location.pathname,ref:document.referrer});
</script>
</body></html>
"""

def main():
    B.SITE['base'] = BASE
    posts = B.build()               # content/posts, blog.html, sitemap.xml 갱신

    # 깨끗이 지우고 다시 만드는 것이 기본. 다만 동기화 폴더(OneDrive 등)처럼
    # 삭제가 막힌 곳에서도 돌아야 하므로, 실패하면 덮어쓰기로 이어 간다.
    if os.path.exists(OUT):
        try:
            shutil.rmtree(OUT)
        except OSError as e:
            print(f'  (이전 배포본을 지우지 못해 덮어씁니다 — {e.__class__.__name__})')
    os.makedirs(SITE, exist_ok=True)

    # 글 — 평탄화해서 /ohaeng/<slug>.html 로.
    # 이번 빌드에서 실제로 만든 것만 옮긴다. 삭제가 막힌 폴더(OneDrive)에서는
    # 발행 대기 중인 글의 옛 html 이 posts/ 에 남아 있을 수 있는데, 그게 따라오면
    # 예약한 날짜보다 먼저 올라가 버린다.
    live = set(m['slug'] + '.html' for m, _ in posts) | {'game.html'}
    n = 0
    for fn in sorted(os.listdir(B.POSTS)):
        if not fn.endswith('.html'): continue
        if fn not in live: continue
        s = open(os.path.join(B.POSTS, fn), encoding='utf-8').read()
        open(os.path.join(SITE, fn), 'w', encoding='utf-8').write(flatten(s, 1))
        n += 1

    # 목록 → index.html
    s = open(os.path.join(B.ROOT, 'blog.html'), encoding='utf-8').read()
    open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(flatten(s, 0))

    # GA4 스니펫 (본문 페이지와 동일하게) — 준비 중 페이지와 루트 허브가 같이 씁니다
    ga = (f'<script async src="https://www.googletagmanager.com/gtag/js?id={B.SITE["ga"]}"></script>'
          '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}'
          f'gtag(\'js\',new Date());gtag(\'config\',\'{B.SITE["ga"]}\');</script>')
    open(os.path.join(SITE, 'game.html'), 'w', encoding='utf-8').write(GAME % (B.CSS, ga))

    # 사이트 루트(/) 허브 — 글이 늘면 카드도 같이 갱신된다
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(
        HUB.render(posts, ga, B.ADS['client'], B.ADS['slot']))

    # /map/ — 환영 화면과 지도. 지도 그림은 /map/img/ 에만 둔다.
    os.makedirs(os.path.join(OUT, 'map'), exist_ok=True)
    open(os.path.join(OUT, 'map', 'index.html'), 'w', encoding='utf-8').write(
        MAP.render(ga))
    # /iljin/ — 오늘의 일진. 날짜가 박혀 나가므로 매일 다시 빌드된다.
    os.makedirs(os.path.join(OUT, 'iljin'), exist_ok=True)
    open(os.path.join(OUT, 'iljin', 'index.html'), 'w', encoding='utf-8').write(
        ILJIN.render(ga, B.ADS['client'], B.ADS['slot']))

    # /hunt/ — 사냥터. 카카오 로그인 뒤에 열린다. 검색에는 안 잡히게 noindex.
    HUNT.build(os.path.join(OUT, 'hunt'), site_root=SITE_ROOT, ga=ga,
               kakao_js_key=KAKAO_JS_KEY, supabase=SUPABASE)

    # 지도 그림은 완성본 .jpg 만. img/map/src/ 의 생성 원본 PNG 는 배포에서 뺀다.
    mimg = os.path.join(OUT, 'map', 'img')
    os.makedirs(mimg, exist_ok=True)
    for f in sorted(os.listdir(os.path.join(B.ROOT, 'img', 'map'))):
        if f.endswith('.jpg'):
            shutil.copy(os.path.join(B.ROOT, 'img', 'map', f), mimg)

    # 정적 자산
    shutil.copytree(os.path.join(B.ROOT, 'img'), os.path.join(SITE, 'img'),
                    dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('map'))   # 지도 그림은 /map/img/ 에만
    os.makedirs(os.path.join(SITE, 'data'), exist_ok=True)
    for js in ('saju-calculator.js', 'meetcal-core.js'):
        shutil.copy(os.path.join(B.ROOT, 'data', js), os.path.join(SITE, 'data'))

    # 사이트 루트 sitemap.xml — 기존 URL + 새 URL
    today = datetime.date.today()
    slugs = sorted(f[:-5] for f in os.listdir(SITE)
                   if f.endswith('.html') and f not in ('index.html', 'game.html'))
    urls  = [(SITE_ROOT + '/',      '1.0', str(today)),
             (ILJIN_URL,            '0.9', str(today)),
             (SITE_ROOT + '/map/',  '0.7', str(today)),
             (LOVE,                 '0.8', str(today))]
    urls += [(BASE + '/', '0.9', str(today))]
    urls += [(f'{BASE}/{s}.html', '0.8', str(today)) for s in slugs]
    sm = ('<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          ''.join(f'  <url><loc>{u}</loc><lastmod>{d}</lastmod>'
                  f'<priority>{p}</priority></url>\n' for u, p, d in urls) +
          '</urlset>\n')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)

    shutil.copy(os.path.join(HERE, '배포_안내.md'), os.path.join(OUT, '배포_안내.md'))

    print(f'배포본 생성 완료 — 글 {n}편')
    print(f'  {SITE}/            → meetcal.co.kr/ohaeng/ 에 업로드')
    print(f'  {OUT}/index.html   → 사이트 루트의 index.html 교체 (허브)')
    print(f'  {OUT}/map/         → meetcal.co.kr/map/ 에 업로드 (지도)')
    print(f'  {OUT}/iljin/       → meetcal.co.kr/iljin/ 에 업로드 (오늘의 일진)')
    print(f'  {OUT}/sitemap.xml  → 사이트 루트의 sitemap.xml 교체')

if __name__ == '__main__':
    main()
