# -*- coding: utf-8 -*-
"""/privacy/ 개인정보처리방침 · /about/ 소개·문의 (2026-09-25).

애드센스 신청 전 준비(사용자 '처리해놔'). 카카오 로그인으로 개인정보를 받으니 법적으로도 필요하다.
연락처는 메일을 공개하지 않고 문의 양식으로만 받는다(사용자 결정) — 문의는 Supabase contact_msgs 에
넣기만 되고(anon/authenticated insert), 읽기는 운영자가 대시보드에서 한다.
운영자 표기: Four Paws. 말투: 합니다체(사이트 기준, 궁합소만 해요체).
"""
import brand

SITE_ROOT = 'https://meetcal.co.kr'
EFFECTIVE = '2026년 9월 25일'

FOOT_LINKS = [('/', '처음으로'), ('/map/', '선택목록'), ('/hunt/', '사냥터'), ('/gunghap/', '궁합소'),
              ('/iljin/', '오늘의 기운'), ('/ohaeng/', '사주 이야기'), ('/love/', '이성 조건 계산기')]
LEGAL = '<span class="legal"><a href="/about/">소개·문의</a><a href="/privacy/">개인정보처리방침</a></span>'


def _foot(skip):
    return ''.join(f'<a href="{h}">{t}</a>' for h, t in FOOT_LINKS if h != skip)


SHELL = r"""<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0d1119">
__HEAD__
<meta name="color-scheme" content="dark">
<title>__TITLE__ | Four Paws</title>
<meta name="description" content="__DESC__">
<link rel="canonical" href="__ROOT____PATH__">
<meta property="og:type" content="website">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="__ROOT____PATH__">
<meta property="og:image" content="__ROOT__/ohaeng/img/og-ohaeng.png">
__GA__
<style>
:root{--ink:#e9eef6;--mut:#96a3b6;--dim:#6b7789;--line:#242d3d;--bg:#0d1119;--pan:#151b26;--acc:#5b9bf0;--to:#ffd93d}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.8;
 font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
 font-size:16.5px;word-break:keep-all;overflow-wrap:break-word}
a{color:var(--acc)}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
header.site{border-bottom:1px solid var(--line);padding:16px 0}
header.site .wrap{display:flex;align-items:center;gap:14px}
header.site .nm{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
__MKCSS__
header.site .tl{font-size:12.5px;color:var(--dim);margin-left:-4px}
header.site nav{margin-left:auto;display:flex;gap:15px}
header.site nav a{font-size:14.5px;color:var(--mut);text-decoration:none}
h1{font-size:28px;margin:36px 0 8px;letter-spacing:-.02em}
.lead{color:var(--mut);margin:0 0 28px}
h2{font-size:19px;margin:34px 0 10px;padding-top:6px;border-top:1px solid var(--line)}
h3{font-size:16.5px;margin:20px 0 6px}
p,li{color:#d6dde8}
ul{padding-left:22px}
table{width:100%;border-collapse:collapse;font-size:14.5px;margin:10px 0}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--pan);color:var(--ink);font-weight:700}
.tbl{overflow-x:auto}
.box{background:var(--pan);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:14px 0}
.muted{color:var(--dim);font-size:14px}
form label{display:block;font-size:14px;color:var(--mut);margin:14px 0 6px}
form select,form textarea,form input{width:100%;background:#0f141d;border:1px solid #2a3446;border-radius:10px;
 color:var(--ink);font:inherit;font-size:15.5px;padding:11px 12px}
form textarea{min-height:150px;resize:vertical}
form .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
form button{margin-top:16px;width:100%;padding:14px;border:0;border-radius:12px;background:var(--acc);
 color:#08101c;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
form button:disabled{opacity:.6;cursor:default}
.msg{margin-top:12px;font-size:14.5px}
.msg.ok{color:#58e08f}.msg.err{color:#f08c8c}
footer.site{margin-top:48px;border-top:1px solid var(--line);padding:22px 0 40px;font-size:13px;color:var(--dim)}
footer.site a{color:var(--mut);text-decoration:none;margin-right:14px}
footer.site .legal{display:block;margin-top:10px}
@media(max-width:560px){header.site .tl{display:none}}
@media(max-width:430px){h1{font-size:24px}}
</style>
</head><body>
<header class="site"><div class="wrap">
  <a class="nm" href="/">__MARK__Four&nbsp;Paws</a><span class="tl">오행 댕댕이 키우기</span>
  <nav><a href="/map/">선택목록</a><a href="/ohaeng/">사주 이야기</a><span data-fp-chip></span></nav>
</div></header>
<main class="wrap">
__BODY__
</main>
<footer class="site"><div class="wrap">__FOOT____LEGAL__</div></footer>
__SCRIPT__
</body></html>
"""

PRIVACY = """
<h1>개인정보처리방침</h1>
<p class="lead">Four Paws(이하 '서비스')는 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」에 따라 아래와 같이 처리합니다.
시행일: __EFF__</p>

<h2>1. 처리하는 개인정보와 목적</h2>
<div class="tbl"><table>
<tr><th>언제</th><th>항목</th><th>목적</th></tr>
<tr><td>카카오톡 로그인</td><td>카카오 계정 식별자, 닉네임, 프로필 사진, 카카오계정 이메일(선택 동의한 경우)</td><td>회원 확인, 캐릭터·진행 상황을 기기와 상관없이 이어 가기</td></tr>
<tr><td>캐릭터 생성·궁합 보기</td><td>사주 여덟 글자, 오행 비율, 태어난 시각을 아는지 여부, 서비스 안에서 쓰는 닉네임</td><td>캐릭터 만들기, 사냥터 전투력 계산, 궁합 계산</td></tr>
<tr><td>사냥터 이용</td><td>용신석 개수, 정복한 단, 파티 구성, 친구 목록(초대로 연결된 이용자의 닉네임·오행·수치)</td><td>게임 진행 저장, 친구와 파티 맺기</td></tr>
<tr><td>궁합소 이용</td><td>초대 코드, 초대한 사람·받은 사람의 닉네임·오행·사주 여덟 글자</td><td>두 사람의 궁합 결과 보여 주기</td></tr>
<tr><td>문의 양식</td><td>문의 내용, 답장 받을 연락처(적은 경우만)</td><td>문의 답변</td></tr>
<tr><td>자동 수집</td><td>접속 기록, 쿠키, 기기·브라우저 정보, 방문 페이지</td><td>방문 통계(구글 애널리틱스), 광고 게재(구글 애드센스)</td></tr>
</table></div>
<p><b>생년월일은 저장하지 않습니다.</b> 생년월일시는 이용자의 브라우저 안에서 사주 여덟 글자로 계산하는 데만 쓰고,
서버에는 계산 결과(여덟 글자와 오행 비율)만 저장합니다. 이성 조건 계산기·오늘의 기운에 넣는 값도 서버로 보내지 않습니다.</p>
<p>로그인하지 않고 쓰는 경우 캐릭터·설정은 이용자 기기의 브라우저 저장소(localStorage)에만 남고, 서비스는 그 내용을 받지 않습니다.</p>

<h2>2. 보유 기간과 파기</h2>
<ul>
<li>회원 정보·게임 기록: <b>탈퇴(삭제 요청) 시까지</b>. 요청을 받으면 지체 없이 파기합니다.</li>
<li>궁합 초대 기록: 초대한 사람이 지우거나 탈퇴할 때까지.</li>
<li>문의 내용: 답변 뒤 <b>1년</b> 보관 후 파기합니다.</li>
<li>방문 통계: 구글 애널리틱스의 데이터 보관 기간 설정에 따릅니다.</li>
</ul>
<p>전자 파일은 복구할 수 없는 방법으로 지웁니다.</p>

<h2>3. 처리를 맡기는 곳(위탁)과 국외 이전</h2>
<div class="tbl"><table>
<tr><th>받는 곳</th><th>맡기는 일</th><th>위치</th></tr>
<tr><td>Supabase Inc.</td><td>회원 인증, 게임·궁합·문의 데이터 저장</td><td>서울 리전(ap-northeast-2) 서버</td></tr>
<tr><td>㈜카카오</td><td>카카오톡 로그인, 카카오톡 공유</td><td>대한민국</td></tr>
<tr><td>Google LLC</td><td>방문 통계(애널리틱스), 광고 게재(애드센스)</td><td>미국 등 — 접속 시 쿠키로 전송</td></tr>
<tr><td>GitHub Inc.</td><td>웹페이지 호스팅(개인정보 저장 없음, 접속 기록만)</td><td>미국 등</td></tr>
</table></div>
<p>위 경우 외에 이용자의 개인정보를 제3자에게 제공하지 않습니다. 법령에 따른 요청이 있을 때는 예외입니다.</p>

<h2>4. 쿠키와 광고</h2>
<p>서비스는 방문 통계와 광고를 위해 구글의 쿠키를 씁니다.</p>
<ul>
<li><b>구글 애널리틱스</b>: 어떤 페이지가 얼마나 읽히는지 통계를 냅니다. 개인을 알아보는 용도로 쓰지 않습니다.</li>
<li><b>구글 애드센스</b>: 구글을 포함한 제3자 광고 사업자가 쿠키를 써서 이용자의 이전 방문을 바탕으로 광고를 보여 줄 수 있습니다.
맞춤 광고는 <a href="https://adssettings.google.com" rel="noopener">구글 광고 설정</a>에서 끌 수 있고,
<a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>에서 다른 광고 사업자의 맞춤 광고도 끌 수 있습니다.</li>
<li>브라우저 설정에서 쿠키를 막을 수 있습니다. 막아도 계산기·글은 그대로 쓸 수 있고, 로그인이 필요한 사냥터·궁합소는 쓰기 어려울 수 있습니다.</li>
</ul>

<h2>5. 이용자의 권리</h2>
<p>이용자는 언제든 자기 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있습니다.</p>
<ul>
<li>닉네임은 홈의 캐릭터 카드에서 직접 바꿀 수 있습니다.</li>
<li>열람·삭제(탈퇴)는 <a href="/about/#contact">문의 양식</a>에서 '개인정보 요청'을 골라 보내 주세요. 로그인한 상태로 보내면 본인 확인이 쉽습니다.</li>
<li>카카오 쪽 연결은 카카오톡 › 설정 › 카카오계정 › 연결된 서비스 관리에서 끊을 수 있습니다. 끊은 뒤 삭제 요청을 주시면 서버 기록도 지웁니다.</li>
</ul>

<h2>6. 만 14세 미만</h2>
<p>서비스는 만 14세 미만 아동의 회원 가입을 받지 않습니다. 만 14세 미만의 정보가 수집된 것을 알게 되면 바로 지웁니다.</p>

<h2>7. 안전하게 지키는 방법</h2>
<ul>
<li>데이터베이스는 행 단위 보안 규칙으로 <b>본인 데이터만</b> 읽고 쓸 수 있게 막아 두었습니다.</li>
<li>모든 연결은 HTTPS로 암호화합니다.</li>
<li>관리 권한은 운영자 한 명만 가집니다.</li>
</ul>

<h2>8. 개인정보 보호 책임자</h2>
<p>책임자: Four Paws 운영자<br>연락: <a href="/about/#contact">문의 양식</a> (메일 주소는 공개하지 않습니다)</p>
<p class="muted">개인정보 침해 신고·상담은 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr),
개인정보분쟁조정위원회(1833-6972, kopico.go.kr)에도 할 수 있습니다.</p>

<h2>9. 바뀔 때</h2>
<p>이 방침이 바뀌면 시행 7일 전에 이 페이지에 알립니다.</p>
"""

ABOUT = """
<h1>Four Paws 소개</h1>
<p class="lead">생년월일로 내 오행 캐릭터를 만들고, 그 캐릭터로 사냥하고, 궁합을 보는 사이트입니다.</p>

<h2>무엇을 하는 곳인가</h2>
<ul>
<li><b>캐릭터 생성</b> — 생년월일시로 사주 여덟 글자를 계산하고, 가장 많은 오행으로 내 댕댕이 캐릭터를 만듭니다.</li>
<li><b>사냥터</b> — 오행 사냥터 다섯 곳에서 친구와 파티를 맺어 싸우고, 용신석을 모아 캐릭터를 키웁니다.</li>
<li><b>궁합소</b> — 카카오톡으로 상대를 불러 두 사람의 여덟 글자로 궁합을 봅니다.</li>
<li><b>오늘의 기운</b> — 오늘의 일진을 매일 계산해 올립니다.</li>
<li><b>사주 이야기</b> — 26만 건을 직접 세어 본 통계처럼, 계산으로 확인한 사주 이야기를 씁니다.</li>
<li><b>이성 조건 계산기</b> — 내 조건으로 만날 수 있는 이성의 조건을 통계로 계산합니다.</li>
</ul>

<h2>어떻게 만드나</h2>
<p>사주 계산은 운세 API를 쓰지 않고 <b>직접 만든 만세력 엔진</b>으로 합니다. 절기 경계는 태양 황경으로 계산하고,
글에 나오는 숫자는 모두 다시 계산해 볼 수 있는 결과입니다. 사주 해석은 통계적 사실이 아니라 전통 해석이니 재미로 봐 주세요.</p>

<h2>운영</h2>
<div class="box">
<p style="margin:0">운영: <b>Four Paws</b><br>
사이트: meetcal.co.kr<br>
개인정보: <a href="/privacy/">개인정보처리방침</a></p>
</div>

<h2 id="contact">문의하기</h2>
<p>오류 신고, 개인정보 열람·삭제 요청, 제휴 문의를 받습니다. 답장이 필요하면 받을 연락처를 적어 주세요 — 적지 않으면 답장할 수 없습니다.</p>
<form id="cf" novalidate>
  <label for="cf-kind">종류</label>
  <select id="cf-kind"><option>문의</option><option>오류 신고</option><option>개인정보 요청</option><option>제휴</option><option>기타</option></select>
  <label for="cf-body">내용 (5~2,000자)</label>
  <textarea id="cf-body" maxlength="2000" required></textarea>
  <label for="cf-reply">답장 받을 연락처 (선택 — 메일 등)</label>
  <input id="cf-reply" maxlength="120" autocomplete="email">
  <div class="hp" aria-hidden="true"><label for="cf-web">비워 두세요</label><input id="cf-web" tabindex="-1" autocomplete="off"></div>
  <p class="muted">보낸 내용은 답변 뒤 1년 보관하고 지웁니다. 자세한 내용은 <a href="/privacy/">개인정보처리방침</a>에 있습니다.</p>
  <button type="submit" id="cf-go">보내기</button>
  <p class="msg" id="cf-msg" role="status"></p>
</form>
"""

ABOUT_JS = r"""<script>
(function(){
  var f=document.getElementById('cf'), go=document.getElementById('cf-go'), msg=document.getElementById('cf-msg');
  function say(t,ok){ msg.textContent=t; msg.className='msg '+(ok?'ok':'err'); }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(document.getElementById('cf-web').value){ say('보냈습니다.',true); return; }   /* 스팸 봇 */
    var body=document.getElementById('cf-body').value.trim();
    if(body.length<5){ say('내용을 5자 이상 적어 주세요.',false); return; }
    var row={kind:document.getElementById('cf-kind').value, body:body.slice(0,2000),
             reply_to:(document.getElementById('cf-reply').value.trim().slice(0,120)||null), page:(document.referrer||'').slice(0,200)||null};
    if(!(window.FP&&FP.online&&FP.online())){ say('지금은 보낼 수 없습니다. 잠시 뒤에 다시 시도해 주세요.',false); return; }
    go.disabled=true; say('보내는 중…',true);
    FP.ready().then(function(c){
      if(!c) throw new Error('offline');
      return c.from('contact_msgs').insert(row);
    }).then(function(r){
      if(r&&r.error) throw r.error;
      say('보냈습니다. 고맙습니다.',true); f.reset();
      if(window.gtag) gtag('event','contact_send',{kind:row.kind});
    }).catch(function(){ say('보내지 못했습니다. 잠시 뒤에 다시 시도해 주세요.',false); })
      .then(function(){ go.disabled=false; });
  });
})();
</script>"""


def _page(path, title, desc, body, ga, script=''):
    s = SHELL
    for k, v in (('__HEAD__', brand.HEAD), ('__MKCSS__', brand.CSS), ('__MARK__', brand.MARK),
                 ('__TITLE__', title), ('__DESC__', desc), ('__ROOT__', SITE_ROOT), ('__PATH__', path),
                 ('__GA__', ga), ('__BODY__', body.replace('__EFF__', EFFECTIVE)),
                 ('__FOOT__', _foot(path)), ('__LEGAL__', LEGAL), ('__SCRIPT__', script)):
        s = s.replace(k, v)
    return s


def render_privacy(ga):
    return _page('/privacy/', '개인정보처리방침',
                 'Four Paws가 어떤 개인정보를 왜 받고, 얼마나 보관하며, 어떻게 지우는지 적었습니다. 생년월일은 저장하지 않습니다.',
                 PRIVACY, ga)


def render_about(ga):
    return _page('/about/', 'Four Paws 소개·문의',
                 '생년월일로 오행 캐릭터를 만들고 사냥·궁합을 보는 Four Paws 소개와 문의 양식입니다.',
                 ABOUT, ga, ABOUT_JS)
