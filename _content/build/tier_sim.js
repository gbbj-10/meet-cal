/* Four Paws — 단(段) 성장 검산기   node _content/build/tier_sim.js
 *
 * 규칙 (2026-09-21 개정 — me.js · hunt.py 와 같은 숫자)
 *   속성 수치 = 50 + 사주 비율 × 0.4 + 그 속성 용신석 개수   (오늘의 기운 속성은 +10%)
 *   전투력 = 다섯 속성 × 땅과의 관계 무게의 합
 *            그 땅을 누르는 속성 1.5 · 같은 속성 1.0 · 서로 살리는 사이 0.8 · 그 땅에 눌리는 속성 0.5
 *   문턱   = 250 265 290 340 425 565 765 1040 1425 1950  (계단 → 갑단)
 *   문턱을 넘은 단은 반드시 이긴다. 이기면 각자 용신석 = 단 × (1 + 0.25 × (인원 − 1))
 *   파티 전투력 = 가장 센 사람 + 나머지 × 0.2, 상생 한 쌍마다 +5%
 * 목표: 혼자 갑단까지 약 250~330판(한 판 1분 → 4~6시간)
 */
const DGEUK={목:'토',토:'수',수:'화',화:'금',금:'목'};
const DSAENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
const ELS=['목','화','토','금','수'];
const TH=[250,265,290,340,425,565,765,1040,1425,1950];
const NM=['계단','임단','신단','경단','기단','무단','정단','병단','을단','갑단'];
const w=(X,G)=>DGEUK[X]===G?1.5:X===G?1.0:(DSAENG[G]===X||DSAENG[X]===G)?0.8:0.5;
const pow=(st,G)=>ELS.reduce((a,X)=>a+st[X]*w(X,G),0);
const drop=(k,n)=>Math.round(k*(1+0.25*(n-1)));
const tierOf=p=>{let t=0;for(let i=0;i<10;i++) if(p>=TH[i]) t=i+1; return t;};
function run(ratio,n){
  const st={}; ELS.forEach(e=>st[e]=50+Math.round((ratio[e]||0)*0.4));
  const party=n>1?(1+0.2*(n-1))*(1+0.05*Math.min(5,n)):1;   // 친구도 나와 비슷하다고 본다
  const at=G=>tierOf(pow(st,G)*party);
  const start={}; ELS.forEach(G=>start[G]=NM[at(G)-1]);
  const best=ELS.slice().sort((a,b)=>pow(st,b)-pow(st,a))[0];
  let r=0; const hit={};
  while(at(best)<10 && r<9000){
    const G=ELS.slice().sort((a,b)=>at(b)-at(a) || w(b,best)-w(a,best))[0];   // 가장 높은 단을 도는 곳
    st[G]+=drop(Math.max(1,at(G)),n); r++;
    const t=at(best); if(hit[t]===undefined) hit[t]=r;
  }
  return {start,best,r,hit};
}
const CH={'금 50%':{목:0,화:33,토:0,금:50,수:17},'고르게 퍼진 사주':{목:25,화:25,토:12.5,금:25,수:12.5},'목 75% 몰림':{목:75,화:0,토:12.5,금:12.5,수:0}};
console.log('문턱  '+NM.map((x,i)=>x+' '+TH[i]).join(' · '));
for(const [nm,r] of Object.entries(CH)){
  const o=run(r,1);
  console.log(`\n[${nm}] 시작: ${Object.entries(o.start).map(([g,t])=>g+'땅 '+t).join(', ')}`);
  console.log(`   가장 센 땅(${o.best}) — `+NM.map((x,i)=>o.hit[i+1]!==undefined? x+' '+o.hit[i+1]:null).filter(Boolean).join(' → ')+'판');
}
console.log('\n인원별 갑단까지 (고르게 퍼진 사주)');
for(let n=1;n<=5;n++) console.log(`  ${n}명  ${run(CH['고르게 퍼진 사주'],n).r}판`);
