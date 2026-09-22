/* 단 밸런스 검산 — node _content/build/tier_sim.js
 *
 * 규칙은 me.js / hunt.py 와 같다 (루프3, 2026-09-22):
 *   수치     = 30 + 사주 비율 × 1.0 + 그 속성 용신석 (오늘의 기운 +5%)
 *   전투력   = Σ 수치 × 상성(극 1.5 · 같음 1.0 · 상생 0.8 · 역극 0.5)
 *   권장     = 180 205 240 310 425 605 880 1260 1790 2515 (계단 → 갑단)
 *   보상     = 단 번호개, 오늘의 사냥터(오늘 기운이 든 땅) ×1.5
 * 하루 10판, 날마다 오늘의 기운이 돈다. 목표: 혼자 갑단까지 약 200~230판(3~4주).
 */
const DGEUK={목:'토',토:'수',수:'화',화:'금',금:'목'}, DSAENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
const E=['목','화','토','금','수'];
const w=(x,g)=>DGEUK[x]===g?1.5:x===g?1:(DSAENG[g]===x||DSAENG[x]===g)?0.8:0.5;
const P={p1:{목:13,화:0,토:25,금:37,수:25},p2:{목:0,화:17,토:49,금:17,수:17},p3:{목:36,화:0,토:13,금:13,수:38},p4:{목:0,화:0,토:50,금:25,수:25},p5:{목:0,화:13,토:25,금:49,수:13}};
const TH=[180,205,240,310,425,605,880,1260,1790,2515];
const GAN='목목화화토토금금수수', ZHI='수토목목토화화토금금토수';
const tier=p=>{let t=0;for(let i=0;i<10;i++) if(p>=TH[i]) t=i+1; return t;};
for(const [k,r] of Object.entries(P)){
  const st={};E.forEach(e=>st[e]=30+r[e]);
  let n=0, day=0; const vis={};
  while(n<600){
    const td=[GAN[day%10],ZHI[day%12]];
    for(let j=0;j<10&&n<600;j++){ n++;   // 하루 10판
      const pw=g=>E.reduce((a,x)=>a+st[x]*(td.includes(x)?1.05:1)*w(x,g),0);
      const val=g=>{const t=tier(pw(g));return t*(td.includes(g)?1.5:1);};
      const g=E.slice().sort((a,b)=>val(b)-val(a)||pw(b)-pw(a))[0];
      vis[g]=(vis[g]||0)+1; st[g]+=Math.round(Math.max(1,tier(pw(g)))*(td.includes(g)?1.5:1));
      if(E.some(x=>tier(pw(x))>=10)) break;
    }
    if(E.some(x=>tier(E.reduce((a,y)=>a+st[y]*w(y,x),0))>=10)) break;
    day++;
  }
  console.log(k,'갑단',n,'판',day+1,'일',JSON.stringify(vis),'돌',JSON.stringify(Object.fromEntries(E.map(e=>[e,st[e]-30-r[e]]))));
}
