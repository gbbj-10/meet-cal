# -*- coding: utf-8 -*-
"""쿠팡파트너스 다이나믹 배너 — 애드센스 광고 칸을 대신한다 (2026-10-25 사용자 요청, 블로그팀).

애드센스가 '가치가 별로 없는 콘텐츠'로 거절(10/18)돼 광고 칸이 비어 있는 동안,
같은 자리에 쿠팡파트너스 배너를 띄운다. 자리를 새로 늘리지 않는다.

  자리: 블로그 글 계산기 결과 아래(CALC·LOVECALC) · 사이트 첫 화면(hub) · 오늘의 기운(iljin)
  되돌리기: ON = False 한 줄 → 다시 애드센스 <ins> 칸이 나온다.
  애드센스 스크립트(<head>)·ads.txt 는 그대로 둔다 — 재심사 때 코드가 페이지에 있어야 한다.

쿠팡파트너스 규칙 (블로그팀/70_쿠팡파트너스_사전학습.md)
  - 대가성 문구를 배너 바로 위에, 본문 글자 크기로. 블로그 글은 제목 아래에도 한 번(build.py).
  - 쿠팡이 발급한 코드 그대로(채널 meetcal.co.kr, trackingCode AF2513653). 수정·단축 URL 금지.
  - 플로팅·고정 배너, '쿠팡 방문하고 콘텐츠 더보기', 자동 이동·자동 클릭 금지.
  - 계산기 결과·게임 CTA 가 배너보다 위(퍼널이 먼저).
PC(폭 680px 이상)는 680×140, 모바일은 320×100 하나만 보인다.
"""
import json
import re

ON = True
DISC = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'
PC = {"id": 1043126, "template": "carousel", "trackingCode": "AF2513653",
      "width": "680", "height": "140", "tsource": ""}
MO = {"id": 1043128, "template": "carousel", "trackingCode": "AF2513653",
      "width": "320", "height": "100", "tsource": ""}

CSS = ('<style>.cpb{margin:10px 0 0}'
       '.cpb .cp-disc{font-size:15px;line-height:1.6;color:#d7dde7;margin:0 0 10px}'
       '.cpb .cp-pc,.cpb .cp-mo{text-align:center;overflow:hidden}'
       '.cpb iframe{max-width:100%}'
       '.cpb .cp-mo{display:none}'
       '@media(max-width:719px){.cpb .cp-pc{display:none}.cpb .cp-mo{display:block}}'
       '</style>')


def unit():
    """배너 한 칸. 쿠팡 코드는 발급받은 모양 그대로(g.js + new PartnersCoupang.G)."""
    g = '<script src="https://ads-partners.coupang.com/g.js"></script>'
    pc = f'<script>new PartnersCoupang.G({json.dumps(PC, ensure_ascii=False)});</script>'
    mo = f'<script>new PartnersCoupang.G({json.dumps(MO, ensure_ascii=False)});</script>'
    return (f'{CSS}<div class="cpb"><p class="cp-disc">{DISC}</p>'
            f'<div class="cp-pc">{g}{pc}</div><div class="cp-mo">{mo}</div></div>')


_INS = re.compile(r'<ins class="adsbygoogle".*?</ins>', re.S)


def swap(page):
    """hub·iljin 처럼 애드센스 <ins> 를 직접 쓰는 페이지: ON 이면 그 칸만 배너로 바꾼다."""
    if not ON:
        return page
    return _INS.sub(lambda m: unit(), page, count=1)
