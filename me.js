/* Four Paws — 내 오행 캐릭터.
 *
 * 캐릭터는 **한 곳에만 있다.** 페이지마다 따로 물어보면 사용자는 같은 걸
 * 세 번 입력하고, 매번 다른 답을 받을 수도 있다. 홈에서 한 번 만들면
 * 지도·사냥터·글 어디서나 그 캐릭터다.
 *
 * 이 파일은 모든 페이지의 <head> 에서 불린다. defer 를 붙이면 안 된다
 * (본문 끝 스크립트가 먼저 돌아 FP 가 없다).
 */
(function () {
  var KEY = 'fp.me';
  var OLD = 'saju.dominant';       /* 사냥터가 혼자 쓰던 예전 키 */
  var HJ = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  var COL = { 목: '#4fb95f', 화: '#e8483c', 토: '#ffd93d', 금: '#8e9bb0', 수: '#3f8fe0' };

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  var FP = {
    HJ: HJ, COL: COL,

    /* 저장된 캐릭터. 없으면 null. 예전 키에 있던 값은 한 번 옮겨 온다. */
    get: function () {
      var m = read();
      if (m && m.el) return m;
      try {
        var old = JSON.parse(localStorage.getItem(OLD) || 'null');
        if (old) { m = { el: old, at: Date.now() }; write(m); return m; }
      } catch (e) {}
      return null;
    },
    el: function () { var m = this.get(); return m ? m.el : null; },
    has: function () { return !!this.el(); },

    set: function (o) {
      var m = this.get() || {};
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) m[k] = o[k];
      m.at = Date.now();
      write(m);
      /* 사냥터의 예전 코드가 아직 이 키를 읽는다 — 같이 맞춰 둔다 */
      try { localStorage.setItem(OLD, JSON.stringify(m.el)); } catch (e) {}
      this.paint();
      return m;
    },
    clear: function () {
      try { localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) {}
      this.paint();
    },

    /* 헤더의 작은 프로필. 캐릭터가 있을 때만 보인다.
       누르면 지도로 간다 — 지도가 이 사이트의 집이다. */
    chipHTML: function () {
      var m = this.get(); if (!m) return '';
      return '<a class="fpchip" href="/map/" title="내 캐릭터 — 지도로">' +
             '<i style="background:' + (COL[m.el] || '#8e9bb0') + '">' + (HJ[m.el] || '?') + '</i>' +
             '<b>' + m.el + '</b></a>';
    },
    /* ── 속성 수치 ──
       사주 비율(%)은 '내 안에서의 비중'이라 사람끼리 비교가 안 된다.
       그래서 절대 수치로 바꾼다. 누구나 바닥 50에서 시작하고, 사주 비율이
       높은 속성일수록 위에서 시작한다. 용신석은 자기 속성만 1씩 올린다.
         수치 = 50 + 사주 비율 × 0.4 + 그 속성 용신석 개수
       단 문턱은 위로 갈수록 벌어진다 — 높은 단일수록 돌이 많이 나오기 때문이다.
       (2026-09-21, hunt 의 문턱과 같은 표를 쓴다) */
    BASE: 50, PER: 0.4,
    TH: [50, 55, 65, 85, 120, 175, 255, 365, 520, 730],
    ORDER: ['목', '화', '토', '금', '수'],
    TIERS: ['계단', '임단', '신단', '경단', '기단', '무단', '정단', '병단', '을단', '갑단'],
    /* 이 속성 수치로 싸우는 사냥터 = 이 속성이 누르는 땅 */
    USE: { 목: '황토 텃밭', 화: '하얀 골목', 토: '청빛 호수', 금: '녹빛 언덕', 수: '붉은 마당' },
    /* 이 속성 용신석이 나는 사냥터 */
    FROM: { 목: '녹빛 언덕', 화: '붉은 마당', 토: '황토 텃밭', 금: '하얀 골목', 수: '청빛 호수' },

    ratio: function () {
      var m = this.get(); if (!m) return null;
      if (m.ratio) return m.ratio;
      var r = {}; this.ORDER.forEach(function (e) { r[e] = e === m.el ? 40 : 15; });
      return r;                                     /* 예전 캐릭터 — 비율이 없던 시절 */
    },
    stones: function () {
      try { return JSON.parse(localStorage.getItem('hunt.stones') || 'null') || {}; } catch (e) { return {}; }
    },
    stats: function () {
      var r = this.ratio(); if (!r) return null;
      var st = this.stones(), me = this, out = {};
      this.ORDER.forEach(function (e) {
        var base = me.BASE + Math.round((r[e] || 0) * me.PER);
        out[e] = { base: base, stone: st[e] || 0, val: base + (st[e] || 0) };
      });
      return out;
    },
    /* 수치 → 깰 수 있는 가장 높은 단 (1~10) */
    tierOf: function (v) { var t = 0; for (var i = 0; i < 10; i++) if (v >= this.TH[i]) t = i + 1; return t; },
    /* 막대 위치(0~100). 칸 하나가 한 단이 되게 눈금을 고르게 편다 —
       문턱 간격이 5에서 210까지 벌어져서, 그냥 비례로 그리면 아래쪽 단이 안 보인다. */
    pos: function (v) {
      var T = [0].concat(this.TH);                 /* 0,50,55,…,730 → 칸 10개 */
      if (v >= T[10]) return 100;
      for (var i = 0; i < 10; i++)
        if (v < T[i + 1]) return (i + (v - T[i]) / (T[i + 1] - T[i])) * 10;
      return 100;
    },

    barsHTML: function (hl) {
      var s = this.stats(); if (!s) return '';
      var me = this, main = this.el();
      var ticks = '';
      for (var k = 1; k < 10; k++) ticks += '<i style="left:' + (k * 10) + '%"></i>';
      return '<div class="fpbars">' + this.ORDER.map(function (e) {
        var x = s[e], t = me.tierOf(x.val);
        var p0 = me.pos(x.base), p1 = me.pos(x.val);
        var nx = t < 10 ? me.TH[t] - x.val : 0;
        return '<div class="fb' + (e === main ? ' fpme' : '') + (e === hl ? ' fphl' : '') + '">' +
          '<span class="fh" style="background:' + COL[e] + '">' + HJ[e] + '</span>' +
          '<span class="fw">' +
            '<span class="ft"><b>' + e + ' ' + x.val + '</b>' +
              (x.stone ? '<em>용신석 +' + x.stone + '</em>' : '') +
              '<span>' + me.USE[e] + ' · ' + me.TIERS[t - 1] + (nx ? ' · 다음 단까지 ' + nx : '') + '</span></span>' +
            '<span class="fr">' + ticks +
              '<u style="width:' + p0 + '%;background:' + COL[e] + '"></u>' +
              (p1 > p0 ? '<s style="left:' + p0 + '%;width:' + (p1 - p0) + '%;background:' + COL[e] + '"></s>' : '') +
            '</span>' +
          '</span></div>';
      }).join('') +
      '<p class="fnote">막대 한 칸이 한 단입니다 (계단 50 · 갑단 730). 진한 부분은 타고난 몫, ' +
      '빗금은 용신석으로 올린 몫. 각 수치는 그 속성이 누르는 사냥터에서 쓰입니다.</p></div>';
    },

    paint: function () {
      var slots = document.querySelectorAll('[data-fp-chip]');
      for (var i = 0; i < slots.length; i++) slots[i].innerHTML = this.chipHTML();
    }
  };


  /* 막대 그래프 모양 — 어느 페이지에서 불러도 같게 여기서 한 번만 넣는다 */
  (function () {
    if (document.getElementById('fpbars-css')) return;
    var c = document.createElement('style'); c.id = 'fpbars-css';
    c.textContent =
      '.fpbars{margin:16px 0 4px;display:grid;gap:11px}' +
      '.fpbars .fb{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:center}' +
      '.fpbars .fh{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;' +
        'font:800 15px "Noto Serif KR",serif;color:#0a0f18}' +
      '.fpbars .ft{display:flex;align-items:baseline;gap:7px;font-size:13px;margin-bottom:5px}' +
      '.fpbars .ft b{font-size:14.5px;color:var(--ink,#e8edf5)}' +
      '.fpbars .ft em{font-style:normal;font-size:11.5px;color:#ffd93d}' +
      '.fpbars .ft span{margin-left:auto;font-size:11px;color:var(--dim,#8b96a8);white-space:nowrap}' +
      '.fpbars .fr{position:relative;display:block;height:10px;border-radius:6px;' +
        'background:rgba(255,255,255,.06);overflow:hidden}' +
      '.fpbars .fr i{position:absolute;top:0;bottom:0;width:1px;background:rgba(10,15,24,.55);z-index:2}' +
      '.fpbars .fr u{position:absolute;left:0;top:0;bottom:0;border-radius:6px 0 0 6px;opacity:.9}' +
      '.fpbars .fr s{position:absolute;top:0;bottom:0;opacity:.45;' +
        'background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 3px,transparent 3px 6px)!important}' +
      '.fpbars .fb:not(.fpme){opacity:.82}' +
      '.fpbars .fb.fphl{opacity:1}' +
      '.fpbars .fb.fphl .fr{box-shadow:0 0 0 1px rgba(255,217,61,.55)}' +
      '.fpbars .fb.fpme .ft b::after{content:" · 내 속성";font-size:11px;color:#ffd93d;font-weight:700}' +
      '.fpbars .fnote{margin:4px 0 0;font-size:12px;color:var(--dim,#8b96a8);line-height:1.6}';
    (document.head || document.documentElement).appendChild(c);
  })();

  window.FP = FP;
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { FP.paint(); });
  else FP.paint();
})();
