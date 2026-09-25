# -*- coding: utf-8 -*-
"""/map/ — 환영 화면과 지도.

지도는 **2열 버튼**이다 (2026-09-24 사용자 지시로 원형 건물 배치 지도에서 바꿈).
버튼마다 이름을 크게 적고, 건물 그림은 흐리게(불투명도 .42) 깔아 둔다.
버튼은 그냥 링크라서 자바스크립트가 없어도 들어갈 수 있다.

건물 그림은 게임 캐릭터와 같은 회화 화풍이고, 만든 방법은 build/mk_mapart.py 에 있다.
궁합소 그림(spot-gunghap.jpg)은 같은 화풍 문장으로 ChatGPT 이미지 생성으로 뽑았다.
"""
import brand
import html
import json

SITE_ROOT = 'https://meetcal.co.kr'
TITLE = '선택목록 — Four Paws'
DESC  = ('사주각·궁합소·십이지 궁·십간의 기록·연의 저울·명식의 탑. '
         '사주 여덟 글자로 만든 캐릭터로 들어가는 오행 세계의 선택목록입니다.')

COL = {'목': '#6fd07d', '화': '#f2634f', '토': '#ffd93d',
       '금': '#b3c0d2', '수': '#5aa6ee', '합': '#ff7eb0'}
HJ  = {'목': '木', '화': '火', '토': '土', '금': '金', '수': '水', '합': '合'}

# (id, 이름, 한자, 오행, 그림, 크기배율, 한 줄, 설명, 링크, 상태, 버튼)
# '한 줄' 과 '버튼' 은 이 건물에서 **무엇을 하는가**를 말한다. 이름의 유래가 아니라.
SPOTS = [
    ('sajugak', '사주각', '四柱閣', '토', 'to', 1.00,
     '생년월일시를 넣으면 내 오행 캐릭터가 나옵니다',
     '태어난 해·달·날·시각으로 사주 여덟 글자를 계산하고, 그중 어떤 오행이 몰려 있고 '
     '무엇이 비어 있는지 보여 줍니다. 여기서 나온 캐릭터가 다른 건물의 입장권입니다.',
     '/', '열림', '캐릭터 생성'),
    ('gunghap', '궁합소', '宮合所', '합', 'gunghap', 0.70,
     '상대를 카카오톡으로 불러 두 사람의 궁합을 봅니다',
     '초대받은 사람이 생년월일을 넣으면 두 사람의 사주 여덟 글자로 궁합을 계산합니다. '
     '두 오행 댕댕이가 함께 노는 모습도 볼 수 있습니다. 카카오 계정이 필요합니다.',
     '/gunghap/', '열림', '궁합 보기'),
    ('gung', '십이지 궁', '十二支宮', '화', 'hwa', 0.70,
     '친구 넷과 함께 오행 사냥터로 들어갑니다',
     '오행 사냥터 다섯 곳 중 한 곳을 고릅니다. 오늘의 기운과 내 사주로 유리한 곳을 '
     '짚어 드리고, 빈 자리는 카카오톡으로 친구를 불러 채웁니다. 카카오 계정이 필요합니다.',
     '/hunt/', '열림', '사냥하기'),
    ('jeondang', '십간의 기록', '十干記錄', '수', 'su', 0.70,
     '사주를 직접 계산해서 쓴 사주 이야기를 읽습니다',
     '26만 명분을 직접 세어 본 달별 오행 분포, 태어난 시간을 찾는 세 가지 방법, '
     '부족한 오행과 보완 방향 — 나오는 숫자는 전부 다시 계산해 볼 수 있는 것들입니다.',
     '/ohaeng/', '열림', '사주 이야기'),
    ('jeoul', '연의 저울', '緣—', '목', 'mok', 0.70,
     '내 조건으로 만날 수 있는 이성의 조건을 봅니다',
     '나이·연봉·자산·학력·외모·신체 여섯 항목을 넣으면 통계로 맞춘 상대 조건이 나옵니다. '
     '마음에 안 드는 항목은 고정해 두고 나머지를 다시 계산할 수도 있습니다.',
     '/love/', '열림', '이성 조건 계산기'),
    ('tap', '명식의 탑', '命式塔', '금', 'geum', 0.70,
     '사냥터에서 올린 기록으로 순위를 봅니다',
     '내 캐릭터가 몇 층까지 올라갔는지, 같은 오행을 가진 사람들 사이에서 몇 등인지 '
     '볼 수 있게 만들고 있습니다. 아직 올라간 기록이 없습니다.',
     None, '준비 중', '랭킹 조회'),
]
def tiles():
    """2열 버튼. 이름을 크게 적고, 건물 그림은 흐리게 깔아 둔다.
    자바스크립트가 없어도 그대로 링크라서 크롤러·구형 브라우저도 들어갈 수 있다."""
    o = ['<div class="grid" id="grid">']
    for sid, nm, hj, el, img, k, one, desc, link, state, act in SPOTS:
        lock = state != '열림'
        tag = 'span' if lock else 'a'
        href = '' if lock else f' href="{link}"'
        o.append(
            f'<{tag} class="tile{" locked" if lock else ""}" id="t-{sid}"{href} data-cta="tile_{sid}" '
            f'style="--c:{COL[el]};--img:url(img/spot-{img}.jpg)" aria-label="{nm} — {html.escape(one)}">'
            f'<i class="hj">{HJ[el]}</i>'
            f'<b class="tn">{nm}</b>'
            f'<span class="ta">{act}{" · 준비 중" if lock else ""}</span>'
            f'</{tag}>')
    o.append('</div>')
    return ''.join(o)


PAGE = r"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1119">
__HEAD__
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
            "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}}
</script>
<meta name="color-scheme" content="dark">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<link rel="canonical" href="__ROOT__/map/">
<meta property="og:type" content="website">
<meta property="og:title" content="오행 세계 선택목록">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__ROOT__/map/">
<meta property="og:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
__GA__
<style>
:root{--ink:#eaeef5;--mut:#9aa6b8;--dim:#6f7d92;--line:#232c3c;--acc:#5b9bf0;--to:#ffd93d}
*{box-sizing:border-box}
html,body{margin:0;background:#080c13;color:var(--ink);
 font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
 word-break:keep-all;-webkit-text-size-adjust:100%}
a{color:var(--acc)}
.bar{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--line)}
.bar .nm{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none;
  letter-spacing:-.02em;display:flex;align-items:center;gap:8px;min-height:40px}
__MKCSS__
.bar .tl{font-size:12px;color:var(--dim);margin-left:-3px}
@media(max-width:560px){.bar .tl{display:none}}
.bar nav{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap}
.bar nav a.hl{color:var(--to);font-weight:700}
.bar nav a{font-size:14px;color:var(--mut);text-decoration:none}

/* ── 2열 버튼 지도 (2026-09-24) ── 건물 그림은 흐리게 깔고 이름을 크게 */
.grid{max-width:720px;margin:0 auto;padding:16px 16px 6px;display:grid;
  grid-template-columns:1fr 1fr;gap:12px}
.tile{position:relative;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;
  aspect-ratio:1/0.92;padding:14px 14px 13px;border-radius:18px;overflow:hidden;
  text-decoration:none;color:var(--ink);background:#101723;
  border:1.5px solid color-mix(in srgb,var(--c) 55%,transparent);
  box-shadow:0 6px 24px rgba(0,0,0,.35);transition:transform .12s,border-color .12s}
.tile::before{content:"";position:absolute;inset:0;background:var(--img) center 40%/cover no-repeat;
  opacity:.42;transition:opacity .15s}
.tile::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(8,12,19,.05) 30%,rgba(8,12,19,.86) 100%)}
.tile > *{position:relative;z-index:1}
.tile:hover,.tile:focus-visible{transform:translateY(-2px);border-color:var(--c);outline:none}
.tile:hover::before,.tile:focus-visible::before{opacity:.58}
.tile:active{transform:scale(.98)}
.tile .hj{position:absolute;top:11px;left:11px;width:30px;height:30px;border-radius:50%;
  display:grid;place-items:center;font-style:normal;font-weight:800;font-size:15px;color:#0a0f18;
  background:var(--c);font-family:"Noto Serif KR","Apple SD Gothic Neo",serif;
  box-shadow:0 0 0 2px rgba(8,12,19,.6)}
.tile .tn{font-size:clamp(18px,5vw,22px);letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.9)}
.tile .ta{font-size:13px;color:#c9d2df;text-shadow:0 1px 8px rgba(0,0,0,.9)}
.tile.locked{filter:grayscale(.7);cursor:default}
.tile.locked::before{opacity:.25}
.tile.locked .ta{color:#8a97ab}
#t-gunghap .ta::after{content:"NEW";margin-left:6px;font-size:10.5px;font-weight:800;color:#0a0f18;
  background:var(--c);border-radius:5px;padding:1px 5px;vertical-align:1px}
.hint{text-align:center;color:var(--dim);font-size:13.5px;padding:8px 18px 10px;margin:0}
.foot{max-width:720px;margin:0 auto;padding:4px 16px 30px;display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center}
.foot a{color:var(--dim);font-size:13px;text-decoration:none}

.hello{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:24px;
  background:#080c13 center/cover no-repeat}
.hello::before{content:"";position:absolute;inset:0;background:rgba(8,12,19,.62)}
.hello > *{position:relative}
.hello img{width:min(86vw,520px);height:auto;max-height:34vh;object-fit:contain;
  border-radius:14px;margin-bottom:10px}
.hello .dog{width:min(78vw,340px);height:min(38vh,270px);margin-bottom:4px}
.hello .dog canvas{display:block;width:100%;height:100%}
.hello .el{display:inline-flex;align-items:center;gap:7px;margin-bottom:10px;
  background:rgba(0,0,0,.45);border-radius:999px;padding:5px 14px 5px 5px;
  font-size:14px;font-weight:700}
.hello .el i{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;
  font-style:normal;font-size:13px;font-weight:800;color:#0a0f18;
  font-family:"Noto Serif KR",serif}
.hello h1{font-size:clamp(22px,5.4vw,33px);margin:0;letter-spacing:-.02em;line-height:1.35;
  text-shadow:0 2px 18px rgba(0,0,0,.8)}
.hello p{color:#b7c2d2;margin:10px 0 22px;font-size:clamp(14px,3.6vw,16px);line-height:1.7;
  text-shadow:0 1px 12px rgba(0,0,0,.8)}
.hello button{padding:15px 44px;border:0;border-radius:12px;background:var(--acc);color:#08111f;
  font:inherit;font-size:17px;font-weight:800;cursor:pointer}
.hello .skip{margin-top:14px;background:0;color:#8e9bae;font-size:13.5px;padding:6px;
  border:0;cursor:pointer;text-decoration:underline}
.hello[hidden]{display:none}
@media(max-height:520px){ .hello img{max-height:26vh} .hello p{margin-bottom:14px} }
</style>
</head><body>

<div class="hello" id="hello" style="background-image:url(img/map-bg.jpg)">
  <!-- 캐릭터가 있으면 여기에 그 개가 서 있고, 없으면 아래 안내가 나온다 -->
  <div class="dog" id="dog" hidden></div>
  <img id="hello-img" src="/ohaeng/img/og-ohaeng.png" alt="다섯 오행 캐릭터">
  <h1 id="hello-h">사주 여덟 글자가<br>내 캐릭터가 됩니다</h1>
  <p id="hello-p">태어난 해·달·날·시각 네 기둥을 계산해서<br>목·화·토·금·수 다섯 속성 중 하나를 찾아 드립니다.</p>
  <button id="start">시작하기</button>
  <button class="skip" id="skip">바로 선택목록 보기</button>
</div>

<div class="bar">
  <a class="nm" href="/">__MARK__Four&nbsp;Paws</a><span class="tl">오행 댕댕이 키우기</span>
  <nav><a class="hl" href="/map/" aria-current="page">선택목록</a><a href="/ohaeng/">사주 이야기</a><span data-fp-chip></span></nav>
</div>

__TILES__
<p class="hint">버튼을 누르면 바로 들어갑니다. 아직 문이 열리지 않은 곳도 있습니다.</p>
<footer class="foot"><a href="/">처음으로</a><a href="/hunt/">사냥터</a><a href="/gunghap/">궁합소</a><a href="/iljin/">오늘의 기운</a><a href="/ohaeng/">사주 이야기</a><a href="/love/">이성 조건 계산기</a></footer>

<script>
(function(){
var $=function(i){return document.getElementById(i)};
var COL=__COL__;

// ── 들어서는 화면 ──
// 캐릭터가 있으면 **그 개가 가운데 서 있는 화면**으로 맞이한다.
// 홈에서 막 만들고 넘어온 사람(?new=1)에게는 늘 보여 준다.
var seen=null; try{ seen=localStorage.getItem('ohaeng_seen') }catch(e){}
var fresh=/[?&]new=1/.test(location.search);
var MYEL=(window.FP&&FP.el())||null;

if(MYEL){
  var HJ={목:'木',화:'火',토:'土',금:'金',수:'水'};
  var SAY={목:'뻗어 나가는 성질입니다.',화:'퍼지는 성질입니다.',토:'품는 성질입니다.',
           금:'가르는 성질입니다.',수:'스미는 성질입니다.'};
  $('hello-img').hidden=true;
  $('dog').hidden=false;
  $('hello-h').innerHTML='<span class="el"><i style="background:'+(COL[MYEL]||'#8e9bb0')+'">'+
    HJ[MYEL]+'</i>'+MYEL+' 속성</span><br>오행 캐릭터가 준비됐습니다';
  $('hello-p').textContent=SAY[MYEL]+' 궁합소·사냥터·기운·글로 갑니다.';
  $('start').textContent='선택목록 보기';
  $('skip').hidden=true;
  import('/3d/profile3d.js').then(function(m){
    return m.showDog({mount:$('dog'), base:'/3d/', el:MYEL});
  }).catch(function(){ $('dog').hidden=true; $('hello-img').hidden=false; });
}
if(seen && !fresh) $('hello').hidden=true;
function enter(){ $('hello').hidden=true;
  try{ localStorage.setItem('ohaeng_seen','1') }catch(e){}
  if(window.gtag) gtag('event','map_enter',{first: !seen}); }
$('start').addEventListener('click',enter);
$('skip').addEventListener('click',enter);

/* 사주각은 프로필 건물이다. 캐릭터가 있으면 홈으로 보내지 않고
   지도에 들어설 때 봤던 그 화면(가운데 3D 개)을 다시 띄운다. */
if(MYEL){
  var t=$('t-sajugak');
  if(t){ t.querySelector('.ta').textContent='내 캐릭터 보기';
    t.addEventListener('click',function(e){
      e.preventDefault(); $('hello').hidden=false; window.scrollTo(0,0);
      if(window.gtag) gtag('event','cta_click',{cta:'saju_show_dog'});
    }); }
}
document.addEventListener('click',function(e){
  var a=e.target.closest? e.target.closest('[data-cta]'):null;
  if(a&&window.gtag) gtag('event','cta_click',{where:a.getAttribute('data-cta')});
});
if(window.FP&&FP.paintAccount) FP.paintAccount();
})();
</script>
</body></html>
"""


def render(ga_snippet):
    s = PAGE
    for k, v in (('__MARK__', brand.MARK), ('__HEAD__', brand.HEAD),
                 ('__MKCSS__', brand.CSS),
                 ('__TITLE__', TITLE), ('__DESC__', DESC), ('__ROOT__', SITE_ROOT),
                 ('__GA__', ga_snippet), ('__TILES__', tiles()),
                 ('__COL__', json.dumps(COL, ensure_ascii=False, separators=(',', ':')))):
        s = s.replace(k, v)
    return s
