/*
 * meetcal-core.js — 이성 조건 계산 로직 (DOM 없음)
 *
 * index.html 안에 인라인으로 있던 점수/환산 함수를 그대로 떼어낸 것입니다.
 * 숫자는 하나도 바꾸지 않았습니다. 화면 그리는 코드만 뺐습니다.
 * 이렇게 분리해 두면 메인 계산기와 블로그 글 속 계산기가 같은 결과를 냅니다.
 *
 * 사용:
 *   const r = MeetCal.calc({gender:'male', age:30, eduVal:60, salary:4000,
 *                           asset:2000, height:175, weight:70, bodyVal:60});
 *   r.partner.pAge  → '25~29세'
 */
(function (root) {
  'use strict';

  var ASSET_TIERS = [
    { v: -5000, l: '-5,000만원 이상 빚' }, { v: -3000, l: '-3,000만 ~ -5,000만원' },
    { v: -1000, l: '-1,000만 ~ -3,000만원' }, { v: -500, l: '-500만 ~ -1,000만원' },
    { v: 0, l: '0 ~ 500만원' }, { v: 500, l: '500만 ~ 2,000만원' },
    { v: 2000, l: '2,000만 ~ 5,000만원' }, { v: 5000, l: '5,000만 ~ 1억원' },
    { v: 10000, l: '1억 ~ 3억원' }, { v: 30000, l: '3억 ~ 5억원' }, { v: 50000, l: '5억원 이상' }
  ];
  var EDU_MAP = { 30: '고졸', 45: '초대졸', 60: '대졸', 80: '석사졸', 100: '박사졸' };
  var BODY_F_OPTS = [{ v: 15, l: 'AA컵' }, { v: 35, l: 'A컵' }, { v: 60, l: 'B컵' },
                     { v: 78, l: 'C컵' }, { v: 98, l: 'D컵 이상' }];
  var BODY_M_OPTS = [{ v: 15, l: '9cm 미만' }, { v: 35, l: '9~11cm' }, { v: 60, l: '11~13cm' },
                     { v: 78, l: '13~15cm' }, { v: 90, l: '15~17cm' }, { v: 98, l: '17cm 이상' }];

  /* ── 내 조건 → 점수 ── */
  function htSc(h, g) {
    if (g === 'male') { if (h < 160) return 0; if (h < 165) return 15; if (h < 168) return 30;
      if (h < 171) return 45; if (h < 174) return 58; if (h < 177) return 70; if (h < 180) return 80;
      if (h < 183) return 88; if (h < 186) return 94; return 100; }
    if (h < 150) return 10; if (h < 155) return 25; if (h < 158) return 45; if (h < 161) return 62;
    if (h < 164) return 76; if (h < 167) return 87; if (h < 170) return 94; return 100;
  }
  function bmiSc(bmi, g) {
    if (g === 'male') { if (bmi < 16) return 10; if (bmi < 18.5) return 40; if (bmi < 21) return 88;
      if (bmi < 23) return 95; if (bmi < 25) return 80; if (bmi < 27) return 60; if (bmi < 30) return 35; return 10; }
    if (bmi < 15) return 10; if (bmi < 17) return 40; if (bmi < 19) return 80; if (bmi < 21) return 95;
    if (bmi < 23) return 88; if (bmi < 25) return 70; if (bmi < 28) return 40; return 10;
  }
  function ageSc(a, g) {
    var m = [[20,95],[25,85],[30,72],[35,55],[40,38],[45,25],[50,17],[55,10],[60,5]];
    var f = [[20,95],[25,88],[30,65],[35,42],[40,25],[45,16],[50,10],[55,6],[60,2]];
    var t = g === 'male' ? m : f;
    for (var i = t.length - 1; i >= 0; i--) if (a >= t[i][0]) return t[i][1];
    return 5;
  }
  function salSc(s, g) {
    if (g === 'male') { if (s < 1500) return 5; if (s < 2500) return 20; if (s < 3500) return 38;
      if (s < 5000) return 57; if (s < 7000) return 72; if (s < 10000) return 85; return 97; }
    if (s < 1500) return 10; if (s < 2500) return 35; if (s < 3500) return 58; if (s < 5000) return 76;
    if (s < 7000) return 89; if (s < 10000) return 96; return 99;
  }
  function astSc(a) {
    if (a <= -5000) return 0; if (a < -3000) return 3; if (a < -1000) return 6; if (a < -500) return 10;
    if (a < 0) return 15; if (a < 500) return 20; if (a < 2000) return 30; if (a < 5000) return 50;
    if (a < 10000) return 68; if (a < 30000) return 82; if (a < 50000) return 90; return 97;
  }

  /* ── 점수 → 이성 조건 ── */
  function scToPartnerAge(sc, pg) {
    var tbl = pg === 'female'
      ? [[88,20,24],[65,25,29],[42,30,34],[25,35,39],[16,40,44],[10,45,49],[6,50,54],[2,55,60]]
      : [[85,20,24],[72,25,29],[55,30,34],[38,35,39],[25,40,44],[17,45,49],[10,50,54],[5,55,60]];
    for (var i = 0; i < tbl.length; i++) if (sc >= tbl[i][0]) return tbl[i][1] + '~' + tbl[i][2] + '세';
    return '55~60세';
  }
  function scToPartnerSal(sc, pg) {
    if (pg === 'female') {
      if (sc >= 96) return { v:10000, l:'연 1억원 이상' }; if (sc >= 89) return { v:7000, l:'연 7,000만원' };
      if (sc >= 76) return { v:5000, l:'연 5,000만원' };  if (sc >= 58) return { v:3500, l:'연 3,500만원' };
      if (sc >= 35) return { v:2500, l:'연 2,500만원' };  if (sc >= 10) return { v:1500, l:'연 1,500만원' };
      return { v:1000, l:'연 1,000만원 미만' };
    }
    if (sc >= 97) return { v:10000, l:'연 1억원 이상' }; if (sc >= 85) return { v:7000, l:'연 7,000만원' };
    if (sc >= 72) return { v:5000, l:'연 5,000만원' };  if (sc >= 57) return { v:3500, l:'연 3,500만원' };
    if (sc >= 38) return { v:2500, l:'연 2,500만원' };  if (sc >= 20) return { v:1500, l:'연 1,500만원' };
    return { v:1000, l:'연 1,000만원 미만' };
  }
  function salJob(v) {
    if (v >= 10000) return '임원급/전문직'; if (v >= 7000) return '대기업 고연봉';
    if (v >= 5000) return '대기업'; if (v >= 3500) return '중견기업';
    if (v >= 2500) return '중소기업'; return '스타트업/기타';
  }
  function scToPartnerAsset(sc) {
    var idx = sc >= 97 ? 10 : sc >= 90 ? 9 : sc >= 82 ? 8 : sc >= 68 ? 7 : sc >= 50 ? 6 :
              sc >= 30 ? 5 : sc >= 20 ? 4 : sc >= 15 ? 3 : sc >= 10 ? 2 : sc >= 3 ? 1 : 0;
    return ASSET_TIERS[idx];
  }
  function scToPartnerHt(sc, pg) {
    if (pg === 'female') { if (sc >= 94) return '170cm 이상'; if (sc >= 87) return '167~170cm';
      if (sc >= 76) return '164~167cm'; if (sc >= 62) return '161~164cm'; if (sc >= 45) return '158~161cm';
      if (sc >= 25) return '155~158cm'; return '155cm 미만'; }
    if (sc >= 94) return '186cm 이상'; if (sc >= 88) return '183~186cm'; if (sc >= 80) return '180~183cm';
    if (sc >= 70) return '177~180cm'; if (sc >= 58) return '174~177cm'; if (sc >= 45) return '171~174cm';
    if (sc >= 30) return '168~171cm'; if (sc >= 15) return '165~168cm'; return '165cm 미만';
  }
  function scToPartnerWt(sc, pg) {
    if (pg === 'female') { if (sc >= 95) return '45~50kg'; if (sc >= 80) return '48~53kg';
      if (sc >= 70) return '50~55kg'; if (sc >= 40) return '53~60kg'; if (sc >= 10) return '60~70kg';
      return '70kg 이상'; }
    if (sc >= 95) return '65~72kg'; if (sc >= 80) return '68~75kg'; if (sc >= 60) return '72~80kg';
    if (sc >= 35) return '78~88kg'; return '88kg 이상';
  }
  function scToPartnerBody(sc, pg) {
    var opts = pg === 'female' ? BODY_F_OPTS : BODY_M_OPTS, best = opts[0];
    for (var i = 0; i < opts.length; i++) if (sc >= opts[i].v) best = opts[i];
    return best.l;
  }
  function eduValToLabel(v) { return EDU_MAP[parseInt(v, 10)] || '대졸'; }

  function computeDisplayFromScores(scores, pg, eduLabel) {
    return {
      pAge:  scToPartnerAge(scores.age, pg),
      pSal:  scToPartnerSal(scores.sal, pg),
      pAst:  scToPartnerAsset(scores.ast),
      pEdu:  eduLabel,
      pHt:   scToPartnerHt(scores.looks, pg),
      pWt:   scToPartnerWt(scores.looks, pg),
      pBody: scToPartnerBody(scores.body, pg)
    };
  }

  /* ── 한 번에 ── */
  function scoreMe(i) {
    var g = i.gender, bmi = i.weight / Math.pow(i.height / 100, 2);
    return {
      age:   ageSc(i.age, g),
      sal:   salSc(i.salary, g),
      ast:   astSc(i.asset),
      looks: Math.round(htSc(i.height, g) * 0.4 + bmiSc(bmi, g) * 0.6),
      body:  i.bodyVal,
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
    calc: calc, scoreMe: scoreMe, computeDisplayFromScores: computeDisplayFromScores,
    htSc: htSc, bmiSc: bmiSc, ageSc: ageSc, salSc: salSc, astSc: astSc,
    salJob: salJob, eduValToLabel: eduValToLabel,
    ASSET_TIERS: ASSET_TIERS, EDU_MAP: EDU_MAP,
    BODY_F_OPTS: BODY_F_OPTS, BODY_M_OPTS: BODY_M_OPTS
  };
  root.MeetCal = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
