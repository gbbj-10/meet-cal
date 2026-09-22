/* Four Paws — 내 오행 캐릭터.
 *
 * 캐릭터는 **한 곳에만 있다.** 페이지마다 따로 물어보면 사용자는 같은 걸
 * 세 번 입력하고, 매번 다른 답을 받을 수도 있다. 홈에서 한 번 만들면
 * 지도·사냥터·글 어디서나 그 캐릭터다.
 *
 * 카카오로 로그인하면 캐릭터·용신석·깬 단이 서버(Supabase hunt_players)에
 * 저장되고, 다른 기기에서 같은 카카오 계정으로 들어오면 그대로 이어진다.
 * 로그인하지 않으면 이 브라우저 안에만 남는다.
 *
 * 이 파일은 모든 페이지의 <head> 에서 불린다. defer 를 붙이면 안 된다
 * (본문 끝 스크립트가 먼저 돌아 FP 가 없다).
 */
(function () {
  var KEY = 'fp.me';
  var OLD = 'saju.dominant';       /* 사냥터가 혼자 쓰던 예전 키 */
  var HJ = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  var COL = { 목: '#4fb95f', 화: '#e8483c', 토: '#ffd93d', 금: '#8e9bb0', 수: '#3f8fe0' };
  var SAENG = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };   /* A 가 B 를 살린다 */
  var GEUK  = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };   /* A 가 B 를 누른다 */

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function read() { return lsGet(KEY, null); }
  function write(v) { lsSet(KEY, v); }

  var FP = {
    HJ: HJ, COL: COL, SAENG: SAENG, GEUK: GEUK,

    /* 저장된 캐릭터. 없으면 null. 예전 키에 있던 값은 한 번 옮겨 온다. */
    get: function () {
      var m = read();
      if (m && m.el) return m;
      var old = lsGet(OLD, null);
      if (old) { m = { el: old, at: Date.now() }; write(m); return m; }
      return null;
    },
    el: function () { var m = this.get(); return m ? m.el : null; },
    has: function () { return !!this.el(); },

    set: function (o, quiet) {
      var m = this.get() || {};
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) m[k] = o[k];
      m.at = Date.now();
      write(m);
      lsSet(OLD, m.el);             /* 사냥터의 예전 코드가 아직 이 키를 읽는다 */
      this.paint();
      if (!quiet) this.push();
      return m;
    },
    clear: function () { lsSet(KEY, null); lsSet(OLD, null); this.paint(); },

    /* 헤더의 작은 프로필. 캐릭터가 있을 때만 보인다. 누르면 지도로 간다. */
    chipHTML: function () {
      var m = this.get(); if (!m) return '';
      return '<a class="fpchip" href="/map/" title="내 캐릭터 — 지도로">' +
             '<i style="background:' + (COL[m.el] || '#8e9bb0') + '">' + (HJ[m.el] || '?') + '</i>' +
             '<b>' + m.el + '</b></a>';
    },

    /* ── 오늘의 기운 (한국 날짜의 일주) ── */
    today: function () {
      var G = '갑을병정무기경신임계', Z = '자축인묘진사오미신유술해';
      var GE = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
      var ZE = { 자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수' };
      var GH = { 갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊', 기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸' };
      var ZH = { 자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳', 오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥' };
      var t = new Date(), k = new Date(t.getTime() + t.getTimezoneOffset() * 60000 + 9 * 3600000);
      var n = Math.round((Date.UTC(k.getFullYear(), k.getMonth(), k.getDate()) - Date.UTC(1900, 0, 31)) / 86400000);
      var g = G[((n % 10) + 10) % 10], z = Z[((n % 12) + 12) % 12];
      return { gan: g, zhi: z, ganHj: GH[g], zhiHj: ZH[z], els: [GE[g], ZE[z]] };
    },

    /* ── 속성 수치 ──
       사주 비율(%)은 '내 안에서의 비중'이라 사람끼리 비교가 안 된다.
       그래서 절대 수치로 바꾼다. 누구나 바닥 50에서 시작하고, 사주 비율이
       높은 속성일수록 위에서 시작한다. 용신석은 자기 속성만 1씩 올린다.
         수치 = 30 + 사주 비율 × 1.0 + 그 속성 용신석 개수
       오늘의 기운에 든 속성은 그날 +5% (막대에 노란 몫으로 보인다).
       ⚠ 2026-09-22 루프1 — 예전(50 + 비율×0.4, 오늘 +10%)에는 바닥 50 이 수치를 지배해
         사주가 달라도 다섯 명이 모두 같은 땅·같은 동선으로 갔다. 사주 몫을 2.5배로 키우고
         오늘의 기운을 반으로 줄여 '내 사주가 강한 땅'이 사람마다 달라지게 했다. */
    BASE: 30, PER: 1.0, TODAY: 0.05,
    ORDER: ['목', '화', '토', '금', '수'],
    TIERS: ['계단', '임단', '신단', '경단', '기단', '무단', '정단', '병단', '을단', '갑단'],
    /* 막대 눈금 — 칸 하나가 고르게 보이도록 벌어지는 눈금 (표시용) */
    BAR: [30, 40, 55, 75, 100, 140, 200, 280, 390, 540],

    /* ── 전투력 (2026-09-21 개정) ──
       한 속성만으로 싸우지 않는다. 다섯 속성을 땅과의 관계로 무게를 달아 더한다.
         그 땅을 누르는 속성 ×1.5 · 같은 속성 ×1.0 · 서로 살리는 사이 ×0.8 · 그 땅에 눌리는 속성 ×0.5
       예) 녹빛 언덕(목): 금×1.5 + 목×1 + 화×0.8 + 수×0.8 + 토×0.5
       문턱은 이 합계로 잰다. 누구든 최소 약 190 이라 계단(180)은 모두 깬다. */
    TH: [180, 205, 240, 310, 425, 605, 880, 1260, 1790, 2515],
    weight: function (x, g) {
      if (GEUK[x] === g) return 1.5;
      if (x === g) return 1.0;
      if (SAENG[g] === x || SAENG[x] === g) return 0.8;
      return 0.5;
    },
    /* 이 땅을 누르는 속성 — '○ 우세' */
    edge: function (g) { for (var a in GEUK) if (GEUK[a] === g) return a; return g; },

    FROM: { 목: '녹빛 언덕', 화: '붉은 마당', 토: '황토 텃밭', 금: '하얀 골목', 수: '청빛 호수' },

    /* ── 사주 조합 필살기 (2026-09-22) ──
       사주에서 가장 많은 두 속성이 만나면 오행 너머의 '변화 속성'이 생긴다.
       금+수 → 얼음, 화+토 → 가스 … 열 가지. 기단(5단)부터 전투에 나오고,
       두 속성이 누르는 두 땅에서 전투력 +8% (조합 공명). 후반에도 사주마다 길이 갈린다. */
    ULT_TIER: 5, COMBO_BONUS: 0.08,
    COMBO: {
      '목화': { nm: '번개',   hj: '雷', sk: '벽력일섬', skHj: '霹靂一閃', fx: 'bolt',    col: '#ffe45c', eff: '연쇄 — 벼락이 두 번 떨어집니다' },
      '화토': { nm: '가스',   hj: '瓦', sk: '독연분화', skHj: '毒煙噴火', fx: 'gas',     col: '#b6e05a', eff: '중독 — 사냥감이 독연에 휩싸입니다' },
      '토금': { nm: '수정',   hj: '晶', sk: '수정천주', skHj: '水晶天柱', fx: 'crystal', col: '#e9b8ff', eff: '결정 방벽 — 파티가 받는 피해가 줄어듭니다' },
      '금수': { nm: '얼음',   hj: '氷', sk: '빙결만리', skHj: '氷結萬里', fx: 'ice',     col: '#a8ecff', eff: '빙결 — 사냥감이 한 번 얼어붙습니다' },
      '목수': { nm: '안개',   hj: '霧', sk: '운무미혹', skHj: '雲霧迷惑', fx: 'mist',    col: '#dfe9f2', eff: '미혹 — 사냥감의 반격이 빗나갑니다' },
      '목토': { nm: '지진',   hj: '震', sk: '지룡진동', skHj: '地龍震動', fx: 'quake',   col: '#d9a45b', eff: '기절 — 사냥감이 한 번 쓰러집니다' },
      '토수': { nm: '진흙',   hj: '泥', sk: '니소속박', skHj: '泥沼束縛', fx: 'mud',     col: '#9b7a52', eff: '속박 — 사냥감의 발이 묶입니다' },
      '화수': { nm: '증기',   hj: '蒸', sk: '증기폭발', skHj: '蒸氣爆發', fx: 'steam',   col: '#f4f4f4', eff: '화상 — 뜨거운 김이 터집니다' },
      '화금': { nm: '쇳물',   hj: '熔', sk: '용철낙하', skHj: '熔鐵落下', fx: 'molten',  col: '#ff8a3d', eff: '관통 — 쇳물이 쏟아져 크게 들어갑니다' },
      '목금': { nm: '칼바람', hj: '風', sk: '풍인난무', skHj: '風刃亂舞', fx: 'wind',    col: '#d7fff0', eff: '연타 — 바람 칼날이 세 번 벱니다' }
    },
    /* r = 사주 비율 {목:..}. 1·2위(동률이면 ORDER 순). 2위가 0% 면 1위 속성끼리(순수) */
    combo: function (r) {
      r = r || this.ratio(); if (!r) return null;
      var o = this.ORDER.slice().sort(function (x, y) { return (r[y] || 0) - (r[x] || 0); });
      var a = o[0], b = (r[o[1]] || 0) > 0 ? o[1] : null;
      if (!b) return null;
      var ord = this.ORDER, k = [a, b].sort(function (x, y) { return ord.indexOf(x) - ord.indexOf(y); }).join('');
      var c = this.COMBO[k]; if (!c) return null;
      return { a: a, b: b, key: k, nm: c.nm, hj: c.hj, sk: c.sk, skHj: c.skHj, fx: c.fx, col: c.col, eff: c.eff,
               strong: [GEUK[a], GEUK[b]] };
    },

    ratio: function () {
      var m = this.get(); if (!m) return null;
      if (m.ratio) return m.ratio;
      var r = {}; this.ORDER.forEach(function (e) { r[e] = e === m.el ? 40 : 15; });
      return r;                                     /* 예전 캐릭터 — 비율이 없던 시절 */
    },
    stones: function () { return lsGet('hunt.stones', {}) || {}; },
    stats: function () {
      var r = this.ratio(); if (!r) return null;
      var st = this.stones(), me = this, td = this.today().els, out = {};
      this.ORDER.forEach(function (e) {
        var base = me.BASE + Math.round((r[e] || 0) * me.PER);
        var val = base + (st[e] || 0);
        var bonus = td.indexOf(e) >= 0 ? Math.round(val * me.TODAY) : 0;
        out[e] = { base: base, stone: st[e] || 0, val: val, today: bonus, now: val + bonus };
      });
      return out;
    },
    /* 한 사람의 전투력. vals 는 {목:수치,…} (오늘 몫 포함) */
    powerOf: function (vals, g) {
      var me = this, p = 0;
      this.ORDER.forEach(function (x) { p += (vals[x] || 0) * me.weight(x, g); });
      return Math.round(p);
    },
    myPower: function (g) {
      var s = this.stats(); if (!s) return 0;
      var v = {}; this.ORDER.forEach(function (x) { v[x] = s[x].now; });
      return this.powerOf(v, g);
    },
    tierOf: function (p) { var t = 0; for (var i = 0; i < 10; i++) if (p >= this.TH[i]) t = i + 1; return t; },

    /* 막대 위치(0~100). 칸 하나가 고르게 보이도록 눈금을 편다 */
    pos: function (v) {
      var T = [0].concat(this.BAR);
      if (v >= T[10]) return 100;
      for (var i = 0; i < 10; i++)
        if (v < T[i + 1]) return (i + (v - T[i]) / (T[i + 1] - T[i])) * 10;
      return 100;
    },

    /* 속성 막대 다섯 줄. o.hl = 강조할 속성, o.w = 사냥터(주면 무게를 옆에 적는다) */
    barsHTML: function (o) {
      if (typeof o === 'string') o = { hl: o };
      o = o || {};
      var s = this.stats(); if (!s) return '';
      var me = this, main = this.el(), anyToday = false;
      var ticks = '';
      for (var k = 1; k < 10; k++) ticks += '<i style="left:' + (k * 10) + '%"></i>';
      var rows = this.ORDER.map(function (e) {
        var x = s[e]; if (x.today) anyToday = true;
        var p0 = me.pos(x.base), p1 = me.pos(x.val), p2 = me.pos(x.now);
        var wt = o.w ? me.weight(e, o.w) : null;
        return '<div class="fb' + (e === main ? ' fpme' : '') + (e === o.hl ? ' fphl' : '') + '">' +
          '<span class="fh fpgem" style="--c:' + COL[e] + '">' + HJ[e] + '</span>' +
          '<span class="fw">' +
            '<span class="ft"><b>' + e + ' ' + x.now + '</b>' +
              (x.stone ? '<em>용신석 +' + x.stone + '</em>' : '') +
              (x.today ? '<em class="td">오늘 +' + x.today + '</em>' : '') +
              (wt != null ? '<span>×' + wt + '</span>' : '') + '</span>' +
            '<span class="fr">' + ticks +
              '<u style="width:' + p0 + '%;background:' + COL[e] + '"></u>' +
              (p1 > p0 ? '<s style="left:' + p0 + '%;width:' + (p1 - p0) + '%;background:' + COL[e] + '"></s>' : '') +
              (p2 > p1 ? '<b class="tdb" style="left:' + p1 + '%;width:' + (p2 - p1) + '%"></b>' : '') +
            '</span>' +
          '</span></div>';
      }).join('');
      return '<div class="fpbars">' + rows +
        (o.note === false ? '' :
        '<p class="fnote">진한 부분은 타고난 몫, 빗금은 용신석으로 올린 몫' +
        (anyToday ? ', <b style="color:#ffd93d">노란 부분은 오늘의 기운으로 오른 몫</b>' : '') + '입니다.</p>') +
        '</div>';
    },

    paint: function () {
      var slots = document.querySelectorAll('[data-fp-chip]');
      for (var i = 0; i < slots.length; i++) slots[i].innerHTML = this.chipHTML();
    },

    /* ================= 계정 (카카오 → Supabase) ================= */
    cfg: function () { return window.FPCFG || {}; },
    online: function () { var c = this.cfg(); return !!(c.sbUrl && c.sbKey && /^https?:/.test(c.sbUrl)); },
    _c: null, _load: null,
    /* supabase 클라이언트 — 한 페이지에 하나만 만든다 */
    client: function () {
      if (!this.online()) return null;
      if (!this._c && window.supabase) this._c = window.supabase.createClient(this.cfg().sbUrl, this.cfg().sbKey);
      return this._c;
    },
    ready: function () {
      var me = this;
      if (!this.online()) return Promise.resolve(null);
      if (this.client()) return Promise.resolve(this._c);
      if (!this._load) this._load = new Promise(function (res) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = function () { res(me.client()); };
        s.onerror = function () { res(null); };
        document.head.appendChild(s);
      });
      return this._load;
    },
    user: function () {
      return this.ready().then(function (c) {
        if (!c) return null;
        return c.auth.getSession().then(function (r) {
          var u = r.data && r.data.session && r.data.session.user; if (!u) return null;
          var m = u.user_metadata || {};
          return { id: u.id, nick: m.name || m.full_name || m.preferred_username || m.nickname || '이름없음',
                   pic: m.avatar_url || m.picture || '' };
        });
      }).catch(function () { return null; });
    },
    login: function (back) {
      return this.ready().then(function (c) {
        if (!c) return;
        return c.auth.signInWithOAuth({ provider: 'kakao',
          options: { redirectTo: back || location.href.split('#')[0] } });
      });
    },
    /* 로그아웃 — 서버에는 그대로 남고, 이 기기에서만 지운다 */
    logout: function () {
      var me = this;
      return this.ready().then(function (c) { return c ? c.auth.signOut() : null; })
        .catch(function () {}).then(function () {
          var kill = [];
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k === KEY || k === OLD || k === 'hunt.me' || k === 'hunt.stones' || /^hunt\.(tier|last|party|friends)\./.test(k)) kill.push(k);
          }
          kill.forEach(function (k) { lsSet(k, null); });
          me.paint();
        });
    },

    /* 이 기기의 진행 상황을 한 덩어리로 */
    tiers: function () {
      var t = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), m = /^hunt\.tier\.(.+)$/.exec(k || '');
        if (m) t[m[1]] = lsGet(k, 0) || 0;
      }
      return t;
    },

    /* 로그인한 사람의 진행을 서버와 맞춘다.
       - 서버에 캐릭터가 있으면 **서버 것이 이 기기 캐릭터가 된다** (같은 계정 = 같은 캐릭터)
       - 서버에 없고 이 기기에 있으면 이 기기 것을 올린다
       - 용신석·깬 단은 둘 중 큰 값을 남긴다 — 어느 기기에서 키운 것도 잃지 않게 */
    sync: function () {
      var me = this;
      return this.user().then(function (u) {
        if (!u) return null;
        me.who = u;
        var c = me._c;
        return c.from('hunt_players').select('*').eq('user_id', u.id).maybeSingle().then(function (q) {
          var row = q && q.data, changed = false;
          if (row && row.dominant_element) {
            var cur = me.get() || {};
            var srv = { el: row.dominant_element, ratio: row.ratio || cur.ratio || null,
                        top: row.top != null ? row.top : cur.top, timeKnown: !!row.time_known };
            if (cur.el !== srv.el || JSON.stringify(cur.ratio || null) !== JSON.stringify(srv.ratio)) {
              me.set(srv, true);
            }
          } else if (me.get()) changed = true;
          var ls = me.stones(), ss = (row && row.stones) || {}, ms = {};
          me.ORDER.forEach(function (e) {
            ms[e] = Math.max(ls[e] || 0, ss[e] || 0);
            if (ms[e] !== (ss[e] || 0)) changed = true;
          });
          lsSet('hunt.stones', ms);
          var lt = me.tiers(), st = (row && row.tiers) || {}, all = {};
          Object.keys(lt).concat(Object.keys(st)).forEach(function (g) {
            all[g] = Math.max(lt[g] || 0, st[g] || 0);
            if (all[g] !== (st[g] || 0)) changed = true;
            lsSet('hunt.tier.' + g, all[g]);
          });
          if (!row || row.nick !== u.nick) changed = true;
          me.synced = true;
          if (changed) return me.pushNow().then(function () { return u; });
          return u;
        });
      }).then(function (u) {
        try { document.dispatchEvent(new CustomEvent('fp:sync', { detail: u })); } catch (e) {}
        return u;
      }).catch(function () { return null; });
    },
    _pt: null,
    push: function () {
      var me = this;
      if (!this.online()) return;
      clearTimeout(this._pt);
      this._pt = setTimeout(function () { me.pushNow(); }, 700);
    },
    pushNow: function () {
      var me = this;
      if (!this.online()) return Promise.resolve();
      return this.user().then(function (u) {
        if (!u || !me._c) return;
        var m = me.get() || {};
        return me._c.from('hunt_players').upsert({
          user_id: u.id, nick: u.nick,
          dominant_element: m.el || null, ratio: m.ratio || null,
          top: m.top != null ? m.top : null, time_known: !!m.timeKnown,
          stones: me.stones(), tiers: me.tiers(), updated_at: new Date().toISOString()
        });
      }).catch(function () {});
    },

    /* 프로필 자리에 붙는 계정 줄 — 로그인/로그아웃 */
    accountHTML: function () {
      if (!this.online()) return '';
      return '<div class="fpacc" data-fp-acc><span class="fpacc-t">계정 확인 중…</span></div>';
    },
    paintAccount: function () {
      var me = this, els = document.querySelectorAll('[data-fp-acc]');
      if (!els.length || !this.online()) return;
      this.user().then(function (u) {
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (u) {
            el.innerHTML = (u.pic ? '<img src="' + u.pic + '" alt="">' : '<i class="fpacc-k">K</i>') +
              '<span class="fpacc-t"><b>' + u.nick.replace(/[<>&"]/g, '') + '</b> · 카카오 계정에 저장 중</span>' +
              '<button type="button" class="fpacc-b" data-fp-out>로그아웃</button>';
          } else {
            el.innerHTML = '<span class="fpacc-t">카카오로 로그인하면 <b>다른 기기에서도</b> 이 캐릭터가 이어집니다.</span>' +
              '<button type="button" class="fpacc-b in" data-fp-in>카카오로 로그인</button>';
          }
        }
        [].forEach.call(document.querySelectorAll('[data-fp-out]'), function (b) {
          b.onclick = function () { if (confirm('로그아웃할까요? 캐릭터와 용신석은 카카오 계정에 남아 있습니다.')) me.logout().then(function () { location.reload(); }); };
        });
        [].forEach.call(document.querySelectorAll('[data-fp-in]'), function (b) {
          b.onclick = function () { me.login(); };
        });
      });
    }
  };

  /* 막대·계정 줄 모양 — 어느 페이지에서 불러도 같게 여기서 한 번만 넣는다 */
  (function () {
    if (document.getElementById('fpbars-css')) return;
    var c = document.createElement('style'); c.id = 'fpbars-css';
    c.textContent =
      '.fpbars{margin:16px 0 4px;display:grid;gap:11px}' +
      '.fpbars .fb{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:center}' +
      '.fpbars .fh{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;' +
        'font:800 15px "Noto Serif KR",serif;color:#0a0f18}' +
      '.fpgem{color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.7);' +
        'background:radial-gradient(circle at 30% 24%,rgba(255,255,255,.9) 0 6%,rgba(255,255,255,.3) 13%,transparent 26%),' +
        'linear-gradient(135deg,color-mix(in srgb,var(--c) 55%,#fff),var(--c) 45%,color-mix(in srgb,var(--c) 60%,#000))!important;' +
        'box-shadow:inset 0 -4px 7px rgba(0,0,0,.4),inset 0 2px 4px rgba(255,255,255,.35),' +
        '0 0 0 1.5px color-mix(in srgb,var(--c) 45%,#1a2230),0 3px 10px color-mix(in srgb,var(--c) 40%,transparent)}' +
      '.fpbars .ft{display:flex;align-items:baseline;gap:7px;font-size:13px;margin-bottom:5px;flex-wrap:wrap}' +
      '.fpbars .ft b{font-size:14.5px;color:var(--ink,#e8edf5)}' +
      '.fpbars .ft em{font-style:normal;font-size:11.5px;color:#9cc3f7}' +
      '.fpbars .ft em.td{color:#ffd93d;font-weight:700}' +
      '.fpbars .ft span{margin-left:auto;font-size:11.5px;color:var(--dim,#8b96a8);white-space:nowrap}' +
      '.fpbars .fr{position:relative;display:block;height:10px;border-radius:6px;' +
        'background:rgba(255,255,255,.06);overflow:hidden}' +
      '.fpbars .fr i{position:absolute;top:0;bottom:0;width:1px;background:rgba(10,15,24,.55);z-index:2}' +
      '.fpbars .fr u{position:absolute;left:0;top:0;bottom:0;border-radius:6px 0 0 6px;opacity:.9}' +
      '.fpbars .fr s{position:absolute;top:0;bottom:0;opacity:.5;' +
        'background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 3px,transparent 3px 6px)!important}' +
      '.fpbars .fr b.tdb{position:absolute;top:0;bottom:0;z-index:3;border-radius:0 6px 6px 0;' +
        'background:repeating-linear-gradient(90deg,#fff7c7 0 3px,#ffd93d 3px 6px);' +
        'box-shadow:inset 0 0 0 1.5px #fffdf0,0 0 9px rgba(255,217,61,.85)}' +
      '.fpbars .fb:not(.fpme){opacity:.85}' +
      '.fpbars .fb.fphl{opacity:1}' +
      '.fpbars .fb.fphl .fr{box-shadow:0 0 0 1px rgba(255,217,61,.55)}' +
      '.fpbars .fb.fpme .ft b::after{content:" · 내 속성";font-size:11px;color:#ffd93d;font-weight:700}' +
      '.fpbars .fnote{margin:4px 0 0;font-size:12px;color:var(--dim,#8b96a8);line-height:1.6}' +
      '.fpacc{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 0;padding:11px 13px;' +
        'border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:13px;' +
        'color:var(--mut,#b4c0d2)}' +
      '.fpacc img,.fpacc .fpacc-k{width:26px;height:26px;border-radius:50%;flex:none;object-fit:cover}' +
      '.fpacc .fpacc-k{display:grid;place-items:center;background:#FEE500;color:#191600;font-style:normal;font-weight:800;font-size:12px}' +
      '.fpacc .fpacc-t{flex:1;min-width:160px}' +
      '.fpacc .fpacc-t b{color:var(--ink,#e8edf5)}' +
      '.fpacc .fpacc-b{margin-left:auto;border:1px solid rgba(255,255,255,.18);background:transparent;color:var(--mut,#b4c0d2);' +
        'border-radius:9px;padding:7px 12px;font:inherit;font-size:12.5px;cursor:pointer}' +
      '.fpacc .fpacc-b.in{background:#FEE500;color:#191600;border:0;font-weight:700}';
    (document.head || document.documentElement).appendChild(c);
  })();

  window.FP = FP;
  function boot() {
    FP.paint();
    /* 로그인한 상태로 들어오면 한 번 맞춘다. 끝나면 fp:sync 가 난다. */
    if (FP.online()) FP.sync().then(function () { FP.paintAccount(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
