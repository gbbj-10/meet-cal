/**
 * 콘텐츠용 데이터 계산 — DATA 에이전트 산출물
 * 재현: node calc.js   (saju-calculator.js 와 같은 폴더에서)
 *
 * ★ 1차 계산은 검증에서 떨어졌다.
 *   시각을 4개(03·09·15·21)만 표본으로 썼더니, 시각을 바꾸자 월별 1위가 달라졌다.
 *   원인: 시주(時柱)는 여덟 글자 중 두 글자라 오행 비율을 크게 흔든다.
 *   수정: 12시주를 전부, 모든 날짜를 전부 돌려 시각 편향을 없앴다.
 */
const { calculateSaju } = require('./saju-calculator.js');
const EL = ['목','화','토','금','수'];
const DIR = { 목:'동', 화:'남', 토:'중앙', 금:'서', 수:'북' };
const HOURS = [0,2,4,6,8,10,12,14,16,18,20,22];   // 12시주 전부
const pct = (a,b) => +(a/b*100).toFixed(1);
const dim = (y,m) => new Date(y, m, 0).getDate();

function run(y0, y1) {
  const byMonth = {}; for (let m=1;m<=12;m++) byMonth[m] = Object.fromEntries(EL.map(e=>[e,0]));
  const zero = Object.fromEntries(EL.map(e=>[e,0]));
  const weak = Object.fromEntries(EL.map(e=>[e,0]));
  const dir  = { 동:0, 남:0, 중앙:0, 서:0, 북:0 };
  const sameDay = [];              // 같은 날 12시주에서 우세 오행이 몇 종류 나오나
  let n = 0, anyZero = 0;
  for (let y=y0; y<=y1; y++) for (let m=1; m<=12; m++) for (let d=1; d<=dim(y,m); d++) {
    const doms = new Set();
    for (const h of HOURS) {
      const r = calculateSaju({ year:y, month:m, day:d, hour:h });
      byMonth[m][r.dominantElement]++; doms.add(r.dominantElement);
      if (r.deficientElement) { zero[r.deficientElement]++; anyZero++; }
      const w = EL.reduce((a,b) => r.elementRatio[a] <= r.elementRatio[b] ? a : b);
      weak[w]++; dir[DIR[w]]++; n++;
    }
    sameDay.push(doms.size);
  }
  return { n, byMonth, zero, weak, dir, anyZero, sameDay };
}

// ★ 2차 실패도 있었다. 1985~2005(21년)을 10/11년으로 가르니 5월·11월 1위가 뒤집혔다.
//   원인: 연주(年柱)는 60갑자 주기다. 60의 배수가 아닌 구간을 쓰면 간지 분포가 기울어진다.
//   수정: 60년 = 갑자 한 바퀴를 통째로 쓰고, 검증은 '직전 60년 한 바퀴'와 비교한다.
const B = run(1901, 1960);      // 검증용 — 이전 갑자 한 바퀴
const A = run(1961, 2020);      // 본 표본 — 최근 갑자 한 바퀴
const ALL = { n:A.n, anyZero:A.anyZero,
  byMonth: A.byMonth,
  zero: A.zero,
  weak: A.weak,
  dir: A.dir,
  sameDay: A.sameDay };

const monthOut = S => Object.fromEntries(Object.entries(S.byMonth).map(([m,o])=>{
  const t = Object.values(o).reduce((a,b)=>a+b,0);
  const p = Object.fromEntries(EL.map(e=>[e, pct(o[e],t)]));
  const top = EL.reduce((a,b)=> p[a]>=p[b]?a:b);
  return [m, { "비율":p, "1위":top, "1위비율":p[top] }];
}));
const sdDist = arr => { const c={1:0,2:0,3:0,4:0,5:0}; arr.forEach(v=>c[v]++);
  return Object.fromEntries(Object.entries(c).map(([k,v])=>[k, pct(v,arr.length)])); };

const out = {
  표본: { 범위:'1961~2020년생 (60갑자 한 바퀴)', 건수:ALL.n, 방법:'모든 날짜 × 12시주 전부' },
  월별우세: monthOut(ALL),
  오행완비율: pct(ALL.n - ALL.anyZero, ALL.n),
  결핍있음율: pct(ALL.anyZero, ALL.n),
  결핍분포: Object.fromEntries(EL.map(e=>[e, pct(ALL.zero[e], ALL.anyZero)])),
  최약분포: Object.fromEntries(EL.map(e=>[e, pct(ALL.weak[e], ALL.n)])),
  방위분포: Object.fromEntries(Object.entries(ALL.dir).map(([d,c])=>[d, pct(c, ALL.n)])),
  같은날_우세오행_종류수: { 설명:'같은 날 12시주에서 우세 오행이 몇 종류 나오는가', 분포:sdDist(ALL.sameDay),
    평균:+(ALL.sameDay.reduce((a,b)=>a+b,0)/ALL.sameDay.length).toFixed(2) },
  검증: {
    방법: '직전 갑자 한 바퀴(1901~1960년생, 525,600건)를 따로 계산해 비교',
    월별1위_일치: Object.keys(A.byMonth).every(m => monthOut(A)[m]["1위"] === monthOut(B)[m]["1위"]),
    최약분포_최대편차퍼센트: +Math.max(...EL.map(e => Math.abs(pct(A.weak[e],A.n) - pct(B.weak[e],B.n)))).toFixed(1),
    오행완비율_편차퍼센트: +Math.abs(pct(A.n-A.anyZero,A.n) - pct(B.n-B.anyZero,B.n)).toFixed(1),
  },
  한계: [
    '생일 분포를 균등 가정했다. 실제 출생 분포(계절 편중)와는 다르다.',
    '오행 비율은 사주 여덟 글자의 오행을 세어 낸 값이다. 지장간·왕상휴수 같은 심화 이론은 넣지 않았다.',
    '절기 경계는 태양 황경으로 계산했다(1900~2100년 오차 수 분).',
  ],
};
console.log(JSON.stringify(out, null, 1));
