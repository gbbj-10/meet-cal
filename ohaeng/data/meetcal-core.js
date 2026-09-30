/*
 * meetcal-core.js v2 — 이성 조건 계산 로직 (DOM 없음)
 *
 * v1 은 모든 점수가 계단식(구간마다 같은 점수)이었습니다.
 * v2 는 계단의 각 구간 시작점을 기준점(앵커)으로 삼고, 그 사이를 단조 곡선(PCHIP)으로
 * 이어서 1단위마다 점수가 달라지게 했습니다.  예) 남자 키 171cm 58점 → 172cm 62점 → 174cm 70점
 *  - 기준점 위의 점수는 v1 과 똑같습니다(계단의 첫 칸 = 기존 점수).
 *  - 맨 위 상한과 맨 아래 하한은 v1 그대로 둡니다(그 밖은 평평).
 *  - BMI 는 가운데가 가장 높은 산 모양이라 구간 가운뎃점을 기준점으로 씁니다.
 *  - 학력·컵 사이즈는 순서만 있는 범주라 곡선을 만들 수 없어 그대로 둡니다.
 * 결과(점수 → 상대 조건)도 같은 방식으로 곡선화해서 '25~29세' 대신 '27세'처럼 한 값이 나옵니다.
 *
 * 사용:
 *   const r = MeetCal.calc({gender:'male', age:30, eduVal:60, salary:4000,
 *                           asset:3000, height:175, weight:70, bodyVal:60});
 *   r.partner.pAge  → '27세'
 */
(function (root) {
  'use strict';

  /* ── 단조 3차 보간(PCHIP, Fritsch–Carlson) ── */
  function curve(pts) {
    var n = pts.length, x = [], y = [], d = [], m = [], i;
    for (i = 0; i < n; i++) { x.push(pts[i][0]); y.push(pts[i][1]); }
    var h = [];
    for (i = 0; i < n - 1; i++) { h.push(x[i + 1] - x[i]); d.push((y[i + 1] - y[i]) / h[i]); }
    if (n === 2) { m = [d[0], d[0]]; }
    else {
      m[0] = end(h[0], h[1], d[0], d[1]);
      m[n - 1] = end(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
      for (i = 1; i < n - 1; i++) {
        if (d[i - 1] === 0 || d[i] === 0 || (d[i - 1] > 0) !== (d[i] > 0)) m[i] = 0;
        else {
          var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
          m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
        }
      }
    }
    function end(h0, h1, d0, d1) {
      var v = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
      if ((v > 0) !== (d0 > 0) || d0 === 0) return 0;
      if ((d0 > 0) !== (d1 > 0) && Math.abs(v) > Math.abs(3 * d0)) return 3 * d0;
      return v;
    }
    function f(t) {
      if (!(t === t)) return y[0];
      if (t <= x[0]) return y[0];
      if (t >= x[n - 1]) return y[n - 1];
      var k = 0;
      while (k < n - 2 && t >= x[k + 1]) k++;
      var s = (t - x[k]) / h[k], s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * y[k] + (s3 - 2 * s2 + s) * h[k] * m[k] +
             (-2 * s3 + 3 * s2) * y[k + 1] + (s3 - s2) * h[k] * m[k + 1];
    }
    f.pts = pts; f.lo = x[0]; f.hi = x[n - 1]; f.ylo = y[0]; f.yhi = y[n - 1];
    return f;
  }
  function swap(pts) {
    return pts.map(function (p) { return [p[1], p[0]]; }).sort(function (a, b) { return a[0] - b[0]; });
  }

  /* ── 기준점 표 ── [입력값, 점수]  (v1 계단의 구간 시작점) */
  var A = {
    htM:  [[155,0],[160,15],[165,30],[168,45],[171,58],[174,70],[177,80],[180,88],[183,94],[186,100]],
    htF:  [[145,10],[150,25],[155,45],[158,62],[161,76],[164,87],[167,94],[170,100]],
    bmiM: [[15,10],[17.25,40],[19.75,88],[22,95],[24,80],[26,60],[28.5,35],[31.5,10]],
    bmiF: [[14,10],[16,40],[18,80],[20,95],[22,88],[24,70],[26.5,40],[29.5,10]],
    ageM: [[20,95],[25,85],[30,72],[35,55],[40,38],[45,25],[50,17],[55,10],[60,5]],
    ageF: [[20,95],[25,88],[30,65],[35,42],[40,25],[45,16],[50,10],[55,6],[60,2]],
    salM: [[0,5],[1500,20],[2500,38],[3500,57],[5000,72],[7000,85],[10000,97]],
    salF: [[0,10],[1500,35],[2500,58],[3500,76],[5000,89],[7000,96],[10000,99]],
    ast:  [[-10000,0],[-5000,3],[-3000,6],[-1000,10],[-500,15],[0,20],[500,30],[2000,50],
           [5000,68],[10000,82],[30000,90],[50000,97]],
    len:  [[7,15],[9,35],[11,60],[13,78],[15,90],[17,98]]
  };
  /* ── 결과 쪽 기준점 ── [점수, 상대 조건]  (v1 결과표의 구간 경계) */
  var R = {
    ageF: [[2,60],[6,55],[10,50],[16,45],[25,40],[42,35],[65,30],[88,25],[100,20]],
    ageM: [[5,60],[10,55],[17,50],[25,45],[38,40],[55,35],[72,30],[85,25],[100,20]],
    salF: [[0,1000],[10,1500],[35,2500],[58,3500],[76,5000],[89,7000],[96,10000]],
    salM: [[0,1000],[20,1500],[38,2500],[57,3500],[72,5000],[85,7000],[97,10000]],
    ast:  swap(A.ast),
    htF:  [[0,150],[25,155],[45,158],[62,161],[76,164],[87,167],[94,170]],
    htM:  [[0,160],[15,165],[30,168],[45,171],[58,174],[70,177],[80,180],[88,183],[94,186]],
    wtF:  [[0,75],[10,70],[40,60],[70,55],[80,53],[95,50],[100,45]],
    wtM:  [[0,95],[35,88],[60,80],[80,75],[95,72],[100,65]],
    len:  swap(A.len)
  };
  var C = {}, k;
  for (k in A) C['in_' + k] = curve(A[k]);
  for (k in R) C['out_' + k] = curve(R[k]);
  /* 재계산 화면에서 상대 키·체중을 직접 넣을 때: 결과 곡선의 역함수 */
  C.inv_htF = curve(swap(R.htF)); C.inv_htM = curve(swap(R.htM));
  C.inv_wtF = curve(swap(R.wtF)); C.inv_wtM = curve(swap(R.wtM));

  var EDU_MAP = { 30: '고졸', 45: '초대졸', 60: '대졸', 80: '석사졸', 100: '박사졸' };
  var BODY_F_OPTS = [{ v: 15, l: 'AA컵' }, { v: 35, l: 'A컵' }, { v: 60, l: 'B컵' },
                     { v: 78, l: 'C컵' }, { v: 98, l: 'D컵 이상' }];
  /* 하위 호환(블로그 미니 계산기 등) — 이제 자산은 숫자로 넣습니다 */
  var ASSET_TIERS = [
    { v: -5000, l: '-5,000만원 이상 빚' }, { v: -3000, l: '-3,000만 ~ -5,000만원' },
    { v: -1000, l: '-1,000만 ~ -3,000만원' }, { v: -500, l: '-500만 ~ -1,000만원' },
    { v: 0, l: '0 ~ 500만원' }, { v: 500, l: '500만 ~ 2,000만원' },
    { v: 2000, l: '2,000만 ~ 5,000만원' }, { v: 5000, l: '5,000만 ~ 1억원' },
    { v: 10000, l: '1억 ~ 3억원' }, { v: 30000, l: '3억 ~ 5억원' }, { v: 50000, l: '5억원 이상' }
  ];

  function r1(v) { return Math.round(v * 10) / 10; }
  function G(g) { return g === 'male' ? 'M' : 'F'; }

  /* ── 내 조건 → 점수 (소수 첫째 자리) ── */
  function htSc(h, g)    { return r1(C['in_ht' + G(g)](+h)); }
  function bmiSc(b, g)   { return r1(C['in_bmi' + G(g)](+b)); }
  function ageSc(a, g)   { return r1(C['in_age' + G(g)](+a)); }
  function salSc(s, g)   { return r1(C['in_sal' + G(g)](+s)); }
  function astSc(a)      { return r1(C.in_ast(+a)); }
  function lenSc(cm)     { return r1(C.in_len(+cm)); }
  /* 상대 키·체중(재계산 입력) → 외모 점수 */
  function htOutSc(h, pg) { return r1(C['inv_ht' + G(pg)](+h)); }
  function wtOutSc(w, pg) { return r1(C['inv_wt' + G(pg)](+w)); }

  /* ── 표시 형식 ── */
  function comma(n) { return Math.round(n).toLocaleString('ko-KR'); }
  function fmtMan(v) {                       // 만원 단위 → '1억 2,000만원'
    var neg = v < 0, a = Math.abs(Math.round(v)), s;
    if (a >= 10000) {
      var e = Math.floor(a / 10000), r = a % 10000;
      s = e + '억' + (r ? ' ' + comma(r) + '만원' : '원');
    } else s = comma(a) + '만원';
    return neg ? '-' + s : s;
  }
  function roundMoney(v) { return Math.abs(v) >= 10000 ? Math.round(v / 1000) * 1000 : Math.round(v / 100) * 100; }

  /* ── 점수 → 이성 조건 (곡선) ── */
  function partnerAgeN(sc, pg) { return Math.round(C['out_age' + G(pg)](sc)); }
  function scToPartnerAge(sc, pg) { return partnerAgeN(sc, pg) + '세'; }
  function scToPartnerSal(sc, pg) {
    var f = C['out_sal' + G(pg)], v = Math.round(f(sc) / 100) * 100;
    if (sc >= f.hi) return { v: v, l: '연 ' + fmtMan(v) + ' 이상' };
    if (sc <= f.lo) return { v: v, l: '연 ' + fmtMan(v) + ' 미만' };
    return { v: v, l: '연 ' + fmtMan(v) };
  }
  function salJob(v) {
    if (v >= 10000) return '임원급/전문직'; if (v >= 7000) return '대기업 고연봉';
    if (v >= 5000) return '대기업'; if (v >= 3500) return '중견기업';
    if (v >= 2500) return '중소기업'; return '스타트업/기타';
  }
  function astLabel(v, cap) {
    if (cap) return fmtMan(v) + ' 이상';
    return v < 0 ? fmtMan(v) + ' (빚)' : fmtMan(v);
  }
  function scToPartnerAsset(sc) {
    var f = C.out_ast, v = roundMoney(f(sc));
    return { v: v, l: astLabel(v, sc >= f.hi) };
  }
  function partnerHtN(sc, pg) { return Math.round(C['out_ht' + G(pg)](sc)); }
  function scToPartnerHt(sc, pg) {
    var f = C['out_ht' + G(pg)], v = partnerHtN(sc, pg);
    return v + 'cm' + (sc >= f.hi ? ' 이상' : '');
  }
  function partnerWtN(sc, pg) { return Math.round(C['out_wt' + G(pg)](sc)); }
  function scToPartnerWt(sc, pg) { return partnerWtN(sc, pg) + 'kg'; }
  function partnerLenN(sc) { return Math.round(C.out_len(sc) * 2) / 2; }
  function scToPartnerBody(sc, pg) {
    if (pg === 'male') {
      var v = partnerLenN(sc), f = C.out_len;
      return v + 'cm' + (sc >= f.hi ? ' 이상' : sc <= f.lo ? ' 이하' : '');
    }
    var best = BODY_F_OPTS[0];
    for (var i = 0; i < BODY_F_OPTS.length; i++) if (sc >= BODY_F_OPTS[i].v) best = BODY_F_OPTS[i];
    return best.l;
  }
  function eduValToLabel(v) { return EDU_MAP[parseInt(v, 10)] || '대졸'; }

  function computeDisplayFromScores(scores, pg, eduLabel) {
    return {
      pAge:  scToPartnerAge(scores.age, pg),   pAgeN: partnerAgeN(scores.age, pg),
      pSal:  scToPartnerSal(scores.sal, pg),
      pAst:  scToPartnerAsset(scores.ast),
      pEdu:  eduLabel,
      pHt:   scToPartnerHt(scores.looks, pg),  pHtN: partnerHtN(scores.looks, pg),
      pWt:   scToPartnerWt(scores.looks, pg),  pWtN: partnerWtN(scores.looks, pg),
      pBody: scToPartnerBody(scores.body, pg), pBodyN: pg === 'male' ? partnerLenN(scores.body) : null
    };
  }

  /* ── 한 번에 ── */
  function looksSc(height, weight, g) {
    var bmi = weight / Math.pow(height / 100, 2);
    return r1(htSc(height, g) * 0.4 + bmiSc(bmi, g) * 0.6);
  }
  function scoreMe(i) {
    var g = i.gender;
    return {
      age:   ageSc(i.age, g),
      sal:   salSc(i.salary, g),
      ast:   astSc(i.asset),
      looks: looksSc(i.height, i.weight, g),
      body:  i.bodyLen != null ? lenSc(i.bodyLen) : i.bodyVal,
      edu:   i.eduVal
    };
  }
  function calc(i) {
    var scores = scoreMe(i);
    var pg = i.gender === 'male' ? 'female' : 'male';
    return {
      scores: scores,
      partnerGender: pg,
      partner: computeDisplayFromScores(scores, pg, eduValToLabel(i.eduVal))
    };
  }

  var API = {
    version: 2, curve: curve, ANCHORS: A, RESULT_ANCHORS: R,
    calc: calc, scoreMe: scoreMe, computeDisplayFromScores: computeDisplayFromScores,
    htSc: htSc, bmiSc: bmiSc, ageSc: ageSc, salSc: salSc, astSc: astSc, lenSc: lenSc,
    looksSc: looksSc, htOutSc: htOutSc, wtOutSc: wtOutSc,
    scToPartnerAge: scToPartnerAge, scToPartnerSal: scToPartnerSal, scToPartnerAsset: scToPartnerAsset,
    scToPartnerHt: scToPartnerHt, scToPartnerWt: scToPartnerWt, scToPartnerBody: scToPartnerBody,
    salJob: salJob, eduValToLabel: eduValToLabel, fmtMan: fmtMan,
    ASSET_TIERS: ASSET_TIERS, EDU_MAP: EDU_MAP, BODY_F_OPTS: BODY_F_OPTS,
    BODY_M_OPTS: [{ v: 15, l: '9cm 미만' }, { v: 35, l: '9~11cm' }, { v: 60, l: '11~13cm' },
                  { v: 78, l: '13~15cm' }, { v: 90, l: '15~17cm' }, { v: 98, l: '17cm 이상' }]
  };
  root.MeetCal = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
