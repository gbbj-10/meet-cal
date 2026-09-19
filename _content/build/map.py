# -*- coding: utf-8 -*-
"""/map/ — 환영 화면과 지도.

지도는 **화면을 재서 그립니다.** 고정된 그림판을 늘렸다 줄였다 하는 게 아니라,
브라우저 창의 실제 폭과 남은 높이를 읽어 viewBox 를 그 픽셀 수로 잡고,
건물 위치는 비율로, 크기는 짧은 변에 비례해 계산합니다. 그래서

  · 글자 크기가 화면에 따라 줄어들지 않습니다 (1 단위 = 1 픽셀)
  · 가로가 긴 화면이면 좌우로 퍼지고, 세로가 긴 화면이면 아래에서 위로 오릅니다
    — 폭이 아니라 **비율**로 고르므로 휴대폰 가로·태블릿 세로도 제대로 걸립니다
  · 지도가 늘 한 화면에 들어옵니다

건물 그림은 게임 캐릭터와 같은 회화 화풍이고, 만든 방법은 build/mk_mapart.py 에 있습니다.
"""
import html
import json

SITE_ROOT = 'https://meetcal.co.kr'
TITLE = '지도 — 오행 이야기'
DESC  = ('사주각·십간의 기록·명식의 탑·십이지 궁·연의 저울. '
         '사주 여덟 글자로 만든 캐릭터로 돌아다니는 오행 세계의 지도입니다.')

COL = {'목': '#6fd07d', '화': '#f2634f', '토': '#e0b636',
       '금': '#b3c0d2', '수': '#5aa6ee'}
HJ  = {'목': '木', '화': '火', '토': '土', '금': '金', '수': '水'}

# (id, 이름, 한자, 오행, 그림, 크기배율, 한 줄, 설명, 링크, 상태, 버튼)
# '한 줄' 과 '버튼' 은 이 건물에서 **무엇을 하는가**를 말한다. 이름의 유래가 아니라.
SPOTS = [
    ('sajugak', '사주각', '四柱閣', '토', 'to', 1.00,
     '생년월일시를 넣으면 내 오행 캐릭터가 나옵니다',
     '태어난 해·달·날·시각으로 사주 여덟 글자를 계산하고, 그중 어떤 오행이 몰려 있고 '
     '무엇이 비어 있는지 보여 줍니다. 여기서 나온 캐릭터가 다른 건물의 입장권입니다.',
     '/', '열림', '캐릭터 생성'),
    ('jeondang', '십간의 기록', '十干記錄', '수', 'su', 0.70,
     '사주를 계산해서 쓴 글을 읽습니다',
     '26만 명분을 직접 세어 본 달별 오행 분포, 태어난 시간을 찾는 세 가지 방법, '
     '부족한 오행과 보완 방향 — 나오는 숫자는 전부 다시 계산해 볼 수 있는 것들입니다.',
     '/ohaeng/', '열림', '사주 이야기'),
    ('gung', '십이지 궁', '十二支宮', '화', 'hwa', 0.70,
     '친구들의 오행 캐릭터와 함께 용신석을 모읍니다',
     '열두 수호신이 지키는 방을 돌며 용신석을 모읍니다. 오행이 서로 맞는 캐릭터끼리 '
     '모이면 더 잘 싸웁니다. 지금 만들고 있습니다.',
     None, '준비 중', '사냥하기'),
    ('jeoul', '연의 저울', '緣—', '목', 'mok', 0.70,
     '내 조건으로 만날 수 있는 이성의 조건을 봅니다',
     '나이·연봉·자산·학력·외모·신체 여섯 항목을 넣으면 통계로 맞춘 상대 조건이 나옵니다. '
     '마음에 안 드는 항목은 고정해 두고 나머지를 다시 계산할 수도 있습니다.',
     '/love/', '열림', '이성 매칭 계산기'),
    ('tap', '명식의 탑', '命式塔', '금', 'geum', 0.70,
     '사냥터에서 올린 기록으로 순위를 봅니다',
     '내 캐릭터가 몇 층까지 올라갔는지, 같은 오행을 가진 사람들 사이에서 몇 등인지 '
     '볼 수 있게 만들고 있습니다. 아직 올라간 기록이 없습니다.',
     None, '준비 중', '랭킹 조회'),
]
ROADS = [['sajugak', 'jeondang'], ['sajugak', 'tap'],
         ['jeondang', 'gung'], ['tap', 'jeoul']]

# 위치는 폭·높이에 대한 비율. 화면이 어떤 크기든 같은 구도가 나온다.
POS = {
    'wide': {'sajugak': [.500, .645], 'jeondang': [.152, .484],
             'gung':    [.322, .200], 'jeoul':    [.678, .200],
             'tap':     [.848, .484]},
    'tall': {'sajugak': [.500, .815], 'jeondang': [.231, .600],
             'tap':     [.769, .600], 'gung':     [.278, .315],
             'jeoul':   [.722, .315]},
}


def spot_json():
    return json.dumps([{
        'id': s[0], 'nm': s[1], 'el': s[3], 'img': s[4], 'k': s[5],
        'one': s[6], 'lock': s[9] != '열림',
        'col': COL[s[3]], 'hj': HJ[s[3]],
    } for s in SPOTS], ensure_ascii=False, separators=(',', ':'))


def panels():
    o = []
    for sid, nm, hj, el, img, k, one, desc, link, state, act in SPOTS:
        btn = (f'<a class="enter" href="{link}" data-cta="enter_{sid}">{act} &rarr;</a>'
               if link else f'<span class="enter off">{act} <i>준비 중</i></span>')
        o.append(
            f'<div class="panel" id="p-{sid}" hidden>'
            f'<div class="pic" style="background-image:url(img/spot-{img}.jpg)"></div>'
            f'<div class="pb">'
            f'<div class="ph"><span class="dot" style="background:{COL[el]}"></span>'
            f'<b>{nm}</b><span class="hj">{hj}</span>'
            f'<button class="x" data-close aria-label="닫기">&times;</button></div>'
            f'<p class="one">{one}</p><p class="ds">{html.escape(desc)}</p>{btn}'
            f'</div></div>')
    return ''.join(o)


def fallback():
    """자바스크립트가 안 돌아도, 크롤러가 와도 건물 목록과 링크는 남는다."""
    o = ['<ul class="flist" id="flist">']
    for sid, nm, hj, el, img, k, one, desc, link, state, act in SPOTS:
        a = (f'<a href="{link}">{nm} — {act}</a>' if link
             else f'<span>{nm} — {act} (준비 중)</span>')
        o.append(f'<li><i style="background:{COL[el]}">{HJ[el]}</i>{a}'
                 f'<em>{one}</em></li>')
    o.append('</ul>')
    return ''.join(o)


PAGE = r"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<link rel="canonical" href="__ROOT__/map/">
<meta property="og:type" content="website">
<meta property="og:title" content="오행 세계의 지도">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__ROOT__/map/">
<meta property="og:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
<link rel="preload" as="image" href="img/map-bg.jpg">
__GA__
<style>
:root{--ink:#eaeef5;--mut:#9aa6b8;--dim:#6f7d92;--line:#232c3c;--acc:#5b9bf0}
*{box-sizing:border-box}
html,body{margin:0;background:#080c13;color:var(--ink);
 font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
 word-break:keep-all;-webkit-text-size-adjust:100%}
a{color:var(--acc)}
.bar{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--line)}
.bar .nm{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none}
.bar nav{margin-left:auto;display:flex;gap:14px}
.bar nav a{font-size:14px;color:var(--mut);text-decoration:none}

.mapwrap{max-width:1180px;margin:0 auto;position:relative}
svg.map{display:block;width:100%}
.spot{cursor:pointer}
.spot .nm{fill:#eef2f8;font-weight:700}
.spot .st{fill:#8a97ab}
.spot .el{fill:#0a0f18;font-weight:800;
  font-family:"Noto Serif KR","Apple SD Gothic Neo",serif}
.spot:hover,.spot:focus{outline:none}
.spot:hover image,.spot:focus image{filter:brightness(1.15)}
.spot .pulse{transform-origin:center;animation:pl 3.4s ease-in-out infinite}
.spot.locked{opacity:.88}
.spot.locked .pulse{display:none}
@keyframes pl{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.035);opacity:.04}}
@media(prefers-reduced-motion:reduce){.spot .pulse{animation:none}}
.hint{text-align:center;color:var(--dim);font-size:13.5px;padding:11px 18px 24px;margin:0}

/* 자바스크립트가 못 돌 때의 건물 목록 */
.flist{list-style:none;margin:0 auto;padding:18px;max-width:560px}
.flist li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:12px 0;border-bottom:1px solid var(--line)}
.flist i{font-style:normal;width:26px;height:26px;border-radius:50%;color:#0a0f18;
  display:grid;place-items:center;font-weight:800;flex:none}
.flist a,.flist span{font-weight:700;font-size:16px;text-decoration:none}
.flist span{color:var(--dim)}
.flist em{flex:1 0 100%;font-style:normal;font-size:13.5px;color:var(--mut)}

.sheet{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;justify-content:center;
  pointer-events:none;padding:0 12px max(12px,env(safe-area-inset-bottom))}
.panel{pointer-events:auto;width:100%;max-width:520px;background:#111825;
  border:1px solid #27324a;border-radius:16px;overflow:hidden;
  box-shadow:0 -6px 44px rgba(0,0,0,.6);animation:up .18s ease-out}
@keyframes up{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.panel .pic{height:clamp(84px,14vh,132px);background-size:cover;background-position:center 42%}
.panel .pb{padding:14px 18px 18px}
.ph{display:flex;align-items:center;gap:8px}
.ph .dot{width:9px;height:9px;border-radius:50%;flex:none}
.ph b{font-size:18px}
.ph .hj{font-size:13px;color:var(--dim)}
.ph .x{margin-left:auto;background:0;border:0;color:var(--dim);font-size:26px;line-height:1;
  cursor:pointer;padding:0 2px}
.one{margin:10px 0 6px;font-size:15px;color:#c6d0df}
.ds{margin:0 0 14px;font-size:14px;line-height:1.75;color:var(--mut)}
.enter{display:block;text-align:center;padding:13px;border-radius:11px;background:var(--acc);
  color:#08111f;font-weight:700;text-decoration:none;font-size:15.5px}
.enter.off{background:#222c3e;color:#8b98ac}
.enter.off i{font-style:normal;font-size:13px;color:#6f7d92;margin-left:6px}

.hello{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:24px;
  background:#080c13 center/cover no-repeat}
.hello::before{content:"";position:absolute;inset:0;background:rgba(8,12,19,.62)}
.hello > *{position:relative}
.hello img{width:min(86vw,520px);height:auto;max-height:34vh;object-fit:contain;
  border-radius:14px;margin-bottom:10px}
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
  <img src="/ohaeng/img/og-ohaeng.png" alt="다섯 오행 캐릭터">
  <h1>사주 여덟 글자가<br>내 캐릭터가 됩니다</h1>
  <p>태어난 해·달·날·시각 네 기둥을 계산해서<br>목·화·토·금·수 다섯 속성 중 하나를 찾아 드립니다.</p>
  <button id="start">시작하기</button>
  <button class="skip" id="skip">바로 지도 보기</button>
</div>

<div class="bar">
  <a class="nm" href="/">오행 이야기</a>
  <nav><a href="/iljin/">일진</a><a href="/">계산기</a><a href="/ohaeng/">글</a>
       <a href="/love/">이성 계산기</a></nav>
</div>

<div class="mapwrap" id="mapwrap">
  <svg class="map" id="map" role="img"
       aria-label="오행 세계 지도 — 사주각, 십간의 기록, 명식의 탑, 십이지 궁, 연의 저울"></svg>
</div>
<p class="hint" id="hint">건물을 누르면 설명이 나옵니다. 아직 문이 열리지 않은 곳도 있습니다.</p>

__FALLBACK__

<div class="sheet" id="sheet">__PANELS__</div>

<script>
(function(){
var $=function(i){return document.getElementById(i)};
var SPOTS=__SPOTS__, ROADS=__ROADS__, POS=__POS__;
var NS='http://www.w3.org/2000/svg';

// ── 환영 화면은 처음 온 사람에게만 ──
var seen=null; try{ seen=localStorage.getItem('ohaeng_seen') }catch(e){}
if(seen) $('hello').hidden=true;
function enter(){ $('hello').hidden=true;
  try{ localStorage.setItem('ohaeng_seen','1') }catch(e){}
  if(window.gtag) gtag('event','map_enter',{first: !seen});
  draw(); }
$('start').addEventListener('click',enter);
$('skip').addEventListener('click',enter);

// ── 지도 그리기 ── 화면을 재서 그 픽셀 수로 그린다
var svg=$('map'), wrap=$('mapwrap'), mode=null;

function measure(){
  var W = wrap.clientWidth;
  var top = wrap.getBoundingClientRect().top;
  var hint = $('hint').offsetHeight || 46;
  var avail = window.innerHeight - top - hint - 8;
  // 세로로 너무 길어지지도, 너무 납작해지지도 않게 가둔다
  var H = Math.min(Math.max(avail, 340), W * 1.62);
  H = Math.max(H, 300);
  return {W: Math.round(W), H: Math.round(H)};
}

function draw(){
  var m=measure(), W=m.W, H=m.H;
  if(!W) return;
  // 폭이 아니라 비율로 고른다 — 휴대폰 가로도, 태블릿 세로도 제대로 걸린다
  var md = (W / H > 1.15) ? 'wide' : 'tall';
  var base = Math.max(44, Math.min(112, Math.min(W, H) * 0.155));
  // 글자는 화면과 함께 줄어들면 안 된다 — 픽셀로 잡고 아주 작은 화면에서만 살짝 줄인다
  var fN = Math.max(13, Math.min(16, base*0.20));
  var fS = fN - 3, fE = Math.max(13, Math.min(18, base*0.23));
  var br = Math.max(13, base*0.175);

  var P = POS[md], at = {};
  SPOTS.forEach(function(s){
    var p = P[s.id], r = Math.round(base * s.k);
    var lh = s.lock ? fN+fS+16 : fN+12;          // 이름표 높이
    // 원도 이름표도 지도 밖으로 나가지 않게 가둔다
    var minY = 4 + r + br, maxY = H - 6 - lh - 12 - r;
    var y = Math.min(Math.max(p[1]*H, minY), Math.max(minY, maxY));
    at[s.id] = {x: p[0]*W, y: y, r: r};
  });

  var rs = {}, o = [];
  SPOTS.forEach(function(s){ rs[at[s.id].r] = 1 });
  o.push('<defs><filter id="glow" x="-70%" y="-70%" width="240%" height="240%">'+
         '<feGaussianBlur stdDeviation="'+(base*0.16).toFixed(1)+'"/></filter>'+
         '<filter id="dim"><feColorMatrix type="saturate" values="0.72"/></filter>'+
         '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">'+
         '<stop offset="0" stop-color="#080c13" stop-opacity=".55"/>'+
         '<stop offset=".45" stop-color="#080c13" stop-opacity="0"/>'+
         '<stop offset="1" stop-color="#080c13" stop-opacity=".75"/></linearGradient>');
  Object.keys(rs).forEach(function(r){
    o.push('<clipPath id="c'+r+'"><circle cx="0" cy="0" r="'+r+'"/></clipPath>');
  });
  o.push('</defs>');
  o.push('<image href="img/map-bg.jpg" x="0" y="0" width="'+W+'" height="'+H+
         '" preserveAspectRatio="xMidYMid slice"/>');
  o.push('<rect width="'+W+'" height="'+H+'" fill="url(#fade)"/>');

  ROADS.forEach(function(rd){
    var a=at[rd[0]], b=at[rd[1]];
    var mx=(a.x+b.x)/2, my=(a.y+b.y)/2 + (md==='wide' ? H*0.05 : 0);
    o.push('<path d="M '+a.x.toFixed(0)+','+a.y.toFixed(0)+' Q '+mx.toFixed(0)+','+
           my.toFixed(0)+' '+b.x.toFixed(0)+','+b.y.toFixed(0)+'" fill="none" '+
           'stroke="#c9b48a" stroke-opacity=".28" stroke-width="3" '+
           'stroke-dasharray="6 10" stroke-linecap="round"/>');
  });

  SPOTS.forEach(function(s){
    var a=at[s.id], r=a.r;
    o.push('<g class="spot'+(s.lock?' locked':'')+'" data-id="'+s.id+'" tabindex="0" '+
           'role="button" aria-label="'+s.nm+' — '+s.one+'" transform="translate('+
           a.x.toFixed(0)+','+a.y.toFixed(0)+')">');
    o.push('<circle r="'+(r+14)+'" fill="'+s.col+'" opacity=".30" filter="url(#glow)"/>');
    o.push('<circle class="pulse" r="'+(r+3)+'" fill="none" stroke="'+s.col+
           '" stroke-width="1.2" opacity=".35"/>');
    o.push('<image href="img/spot-'+s.img+'.jpg" x="'+(-r)+'" y="'+(-r)+'" width="'+(2*r)+
           '" height="'+(2*r)+'" clip-path="url(#c'+r+')" preserveAspectRatio="xMidYMid slice"'+
           (s.lock?' filter="url(#dim)"':'')+'/>');
    o.push('<circle r="'+r+'" fill="none" stroke="'+s.col+'" stroke-width="3.5"/>');
    o.push('<circle r="'+(r-3.5)+'" fill="none" stroke="#0a0f18" stroke-opacity=".55" stroke-width="2"/>');
    o.push('<g transform="translate(0,'+(-r-2)+')"><circle r="'+br.toFixed(1)+'" fill="'+s.col+
           '" stroke="#0a0f18" stroke-width="2"/><text class="el" y="'+(fE*0.36).toFixed(1)+
           '" text-anchor="middle" font-size="'+fE.toFixed(1)+'">'+s.hj+'</text></g>');
    var lh = s.lock ? fN+fS+16 : fN+12;
    o.push('<g class="lb" transform="translate(0,'+(r+12)+')">'+
           '<rect class="plate" x="-60" y="0" width="120" height="'+lh.toFixed(0)+
           '" rx="9" fill="#080c13" opacity=".78"/>'+
           '<text class="nm" y="'+(fN+5).toFixed(0)+'" text-anchor="middle" font-size="'+
           fN.toFixed(0)+'">'+s.nm+'</text>'+
           (s.lock?'<text class="st" y="'+(fN+fS+9).toFixed(0)+'" text-anchor="middle" font-size="'+
                   fS.toFixed(0)+'">준비 중</text>':'')+'</g>');
    o.push('</g>');
  });

  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.style.height=H+'px';
  svg.innerHTML=o.join('');

  // 이름표 배경은 글자를 실제로 재서 맞추고, 가장자리에서는 안쪽으로 밀어 넣는다
  Array.prototype.forEach.call(svg.querySelectorAll('.spot'), function(sp){
    var g=sp.querySelector('.lb'), t=g.querySelector('.nm'), p=g.querySelector('.plate');
    var w=Math.ceil(t.getComputedTextLength())+30;
    p.setAttribute('x', (-w/2).toFixed(0)); p.setAttribute('width', w);
    var a=at[sp.getAttribute('data-id')];
    var dx=0;
    if(a.x - w/2 < 6)      dx = 6 - (a.x - w/2);
    else if(a.x + w/2 > W-6) dx = (W-6) - (a.x + w/2);
    g.setAttribute('transform','translate('+dx.toFixed(0)+','+(a.r+12)+')');
  });
  bind();
  mode=md;
}

// ── 건물 누르기 ──
var open=null;
function show(id){
  if(open) open.hidden=true;
  var p=$('p-'+id); if(!p) return;
  p.hidden=false; open=p;
  if(window.gtag) gtag('event','spot_open',{spot:id});
}
function hide(){ if(open){ open.hidden=true; open=null } }
function bind(){
  Array.prototype.forEach.call(svg.querySelectorAll('.spot'), function(g){
    g.addEventListener('click', function(){ show(g.getAttribute('data-id')) });
    g.addEventListener('keydown', function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); show(g.getAttribute('data-id')) }
    });
  });
}
document.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click',hide) });
document.addEventListener('keydown',function(e){ if(e.key==='Escape') hide() });
document.addEventListener('click',function(e){
  if(open && !e.target.closest('.panel') && !e.target.closest('.spot')) hide();
});
document.addEventListener('click',function(e){
  var a=e.target.closest? e.target.closest('[data-cta]'):null;
  if(a&&window.gtag) gtag('event','cta_click',{where:a.getAttribute('data-cta')});
});

// ── 화면이 바뀌면 다시 잰다 ──
var t=null;
function redraw(){ clearTimeout(t); t=setTimeout(draw, 120) }
window.addEventListener('resize', redraw);
window.addEventListener('orientationchange', redraw);
if(window.ResizeObserver) new ResizeObserver(redraw).observe(wrap);

var f=$('flist'); if(f) f.parentNode.removeChild(f);   // 지도가 그려지니 목록은 뺀다
draw();
})();
</script>
</body></html>
"""


def render(ga_snippet):
    s = PAGE
    for k, v in (('__TITLE__', TITLE), ('__DESC__', DESC), ('__ROOT__', SITE_ROOT),
                 ('__GA__', ga_snippet), ('__PANELS__', panels()),
                 ('__FALLBACK__', fallback()),
                 ('__SPOTS__', spot_json()),
                 ('__ROADS__', json.dumps(ROADS, separators=(',', ':'))),
                 ('__POS__', json.dumps(POS, separators=(',', ':')))):
        s = s.replace(k, v)
    return s
