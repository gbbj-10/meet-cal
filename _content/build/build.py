#!/usr/bin/env python3
"""
PUB — 블로그 빌드
  content/draft/*.md  →  content/posts/*.html  +  content/blog.html  +  content/index.json  +  sitemap.xml
재현: python3 build.py            (content/ 폴더 기준 상대경로)
"""
import brand
import os, re, json, html, datetime, sys
import markdown, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # content/
DRAFT, POSTS = os.path.join(ROOT,'draft'), os.path.join(ROOT,'posts')
SITE = {
    'name':  '오행 이야기',
    'tagline': '사주를 직접 계산해서 씁니다',
    'base':  'https://meetcal.co.kr/ohaeng',   # GitHub Pages 가 www→apex 로 리다이렉트하므로 non-www 가 정본
    'author':'오행 이야기',
    'ga':    'G-HMSZVTTJMB',              # meetcal.co.kr GA4 속성 (2026-09-19 생성)
}
# 애드센스 — 승인 전에는 on=False (자리표시자만 보입니다)
ADS = {
    'on':     True,
    'client': 'ca-pub-6266949069255809',   # 2026-07 대화에서 확인한 게시자 ID
    'slot':   '6974474591',                # 그때 만든 디스플레이 광고 단위
}

def ad_unit():
    """계산 결과가 나온 뒤 결과 블록 맨 아래에 한 번 노출되는 광고.
       프리롤(결과를 보려면 광고를 먼저 봐야 하는 형태)은 애드센스 게재위치 정책 위반이라
       결과를 모두 보여준 다음, 게임 CTA 아래에 충분한 간격을 두고 배치합니다."""
    if not ADS['on']:
        return ('<div class="cadph">광고 자리<br>'
                '<span>애드센스 승인 후 이 자리에 노출됩니다</span></div>')
    return (f'<ins class="adsbygoogle" style="display:block" '
            f'data-ad-client="{ADS["client"]}" data-ad-slot="{ADS["slot"]}" '
            f'data-ad-format="auto" data-full-width-responsive="true"></ins>')
DISCLAIMER = ('이 글은 전통 오행 이론과 직접 계산한 통계를 정리한 것입니다. '
              '운세는 검증된 과학이 아니며, 재미와 참고를 위한 콘텐츠입니다. '
              '중요한 결정은 스스로 판단하세요.')

def read_md(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    meta, body = yaml.safe_load(m.group(1)), m.group(2)
    md = markdown.Markdown(extensions=['tables','fenced_code','attr_list'])
    return meta, md.convert(body)

CSS = """
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
header.site{border-bottom:1px solid var(--line);padding:15px 0;margin-bottom:34px}
header.site .wrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
header.site .nm{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;
  letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
header.site .tl{font-size:12.5px;color:var(--dim);margin-left:-4px}
header.site .tl a{color:var(--dim);text-decoration:none}
header.site .tl a:hover{color:var(--mut)}
header.site nav{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap}
header.site nav a{font-size:14px;font-weight:600;color:var(--mut);text-decoration:none}
header.site nav a:hover{color:var(--ink)}
header.site nav a.hl{color:var(--to)}
h1{font-size:30px;line-height:1.35;letter-spacing:-.02em;margin:0 0 14px}
h2{font-size:22px;letter-spacing:-.015em;margin:44px 0 12px;padding-top:6px}
h3{font-size:18px;margin:28px 0 8px}
p{margin:0 0 18px}
.meta{color:var(--dim);font-size:14px;margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.lead{font-size:18px;color:var(--mut)}
img{max-width:100%;height:auto;display:block;margin:26px auto;border:1px solid var(--line);border-radius:10px}
table{width:100%;border-collapse:collapse;margin:22px 0;font-size:15px;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:10px 12px;text-align:left;white-space:nowrap}
th{background:var(--soft);font-weight:700;font-size:14px;color:var(--mut)}
blockquote{margin:24px 0;padding:14px 18px;background:var(--soft);border-left:3px solid var(--acc);
  border-radius:0 8px 8px 0;color:var(--mut)}
blockquote p{margin:0}
pre{background:#080c12;color:#dfe7f2;padding:16px 18px;border-radius:10px;overflow-x:auto;
  font-size:14px;line-height:1.7}
code{font-family:ui-monospace,Menlo,Consolas,monospace}
ul,ol{margin:0 0 18px;padding-left:22px}
li{margin-bottom:8px}
hr{border:0;border-top:1px solid var(--line);margin:40px 0}
.cta{margin:36px 0;padding:22px;border-radius:14px;border:1px solid #2c3d57;
  background:linear-gradient(135deg,#161e2e,#111722);text-align:center}
.cta .t{font-size:19px;font-weight:800;margin-bottom:6px;letter-spacing:-.01em}
.cta .s{font-size:14px;color:var(--mut);margin-bottom:16px}
.cta a{display:inline-block;background:var(--acc);color:#08101c;text-decoration:none;
  font-weight:700;padding:13px 26px;border-radius:10px;font-size:16px}
.disc{font-size:13px;color:var(--dim);background:var(--soft);padding:14px 16px;border-radius:9px;line-height:1.7}
.related{margin:40px 0 0;padding-top:24px;border-top:1px solid var(--line)}
.related .h{font-size:14px;color:var(--dim);margin-bottom:12px}
.related a{display:block;padding:12px 0;text-decoration:none;color:var(--ink);font-weight:600;
  border-bottom:1px solid var(--line);font-size:16px}
.related a:last-child{border-bottom:0}
footer.site{margin-top:56px;padding:26px 0 44px;border-top:1px solid var(--line);
  color:var(--dim);font-size:13px}
footer.site nav{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px}
footer.site nav a{font-size:13.5px;font-weight:600;color:var(--mut);text-decoration:none}
/* 글 안 계산기 */
.calc{margin:32px 0;padding:24px 22px;border:1px solid #2c3d57;border-radius:16px;
  background:linear-gradient(135deg,#161e2e,#111722)}
.calc .ct{font-size:20px;font-weight:800;letter-spacing:-.01em;margin-bottom:6px}
.calc .cs{font-size:13.5px;color:var(--mut);line-height:1.65;margin-bottom:18px}
.crow{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px}
.crow label{display:block;font-size:12px;color:var(--dim)}
.crow input{display:block;width:100%;margin-top:5px;padding:12px 10px;border:1px solid #2b3546;
  border-radius:9px;font-size:17px;font-family:inherit;text-align:center;background:var(--pan);color:var(--ink)}
.crow input:disabled{background:#1e2635;color:#4d5769}
.cchk{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--mut);margin-bottom:16px}
.calc button{width:100%;padding:14px;border:0;border-radius:10px;background:var(--acc);color:#08101c;
  font-size:16px;font-weight:700;font-family:inherit;cursor:pointer}
.cout{margin-top:20px;padding-top:20px;border-top:1px solid #242d3d}
.cerr{font-size:14px;color:#ff6b5e}
.chead{font-size:17px;margin-bottom:14px}
.cbig{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.cdir{font-size:26px;font-weight:800;color:#fff;padding:10px 22px;border-radius:12px;letter-spacing:-.01em}
.cdd{font-size:13px;color:var(--dim)}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.cgrid>div{background:var(--pan);border:1px solid #242d3d;border-radius:10px;padding:11px 13px}
.cgrid .cwide{grid-column:1/-1}
.cgrid .ck{display:block;font-size:12px;color:var(--dim);margin-bottom:4px}
.cgrid .cv{font-size:15px;font-weight:600}
.cbars{background:var(--pan);border:1px solid #242d3d;border-radius:10px;padding:14px}
.cad{margin-top:40px;padding-top:20px;border-top:1px dashed #2b3546}
.lgen{display:flex;gap:8px;margin-bottom:16px}
.lgen button{flex:1;padding:11px;border:1px solid #2b3546;border-radius:9px;background:var(--pan);
  font:inherit;font-size:14px;font-weight:700;color:var(--mut);cursor:pointer}
.lgen button.on{background:var(--acc);border-color:var(--acc);color:#08101c}
.lrow{display:flex;gap:10px;margin-bottom:12px}
.lrow label{flex:1;display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--mut)}
.lrow input,.lrow select{width:100%;padding:11px 10px;border:1px solid #2b3546;border-radius:9px;
  font:inherit;font-size:15px;background:var(--pan);color:var(--ink)}
.ltbl{display:table;width:100%;border-collapse:collapse;margin:14px 0 4px;font-size:14px;
  background:var(--pan);border:1px solid #242d3d;border-radius:10px;overflow:hidden}
.ltbl th{width:34%;background:#1b2230;font-size:12.5px;color:var(--mut);font-weight:700;
  padding:10px;text-align:left;border-bottom:0;white-space:nowrap}
.ltbl td{padding:10px;border-top:1px solid #1e2635;border-bottom:0;font-weight:700;white-space:normal}
.ltag{display:inline-block;margin-left:6px;font-size:11.5px;font-weight:700;color:var(--acc);
  background:#1b2740;border-radius:5px;padding:2px 7px;vertical-align:1px}
.cadl{font-size:11px;letter-spacing:.06em;color:var(--dim);margin-bottom:8px}
/* 광고가 안 채워지면 빈 상자가 남지 않게 통째로 접는다 */
.cad:has(ins[data-ad-status="unfilled"]){display:none}
.cad ins.adsbygoogle[data-ad-status="unfilled"]{display:none}
.cadph{border:1px dashed #2b3546;border-radius:10px;background:#131a26;color:var(--dim);
  text-align:center;padding:34px 16px;font-size:13.5px;line-height:1.7}
.cadph span{font-size:12px;color:#6b7789}
.ctie{display:table;width:100%;border-collapse:collapse;margin:14px 0 4px;font-size:13.5px;background:var(--pan);
  border:1px solid #242d3d;border-radius:10px;overflow:hidden}
.ctie th{background:#1b2230;font-size:12px;color:var(--mut);font-weight:700;padding:8px 10px;text-align:left}
.ctie td{padding:9px 10px;border-top:1px solid #1e2635;border-bottom:0;white-space:normal}
.ctie th{border-bottom:0}
.cbig .cdir{margin-right:8px}
.cbh{font-size:12px;color:var(--dim);margin-bottom:10px}
.cb{display:flex;align-items:center;gap:10px;margin-bottom:7px}
.cb:last-child{margin-bottom:0}
.cbl{width:22px;font-size:14px;font-weight:700;color:var(--mut)}
.cbt{flex:1;height:10px;background:#1e2635;border-radius:5px;overflow:hidden}
.cbt i{display:block;height:100%;border-radius:5px}
.cbv{width:42px;text-align:right;font-size:13.5px;color:var(--mut)}
.cnote{margin-top:12px;font-size:13px;color:var(--dim)}
.cgame{display:block;margin-top:16px;text-align:center;background:#1b2740;color:#e9eef6;
  text-decoration:none;font-weight:700;padding:13px;border-radius:10px;font-size:15px}
@media(max-width:480px){.crow{grid-template-columns:1.3fr 1fr 1fr 1fr}.cgrid{grid-template-columns:1fr}}
/* 목록 */
.card{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);
  border-radius:14px;overflow:hidden;margin-bottom:18px;transition:border-color .15s}
.card:hover{border-color:#39455c}
.card img{margin:0;border:0;border-radius:0;border-bottom:1px solid var(--line)}
.card .bd{padding:18px 20px}
.card .t{font-size:19px;font-weight:800;letter-spacing:-.015em;line-height:1.4;margin-bottom:8px}
.card .d{font-size:14.5px;color:var(--mut);line-height:1.65;margin-bottom:10px}
.card .m{font-size:12.5px;color:var(--dim)}
.intro{margin-bottom:32px;padding:20px;background:var(--soft);border-radius:12px;font-size:15px;color:var(--mut)}
@media(max-width:560px){h1{font-size:25px}h2{font-size:20px}body{font-size:16px}
  header.site .tl{display:none}
  header.site nav{margin-left:0;width:100%;gap:13px;row-gap:6px}
  header.site nav a{font-size:13.5px}}
"""

CALC = """
<div class="calc" id="calc">
  <div class="ct">내 방향은 어디일까</div>
  <div class="cs">생년월일시를 넣으면 가장 약한 오행과 그에 맞는 방향이 바로 나옵니다.<br>
    입력값은 <b>브라우저 안에서만</b> 계산되고 어디로도 전송되지 않습니다.</div>
  <div class="crow">
    <label>년<input id="cy" type="number" inputmode="numeric" placeholder="1991" min="1900" max="2100"></label>
    <label>월<input id="cm" type="number" inputmode="numeric" placeholder="3" min="1" max="12"></label>
    <label>일<input id="cd" type="number" inputmode="numeric" placeholder="17" min="1" max="31"></label>
    <label>시<input id="ch" type="number" inputmode="numeric" placeholder="5" min="0" max="23"></label>
  </div>
  <label class="cchk"><input id="cnk" type="checkbox"> 태어난 시각을 모릅니다 (시주를 빼고 여섯 글자로 계산)</label>
  <button id="cgo" type="button">내 방향 보기</button>
  <div id="cout" class="cout" hidden></div>
  <div id="cad" class="cad" hidden><div class="cadl">광고</div><!--AD_UNIT--></div>
</div>
<script src="../data/saju-calculator.js"></script>
<script>
(function(){
  var DIR={목:{d:'동(東)',c:'청록',src:'수(水)',act:'배우기 · 기르기 · 아침 산책 · 새로 시작하기'},
           화:{d:'남(南)',c:'붉은색',src:'목(木)',act:'사람 만나기 · 표현하기 · 햇빛 쬐기'},
           토:{d:'중앙',  c:'황토색',src:'화(火)',act:'정리하기 · 요리 · 흙 만지기 · 루틴 만들기'},
           금:{d:'서(西)',c:'흰색·금속',src:'토(土)',act:'마무리하기 · 규칙 정하기 · 버리기 · 악기'},
           수:{d:'북(北)',c:'검정·남색',src:'금(金)',act:'쉬기 · 읽기 · 물가 가기 · 혼자 생각하기'}};
  var COL={목:'#4fb95f',화:'#e8483c',토:'#ffd93d',금:'#8e9bb0',수:'#3f8fe0'};
  var EL=['목','화','토','금','수'];
  var $=function(id){return document.getElementById(id)};
  $('cnk').addEventListener('change',function(){ $('ch').disabled=this.checked; });
  $('cgo').addEventListener('click',function(){
    var y=+$('cy').value, m=+$('cm').value, d=+$('cd').value;
    var nk=$('cnk').checked, h=nk?null:+$('ch').value;
    var out=$('cout'); out.hidden=false;
    if(!y||!m||!d||y<1900||y>2100||m<1||m>12||d<1||d>31||(!nk&&($('ch').value===''||h<0||h>23))){
      out.innerHTML='<div class="cerr">생년월일을 정확히 넣어 주세요. 시각을 모르면 아래를 체크하시면 됩니다.</div>';
      return;
    }
    var r;
    try{ r=calculateSaju({year:y,month:m,day:d,hour:h}); }
    catch(e){ out.innerHTML='<div class="cerr">계산에 실패했습니다. 날짜를 다시 확인해 주세요.</div>'; return; }
    var weak=EL.reduce(function(a,b){return r.elementRatio[a]<=r.elementRatio[b]?a:b});
    var tie=EL.filter(function(e){return e!==weak&&r.elementRatio[e]===r.elementRatio[weak]});
    var info=DIR[weak], c=COL[weak];
    var bars=EL.map(function(e){
      return '<div class="cb"><span class="cbl">'+e+'</span>'+
        '<span class="cbt"><i style="width:'+Math.max(2,r.elementRatio[e])+'%;background:'+COL[e]+'"></i></span>'+
        '<span class="cbv">'+r.elementRatio[e]+'%</span></div>';
    }).join('');
    var all=[weak].concat(tie), head, mid;
    if(tie.length){
      head='<div class="chead">가장 약한 오행이 <b>'+all.length+'개</b> 공동 최저입니다 '+
           '<span class="czero">(각 '+r.elementRatio[weak]+'%)</span></div>';
      mid='<div class="cbig">'+all.map(function(e){
            return '<span class="cdir" style="background:'+COL[e]+'">'+DIR[e].d+'</span>';
          }).join('')+'<span class="cdd">추천 방향 후보</span></div>'+
          '<table class="ctie"><tr><th>오행</th><th>방향</th><th>색</th><th>해 볼 만한 것</th></tr>'+
          all.map(function(e){
            return '<tr><td><b style="color:'+COL[e]+'">'+e+'</b></td><td>'+DIR[e].d+
                   '</td><td>'+DIR[e].c+'</td><td>'+DIR[e].act+'</td></tr>';
          }).join('')+'</table>';
    } else {
      head='<div class="chead">가장 약한 오행은 <b style="color:'+c+'">'+weak+'</b>'+
           (r.elementRatio[weak]===0?' <span class="czero">(0%)</span>':'')+'</div>';
      mid='<div class="cbig"><span class="cdir" style="background:'+c+'">'+info.d+'</span>'+
            '<span class="cdd">추천 방향</span></div>'+
          '<div class="cgrid">'+
            '<div><span class="ck">채워 주는 오행</span><span class="cv">'+info.src+'</span></div>'+
            '<div><span class="ck">어울리는 색</span><span class="cv">'+info.c+'</span></div>'+
            '<div class="cwide"><span class="ck">해 볼 만한 것</span><span class="cv">'+info.act+'</span></div>'+
          '</div>';
    }
    out.innerHTML = head + mid +
      '<div class="cbars"><div class="cbh">내 오행 비율 · '+r.pillars.year+' '+r.pillars.month+' '+r.pillars.day+
        (r.pillars.hour?' '+r.pillars.hour:'')+'</div>'+bars+'</div>'+
      (tie.length&&nk?'<div class="cnote">시주 두 글자가 비어서 공동 최저가 나왔습니다. <a href="taeeonan-sigak.html">태어난 시각을 찾으면</a> 대개 하나로 좁혀집니다.</div>':
       tie.length?'<div class="cnote">여덟 글자를 다 채워도 공동 최저인 경우입니다. 위 후보 중 끌리는 쪽을 보셔도 됩니다.</div>':'')+
      (nk&&!tie.length?'<div class="cnote">시주를 뺀 여섯 글자로 계산했습니다. 시각을 알면 결과가 달라질 수 있어요.</div>':'')+
      '<a class="cgame" href="/" data-cta="calc">이 오행으로 캐릭터 만들어 보기</a>';
    var ad=$('cad');
    if(ad&&ad.hidden){
      ad.hidden=false;
      if(ad.querySelector('ins.adsbygoogle')){
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}
      }
    }
    if(window.gtag) gtag('event','calc_run',{weak:weak,time_known:!nk});
  });
})();
</script>
"""

LOVECALC = """
<div class="calc lovecalc" id="lcalc">
  <div class="ct">나는 어떤 이성을 만날 수 있을까</div>
  <div class="cs">조건을 넣으면 대한민국 통계 기준으로 만날 수 있는 이성의 조건이 나옵니다.<br>
    입력값은 <b>브라우저 안에서만</b> 계산되고 어디로도 전송되지 않습니다.</div>

  <div class="lgen">
    <button type="button" id="lg-m" class="on">남성으로 입력</button>
    <button type="button" id="lg-f">여성으로 입력</button>
  </div>

  <div class="lrow">
    <label>나이<input id="l-age" type="number" inputmode="numeric" value="30" min="20" max="60"></label>
    <label>학력<select id="l-edu">
      <option value="30">고졸</option><option value="45">초대졸</option>
      <option value="60" selected>대졸</option><option value="80">석사졸</option>
      <option value="100">박사졸</option></select></label>
  </div>
  <div class="lrow">
    <label>연봉 (만원)<input id="l-sal" type="number" inputmode="numeric" value="4000" min="0" max="30000" step="100"></label>
    <label>보유 자산<select id="l-ast"></select></label>
  </div>
  <div class="lrow">
    <label>키 (cm)<input id="l-ht" type="number" inputmode="numeric" value="175" min="140" max="210"></label>
    <label>체중 (kg)<input id="l-wt" type="number" inputmode="numeric" value="70" min="30" max="200"></label>
  </div>

  <button id="lgo" type="button">내 조건 계산하기</button>
  <div id="lout" class="cout" hidden></div>
  <div id="lad" class="cad" hidden><div class="cadl">광고</div><!--AD_UNIT--></div>
</div>
<script src="../data/meetcal-core.js"></script>
<script>
(function(){
  var $=function(id){return document.getElementById(id)};
  var G='male';
  var BODY_MID=60;            // 신체 항목은 본 계산기에서만 — 여기서는 중간값 고정
  if(!window.MeetCal){ $('lgo').disabled=true; return; }

  $('l-ast').innerHTML = MeetCal.ASSET_TIERS.map(function(t,i){
    return '<option value="'+t.v+'"'+(i===6?' selected':'')+'>'+t.l+'</option>';
  }).join('');

  function setG(g){ G=g;
    $('lg-m').classList.toggle('on',g==='male');
    $('lg-f').classList.toggle('on',g==='female');
    $('l-ht').value = g==='male' ? 175 : 162;
    $('l-wt').value = g==='male' ? 70  : 53;
  }
  $('lg-m').addEventListener('click',function(){setG('male')});
  $('lg-f').addEventListener('click',function(){setG('female')});

  $('lgo').addEventListener('click',function(){
    var age=+$('l-age').value, sal=+$('l-sal').value, ast=+$('l-ast').value;
    var ht=+$('l-ht').value, wt=+$('l-wt').value, edu=+$('l-edu').value;
    var out=$('lout'); out.hidden=false;
    if(!(age>=20&&age<=60)||!(ht>=140&&ht<=210)||!(wt>=30&&wt<=200)||!(sal>=0)){
      out.innerHTML='<div class="cerr">나이 20~60세, 키 140~210cm, 체중 30~200kg 범위로 넣어 주세요.</div>';
      return;
    }
    var r=MeetCal.calc({gender:G,age:age,eduVal:edu,salary:sal,asset:ast,
                        height:ht,weight:wt,bodyVal:BODY_MID});
    var p=r.partner, pgLabel = r.partnerGender==='female' ? '여성' : '남성';
    out.innerHTML =
      '<div class="chead">만날 수 있는 <b>'+pgLabel+'</b>의 조건</div>'+
      '<table class="ltbl">'+
        '<tr><th>나이</th><td>'+p.pAge+'</td></tr>'+
        '<tr><th>연봉</th><td>'+p.pSal.l+' <span class="ltag">'+MeetCal.salJob(p.pSal.v)+'</span></td></tr>'+
        '<tr><th>보유 자산</th><td>'+p.pAst.l+'</td></tr>'+
        '<tr><th>학력</th><td>'+p.pEdu+'</td></tr>'+
        '<tr><th>키</th><td>'+p.pHt+'</td></tr>'+
        '<tr><th>체중</th><td>'+p.pWt+'</td></tr>'+
      '</table>'+
      '<div class="cnote">신체 조건까지 넣고 항목을 고정해 다시 계산해 보시려면 '+
        '<a href="/" data-cta="lovecalc_full">본 계산기</a>를 쓰시면 됩니다.</div>';
    var ad=$('lad');
    if(ad&&ad.hidden){
      ad.hidden=false;
      if(ad.querySelector('ins.adsbygoogle')){
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}
      }
    }
    if(window.gtag) gtag('event','lovecalc_run',{gender:G,age:age});
  });
  setG('male');
})();
</script>
"""

def head(title, desc, canon, img=None, article=False, meta=None):
    ga = f"""<script async src="https://www.googletagmanager.com/gtag/js?id={SITE['ga']}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}
gtag('js',new Date());gtag('config','{SITE['ga']}');</script>"""
    ld = ''
    if article and meta:
        ld = '<script type="application/ld+json">' + json.dumps({
            "@context":"https://schema.org","@type":"Article",
            "headline":meta['title'],"description":meta['desc'],
            "datePublished":str(meta['date']),"dateModified":str(meta['date']),
            "author":{"@type":"Organization","name":SITE['author']},
            "publisher":{"@type":"Organization","name":SITE['name']},
            "image":f"{SITE['base']}/{meta['image']}",
            "mainEntityOfPage":canon}, ensure_ascii=False) + '</script>'
    og = f'<meta property="og:image" content="{SITE["base"]}/{img}">' if img else ''
    ads = (f'<script async crossorigin="anonymous" '
           f'src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADS["client"]}"></script>'
           if ADS['on'] else '')
    return f"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0d1119">
<meta name="color-scheme" content="dark">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="{'article' if article else 'website'}">
<meta property="og:site_name" content="Four Paws">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canon}">
{og}
{ld}
{ga}
{ads}
<style>{CSS}</style>
<style>{brand.CSS}</style>
{brand.HEAD}
</head><body>
<header class="site"><div class="wrap">
  <a class="nm" href="/">{brand.MARK}Four&nbsp;Paws</a>
  <span class="tl"><a href="blog.html">{SITE['name']}</a></span>
  <nav>
    <a href="/map/" data-cta="nav_map">선택목록</a><a class="hl" href="blog.html" data-cta="nav_blog">사주 이야기</a><span data-fp-chip></span>
  </nav>
</div></header>"""

FOOT = f"""<footer class="site"><div class="wrap">
  <b style="color:var(--mut)">Four&nbsp;Paws</b> · 오행 댕댕이 키우기<br>
  <nav>
    <a href="/">처음으로</a><a href="/map/">선택목록</a><a href="/hunt/">사냥터</a><a href="/gunghap/">궁합소</a><a href="/iljin/">오늘의 기운</a><a href="/ohaeng/">사주 이야기</a><a href="/love/">이성 조건 계산기</a>
  </nav>
  {SITE['name']} · 사주 계산은 직접 만든 만세력 엔진을 씁니다.<br>
  글에 쓰인 숫자는 전부 재현 가능한 계산 결과입니다.
</div></footer>
<script>
document.querySelectorAll('[data-cta]').forEach(function(a){{
  a.addEventListener('click',function(){{
    if(window.gtag) gtag('event','cta_click',{{cta:a.dataset.cta,page:location.pathname}});
  }});
}});
</script>
</body></html>"""

def cta(where):
    return f"""<div class="cta">
  <div class="t">내 사주는 어떤 오행일까</div>
  <div class="s">생년월일시만 넣으면 1분 만에 나옵니다. 가입은 필요 없어요.<br>
     캐릭터가 나오면 그대로 사냥터에 들어갈 수 있습니다.</div>
  <a href="/" data-cta="{where}">내 사주 보기</a>
</div>"""

def kst_today():
    """한국 날짜. 발행 예정일이 오늘보다 뒤인 초안은 건너뛴다."""
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()


def build():
    posts, waiting = [], []
    today = kst_today()
    for fn in sorted(os.listdir(DRAFT)):
        if not fn.endswith('.md'): continue
        meta, body = read_md(os.path.join(DRAFT, fn))
        try:
            when = datetime.date.fromisoformat(str(meta['date'])[:10])
        except (ValueError, KeyError):
            when = today
        if when > today:
            waiting.append((str(when), meta.get('slug', fn)))
            continue
        posts.append((meta, body))
    if waiting:
        print('  발행 대기 — 날짜가 되면 자동으로 올라갑니다:')
        for when, slug in sorted(waiting):
            print(f'    {when}  {slug}')
    posts.sort(key=lambda p: str(p[0]['date']), reverse=True)

    os.makedirs(POSTS, exist_ok=True)
    for meta, body in posts:
        slug = meta['slug']
        canon = f"{SITE['base']}/posts/{slug}.html"
        # 본문 이미지 경로를 상위로 (posts/ 안에서 실행되므로)
        body = body.replace('src="img/', 'src="../img/')
        calc = CALC.replace('<!--AD_UNIT-->', ad_unit())
        body = body.replace('<p>{{CALC}}</p>', calc).replace('{{CALC}}', calc)
        love = LOVECALC.replace('<!--AD_UNIT-->', ad_unit())
        body = body.replace('<p>{{LOVECALC}}</p>', love).replace('{{LOVECALC}}', love)
        # 링크: 같은 폴더 안이라 그대로
        # CTA 두 군데 — 본문 중간(첫 h2 다음 두 번째 h2 앞)과 끝
        parts = body.split('<h2')
        if len(parts) >= 4:
            mid = 3
            body = ('<h2'.join(parts[:mid])) + cta('mid') + '<h2' + ('<h2'.join(parts[mid:]))
        rel = [m for m,_ in posts if m['slug'] != slug][:2]
        relhtml = ''
        if rel:
            relhtml = '<div class="related"><div class="h">같이 읽어 보세요</div>' + \
                ''.join(f'<a href="{m["slug"]}.html">{html.escape(m["title"])}</a>' for m in rel) + '</div>'
        page = head(meta['title'], meta['desc'], canon, meta.get('image'), True, meta) + f"""
<main class="wrap">
<article>
  <h1>{html.escape(meta['title'])}</h1>
  <div class="meta">{meta['date']} · {SITE['name']}</div>
  {body}
</article>
{cta('end')}
<p class="disc">{DISCLAIMER}</p>
{relhtml}
</main>""" + FOOT
        open(os.path.join(POSTS, slug+'.html'), 'w', encoding='utf-8').write(page)

    # 목록
    cards = ''.join(f"""<a class="card" href="posts/{m['slug']}.html">
  <img src="{m['image']}" alt="{html.escape(m['title'])}">
  <div class="bd"><div class="t">{html.escape(m['title'])}</div>
  <div class="d">{html.escape(m['desc'])}</div>
  <div class="m">{m['date']}</div></div></a>""" for m,_ in posts)
    idx = head(f"{SITE['name']} — {SITE['tagline']}",
               '사주 만세력을 직접 계산해 오행 통계를 씁니다. 262,980건을 세어 본 결과들.',
               f"{SITE['base']}/blog.html", 'img/og-ohaeng.png') + f"""
<main class="wrap">
  <h1>{SITE['name']}</h1>
  <div class="intro">사주 여덟 글자를 <b>직접 계산해서</b> 씁니다.
  글에 나오는 숫자는 전부 재현 가능한 계산 결과이고, 계산 방법과 한계도 같이 적습니다.</div>
  {cards}
</main>""" + FOOT
    open(os.path.join(ROOT,'blog.html'),'w',encoding='utf-8').write(idx)

    # index.json (중복·카니발 방지 기준)
    json.dump([{ 'slug':m['slug'],'title':m['title'],'keywords':m['keywords'],
                 'date':str(m['date']),'data':'data/result.json'} for m,_ in posts],
              open(os.path.join(ROOT,'index.json'),'w',encoding='utf-8'), ensure_ascii=False, indent=1)

    # sitemap
    urls = [f"{SITE['base']}/blog.html"] + [f"{SITE['base']}/posts/{m['slug']}.html" for m,_ in posts]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
         ''.join(f'<url><loc>{u}</loc><lastmod>{datetime.date.today()}</lastmod></url>\n' for u in urls) + '</urlset>\n'
    open(os.path.join(ROOT,'sitemap.xml'),'w',encoding='utf-8').write(sm)
    open(os.path.join(ROOT,'robots.txt'),'w',encoding='utf-8').write(
        f"User-agent: *\nAllow: /\nSitemap: {SITE['base']}/sitemap.xml\n")
    print(f"빌드 완료: {len(posts)}편")
    for m,_ in posts: print('  posts/'+m['slug']+'.html')
    return posts          # deploy.py 가 루트 허브의 글 카드를 채우는 데 씁니다

if __name__ == '__main__':
    build()
