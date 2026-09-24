# -*- coding: utf-8 -*-
"""/gunghap/ — 궁합소.

흐름 (2026-09-24 사용자 지시)
  1. 카카오톡 로그인
  2. 내 사주 — 캐릭터를 만들 때 계산한 여덟 글자가 있으면 그대로, 없으면 생년월일을 한 번 넣는다
  3. '카카오톡으로 상대 초대하기' → 초대 링크(/gunghap/?c=코드)를 카카오톡으로 보낸다
  4. 상대가 링크로 들어와 카카오톡 로그인 → 생년월일 입력 → 두 사람의 궁합
  5. 결과 위에는 두 사람의 오행 댕댕이가 같이 노는 3D (3d/play3d.js)

계산은 전부 브라우저에서 한다(만세력 엔진 + gh_core.js). API·서버 계산 없음, 비용 0.
저장하는 것은 계산한 여덟 글자와 오행 비율뿐이고, 생년월일 원문은 저장하지 않는다.
DB: Supabase gh_pairs + gh_peek()/gh_join() (마이그레이션 gh_pairs_gunghapso, 2026-09-24).
"""
import os
import brand

HERE = os.path.dirname(os.path.abspath(__file__))
TITLE = '궁합소 — Four Paws'
DESC = ('상대를 카카오톡으로 불러 두 사람의 사주 여덟 글자로 궁합을 봅니다. '
        '두 사람의 오행 댕댕이가 함께 노는 모습도 볼 수 있습니다.')

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
<meta name="robots" content="noindex">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta property="og:type" content="website">
<meta property="og:title" content="궁합소 — 두 사람의 오행 궁합">
<meta property="og:description" content="__DESC__">
<meta property="og:image" content="__ROOT__/map/img/spot-gunghap.jpg">
__GA__
<style>
:root{--bg:#0d1119;--pan:#151b26;--ink:#e9eef6;--mut:#9aa6b8;--dim:#6f7d92;--line:#232c3c;
  --acc:#5b9bf0;--to:#ffd93d;--rose:#ff7eb0}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink);
  font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
  word-break:keep-all;-webkit-text-size-adjust:100%}
a{color:var(--acc)}
header.site{border-bottom:1px solid var(--line)}
header.site .in{max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:12px 16px}
header.site .nm{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px;min-height:40px}
__MKCSS__
header.site nav{margin-left:auto;display:flex;gap:14px;align-items:center}
header.site nav a{font-size:14px;color:var(--mut);text-decoration:none}
.wrap{max-width:640px;margin:0 auto;padding:18px 16px 40px}
.hero{position:relative;border-radius:18px;overflow:hidden;padding:26px 20px 22px;
  border:1.5px solid rgba(255,126,176,.45);background:#141019}
.hero::before{content:"";position:absolute;inset:0;background:url(/map/img/spot-gunghap.jpg) center 40%/cover;opacity:.40}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,17,25,.1),rgba(13,17,25,.88))}
.hero > *{position:relative;z-index:1}
.hero .k{color:var(--rose);font-size:13px;font-weight:800;letter-spacing:.04em}
.hero h1{margin:6px 0 6px;font-size:28px;letter-spacing:-.02em}
.hero p{margin:0;color:#cfd7e4;line-height:1.7;font-size:15px}
.stage{height:280px;margin:14px -8px 0;border-radius:16px;
  background:radial-gradient(ellipse at 50% 80%,rgba(255,126,176,.14),transparent 64%)}
.stage canvas{display:block;width:100%!important;height:100%!important}
.stage.ld{display:grid;place-items:center;color:var(--dim);font-size:13px}
.card{margin-top:14px;background:var(--pan);border:1px solid #222c3c;border-radius:16px;padding:18px}
.card h2{margin:0 0 6px;font-size:19px}
.card p.s{margin:0 0 12px;color:var(--mut);font-size:14px;line-height:1.7}
.btn{display:block;width:100%;margin-top:12px;padding:15px;border:0;border-radius:12px;font:inherit;
  font-size:16px;font-weight:800;cursor:pointer;text-align:center;text-decoration:none}
.btn.kakao{background:#fee500;color:#191600}
.btn.rose{background:var(--rose);color:#2a0716}
.btn.ghost{background:#222c3e;color:#c9d2df}
.btn:disabled{opacity:.6;cursor:default}
.frow{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px}
.f span{display:block;font-size:12.5px;color:var(--dim);margin-bottom:5px}
.f input,.f select{width:100%;padding:11px 10px;border:1px solid #2b3546;border-radius:9px;
  background:#0f141d;color:var(--ink);font:inherit;font-size:16px}
.f.full{grid-column:1/-1;margin-top:8px}
.note{margin:10px 0 0;font-size:12.5px;color:var(--dim);line-height:1.6}
.me{display:flex;gap:10px;align-items:center;margin-bottom:4px}
.orb{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;
  font-size:18px;color:#0a0f18;background:radial-gradient(circle at 35% 30%,#fff8,transparent 45%),var(--c);flex:none;
  font-family:"Noto Serif KR",serif}
.me b{font-size:16px}.me small{display:block;color:var(--mut);font-size:12.5px;margin-top:2px}
.list{list-style:none;margin:14px 0 0;padding:0}
.list li{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #222c3c;font-size:14.5px}
.list li .w{flex:1}.list li small{display:block;color:var(--dim);font-size:12px;margin-top:2px}
.list li button{background:#2a2032;color:var(--rose);border:1px solid rgba(255,126,176,.4);border-radius:9px;
  padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.list li .wait{color:var(--dim);font-size:12.5px}
.pair{display:flex;gap:8px;align-items:center}
.who{flex:1;display:flex;gap:10px;align-items:center;background:#10151f;border:1px solid #243044;border-radius:14px;padding:10px}
.who .nm{font-weight:800}.who .pl{font-size:12px;color:#cfd7e4;margin-top:2px}
.x{color:var(--dim)}
.score{margin:16px 0 4px;display:flex;align-items:baseline;gap:8px}
.score .n{font-size:52px;font-weight:900;color:var(--rose);line-height:1}.score .u{color:var(--dim)}
.grade{display:inline-block;background:rgba(255,126,176,.12);border:1px solid rgba(255,126,176,.45);color:var(--rose);
  padding:5px 12px;border-radius:99px;font-weight:700;font-size:14px}
.sum{margin:12px 0 14px;line-height:1.75;font-size:15.5px}
.part{background:#10151f;border:1px solid #1f2837;border-radius:14px;padding:13px 15px;margin-top:10px}
.ph{display:flex;justify-content:space-between;font-weight:700;font-size:14.5px}.ph span{color:var(--dim);font-weight:600}
.bar{height:6px;background:#232c3b;border-radius:9px;margin:8px 0 10px;overflow:hidden}.bar i{display:block;height:100%;background:var(--rose);border-radius:9px}
.part p{margin:0;line-height:1.75;font-size:14.5px;color:#d6deea}
.dog{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(79,185,95,.08);border:1px solid rgba(79,185,95,.3);font-size:14px;line-height:1.7}
.dis{font-size:12.5px;color:var(--dim);margin-top:10px}
[hidden]{display:none!important}
</style>
</head><body>
<header class="site"><div class="in">
  <a class="nm" href="/">__MARK__Four&nbsp;Paws</a>
  <nav><a href="/map/">지도</a><a href="/ohaeng/">사주 이야기</a><span data-fp-chip></span></nav>
</div></header>

<main class="wrap">
  <section class="hero" id="hero">
    <div class="k">宮合所</div>
    <h1>궁합소</h1>
    <p id="hero-p">상대를 카카오톡으로 불러, 두 사람의 사주 여덟 글자로 궁합을 봅니다.
       결과 위에서 두 사람의 오행 댕댕이가 같이 놀아요.</p>
  </section>

  <div class="stage" id="stage" hidden></div>

  <section class="card" id="v-load"><p class="s">불러오는 중…</p></section>

  <section class="card" id="v-off" hidden>
    <h2>지금은 궁합소를 열 수 없어요</h2>
    <p class="s">계정 연결이 준비되지 않았습니다. 잠시 뒤에 다시 들어와 주세요.</p>
  </section>

  <section class="card" id="v-login" hidden>
    <h2 id="lg-h">카카오톡으로 시작해요</h2>
    <p class="s" id="lg-p">궁합은 두 사람이 각자 로그인해서 봅니다. 초대한 사람도, 초대받은 사람도 결과를 같이 볼 수 있어요.</p>
    <button class="btn kakao" id="lg-go">카카오톡 로그인</button>
  </section>

  <section class="card" id="v-birth" hidden>
    <h2 id="bh">내 생년월일</h2>
    <p class="s" id="bp">궁합을 계산할 사주 여덟 글자를 만듭니다.</p>
    <div class="frow">
      <label class="f"><span>연도</span><input type="number" id="y" min="1900" max="2100" value="1995" inputmode="numeric"></label>
      <label class="f"><span>월</span><select id="m"></select></label>
      <label class="f"><span>일</span><select id="d"></select></label>
      <label class="f full"><span>태어난 시각</span><select id="h"></select></label>
    </div>
    <button class="btn rose" id="bgo">궁합 보기</button>
    <button class="btn ghost" id="buse" hidden>내 캐릭터 사주로 바로 보기</button>
    <p class="note">생년월일은 저장하지 않고, 계산한 사주 여덟 글자와 오행 비율만 저장합니다. 시각을 모르면 '모름'으로 두세요.</p>
  </section>

  <section class="card" id="v-host" hidden>
    <div class="me" id="host-me"></div>
    <button class="btn kakao" id="inv">카카오톡으로 상대 초대하기</button>
    <p class="note">상대가 링크로 들어와 로그인하고 생년월일을 넣으면, 여기에 결과가 생깁니다.</p>
    <ul class="list" id="pairs"></ul>
  </section>

  <section class="card" id="v-msg" hidden><h2 id="msg-h"></h2><p class="s" id="msg-p"></p>
    <a class="btn ghost" href="/gunghap/">궁합소 처음으로</a></section>

  <section class="card" id="v-result" hidden>
    <div id="res"></div>
    <a class="btn rose" href="/gunghap/" id="again">다른 사람과도 궁합 보기</a>
  </section>
</main>

<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js"></script>
<script src="/ohaeng/data/saju-calculator.js"></script>
<script>__CORE__</script>
<script>
(function(){
var $=function(i){return document.getElementById(i)};
var KAKAO='__KAKAO_KEY__';
var COL={목:'#4fb95f',화:'#e8483c',토:'#ffd93d',금:'#8e9bb0',수:'#3f8fe0'};
var HJ={목:'木',화:'火',토:'土',금:'金',수:'水'};
var ORDER=['목','화','토','금','수'];
var VIEWS=['v-load','v-off','v-login','v-birth','v-host','v-msg','v-result'];
function show(v){ VIEWS.forEach(function(x){ $(x).hidden=(x!==v); }); }
function qs(k){ var m=new RegExp('[?&]'+k+'=([^&]+)').exec(location.search); return m?decodeURIComponent(m[1]):null; }
function ev(n,p){ if(window.gtag) gtag('event',n,p||{}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function b(s){ return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'); }
var CODE=qs('c'), ME=null, CL=null;
try{ if(KAKAO && window.Kakao && !Kakao.isInitialized()) Kakao.init(KAKAO); }catch(e){}

/* ── 생년월일 입력 ── */
var y=$('y'), m=$('m'), d=$('d'), h=$('h');
for(var i=1;i<=12;i++) m.add(new Option(i+'월', i));
h.add(new Option('모름',''));
for(var i=0;i<24;i++) h.add(new Option((i<10?'0':'')+i+':00~'+(i<10?'0':'')+i+':59', i));
function fillDays(){ var keep=+d.value||1, n=new Date(+y.value||2000, +m.value, 0).getDate();
  d.innerHTML=''; for(var i=1;i<=n;i++) d.add(new Option(i+'일', i)); d.value=Math.min(keep,n); }
m.addEventListener('change',fillDays); y.addEventListener('change',fillDays);
m.value=1; fillDays();
function birthSaju(){
  var yy=+y.value, mm=+m.value, dd=+d.value, hh=(h.value===''?null:+h.value);
  if(!(yy>=1900&&yy<=2100)){ alert('연도를 1900~2100 사이로 넣어 주세요.'); y.focus(); return null; }
  var r; try{ r=calculateSaju({year:yy,month:mm,day:dd,hour:hh}); }catch(e){ alert('날짜를 확인해 주세요.'); return null; }
  return {p:r.pillars, r:r.elementRatio, tk:r.timeKnown};
}
function elOf(sj){ return ORDER.reduce(function(a,b){ return sj.r[a]>=sj.r[b]?a:b; }); }
/* 캐릭터를 만들 때 저장해 둔 여덟 글자 */
function mySaju(){ var c=window.FP&&FP.get(); return (c&&c.pillars&&c.ratio)?{p:c.pillars,r:c.ratio,tk:!!c.timeKnown}:null; }
/* 새로 넣은 사주를 내 캐릭터에도 남긴다 — 궁합소로 처음 온 사람도 이걸로 캐릭터가 생긴다 */
function keepMine(sj){
  var el=elOf(sj), top=sj.r[el], tied=ORDER.filter(function(e){ return sj.r[e]===top; });
  if(window.FP) FP.set({el:el, tied:tied, top:top, ratio:sj.r, timeKnown:sj.tk, pillars:sj.p});
}
function pillStr(sj){ return [sj.p.year,sj.p.month,sj.p.day,sj.p.hour].filter(Boolean).join(' · '); }

/* ── 로그인 ── */
$('lg-go').onclick=function(){
  ev('gh_login_try',{invited:!!CODE});
  try{ localStorage.setItem('fp.next', JSON.stringify({url:location.href, at:Date.now()})); }catch(e){}
  FP.login(location.origin);         /* 사이트 주소 그대로 — Supabase 허용 목록과 같다. 돌아오면 me.js 가 이 주소로 보낸다 */
};

/* ── 초대한 사람 화면 ── */
function hostView(){
  var sj=mySaju();
  if(!sj){ birthView('host'); return; }
  var el=elOf(sj);
  $('host-me').innerHTML='<span class="orb" style="--c:'+COL[el]+'">'+HJ[el]+'</span>'+
    '<div><b>'+esc(ME.nick||'나')+'</b><small>'+esc(pillStr(sj))+' · '+el+' 속성</small></div>';
  show('v-host'); loadPairs();
}
function loadPairs(){
  CL.from('gh_pairs').select('*').or('host_id.eq.'+ME.id+',guest_id.eq.'+ME.id)
    .order('created_at',{ascending:false}).limit(30).then(function(q){
    var rows=(q&&q.data)||[];
    if(!rows.length){ $('pairs').innerHTML='<li><span class="w wait">아직 보낸 초대가 없어요.</span></li>'; return; }
    $('pairs').innerHTML=rows.map(function(r,i){
      var mine=r.host_id===ME.id, other=mine?r.guest_nick:r.host_nick;
      var when=new Date(r.created_at); when=(when.getMonth()+1)+'월 '+when.getDate()+'일';
      if(!r.guest_saju) return '<li><span class="w">초대 보냄<small>'+when+' · 아직 들어오지 않았어요</small></span>'+
        '<button data-re="'+esc(r.code)+'">다시 보내기</button></li>';
      return '<li><span class="orb" style="--c:'+COL[mine?r.guest_el:r.host_el]+';width:30px;height:30px;font-size:14px">'+
        HJ[mine?r.guest_el:r.host_el]+'</span><span class="w">'+esc(other||'상대')+'님과의 궁합<small>'+when+
        (mine?' · 내가 초대':' · 초대받음')+'</small></span><button data-i="'+i+'">결과 보기</button></li>';
    }).join('');
    [].forEach.call($('pairs').querySelectorAll('[data-i]'),function(bt){ bt.onclick=function(){ result(rows[+bt.getAttribute('data-i')]); }; });
    [].forEach.call($('pairs').querySelectorAll('[data-re]'),function(bt){ bt.onclick=function(){ share(bt.getAttribute('data-re')); }; });
  });
}
function newCode(){ var a=new Uint8Array(8); crypto.getRandomValues(a);
  return Array.prototype.map.call(a,function(x){ return 'abcdefghjkmnpqrstuvwxyz23456789'[x%31]; }).join('')+Date.now().toString(36).slice(-3); }
$('inv').onclick=function(){
  var sj=mySaju(); if(!sj) return;
  var bt=$('inv'); bt.disabled=true;
  var code=newCode();
  CL.from('gh_pairs').insert({code:code, host_id:ME.id, host_nick:ME.nick||null, host_el:elOf(sj), host_saju:sj}).then(function(q){
    bt.disabled=false;
    if(q.error){ alert('초대를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.'); return; }
    ev('gh_invite'); share(code); loadPairs();
  });
};
function share(code){
  var url=location.origin+'/gunghap/?c='+encodeURIComponent(code);
  var nick=(ME&&ME.nick)||'친구';
  if(window.Kakao && Kakao.isInitialized && Kakao.isInitialized() && Kakao.Share){
    try{
      Kakao.Share.sendDefault({ objectType:'feed',
        content:{ title:nick+'님이 궁합을 보자고 해요',
          description:'생년월일만 넣으면 두 사람의 사주로 궁합이 나와요. 오행 댕댕이도 같이 놀아요.',
          imageUrl:location.origin+'/map/img/spot-gunghap.jpg', link:{mobileWebUrl:url, webUrl:url} },
        buttons:[{title:'궁합 보러 가기', link:{mobileWebUrl:url, webUrl:url}}] });
      return;
    }catch(e){}
  }
  if(navigator.share){ navigator.share({title:'궁합소 · Four Paws', text:nick+'님이 궁합을 보자고 해요', url:url}).catch(function(){}); return; }
  if(navigator.clipboard){ navigator.clipboard.writeText(url).then(function(){ alert('초대 링크를 복사했어요.\n\n'+url); })
      .catch(function(){ prompt('이 링크를 보내 주세요', url); }); return; }
  prompt('이 링크를 보내 주세요', url);
}

/* ── 생년월일 화면 (host: 내 사주 만들기 / guest: 초대받고 들어옴) ── */
var BMODE=null, PEEK=null;
function birthView(mode){
  BMODE=mode;
  if(mode==='host'){ $('bh').textContent='먼저 내 생년월일을 넣어 주세요';
    $('bp').textContent='궁합을 보려면 내 사주 여덟 글자가 있어야 해요. 한 번만 넣으면 됩니다.';
    $('bgo').textContent='저장하고 초대하러 가기'; $('buse').hidden=true; }
  else { var hn=(PEEK&&PEEK.host_nick)||'상대';
    $('bh').textContent=hn+'님이 궁합을 보자고 했어요';
    $('bp').textContent='생년월일을 넣으면 두 사람의 사주로 궁합이 바로 나와요.';
    $('bgo').textContent='궁합 보기'; $('buse').hidden=!mySaju(); }
  show('v-birth');
}
$('bgo').onclick=function(){ var sj=birthSaju(); if(sj) useSaju(sj, true); };
$('buse').onclick=function(){ var sj=mySaju(); if(sj) useSaju(sj, false); };
function useSaju(sj, fresh){
  if(BMODE==='host'){ keepMine(sj); ev('gh_host_saju'); hostView(); return; }
  if(fresh && !(window.FP&&FP.has())) keepMine(sj);          /* 처음 온 사람은 이걸로 캐릭터가 생긴다 */
  else if(fresh && !mySaju()) keepMine(sj);
  $('bgo').disabled=true;
  CL.rpc('gh_join',{p_code:CODE, p_nick:(ME.nick||'').slice(0,20), p_el:elOf(sj), p_saju:sj}).then(function(q){
    $('bgo').disabled=false;
    var row=q&&q.data&&q.data[0];
    if(!row){ msg('이 초대에는 들어갈 수 없어요','이미 다른 분이 들어왔거나, 내가 보낸 초대일 수 있어요.'); return; }
    ev('gh_join'); result(row);
  });
}
function msg(h,p){ $('msg-h').textContent=h; $('msg-p').textContent=p; show('v-msg'); }

/* ── 결과 ── */
var PAIR3D=null;
function result(row){
  var A=GH.person(row.host_saju, row.host_nick||'초대한 사람'), B=GH.person(row.guest_saju, row.guest_nick||'초대받은 사람');
  var r=GH.gunghap(A,B), t=GH.read(A,B,r);
  var who=function(P,el){ return '<div class="who"><span class="orb" style="--c:'+COL[el]+'">'+HJ[el]+'</span><div><div class="nm">'+esc(P.name)+
    '</div><div class="pl">'+esc([P.p.year,P.p.month,P.p.day,P.p.hour].filter(Boolean).join(' · '))+' · '+esc(P.tti)+'띠</div></div></div>'; };
  $('res').innerHTML='<div class="pair">'+who(A,row.host_el)+'<span class="x">×</span>'+who(B,row.guest_el)+'</div>'+
    '<div class="score"><span class="n">'+r.score+'</span><span class="u">/ 100</span></div><span class="grade">'+esc(r.grade)+'</span>'+
    '<p class="sum">'+b(t.summary)+'</p>'+
    t.parts.map(function(p){ return '<div class="part"><div class="ph">'+esc(p.label)+'<span>'+p.pt+' / '+p.max+'</span></div>'+
      '<div class="bar"><i style="width:'+(p.pt/p.max*100)+'%"></i></div><p>'+b(p.text)+'</p></div>'; }).join('')+
    '<div class="dog">'+b(t.dog)+'</div><div class="dis">'+esc(t.disclaimer)+'</div>';
  $('hero').hidden=true; show('v-result'); window.scrollTo(0,0);
  ev('gh_view',{score:r.score});
  var st=$('stage'); st.hidden=false; st.className='stage ld'; st.textContent='두 댕댕이를 불러오는 중…';
  if(PAIR3D){ try{ PAIR3D.destroy(); }catch(e){} PAIR3D=null; }
  import('/3d/play3d.js').then(function(mo){
    return mo.showPair({mount:st, base:'/3d/', elA:row.host_el, elB:row.guest_el, height:280});
  }).then(function(h){ PAIR3D=h; st.className='stage'; })
    .catch(function(){ st.hidden=true; });
}

/* ── 시작 ── */
function start(){
  if(!window.FP || !FP.online || !FP.online()){ show('v-off'); return; }
  FP.ready().then(function(c){
    CL=c; if(!c){ show('v-off'); return; }
    var peek = CODE ? c.rpc('gh_peek',{p_code:CODE}).then(function(q){ return q&&q.data&&q.data[0]||null; }) : Promise.resolve(null);
    /* 닉네임은 me.js 동기화(fp:sync)가 끝나야 정한 이름으로 나온다 — 그 전이면 잠깐 기다린다 */
    var who = FP.synced ? FP.user() : new Promise(function(res){
      var done=false, go=function(){ if(done) return; done=true; res(FP.user()); };
      document.addEventListener('fp:sync', go, {once:true}); setTimeout(go, 2500); });
    return Promise.all([who, peek]).then(function(v){
      ME=v[0]; PEEK=v[1];
      if(CODE && !PEEK){ msg('초대를 찾을 수 없어요','링크가 잘렸거나 지워진 초대예요. 보낸 분께 다시 보내 달라고 해 주세요.'); return; }
      if(!ME){
        if(PEEK){ $('lg-h').textContent=(PEEK.host_nick||'상대')+'님이 궁합을 보자고 했어요';
          $('lg-p').textContent='카카오톡으로 로그인하고 생년월일을 넣으면 두 사람의 궁합이 나와요.'; }
        show('v-login'); return;
      }
      if(!CODE){ hostView(); return; }
      /* 초대 링크로 들어온 로그인한 사람 — 내 초대인지, 이미 들어간 초대인지, 새로 들어갈 초대인지 */
      return c.from('gh_pairs').select('*').eq('code',CODE).maybeSingle().then(function(q){
        var row=q&&q.data;
        if(row && row.host_id===ME.id){ hostView(); return; }
        if(row && row.guest_id===ME.id && row.guest_saju){ result(row); return; }
        if(PEEK.joined){ msg('이미 다른 분이 들어온 초대예요','보낸 분께 새 초대를 부탁해 주세요.'); return; }
        birthView('guest');
      });
    });
  }).catch(function(){ show('v-off'); });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
</script>
</body></html>
"""


def render(ga_snippet, kakao_js_key='', site_root='https://meetcal.co.kr'):
    core = open(os.path.join(HERE, 'gh_core.js'), encoding='utf-8').read()
    s = PAGE
    for k, v in (('__MARK__', brand.MARK), ('__HEAD__', brand.HEAD), ('__MKCSS__', brand.CSS),
                 ('__TITLE__', TITLE), ('__DESC__', DESC), ('__ROOT__', site_root),
                 ('__GA__', ga_snippet), ('__KAKAO_KEY__', kakao_js_key or ''),
                 ('__CORE__', core)):
        s = s.replace(k, v)
    return s
