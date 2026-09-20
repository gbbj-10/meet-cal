/* Four Paws — 단(段) 밸런스 검산기
 *
 * hunt.py 의 buildFight() 와 같은 규칙을 그대로 옮겨 놓고 수만 판을 돌린다.
 * THP / TATK 를 건드릴 때는 반드시 여기서 먼저 돌려 본다.
 *
 *   node tier_sim.js
 *
 * 지켜야 하는 두 줄 (2026-09-20 결정):
 *   1. 혼자서는 어느 사냥터든 계단을 깬다
 *   2. 혼자서 임단을 깨는 곳은 내 오행이 누르는 사냥터 한 곳뿐이다
 */

const DSAENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
const DGEUK ={목:'토',토:'수',수:'화',화:'금',금:'목'};
const ELS=['목','화','토','금','수'];
function strike(a,d){
  if(DGEUK[a]===d) return 1.55;
  if(DGEUK[d]===a) return 0.65;
  if(DSAENG[a]===d) return 0.80;
  if(DSAENG[d]===a) return 1.15;
  if(a===d) return 1.10;
  return 1.0;
}
function synergy(els){let p=0;for(let i=0;i<els.length;i++)for(let j=0;j<els.length;j++){if(i===j)continue;if(DSAENG[els[i]]===els[j])p++;}
  const k=new Set(els).size; return {pairs:p,kinds:k,bonus:p*4+(k===5?20:0)};}

const HPK=[0,0.34,0.78,1.05,1.34,1.64,1.94,2.24,2.54,2.84,3.14];   /* 사냥감 몸 배수 */
const ATK=[0,0.40,1.25,1.55,1.62,1.68,1.74,1.80,1.86,1.92,1.98];   /* 사냥감 힘 배수 */

function fight(myEl, gEl, mates, k, dayEls, boost){
  boost = boost||1;
  const team=[{el:myEl}].concat(mates.map(e=>({el:e})));
  const syn=synergy(team.map(t=>t.el));
  team.forEach(t=>{t.hp=t.max=100;t.atk=(18+(dayEls.includes(t.el)?3:0))*boost;t.down=false;});
  const n=team.length;
  const foe={el:gEl,hp:0,max:0,atk:Math.round((13+n*2)*ATK[k])};
  foe.max=foe.hp=Math.round((110+n*95)*HPK[k]);
  const bonus=1+syn.bonus/200; let turn=0; const TC=22+(n-1)*4;
  while(foe.hp>0 && team.some(t=>!t.down) && turn<TC){
    turn++;
    for(let i=0;i<team.length&&foe.hp>0;i++){
      const t=team[i]; if(t.down) continue;
      const m=strike(t.el,foe.el);
      foe.hp=Math.max(0,foe.hp-Math.max(3,Math.round(t.atk*m*bonus*(0.88+Math.random()*0.24))));
    }
    if(foe.hp<=0) break;
    const alive=team.filter(t=>!t.down);
    const v=alive[Math.floor(Math.random()*alive.length)];
    const m2=strike(foe.el,v.el);
    v.hp=Math.max(0,v.hp-Math.max(2,Math.round(foe.atk*m2*(0.85+Math.random()*0.3))));
    if(v.hp<=0) v.down=true;
  }
  return foe.hp<=0;
}
function rate(myEl,gEl,mates,k,dayEls,N=3000,boost){let w=0;for(let i=0;i<N;i++) if(fight(myEl,gEl,mates,k,dayEls,boost)) w++; return w/N;}

const rel=(my,g)=> my===g?'same': DGEUK[my]===g?'easy': DSAENG[g]===my?'gain': DGEUK[g]===my?'risk': DSAENG[my]===g?'give':'flat';


/* ---- 검사 1. 혼자서 어디까지 가는가 ---- */
const REL=(my,g)=> my===g?'같음': DGEUK[my]===g?'내가 누름': DSAENG[g]===my?'기운 얻음'
                 : DGEUK[g]===my?'눌림': DSAENG[my]===g?'기운 줌':'무관';
console.log('== 혼자 · 단별 승률 (내 오행 목, 돌 없음)');
console.log('단\t' + ['내가 누름','기운 얻음','같음','기운 줌','눌림'].join('\t'));
const G={'내가 누름':DGEUK['목'], '기운 얻음':'수', '같음':'목', '기운 줌':DSAENG['목'],
         '눌림':Object.keys(DGEUK).find(x=>DGEUK[x]==='목')};
for(let k=1;k<=4;k++){
  console.log(k+'단\t'+['내가 누름','기운 얻음','같음','기운 줌','눌림']
    .map(r=>(rate('목',G[r],[],k,[],4000)*100).toFixed(0)+'%').join('\t'));
}

/* ---- 검사 2. 인원과 용신석이 어디까지 밀어 올리는가 ---- */
const SETS={1:[],2:['수'],3:['수','화'],4:['수','화','금'],5:['수','화','금','토']};
for(const [lab,b] of [['돌 없음',1],['용신석 +35%',1.35],['용신석 +70%',1.70]]){
  console.log('\n== '+lab+' — 황토 텃밭(내가 누르는 곳) 승률');
  console.log('명\\단\t'+[1,2,3,4,5,6,7,8,9,10].join('\t'));
  for(const n of [1,2,3,4,5]){
    console.log(n+'\t'+Array.from({length:10},(_,i)=>
      (rate('목','토',SETS[n],i+1,[],1200,b)*100).toFixed(0)).join('\t'));
  }
}
