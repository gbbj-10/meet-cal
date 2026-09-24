/* 궁합소 계산 — 규칙 v1 (Game/기획/궁합/궁합_규칙.md). 만세력 엔진 결과만 쓰고 서버·API 없음.
   원본: gunghap.js(점수) + texts.js(문장). 여기서는 둘을 한 파일로 묶어 브라우저에서 돌린다. */
(function(){
/* Four Paws 궁합 규칙 — 만세력 엔진(saju-calculator.js) 결과만으로 계산한다. API·서버 없음.
 * 100점 = 일간 30 + 일지 25 + 띠 15 + 오행 보완 20 + 주도 기운 10
 */
const GAN=['갑','을','병','정','무','기','경','신','임','계'], ZHI=['자','축','인','묘','진','사','오','미','신','유','술','해'];
const EL = ['목','화','토','금','수'];
const HJ = {목:'木',화:'火',토:'土',금:'金',수:'水'};
const SAENG = {목:'화',화:'토',토:'금',금:'수',수:'목'};   // A가 B를 낳는다
const GEUK  = {목:'토',토:'수',수:'화',화:'금',금:'목'};   // A가 B를 누른다
const GAN_EL = ['목','목','화','화','토','토','금','금','수','수'];
const ZHI_EL = ['수','토','목','목','토','화','화','토','금','금','토','수'];
const HAP_NAME = {0:'갑기합',1:'을경합',2:'병신합',3:'정임합',4:'무계합'};
const SAMHAP = {0:'신자진 수국',1:'사유축 금국',2:'인오술 화국',3:'해묘미 목국'};
const TTI = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];

function elRel(a,b){                 // a 기준 b 와의 관계
  if(a===b) return 'same';
  if(SAENG[a]===b) return 'give';    // a 가 b 를 낳음(내가 도와줌)
  if(SAENG[b]===a) return 'take';    // b 가 a 를 낳음(도움 받음)
  if(GEUK[a]===b) return 'press';    // a 가 b 를 누름
  return 'pressed';                  // b 가 a 를 누름
}
function zhiRel(a,b){                // 지지 인덱스
  if(a===b) return 'same';
  if((a+b)%12===1) return 'yukhap';
  if(Math.abs(a-b)===6) return 'chung';
  const WJ=[[0,7],[1,6],[2,9],[3,8],[4,11],[5,10]];
  if(WJ.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x))) return 'wonjin';
  if(a%4===b%4) return 'samhap';
  return 'none';
}
function parse(p){ return { gan: GAN.indexOf(p[0]), zhi: ZHI.indexOf(p[1]) }; }

/* 저장된 사주 {p:{year,month,day,hour}, r:{목..수}, tk} → 궁합 계산용 사람 */
function person(sj, name){
  const d = parse(sj.p.day), y = parse(sj.p.year), r = sj.r;
  const dom = EL.reduce((a,b)=> r[a]>=r[b]?a:b);
  const low = EL.slice().sort((a,b)=>r[a]-r[b])[0];
  return { name, dayGan:d.gan, dayZhi:d.zhi, yearZhi:y.zhi, me:GAN_EL[d.gan], ratio:r, dom, low, tti:TTI[y.zhi], p:sj.p };
}
function gunghap(A,B){
  const out = { parts: [] };
  // 1. 일간 (30)
  let g;
  if(Math.abs(A.dayGan-B.dayGan)===5) g={k:'hap', pt:30, name:HAP_NAME[Math.min(A.dayGan,B.dayGan)]};
  else { const r=elRel(A.me,B.me);
    g = r==='same'?{k:'same',pt:18}: (r==='give'||r==='take')?{k:'saeng',pt:24,dir:r}:{k:'geuk',pt:10,dir:r}; }
  out.parts.push(Object.assign({part:'ilgan', max:30}, g));
  // 2. 일지 (25)
  const zr=zhiRel(A.dayZhi,B.dayZhi);
  const ZP={yukhap:25,samhap:21,same:15,none:15,wonjin:8,chung:5};
  out.parts.push({part:'ilji', max:25, k:zr, pt:ZP[zr], sam: zr==='samhap'?SAMHAP[A.dayZhi%4]:null});
  // 3. 띠 (15)
  const tr=zhiRel(A.yearZhi,B.yearZhi);
  const TP={yukhap:15,samhap:13,same:10,none:9,wonjin:5,chung:3};
  out.parts.push({part:'tti', max:15, k:tr, pt:TP[tr]});
  // 4. 오행 보완 (20) — 내 가장 적은 오행을 상대가 얼마나 가졌나, 양방향 각 10
  const fill=(x,y)=> y.ratio[x.low]>=25?10 : y.ratio[x.low]>=13?5 : 0;
  const fa=fill(A,B), fb=fill(B,A);
  out.parts.push({part:'bowan', max:20, pt:fa+fb, ab:fa, ba:fb});
  // 5. 주도 기운 (10)
  const dr=elRel(A.dom,B.dom);
  out.parts.push({part:'dom', max:10, k:dr, pt: dr==='same'?6 : (dr==='give'||dr==='take')?10 : 3});
  out.score = out.parts.reduce((s,p)=>s+p.pt,0);
  out.grade = out.score>=80?'찰떡':out.score>=65?'잘 맞는 사이':out.score>=50?'맞춰 가는 사이':'노력하면 단단해지는 사이';
  return out;
}


/* 궁합 풀이 문장 — 미리 써 둔 조각을 결과에 맞춰 이어 붙인다(API 없음).
 * 말투: 해요체 · 단정하지 않기 · 좋은 점 먼저, 조심할 점은 '이렇게 하면 된다'로 끝내기
 */

function j(w, a, b){ const c=w.charCodeAt(w.length-1)-0xAC00; return w + ((c>=0&&c%28) ? a : b); }  // 받침 → 조사
const 은=w=>j(w,'은','는'), 이=w=>j(w,'이','가'), 과=w=>j(w,'과','와'), 을=w=>j(w,'을','를'), 이랑=w=>j(w,'이랑','랑');
const NATURE={목:'쭉쭉 뻗어 나가는 나무',화:'환하게 타오르는 불',토:'묵직하게 받쳐 주는 흙',금:'단단하고 반듯한 쇠',수:'깊고 유연한 물'};
const HAPLINE={갑기합:'서로의 부족한 면을 믿고 맡기는 합',을경합:'부드러움과 단단함이 손을 잡는 합',병신합:'밝은 쪽과 깊은 쪽이 서로 끌리는 합',
  정임합:'따뜻한 불빛과 깊은 물이 만나 정이 드는 합',무계합:'듬직함과 섬세함이 어울리는 합'};

function ilgan(A,B,p){
  const a=A.me,b=B.me;
  if(p.k==='hap') return `두 사람의 태어난 날 글자는 **${p.name}**이에요. ${HAPLINE[p.name]}이라, 처음 만났을 때부터 이상하게 편했을 수 있어요. 사주에서 가장 반가운 조합 중 하나예요.`;
  if(p.k==='same') return `${은(A.name)} ${NATURE[a]}, ${B.name}도 같은 ${a} 기운이에요. 말하지 않아도 속도가 비슷해서 편하지만, 둘 다 같은 쪽으로 쏠리면 고집이 부딪힐 수 있어요. 한 사람이 먼저 '이번엔 네 방식대로'를 말해 주면 금방 풀려요.`;
  if(p.k==='saeng'){ const [g,t]=p.dir==='give'?[A,B]:[B,A];
    return `${g.name}의 ${g.me} 기운이 ${t.name}의 ${t.me} 기운을 살려 주는 **상생** 관계예요. ${은(g.name)} 챙겨 주는 쪽, ${은(t.name)} 힘을 얻는 쪽이 되기 쉬워요. 받는 쪽이 고마움을 자주 말로 해 주면 오래 가요.`; }
  const [p1,p2]=p.dir==='press'?[A,B]:[B,A];
  return `${p1.name}의 ${p1.me} 기운이 ${p2.name}의 ${p2.me} 기운을 누르는 **상극** 관계예요. ${과(NATURE[p1.me])} ${NATURE[p2.me]}처럼 성질이 반대라 처음엔 '왜 저렇게 하지?' 싶은 순간이 있어요. 대신 서로 없는 걸 가진 사이라, 역할을 나누면 오히려 빈틈이 없어요. ${은(p1.name)} 말의 온도를 한 칸 낮추고, ${은(p2.name)} 서운한 걸 쌓아 두지 않는 게 요령이에요.`;
}
function ilji(A,B,p){
  const M={
    yukhap:`배우자 자리(태어난 날의 아래 글자)끼리 **육합**이에요. 생활 리듬과 집에서의 모습이 잘 맞물려서, 같이 지낼수록 편해지는 조합이에요.`,
    samhap:`배우자 자리가 **${p.sam}**의 두 글자로 이어져요. 같은 목표를 보면 힘이 모이는 사이라, 여행 계획이나 저축처럼 '같이 하는 프로젝트'가 있으면 더 가까워져요.`,
    same:`배우자 자리 글자가 같아요. 생활 방식이 닮아서 편하지만, 둘 다 같은 걸 놓치기도 쉬워요. 서로의 빈 곳을 한 번씩 짚어 주세요.`,
    none:`배우자 자리끼리는 특별히 당기지도 부딪히지도 않아요. 두 사람이 만들어 가는 대로 모양이 잡히는 담백한 관계예요.`,
    wonjin:`배우자 자리가 **원진**이에요. 큰 싸움보다는 사소한 말투나 습관에 괜히 서운해지는 조합이라, 서운한 건 그날 가볍게 말하고 넘기는 게 좋아요.`,
    chung:`배우자 자리가 **충**이에요. 생활 패턴(잠, 식사, 쉬는 방식)이 반대일 수 있어요. 부딪히는 대신 '서로 다른 걸 해 주는 사이'로 나누면 오히려 활기가 돼요.`};
  return M[p.k];
}
function tti(A,B,p){
  const t=`${A.tti}띠와 ${B.tti}띠`;
  const M={yukhap:`${t}는 **육합**, 띠끼리 잘 맞는 대표 조합이에요. 가족·친구들과 어울릴 때도 자연스럽게 섞여요.`,
    samhap:`${t}는 **삼합**으로 이어져요. 서로의 사람들과도 금방 친해지는 편이에요.`,
    same:`같은 ${A.tti}띠끼리예요. 또래 친구 같은 편안함이 있어요.`,
    none:`${t}는 띠로 보면 무난한 사이예요.`,
    wonjin:`${t}는 **원진**이라 첫인상은 조금 어색했을 수 있어요. 알고 나면 괜찮아지는 조합이에요.`,
    chung:`${t}는 **충**이에요. 서로의 가족·친구 문화가 다를 수 있으니, 처음 만나는 자리에서는 한 사람이 다리 역할을 해 주세요.`};
  return M[p.k];
}
function bowan(A,B,p){
  const s=[];
  if(p.ab) s.push(`${A.name}에게 가장 적은 **${A.low}** 기운을 ${이(B.name)} ${B.ratio[A.low]}% 가지고 있어요`);
  if(p.ba) s.push(`${B.name}에게 가장 적은 **${B.low}** 기운을 ${이(A.name)} ${A.ratio[B.low]}% 가지고 있어요`);
  if(p.ab&&p.ba) return s.join('. ')+'. 서로의 빈칸을 채워 주는, 궁합에서 가장 실속 있는 부분이에요.';
  if(s.length) return s[0]+'. 한쪽이 다른 쪽의 빈칸을 채워 주는 모양이에요. 채워 받는 쪽이 그걸 알아봐 주면 균형이 맞아요.';
  return `두 사람 모두 ${A.low===B.low? `**${A.low}** 기운이 적은 편이라, 같은 빈칸을 공유해요. 그 기운을 채워 주는 활동을 같이 해 보세요` : '서로의 빈칸을 채워 주지는 않지만, 각자 가진 기운이 뚜렷해요'}.`;
}
function dom(A,B,p){
  const a=A.dom,b=B.dom;
  if(p.k==='same') return `둘 다 **${a}** 기운이 가장 강해요. 좋아하는 것이 비슷해서 함께하는 시간이 즐거워요.`;
  if(p.k==='give'||p.k==='take') return `가장 강한 기운끼리(${a} · ${b})는 **상생**이에요. 같이 있으면 서로 에너지가 오르는 사이예요.`;
  const [x,y]=p.k==='press'?[A,B]:[B,A];
  return `가장 강한 기운끼리는 ${x.dom}이 ${y.dom}을 누르는 관계예요. 결정할 때 ${x.name} 쪽으로 기울기 쉬우니, 큰 결정은 ${y.name}의 의견을 먼저 들어 주세요.`.replace(`${x.dom}이`,이(x.dom)).replace(`${y.dom}을`,을(y.dom));
}
const HEAD={찰떡:'말 안 해도 통하는 찰떡 궁합이에요', '잘 맞는 사이':'편하게 잘 맞는 사이예요',
  '맞춰 가는 사이':'다른 점이 매력이 되는, 맞춰 가는 사이예요', '노력하면 단단해지는 사이':'노력할수록 단단해지는 사이예요'};
const LABEL={ilgan:'두 사람의 본성 (태어난 날)',ilji:'함께 사는 모습 (배우자 자리)',tti:'띠 궁합',bowan:'서로 채워 주는 기운',dom:'가장 강한 기운끼리'};
const SHORT={ilgan:'본성',ilji:'생활 모습',tti:'띠',bowan:'서로 채워 주는 기운',dom:'강한 기운끼리'};
function read(A,B,r){
  const F={ilgan,ilji,tti,bowan,dom};
  const parts=r.parts.map(p=>({label:LABEL[p.part],pt:p.pt,max:p.max,text:F[p.part](A,B,p)}));
  const best=r.parts.slice().sort((x,y)=>y.pt/y.max-x.pt/x.max)[0], worst=r.parts.slice().sort((x,y)=>x.pt/x.max-y.pt/y.max)[0];
  const summary=`${이랑(A.name)} ${B.name}의 궁합은 **${r.score}점**, ${HEAD[r.grade]}. 가장 좋은 건 '${SHORT[best.part]}', 조금 신경 쓰면 좋은 건 '${SHORT[worst.part]}'${j(SHORT[worst.part],'이에요','예요').slice(SHORT[worst.part].length)}.`;
  const dog=`오행 댕댕이로 보면, ${A.name}의 ${A.me} 댕댕이와 ${B.name}의 ${B.me} 댕댕이가 같은 파티에 서면 ${r.parts[0].k==='hap'?'합동 필살기 궁합':'서로 다른 속성을 막아 주는 짝'}이에요.`;
  return {summary,parts,dog,disclaimer:'재미로 보는 궁합이에요. 두 사람의 관계는 사주 여덟 글자보다 서로 나눈 시간이 훨씬 많이 말해 줘요.'};
}


window.GH={person:person,gunghap:gunghap,read:read,HJ:HJ};
})();
