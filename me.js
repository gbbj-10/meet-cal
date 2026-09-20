/* Four Paws — 내 오행 캐릭터.
 *
 * 캐릭터는 **한 곳에만 있다.** 페이지마다 따로 물어보면 사용자는 같은 걸
 * 세 번 입력하고, 매번 다른 답을 받을 수도 있다. 홈에서 한 번 만들면
 * 지도·사냥터·글 어디서나 그 캐릭터다.
 *
 * 이 파일은 모든 페이지의 <head> 에서 defer 로 불린다.
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
    paint: function () {
      var slots = document.querySelectorAll('[data-fp-chip]');
      for (var i = 0; i < slots.length; i++) slots[i].innerHTML = this.chipHTML();
    }
  };

  window.FP = FP;
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { FP.paint(); });
  else FP.paint();
})();
