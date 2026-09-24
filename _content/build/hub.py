# -*- coding: utf-8 -*-
"""사이트 루트(/) 허브 페이지 — 사주·오행이 중심이 되는 첫 화면.

이성 조건 계산기는 /love/ 로 내리고, 루트는 생년월일 → 사주 여덟 글자 →
오행 분포 → 내 속성 캐릭터를 보여 주는 도구가 맡습니다.
글 카드는 deploy.py 가 넘겨주는 실제 글 목록으로 채워지므로,
초고를 하나 올리면 루트 첫 화면도 같이 갱신됩니다.
"""
import brand
import html

SITE_ROOT = 'https://meetcal.co.kr'
TITLE = '사주 오행 계산기 — 생년월일로 만드는 내 오행 캐릭터 | Four Paws'
DESC  = ('생년월일시를 넣으면 사주 여덟 글자와 오행 비율, 내 대표 속성과 '
         '부족한 오행을 계산해 보여 줍니다. 만세력을 직접 계산합니다.')

PAGE = r"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0d1119">
__HEAD__
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
            "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}}
</script>
<meta name="color-scheme" content="dark">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<link rel="canonical" href="__ROOT__/">
<meta property="og:type" content="website">
<meta property="og:title" content="생년월일로 만드는 내 오행 캐릭터">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__ROOT__/">
<meta property="og:site_name" content="Four Paws">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
__GA__
<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=__ADCLIENT__"></script>
<style>
:root{--ink:#e9eef6;--mut:#96a3b6;--dim:#6b7789;--line:#242d3d;--bg:#0d1119;--soft:#151b26;
      --pan:#151b26;--acc:#5b9bf0;--mok:#4fb95f;--hwa:#e8483c;--to:#ffd93d;--geum:#8e9bb0;--su:#3f8fe0}
::selection{background:#1e3a5f;color:#e9eef6}
::-webkit-scrollbar{width:11px;height:11px}
::-webkit-scrollbar-track{background:#0d1119}
::-webkit-scrollbar-thumb{background:#2b3546;border-radius:6px}
input,select,textarea,button{color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.75;
 font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
 font-size:17px;word-break:keep-all;overflow-wrap:break-word}
a{color:var(--acc)}
.wrap{max-width:720px;margin:0 auto;padding:0 20px}
header.site{border-bottom:1px solid var(--line);padding:16px 0}
header.site .wrap{display:flex;align-items:center;gap:14px}
header.site .nm{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;
  letter-spacing:-.02em;display:flex;align-items:center;gap:9px;min-height:40px}
__MKCSS__
header.site .tl{font-size:12.5px;color:var(--dim);margin-left:-4px}
header.site nav{margin-left:auto;display:flex;gap:16px;flex-wrap:wrap}
header.site nav a{font-size:14.5px;color:var(--mut);text-decoration:none}
header.site nav a:hover{color:var(--acc)}
header.site nav a.hl{color:var(--to);font-weight:700}
.hcta{display:block;margin:26px 0 0;padding:20px 22px;border-radius:14px;
  text-decoration:none;border:1px solid rgba(201,162,39,.42);
  background:linear-gradient(135deg,rgba(201,162,39,.13),rgba(201,162,39,.04))}
.hcta .k{display:block;font-size:12.5px;color:var(--to);font-weight:700;letter-spacing:.2px}
.hcta .t{display:block;font-size:20px;font-weight:800;color:var(--ink);margin:5px 0 7px;
  letter-spacing:-.015em}
.hcta .d{display:block;font-size:14px;color:var(--mut);line-height:1.6}

.hero{padding:44px 0 26px;text-align:center}
.hero h1{font-size:31px;line-height:1.35;margin:0 0 14px;letter-spacing:-.02em}
.hero p{margin:0;color:var(--mut);font-size:16px}

/* ── 계산기 ── */
.tool{border:1px solid var(--line);border-radius:16px;padding:22px 20px 24px;background:var(--soft)}
.tool .lab{font-size:13px;letter-spacing:.04em;color:var(--dim);font-weight:700;margin-bottom:12px}
.frow{display:flex;gap:8px;flex-wrap:wrap}
.frow .f{flex:1 1 92px;min-width:0}
.frow .f span{display:block;font-size:12.5px;color:var(--dim);margin-bottom:5px}
.tool input,.tool select{width:100%;padding:11px 10px;border:1px solid #2b3546;border-radius:9px;
  background:var(--pan);color:var(--ink);font:inherit;font-size:16px}
.hint{margin:11px 0 0;font-size:13px;color:var(--dim);line-height:1.6}
.go{width:100%;margin-top:16px;padding:15px;border:0;border-radius:11px;background:var(--acc);
  color:#08101c;font:inherit;font-size:16.5px;font-weight:700;cursor:pointer}
.go:hover{background:#7db1f6}
/* 기존 회원 — 이미 만든 캐릭터를 계정에서 불러온다. 게스트에게만 보인다 */
.go.old{margin-top:10px;background:var(--to);color:#191600}
.go.old:hover{background:#ffe373}
.oldn{margin:8px 0 0;font-size:12.5px;color:var(--dim);text-align:center}

/* ── 결과 ── */
.out{margin-top:26px}
/* 프로필의 로그인 권유 칸은 뺀다 — 로그인은 '시작하기'(게임 시작) 때 한 번만 묻는다. 로그인한 뒤의 계정 줄은 둔다 */
.mine2 .fpacc:has(.fpacc-b.in){display:none}
.sj{margin-top:4px}
.sj .sj-k{font-size:12.5px;font-weight:700;color:var(--to);letter-spacing:.2px}
.sj h1{font-size:26px;letter-spacing:-.02em;margin:4px 0 6px}
.sj .sub{color:var(--mut);font-size:14px;margin:0 0 16px}
.sj-say{margin:20px 0 4px;padding:16px 18px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.sj-say .l{font-size:19px;font-weight:800;letter-spacing:-.02em;margin:0 0 6px}
.sj-say .l b{padding:1px 9px;border-radius:8px;color:#0a0f18}
.sj-say .d{font-size:14px;color:var(--mut);line-height:1.65;margin:0}
.sj-go{background:var(--to)!important;color:#191600!important;font-size:17px}
.sj-back{display:block;margin:12px auto 0;background:0;border:0;color:var(--dim);font:inherit;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px}
.out h2{font-size:20px;margin:0 0 4px;letter-spacing:-.01em}
.out .sub{color:var(--mut);font-size:14px;margin:0 0 16px}
.board{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.board .hd{text-align:center;font-size:12.5px;color:var(--dim);line-height:1.4;padding-bottom:2px}
.board .hd b{display:block;font-size:13.5px;color:var(--mut)}
.cell{background:var(--pan);border:1px solid var(--line);border-radius:10px;padding:9px 4px;text-align:center}
.cell .k{font-size:10.5px;color:var(--dim);letter-spacing:.04em}
.cell .hj{font-size:27px;font-weight:700;line-height:1.15;margin:1px 0}
.cell .kr{font-size:12px;color:var(--mut)}
.cell .el{display:inline-block;min-width:19px;margin-top:4px;padding:1px 5px;border-radius:9px;
  font-size:11px;font-weight:700;color:#fff}
.cell.na{background:repeating-linear-gradient(135deg,#141a25,#141a25 6px,#1b2230 6px,#1b2230 12px)}
.cell.na .hj{color:var(--dim);font-size:20px;padding:6px 0}

.bars{margin-top:20px}
.bar{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.bar .n{width:22px;font-weight:700;font-size:14.5px;text-align:center;flex:none}
.bar .t{flex:1;height:13px;background:#1e2635;border-radius:7px;overflow:hidden}
.bar .t i{display:block;height:100%;border-radius:7px}
.bar .v{width:42px;text-align:right;font-size:13.5px;color:var(--mut);flex:none;
  font-variant-numeric:tabular-nums}

.me{display:flex;align-items:center;gap:16px;margin-top:22px;padding:16px;
  border:1px solid var(--line);border-radius:14px;background:var(--pan)}
.me .pics{display:flex;gap:4px;flex:none}
.me .pics img{object-fit:contain}
.me .k{font-size:12.5px;color:var(--dim);letter-spacing:.04em}
.me .t{font-size:19px;font-weight:800;margin:2px 0 4px}
.me .d{font-size:14px;color:var(--mut);line-height:1.65}

.note{margin-top:14px;padding:13px 15px;border-left:3px solid var(--acc);
  background:#151f2e;border-radius:0 9px 9px 0;font-size:14.5px;line-height:1.7}
.note b{font-weight:700}
.note a{font-weight:700}

/* 광고 — 결과를 모두 보여 준 다음 한 번. 프리롤 아님 */
.cad{margin:34px 0 8px;padding-top:16px;border-top:1px dashed #2b3546}
.cad-l{font-size:11px;letter-spacing:.06em;color:var(--dim);margin-bottom:8px}
.cad:has(ins[data-ad-status="unfilled"]){display:none}
.cad ins.adsbygoogle[data-ad-status="unfilled"]{display:none}

/* ── 글 목록 ── */
.sec{margin-top:52px}
.sec > .h{display:flex;align-items:baseline;gap:10px;margin-bottom:16px}
.sec > .h h2{font-size:20px;margin:0;letter-spacing:-.01em}
.sec > .h a{margin-left:auto;font-size:14px;text-decoration:none}
.card{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line);
  text-decoration:none;color:inherit}
.card img{width:112px;height:72px;object-fit:cover;border-radius:9px;flex:none;background:var(--soft)}
.card .t{font-weight:700;font-size:16px;line-height:1.45}
.card .d{font-size:13.5px;color:var(--mut);margin-top:4px;line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card .m{font-size:12px;color:var(--dim);margin-top:5px}

.tile{display:block;margin-top:14px;padding:17px 19px;border:1px solid var(--line);
  border-radius:13px;text-decoration:none;color:inherit;background:var(--soft)}
.tile .k{display:block;font-size:12px;color:var(--dim);letter-spacing:.04em}
.tile .t{display:block;font-weight:700;margin-top:4px;font-size:16.5px}
.tile .d{display:block;font-size:13.5px;color:var(--mut);margin-top:4px;line-height:1.6}
.tile.map{background:linear-gradient(135deg,#131a28,#1b2740);border-color:#26334c;color:#e9eef6}
.tile.map .k{color:#7f8ca0}
.tile.map .d{color:#9fabbd}

footer.site{margin-top:60px;border-top:1px solid var(--line);padding:24px 0 40px;
  font-size:13px;color:var(--dim)}
footer.site a{color:var(--mut);text-decoration:none;margin-right:14px}
@media(max-width:560px){header.site .tl{display:none}}
.mine2{margin:26px 0 8px;padding:20px 20px 18px;border-radius:16px;
  border:1px solid rgba(255,217,61,.4);background:rgba(255,217,61,.07)}
.mine2 .mw{display:flex;align-items:center;gap:16px}
.mine2 .m2dog{height:345px;margin:10px -8px 0;border-radius:14px;
  background:radial-gradient(ellipse at 50% 78%,rgba(255,217,61,.10),transparent 62%)}
.mine2 .m2dog canvas{display:block;width:100%!important;height:100%!important}
.mine2 .m2dog{position:relative}
.mine2 .m2dog.ld::after{content:'캐릭터를 불러오는 중…';position:absolute;inset:0;display:grid;place-items:center;font-size:13px;color:var(--dim)}
.mine2 .orb2{width:62px;height:62px;border-radius:50%;flex:none;display:grid;place-items:center;
  font-size:27px;font-weight:800;color:#0a0f18;font-family:"Noto Serif KR",serif}
.mine2 .k{font-size:12px;font-weight:700;color:var(--to);letter-spacing:.2px}
.mine2 .t{font-size:21px;font-weight:800;letter-spacing:-.02em;margin:3px 0 4px}
.mine2 .d{font-size:13.5px;color:var(--mut);line-height:1.6}
.mine2 .mgo{display:block;margin-top:16px;padding:14px;border-radius:12px;background:var(--to);
  color:#191600;font-weight:800;font-size:16px;text-align:center;text-decoration:none}
.fpguest{margin:8px 0 0!important;font-size:12.5px!important;color:#ffd93d!important;text-align:center}
.mine2 .medit{display:block;min-height:40px;margin:6px auto 0;background:0;border:0;color:var(--dim);
  font:inherit;font-size:12.5px;cursor:pointer;text-decoration:underline;padding:4px 14px}   /* 누름 영역 40px (루프19) */
@media(max-width:430px){
  .hero h1{font-size:26px}
  .cell .hj{font-size:23px}
  .me img{width:84px;height:84px}
  .card img{width:88px;height:60px}
}
</style>
</head><body>

<header class="site"><div class="wrap">
  <a class="nm" href="/">__MARK__Four&nbsp;Paws</a><span class="tl">오행 댕댕이 키우기</span>
  <nav><a href="/map/">선택목록</a><a href="/ohaeng/">사주 이야기</a><span data-fp-chip></span></nav>
</div></header>

<main class="wrap">

<!-- 이미 캐릭터가 있으면 이것이 먼저 뜨고, 아래 계산기는 접힌다.
     같은 사람에게 같은 걸 두 번 물어보지 않는다. -->
<section class="mine2" id="mine2" hidden>
  <div data-fp-who>게스트</div>
  <div class="mw">
    <div class="orb2" id="m2-orb"></div>
    <div class="mt">
      <div class="k">내 캐릭터</div>
      <div class="t" id="m2-t"></div>
      <div class="d" id="m2-d"></div>
    </div>
  </div>
  <div class="m2dog" id="m2-dog"></div>
  <div id="m2-bars"></div>
  <a class="mgo" href="/map/?new=1" data-cta="mine_map" data-fp-start>시작하기</a>
  <p class="fpguest" data-fp-guest hidden>카카오톡으로 로그인하고 닉네임을 정하면 바로 시작합니다.</p>
  <div id="m2-acc"></div>
  <button class="medit" id="m2-edit">오행 다시 계산</button>
</section>

<section class="hero" id="hero">
  <h1>생년월일로 만드는<br>내 오행 캐릭터</h1>
  <p>사주 여덟 글자를 직접 계산해서, 내 오행이 어디에 몰려 있고 무엇이 비어 있는지 보여 드립니다.</p>
</section>

<section class="tool" id="tool">
  <div class="lab">태어난 날</div>
  <div class="frow">
    <label class="f"><span>연도</span><input type="number" id="y" min="1900" max="2100" value="1995" inputmode="numeric"></label>
    <label class="f"><span>월</span><select id="m"></select></label>
    <label class="f"><span>일</span><select id="d"></select></label>
    <label class="f"><span>태어난 시각</span><select id="h"></select></label>
  </div>
  <p class="hint">시각을 모르면 <b>모름</b>으로 두세요. 여덟 글자 중 여섯 글자로만 계산하고,
     결과에 그 사실을 표시합니다. 아무 시각이나 찍어 넣는 것보다 정확합니다.</p>
  <button class="go" id="go">나의 오행 조회</button>
  <button class="go old" id="old" type="button" hidden>기존 회원 로그인</button>
  <p class="oldn" id="old-n" hidden>이미 캐릭터를 만든 적이 있다면 카카오톡으로 로그인해 불러오세요.</p>
</section>

<!-- 나의 오행 조회 다음 화면 — 사주 여덟 글자만 따로 보여 주고, 캐릭터 생성으로 넘어간다 -->
<section class="tool sj" id="saju" hidden>
  <div class="sj-k">나의 오행 조회</div>
  <h1>당신의 사주 구성</h1>
  <p class="sub" id="dsub"></p>
  <div class="board" id="board"></div>
  <div class="sj-say" id="sj-say"></div>
  <button class="go sj-go" id="mk">캐릭터 생성</button>
  <button class="sj-back" id="sj-back" type="button">생년월일 다시 입력</button>
  <div id="notes"></div>
  <div class="cad">
    <div class="cad-l">광고</div>
    <ins class="adsbygoogle" style="display:block"
         data-ad-client="__ADCLIENT__" data-ad-slot="__ADSLOT__"
         data-ad-format="auto" data-full-width-responsive="true"></ins>
  </div>
</section>

<section class="sec">
  <div class="h"><h2>사주 이야기</h2><a href="/ohaeng/">전체 보기 &rarr;</a></div>
  __POSTS__
</section>


</main>

<footer class="site"><div class="wrap">
  <a href="/iljin/">기운</a><a href="/map/">선택목록</a><a href="/hunt/">사냥터</a>
  <a href="/ohaeng/">오행 이야기</a>
  <a href="/love/">이성 조건 계산기</a>
  <p style="margin:10px 0 0">사주 해석은 통계적 사실이 아니라 전통 해석입니다. 재미로 봐 주세요.</p>
</div></footer>

<script src="/ohaeng/data/saju-calculator.js"></script>
<script>
(function(){
var GAN=['갑','을','병','정','무','기','경','신','임','계'];
var ZHI=['자','축','인','묘','진','사','오','미','신','유','술','해'];
var GANH='甲乙丙丁戊己庚辛壬癸', ZHIH='子丑寅卯辰巳午未申酉戌亥';
var GANE=['목','목','화','화','토','토','금','금','수','수'];
var ZHIE=['수','토','목','목','토','화','화','토','금','금','토','수'];
var COL={'목':'#4fb95f','화':'#e8483c','토':'#ffd93d','금':'#8e9bb0','수':'#3f8fe0'};
var IMG={'목':'mok','화':'hwa','토':'to','금':'geum','수':'su'};
var SAY={
 '목':'뻗어 나가는 성질입니다. 시작하고 벌이는 쪽에 가깝습니다.',
 '화':'퍼지는 성질입니다. 드러내고 표현하는 쪽에 가깝습니다.',
 '토':'머무는 성질입니다. 받치고 버티는 쪽에 가깝습니다.',
 '금':'거두는 성질입니다. 끊고 정리하는 쪽에 가깝습니다.',
 '수':'흐르는 성질입니다. 모으고 궁리하는 쪽에 가깝습니다.'};
var DIR={'목':'동쪽','화':'남쪽','토':'중앙(살던 곳)','금':'서쪽','수':'북쪽'};
// 받침에 맞는 조사 — '수은', '이(가)' 같은 어색한 표기를 안 쓰기 위해
var JGA={'목':'이','화':'가','토':'가','금':'이','수':'가'};
var JEUN={'목':'은','화':'는','토':'는','금':'은','수':'는'};

var $=function(id){return document.getElementById(id)};
var m=$('m'), d=$('d'), h=$('h'), y=$('y');
for(var i=1;i<=12;i++) m.add(new Option(i+'월', i));
h.add(new Option('모름',''));
for(var i=0;i<24;i++) h.add(new Option((i<10?'0':'')+i+':00~'+(i<10?'0':'')+i+':59', i));
function fillDays(){
  var keep=+d.value||1, n=new Date(+y.value||2000, +m.value, 0).getDate();
  d.innerHTML='';
  for(var i=1;i<=n;i++) d.add(new Option(i+'일', i));
  d.value = Math.min(keep, n);
}
m.addEventListener('change',fillDays); y.addEventListener('change',fillDays);
m.value=9; fillDays(); d.value=15;

function cell(kind, idx, isGan){
  var hj=(isGan?GANH:ZHIH)[idx], kr=(isGan?GAN:ZHI)[idx], el=(isGan?GANE:ZHIE)[idx];
  return '<div class="cell"><div class="k">'+kind+'</div><div class="hj">'+hj+'</div>'+
         '<div class="kr">'+kr+'</div><span class="el" style="background:'+COL[el]+'">'+el+'</span></div>';
}
function naCell(kind){
  return '<div class="cell na"><div class="k">'+kind+'</div><div class="hj">?</div>'+
         '<div class="kr">모름</div></div>';
}

$('go').addEventListener('click', function(){
  var yy=+y.value, mm=+m.value, dd=+d.value, hh=(h.value===''?null:+h.value);
  if(!(yy>=1900&&yy<=2100)){ alert('연도를 1900~2100 사이로 넣어 주세요.'); y.focus(); return; }
  var r;
  try{ r=calculateSaju({year:yy, month:mm, day:dd, hour:hh}); }
  catch(e){ alert('계산 중 문제가 생겼습니다. 날짜를 확인해 주세요.'); return; }

  var P=r.pillars, order=[['연주',P.year],['월주',P.month],['일주',P.day],['시주',P.hour]];
  var head='', gan='', zhi='';
  var subs={'연주':'태어난 해','월주':'태어난 달','일주':'태어난 날','시주':'태어난 시각'};
  order.forEach(function(o){
    head+='<div class="hd"><b>'+o[0]+'</b>'+subs[o[0]]+'</div>';
    if(!o[1]){ gan+=naCell('천간'); zhi+=naCell('지지'); return; }
    var gi=GAN.indexOf(o[1][0]), zi=ZHI.indexOf(o[1][1]);
    gan+=cell('천간', gi, true); zhi+=cell('지지', zi, false);
  });
  $('board').innerHTML=head+gan+zhi;
  $('dsub').textContent=yy+'년 '+mm+'월 '+dd+'일'+(hh===null?' · 시각 모름':' · '+hh+'시')+
    ' · 네 기둥 × 천간·지지';

  var er=r.elementRatio;
  // 최고 비율이 둘 이상이면 하나로 정하지 않는다 — 있는 그대로 보여 준다
  var all=['목','화','토','금','수'];
  var top=Math.max.apply(null, all.map(function(e){return er[e]||0}));
  var tied=all.filter(function(e){return (er[e]||0)===top});
  var dom=tied[0];
  /* 글자 수 — 여덟(모르면 여섯) 칸 중 몇 칸이 그 오행인가 */
  var cntEl={목:0,화:0,토:0,금:0,수:0};
  order.forEach(function(o){ if(!o[1]) return;
    cntEl[GANE[GAN.indexOf(o[1][0])]]++; cntEl[ZHIE[ZHI.indexOf(o[1][1])]]++; });
  var chip=function(e){ return '<b style="background:'+COL[e]+'">'+e+'</b>'; };
  $('sj-say').innerHTML='<p class="l">당신의 사주는 '+tied.map(chip).join(' · ')+'입니다</p>'+
    '<p class="d">'+(r.timeKnown?'여덟':'여섯')+' 글자 중 '+tied.join('·')+JGA[tied[tied.length-1]]+' '+cntEl[dom]+'자로 가장 많습니다. '+
    (tied.length>1 ? '같은 수라 한 가지로 정하지 않고 함께 적었습니다.' : SAY[dom])+'</p>';
  PENDING={el:dom, tied:tied, top:top, ratio:er, timeKnown:r.timeKnown, pillars:r.pillars};   /* 여덟 글자는 궁합소가 쓴다 */

  var notes='';
  var empty=['목','화','토','금','수'].filter(function(e){return !er[e]});
  if(empty.length){
    notes+='<div class="note"><b>'+empty.join('·')+'</b>'+JGA[empty[empty.length-1]]+
      ' '+(r.timeKnown?'여덟':'여섯')+' 칸 중 한 칸도 없습니다. '+
      '전통 해석에서는 비어 있는 오행의 방위를 보완 방향으로 봅니다 &mdash; '+
      empty.map(function(e){return e+JEUN[e]+' '+DIR[e]}).join(', ')+'. '+
      '<a href="/ohaeng/buljokhan-ohaeng.html" data-cta="note_direction">부족한 오행과 방향 글 보기 &rarr;</a></div>';
  }
  if(!r.timeKnown){
    notes+='<div class="note">시각을 넣으면 두 글자가 더 붙어 비율이 달라집니다. '+
      '실제로 <b>72.6%</b>의 경우 결과가 바뀝니다. '+
      '<a href="/ohaeng/taeeonan-sigak.html" data-cta="note_time">태어난 시간 확인하는 3가지 방법 &rarr;</a></div>';
  }
  $('notes').innerHTML=notes;

  /* 입력 화면을 접고 '당신의 사주 구성' 페이지를 연다 */
  $('hero').hidden=true; $('tool').hidden=true; $('saju').hidden=false;
  try{
    (adsbygoogle=window.adsbygoogle||[]).push({});
  }catch(e){}
  if(window.gtag) gtag('event','saju_run',
    {dominant:tied.join(''), time_known:r.timeKnown, empty:empty.join('')||'none'});
  window.scrollTo(0,0);
});

/* 캐릭터 생성 — 여기서 저장하고 프로필로 간다.
   ★ 사이트 전체가 쓰는 자리(FP)에 저장해야 지도·사냥터에서 다시 묻지 않는다. */
var PENDING=null;
$('mk').addEventListener('click', function(){
  if(!PENDING) return;
  if(window.FP) FP.set(PENDING);
  if(window.gtag) gtag('event','char_create',{el:PENDING.el});
  $('saju').hidden=true;
  var dg=$('m2-dog'); if(dg){ dg.dataset.on=''; dg.innerHTML=''; }   /* 속성이 바뀌었을 수 있다 — 3D 개를 새로 */
  if(window.__showMine) window.__showMine(true);
  window.scrollTo(0,0);
});
/* 기존 회원 로그인 — 게스트에게만 보인다. 로그인해서 돌아오면 me.js 가 계정의 캐릭터를
   받아 오고(fp:sync) 프로필이 바로 뜬다. 캐릭터가 없던 계정이면 계산기 그대로 둔다. */
function paintOld(){
  var b=$('old'), n=$('old-n'); if(!b) return;
  if(!window.FP || !FP.online || !FP.online()){ b.hidden=n.hidden=true; return; }
  FP.user().then(function(u){ b.hidden=n.hidden=!!u; }).catch(function(){ b.hidden=n.hidden=false; });
}
$('old').addEventListener('click', function(){
  if(window.gtag) gtag('event','old_login');
  if(window.FP) FP.login(location.origin);
});
paintOld();
document.addEventListener('fp:sync', paintOld);
$('sj-back').addEventListener('click', function(){
  $('saju').hidden=true; $('hero').hidden=false; $('tool').hidden=false; window.scrollTo(0,0);
});

/* 이미 캐릭터가 있으면 계산기를 접고 '내 캐릭터' 카드를 먼저 보여 준다.
   ?edit=1 로 들어오면(프로필의 '오행 수정') 곧바로 계산기를 편다. */
(function(){
  var SAY2={목:'뻗어 나가는 성질입니다.',화:'퍼지는 성질입니다.',토:'품는 성질입니다.',
            금:'가르는 성질입니다.',수:'스미는 성질입니다.'};
  function showMine(force){
    if(!window.FP) return;
    var me=FP.get();
    var edit=/[?&]edit=1/.test(location.search);
    /* 캐릭터가 없는 기기 — 이미 만든 사람이 계정으로 불러올 수 있게 로그인 줄을 계산기 위에 둔다 */
    var nl=$('m2-login');
    if(nl){ nl.innerHTML = (!me && FP.online && FP.online()) ? FP.accountHTML() : ''; if(!me) FP.paintAccount(); }
    if(!me || (edit && !force)){ $('mine2').hidden=true; return; }
    if(!$('saju').hidden) return;          /* 사주 구성 화면을 보는 중이면 그대로 둔다 */
    shownEl=me.el;
    $('m2-orb').textContent=FP.HJ[me.el]||'?';
    $('m2-orb').classList.add('fpgem');
    $('m2-orb').style.setProperty('--c', FP.COL[me.el]||'#8e9bb0');
    $('m2-t').textContent=me.el+' 속성'+(me.top?' ('+me.top+'%)':'');
    $('m2-d').textContent=(SAY2[me.el]||'')+' 사냥터·궁합소·기운이 이 캐릭터로 이어집니다.';
    if(FP.barsHTML) $('m2-bars').innerHTML=FP.barsHTML({});
    if(FP.accountHTML){ $('m2-acc').innerHTML=FP.accountHTML(); FP.paintAccount(); }
    $('mine2').hidden=false;
    /* 프로필 한가운데에 내 오행 캐릭터 — 지도에서 본 그 개다.
       WebGL 이 없거나 모델을 못 받으면 칸만 조용히 접는다. */
    var dg=$('m2-dog');
    if(dg && !dg.dataset.on){
      dg.dataset.on='1'; dg.style.display=''; dg.classList.add('ld');
      /* 모델·three.js 합쳐 2MB 가까이 받는다. 받는 동안 빈칸으로 두지 않고 안내를 띄우고,
         한 번 실패하면 잠시 뒤 한 번 더 받는다. 두 번 다 안 되면 그때 칸을 접는다. */
      var tryDog=function(n){
        return import('/3d/profile3d.js').then(function(m){
          return m.showDog({mount:dg, base:'/3d/', el:me.el, height:345});
        }).then(function(r){ if(!r) throw 0; dg.classList.remove('ld'); })
          .catch(function(){ if(n<1) return new Promise(function(ok){ setTimeout(ok,1500); }).then(function(){ return tryDog(n+1); });
                             dg.classList.remove('ld'); dg.style.display='none'; });
      };
      tryDog(0);
    }
    $('hero').hidden=true;
    $('tool').hidden=true;
  }
  /* 계정에서 캐릭터를 받아 오면 다시 그린다. 속성이 바뀌었을 때만 3D 를 새로 띄운다. */
  var shownEl=null;
  document.addEventListener('fp:sync', function(){
    var me=FP.get();
    if(me && me.el!==shownEl){ var d=$('m2-dog'); if(d){ d.dataset.on=''; d.innerHTML=''; } }
    showMine();
  });

  window.__showMine=showMine;
  $('m2-edit').addEventListener('click', function(){
    $('mine2').hidden=true; $('hero').hidden=false; $('tool').hidden=false;
    $('tool').scrollIntoView({behavior:'smooth', block:'start'});
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', showMine);
  else showMine();
})();

document.addEventListener('click', function(e){
  var a=e.target.closest ? e.target.closest('[data-cta]') : null;
  if(a && window.gtag) gtag('event','cta_click', {where:a.getAttribute('data-cta')});
});
})();
</script>
</body></html>
"""


def card(m):
    return ('<a class="card" href="/ohaeng/{s}.html" data-cta="post">'
            '<img src="/ohaeng/{i}" alt="" loading="lazy" width="112" height="72">'
            '<div><div class="t">{t}</div><div class="d">{d}</div>'
            '<div class="m">{dt}</div></div></a>').format(
        s=m['slug'], i=m.get('image', 'img/og-ohaeng.png'),
        t=html.escape(m['title']), d=html.escape(m['desc']), dt=m['date'])


def render(posts, ga_snippet, ad_client, ad_slot, limit=4):
    """posts: build.build() 가 돌려주는 [(meta, body), ...] — 최신순"""
    cards = ''.join(card(m) for m, _ in posts[:limit]) or \
        '<p style="color:var(--dim)">아직 올린 글이 없습니다.</p>'
    s = PAGE
    for k, v in (('__MARK__', brand.MARK), ('__HEAD__', brand.HEAD),
                 ('__MKCSS__', brand.CSS),
                 ('__TITLE__', TITLE), ('__DESC__', DESC), ('__ROOT__', SITE_ROOT),
                 ('__GA__', ga_snippet), ('__ADCLIENT__', ad_client),
                 ('__ADSLOT__', ad_slot), ('__POSTS__', cards)):
        s = s.replace(k, v)
    return s
