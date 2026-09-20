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
CSS = ('.mk{width:24px;height:24px;flex:none;display:block}'
       '.bar .mk,.top-bar .mk{width:21px;height:21px}'
       '@media(max-width:430px){'
       'header.site nav a[href="/"],.bar nav a[href="/"],.top-bar nav a[href="/"]{display:none}'
       'header.site nav,.bar nav,.top-bar nav{gap:12px}}')

HEAD = ('<link rel="icon" href="%s">'
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' % FAVICON)
