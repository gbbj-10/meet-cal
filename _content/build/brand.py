# -*- coding: utf-8 -*-
"""Four Paws 의 로고 마크. 한 곳에서만 고친다.

발가락 넷은 사주의 네 기둥(년·월·일·시)이고, 가운데 패드가 나다.
색은 오행에서 가져왔다 — 발가락이 목·화·금·수, 패드가 토.
**토가 가운데인 것은 우연이 아니다.** 오행에서 토는 중앙을 맡는다.

작은 크기에서는 색이 뭉개진다. 16px 파비콘은 단색 금색을 쓴다.
"""
from urllib.parse import quote

_TOES = (
    ('11.06', '21.75', '5.3', '6.5', '-30', '#4fb95f'),   # 목
    ('18.73', '16.18', '5.8', '7.1',  '-9', '#e8483c'),   # 화
    ('29.27', '16.18', '5.8', '7.1',   '9', '#8e9bb0'),   # 금
    ('36.94', '21.75', '5.3', '6.5',  '30', '#3f8fe0'),   # 수
)
_PAD = ('M24 25.6c7.6 0 14 5.1 14 11.1 0 4.9-4.1 8.3-8.6 8.3-2.6 0-3.8-.9-5.4-.9'
        's-2.8.9-5.4.9C14.1 45 10 41.6 10 36.7c0-6 6.4-11.1 14-11.1z')
GOLD = '#ffd93d'


def _svg(mono=False, attrs='class="mk" aria-hidden="true"'):
    p = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" %s>' % attrs]
    p.append('<path fill="%s" d="%s"/>' % (GOLD, _PAD))
    for x, y, rx, ry, rot, col in _TOES:
        p.append('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" transform="rotate(%s %s %s)" '
                 'fill="%s"/>' % (x, y, rx, ry, rot, x, y, GOLD if mono else col))
    p.append('</svg>')
    return ''.join(p)


MARK = _svg()                       # 헤더용 — 오행 다섯 색
MARK_MONO = _svg(mono=True)         # 작은 자리용 — 금색 하나

# 파비콘은 파일을 따로 올리지 않고 data URI 로 넣는다.
# 경로 데이터에 공백이 들어 있어서 그대로 두면 href 가 거기서 끊긴다. 전부 인코딩한다.
FAVICON = 'data:image/svg+xml,' + quote(_svg(mono=True, attrs=''), safe="~()*!.'")

# 헤더에 들어가는 마크의 크기. 페이지마다 글자 크기가 달라 두 가지를 쓴다.
#
# 좁은 화면에서 메뉴의 '계산기' 를 숨긴다. 마크를 넣으면서 30px 을 더 먹어
# 390px 에서 '글' 한 글자가 둘째 줄로 떨어졌다. 로고 자체가 / 로 가는 링크라
# '계산기' 는 같은 곳을 두 번 가리키는 항목이다. 지울 것이 있으면 이것부터 지운다.
# 헤더의 작은 프로필 — 캐릭터가 있을 때만 들어찬다.
CHIP = ('.fpchip{display:inline-flex;align-items:center;gap:5px;text-decoration:none;'
        'background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:999px;'
        'padding:3px 9px 3px 3px;font-size:13px;font-weight:700;color:var(--ink)}'
        '.fpchip i{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;'
        'font-style:normal;font-size:11px;font-weight:800;color:#0a0f18;'
        'font-family:"Noto Serif KR",serif}'
        '@media(max-width:430px){.fpchip b{display:none}.fpchip{padding:3px}}')

CSS = (CHIP +
       '.mk{width:24px;height:24px;flex:none;display:block}'
       # 메뉴 링크 누름 영역 — 손가락 기준 최소 40px (루프1 플레이테스트: 15px 였다)
       'header nav a,.bar nav a,.top-bar nav a,footer a{display:inline-flex;align-items:center;min-height:40px}'
       'main .h a,main a[data-cta]{display:inline-flex;align-items:center;min-height:40px}'
       '.bar .mk,.top-bar .mk{width:21px;height:21px}'
       '@media(max-width:430px){'
       'header.site nav a[href="/"],.bar nav a[href="/"],.top-bar nav a[href="/"]{display:none}'
       'header.site nav,.bar nav,.top-bar nav{gap:12px}}')

# 내 오행 캐릭터는 모든 페이지가 같은 파일에서 읽는다. 페이지마다 따로
# 물어보면 사용자는 같은 걸 세 번 입력하게 된다.
HEAD = ('<link rel="icon" href="%s">'
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">'
        # defer 를 붙이면 안 된다. 본문 끝의 일반 <script> 가 defer 보다 먼저
        # 돌아서, 지도처럼 바로 FP 를 읽는 페이지에서 window.FP 가 없다.
        # 2.7KB 라 동기로 받아도 체감되지 않는다. (2026-09-20)
        # 계정 설정 — deploy.py 가 SUPABASE 값으로 채운다(비어 있으면 로그인 없이 돈다).
        '<script>window.FPCFG={}</script>'
        '<script src="/me.js"></script>' % FAVICON)


def set_config(sb_url, sb_key):
    """deploy.py 에서 한 번 부른다. 모든 페이지 머리에 같은 계정 설정이 박힌다."""
    import json
    global HEAD
    cfg = json.dumps({'sbUrl': sb_url or '', 'sbKey': sb_key or ''})
    HEAD = HEAD.replace('window.FPCFG={}', 'window.FPCFG=' + cfg)
