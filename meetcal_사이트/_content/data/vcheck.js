const fs=require('fs');
const src=fs.readFileSync('calc.js','utf8');
// calc.js 의 run/monthOut 을 재사용하기 위해 모듈처럼 평가
const m=src.replace('console.log(JSON.stringify(out, null, 1));','module.exports={A,B,monthOut,EL};');
fs.writeFileSync('_tmp.js',m); const {A,B,monthOut,EL}=require('./_tmp.js');
const a=monthOut(A), b=monthOut(B);
console.log('월  전반부(1985~94)        후반부(1995~2005)      일치');
for(let i=1;i<=12;i++){
  const m1=a[i], m2=b[i];
  const s1=EL.map(e=>[e,m1["비율"][e]]).sort((x,y)=>y[1]-x[1]);
  const s2=EL.map(e=>[e,m2["비율"][e]]).sort((x,y)=>y[1]-x[1]);
  const gap1=(s1[0][1]-s1[1][1]).toFixed(1);
  console.log(String(i).padStart(2)+'  '+
    `${s1[0][0]} ${s1[0][1].toFixed(1)}% (2위 ${s1[1][0]} ${s1[1][1].toFixed(1)}, 격차 ${gap1})`.padEnd(38)+
    `${s2[0][0]} ${s2[0][1].toFixed(1)}%`.padEnd(14)+ (m1["1위"]===m2["1위"]?'O':'X'));
}
