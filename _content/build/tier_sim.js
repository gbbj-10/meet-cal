/* Four Paws — 단(段) 성장 검산기
 *
 *   node _content/build/tier_sim.js
 *
 * 규칙 (2026-09-21 결정 — hunt.py · me.js 와 같은 숫자를 쓴다)
 *   속성 수치 = 50 + 사주 비율 × 0.4 + 그 속성 용신석 개수
 *   땅 G 에서는 G 를 누르는 속성의 수치로 싸운다
 *   파티 수치 = 가장 센 사람 + 나머지 합 × 0.2, 상생 한 쌍마다 +5%
 *   문턱을 넘은 단은 반드시 이긴다
 *   이기면 각자 용신석 = 단 × (1 + 0.25 × (인원 − 1))
 *
 * 목표: 혼자 갑단까지 약 240~340판(한 판 1분 → 4~6시간), 다섯이면 약 75판.
 * 문턱(TH)을 바꿀 때는 이 표가 어떻게 움직이는지 먼저 본다.
 */
const DGEUK={목:'토',토:'수',수:'화',화:'금',금:'목'};
const DSAENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
const ELS=['목','화','토','금','수'];
const TH=[50,55,65,85,120,175,255,365,520,730];
const NM=['계단','임단','신단','경단','기단','무단','정단','병단','을단','갑단'];
const tierOf=v=>{let t=0;for(let i=0;i<10;i++) if(v>=TH[i]) t=i+1; return t;};
const keyOf=G=>ELS.find(x=>DGEUK[x]===G);
const drop=(k,n)=>Math.round(k*(1+0.25*(n-1)));
function pairs(els){let p=0;for(let i=0;i<els.length;i++)for(let j=0;j<els.length;j++) if(i!==j&&DSAENG[els[i]]===els[j]) p++; return p;}
/* 친구는 나와 같은 수치, 오행만 다르게 섞는다고 본다 */
function pow(v,n,mates){ const vals=[v].concat(Array(n-1).fill(v)); const top=v, sum=v*n;
  return (top+(sum-top)*0.2)*(1+0.05*pairs(mates)); }

function run(ratio,n,mates){
  const st={}; ELS.forEach(e=>st[e]=50+Math.round((ratio[e]||0)*0.4));
  const main=Object.keys(ratio).sort((a,b)=>ratio[b]-ratio[a])[0];
  const start=st[main]; let r=0; const hit={}; const rec=()=>{const t=tierOf(st[main]); if(hit[t]===undefined) hit[t]=r;};
  rec();
  while(tierOf(st[main])<10 && r<9000){
    const need=keyOf(main);                 // 내 속성 돌이 나는 땅을 누르는 속성
    const G = tierOf(pow(st[need],n,mates)) < tierOf(st[main])-2 ? need : main;
    const k=Math.max(1,tierOf(pow(st[keyOf(G)],n,mates)));
    st[G]+=drop(k,n); r++; rec();
  }
  return {main,start,hit,r};
}

console.log('문턱  '+NM.map((x,i)=>x+' '+TH[i]).join(' · '));
console.log('드롭  '+NM.map((x,i)=>x+' '+drop(i+1,1)).join(' · ')+'  (혼자)\n');

const CH={
  '금 50% 캐릭터':      {목:0,화:33,토:0,금:50,수:17},
  '고르게 퍼진 사주':    {목:25,화:25,토:12.5,금:25,수:12.5},
  '한 속성 몰림(목 75%)':{목:75,화:0,토:12.5,금:12.5,수:0},
};
for(const [nm,r] of Object.entries(CH)){
  const o=run(r,1,[]);
  console.log(`[${nm}] ${o.main} 시작 ${o.start} — 혼자`);
  console.log('   '+NM.map((x,i)=>o.hit[i+1]!==undefined? x+' '+o.hit[i+1]:null).filter(Boolean).join(' → ')+'판');
}
console.log('\n인원별 (고르게 퍼진 사주, 오행을 섞은 파티)');
const MIX=[['목'],['목','수'],['목','수','화'],['목','수','화','토'],['목','수','화','토','금']];
for(let n=1;n<=5;n++){
  const o=run(CH['고르게 퍼진 사주'],n,MIX[n-1]);
  console.log(`  ${n}명  드롭 ×${1+0.25*(n-1)}  상생 ${pairs(MIX[n-1])}쌍  갑단까지 ${o.r}판`);
}
