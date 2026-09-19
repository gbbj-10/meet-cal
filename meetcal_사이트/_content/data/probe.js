const { calculateSaju } = require('./saju-calculator.js');
const EL=['목','화','토','금','수'];
// 시주가 결과를 얼마나 흔드는지 — 같은 날, 시각만 바꿔 본다
const d={year:1995,month:9,day:15};
for (const h of [1,3,5,7,9,11,13,15,17,19,21,23]) {
  const r=calculateSaju({...d,hour:h});
  console.log(String(h).padStart(2)+'시  시주',r.pillars.hour,' 우세',r.dominantElement,' 비율',JSON.stringify(r.elementRatio));
}
