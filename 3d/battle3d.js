/* Four Paws — 사냥터 전투 화면 (three.js)
 *
 * 이 파일은 **연기만 한다.** 누가 몇 대 때렸고 누가 이겼는지는 hunt 쪽
 * buildFight() 가 이미 다 정해 놓는다. 여기서 숫자를 다시 굴리면 사냥터
 * 선택 화면의 추천 문구와 어긋나므로, 받은 대본(acts)을 그대로 연기한다.
 *
 * 모델은 55MB 짜리 원본을 512px WebP + Draco 로 줄인 것(합쳐 3.2MB)이다.
 * 원본은 휴대폰에서 열리지 않는다.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const COL = { 목:0x4fb95f, 화:0xe8483c, 토:0xffd93d, 금:0x8e9bb0, 수:0x3f8fe0 };
const MDL = { 목:'m_mok', 화:'m_hwa', 토:'m_to', 금:'m_geum', 수:'m_su' };
/* 사냥감 — 단이 오르면 짐승이 바뀐다 (트리포 메시 + 늑대 뼈대, rigN)
   계단~경단 늑대 · 기단~정단 멧돼지 · 병단~을단 범 · 갑단 해태 */
/* 던전마다 사냥감이 다르다 — 수 늑대 · 토 멧돼지 · 목 사슴 · 화 해태(불을 먹는 짐승) · 금 백호(서쪽의 흰 범) */
const FOE_BY_EL = { 수: 'm_enemy', 토: 'm_boar', 목: 'm_deer', 화: 'm_haetae', 금: 'm_tiger' };
const FOE_MDL = el => FOE_BY_EL[el] || 'm_enemy';
const POSE = { idle:'Idle', attack:'Attack', hit:'Idle_HitReact1', death:'Death', walk:'Walk', gallop:'Gallop' };

/* ── 던전 테마 ── (예전 3D 파티전투 원형 34_3D_파티전투_5종.html 에서 옮겨 왔다)
   하늘 3색 · 안개 · 빛 · 바닥 바탕/얼룩 · 바위 · 중경 소품 · 랜드마크 · 떠다니는 입자.
   전투장이 던전마다 똑같으면 다섯 곳이 한 곳으로 기억된다. */
const THEME = {
  목: { sky:['#16211a','#31513a','#9ab77a'], fog:0x5f7a4c, fogN:7, fogF:22,
        sun:0xfff3cf, sunI:2.0, hemiSky:0xdff0c0, hemiGnd:0x1c2a18, hemiI:1.05, rim:0x9fe3a0,
        gnd:'#4e5c37', blot:[78,96,44], rock:0x3d4a28, tint:0xcfe0c0,
        dust:{ c:0x9ad86a, n:160, size:0.07, vy:-0.05 }, mid:{ kind:'bamboo', n:40, c:0x4f6f31, h:[3,5.5], w:[0.08,0.14] }, mark:'lantern' },
  화: { sky:['#2a0e10','#7a2416','#e0752c'], fog:0x7c3218, fogN:6, fogF:20,
        sun:0xffc98a, sunI:2.4, hemiSky:0xffb07a, hemiGnd:0x2a0d08, hemiI:1.0, rim:0xff7a3a,
        gnd:'#5a2a20', blot:[120,45,24], rock:0x4a2318, tint:0xe8c0a8,
        dust:{ c:0xffa23a, n:200, size:0.06, vy:0.10 }, mid:{ kind:'spire', n:16, c:0x3a1a0e, h:[2,4], w:[0.35,0.7] }, mark:'torii' },
  토: { sky:['#2a2314','#6d5a2c','#d8b563'], fog:0x8c7036, fogN:7, fogF:22,
        sun:0xffe9a8, sunI:2.2, hemiSky:0xffeab0, hemiGnd:0x2b2210, hemiI:1.0, rim:0xffd07a,
        gnd:'#6f5b33', blot:[126,102,48], rock:0x5a4520, tint:0xe6d6ae,
        dust:{ c:0xe8c56a, n:150, size:0.07, vy:-0.03 }, mid:{ kind:'pillar', n:14, c:0x5a4722, h:[2.2,4], w:[0.25,0.42] }, mark:'stairs' },
  금: { sky:['#1b2634','#5b7796','#dfeaf4'], fog:0xb8c9d8, fogN:7, fogF:21,
        sun:0xf6faff, sunI:2.1, hemiSky:0xe8f2ff, hemiGnd:0x3a4652, hemiI:1.0, rim:0x9fc8ff,
        gnd:'#aebccb', blot:[170,186,204], rock:0x7a8796, tint:0xdfe8f2,
        dust:{ c:0xffffff, n:240, size:0.08, vy:-0.16 }, mid:{ kind:'conifer', n:22, c:0x49596a, h:[2.2,4.2], w:[0.6,1.1] }, mark:'flags' },
  수: { sky:['#0d1620','#1d3a50','#5f8fa8'], fog:0x3e6479, fogN:6, fogF:20,
        sun:0xd8ecff, sunI:2.2, hemiSky:0xc8e4f4, hemiGnd:0x16242e, hemiI:1.2, rim:0x6fd0ff,
        gnd:'#475b62', blot:[74,108,120], rock:0x36454e, tint:0xbcd4e0,
        dust:{ c:0x8fd8ff, n:180, size:0.07, vy:0.04 }, mid:{ kind:'conifer', n:20, c:0x22343e, h:[2.4,4.4], w:[0.6,1.2] }, mark:'stonelamp' },
};
const GID = { 목:'nokbit', 화:'bulgeun', 토:'hwangto', 금:'hayan', 수:'cheongbit' };

function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function skyTexture(c3) {
  return canvasTex(8, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, c3[0]); g.addColorStop(0.58, c3[1]); g.addColorStop(1, c3[2]);
    c.fillStyle = g; c.fillRect(0, 0, 8, 256);
  });
}
function groundTexture(TH) {
  const t = canvasTex(512, 512, (c, S) => {
    c.fillStyle = TH.gnd; c.fillRect(0, 0, S, S);
    const [br, bg, bb] = TH.blot;
    for (let i = 0; i < 1000; i++) {
      const r = 3 + Math.random() * 24, k = 0.55 + Math.random() * 0.75;   /* 밝기만 흔든다 */
      c.fillStyle = `rgba(${Math.min(255, br*k)|0},${Math.min(255, bg*k)|0},${Math.min(255, bb*k)|0},${0.06 + Math.random()*0.14})`;
      c.beginPath(); c.ellipse(Math.random()*S, Math.random()*S, r, r*0.55, Math.random()*3, 0, 7); c.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
}
function sparkTexture() {
  return canvasTex(64, 64, (c, S) => {
    const g = c.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
  });
}

/* 전투장 한 벌 — 원경 그림 · 바닥 · 바위 · 중경 · 랜드마크 · 입자.
   ⚠ 카메라(z≈6)와 전투(z≈0) 사이에는 아무것도 세우지 않는다 — 개를 가린다.
     중경은 z ≤ -5, 랜드마크는 왼쪽 뒤. */
function buildArena(sc, el, base) {
  const TH = THEME[el] || THEME.화;
  sc.background = skyTexture(TH.sky);
  sc.fog = new THREE.Fog(TH.fog, TH.fogN, TH.fogF);

  /* 원경 — 던전 원화. 아래 1/3 은 그려진 바닥이라 잘라 쓴다. 안개를 받지 않는다 */
  const tex = new THREE.TextureLoader().load((base || '/') + 'img/dungeon/' + (GID[el] || 'bulgeun') + '.webp', t => {
    t.colorSpace = THREE.SRGBColorSpace; t.offset.set(0, 0.30); t.repeat.set(1, 0.70); t.needsUpdate = true;
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(46, 16),
    new THREE.MeshBasicMaterial({ map: tex, fog: false, depthWrite: false,
      color: new THREE.Color(TH.tint).multiplyScalar(0.5) }));   /* 원경은 반쯤 눌러 개가 떠 보이게 */
  back.position.set(0.5, 5.2, -21); back.renderOrder = -1; sc.add(back);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ map: groundTexture(TH), roughness: 0.97, color: 0xa8a8a8 }));
  gnd.rotation.x = -Math.PI / 2; sc.add(gnd);

  /* 바위 — 전투 뒤쪽과 양옆에만 */
  const rockMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(TH.rock).multiplyScalar(0.8), roughness: 1, flatShading: true });
  for (let i = 0; i < 22; i++) {
    const s = 0.15 + Math.random() * 0.55;
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockMat);
    const x = (Math.random() - 0.5) * 18, z = -3.2 - Math.random() * 9;
    r.position.set(x, s * 0.35, z); r.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
    sc.add(r);
  }
  /* 중경 — 진짜 입체로 세워야 카메라가 흔들릴 때 시차가 난다.
     루프3: 민무늬 원뿔 한 개 → 층진 침엽수·마디 대나무·용암 첨탑·기둥머리 기둥. 그루마다 색이 조금씩 다르다 */
  const M = TH.mid;
  const pal = [0.62, 0.78, 0.95].map(k => new THREE.MeshStandardMaterial({
    color: new THREE.Color(M.c).multiplyScalar(k), roughness: 1, flatShading: true }));
  for (let i = 0; i < M.n; i++) {
    const x = (Math.random() - 0.5) * 26, z = -6 - Math.random() * 9;
    if (Math.abs(x) < 3.2 && z > -8) continue;             /* 전투 바로 뒤는 비운다 */
    const h = M.h[0] + Math.random() * (M.h[1] - M.h[0]), w = M.w[0] + Math.random() * (M.w[1] - M.w[0]);
    const p = midProp(M.kind, h, w, pal[i % 3], TH);
    p.position.set(x, 0, z); p.rotation.y = Math.random() * 6.28;
    sc.add(p);
  }
  sc.add(buildLandmark(TH));

  /* 떠다니는 입자 — 목=잎 · 화=불티 · 토=모래 · 금=눈 · 수=물보라 */
  const D = TH.dust, pos = new Float32Array(D.n * 3), vel = new Float32Array(D.n);
  for (let i = 0; i < D.n; i++) {
    pos[i*3] = (Math.random() - 0.5) * 16; pos[i*3+1] = Math.random() * 5; pos[i*3+2] = -9 + Math.random() * 12;
    vel[i] = 0.6 + Math.random() * 0.9;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: D.c, size: D.size, map: sparkTexture(),
    transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  sc.add(dust);
  return {
    TH,
    step(dt, t) {
      const a = dust.geometry.attributes.position.array;
      for (let i = 0; i < D.n; i++) {
        a[i*3+1] += D.vy * vel[i] * dt * 5; a[i*3] += Math.sin(t * 0.4 + i) * dt * 0.15;
        if (a[i*3+1] > 5) a[i*3+1] = 0; if (a[i*3+1] < 0) a[i*3+1] = 5;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }
  };
}


/* 꼭짓점을 조금씩 흔들어 손으로 깎은 느낌을 낸다. 같은 자리의 꼭짓점은 같은 만큼 움직여 틈이 안 생긴다 */
function jitter(geo, amt) {
  const a = geo.attributes.position, seen = {};
  for (let i = 0; i < a.count; i++) {
    const k = a.getX(i).toFixed(3) + ',' + a.getY(i).toFixed(3) + ',' + a.getZ(i).toFixed(3);
    const d = seen[k] || (seen[k] = [(Math.random() - .5) * amt, (Math.random() - .5) * amt * .6, (Math.random() - .5) * amt]);
    a.setXYZ(i, a.getX(i) + d[0], a.getY(i) + d[1], a.getZ(i) + d[2]);
  }
  geo.computeVertexNormals(); return geo;
}
const MIDG = {};
function midProp(kind, h, w, mat, TH) {
  const g = new THREE.Group(), add = (geo, y, sx, sy, m) => {
    const o = new THREE.Mesh(geo, m || mat); o.position.y = y; o.scale.set(sx, sy, sx); g.add(o); return o; };
  if (kind === 'conifer') {                       /* 층진 침엽수 + 눈 */
    const cone = MIDG.cone || (MIDG.cone = jitter(new THREE.ConeGeometry(0.5, 1, 8, 1), 0.08));
    const trunk = MIDG.trunk || (MIDG.trunk = new THREE.CylinderGeometry(0.06, 0.09, 1, 6));
    add(trunk, h * 0.15, w, h * 0.3);
    const snow = TH.mark === 'flags' ? (MIDG.snow || (MIDG.snow = new THREE.MeshStandardMaterial({ color: 0xe8eef4, roughness: .9, flatShading: true }))) : null;
    for (let k = 0; k < 3; k++) {
      const s = 1 - k * 0.27, y = h * (0.3 + k * 0.22);
      add(cone, y + h * 0.2 * s, w * s, h * 0.42 * s).rotation.y = k;
      if (snow) add(cone, y + h * 0.3 * s, w * s * 0.55, h * 0.2 * s, snow).rotation.y = k;
    }
  } else if (kind === 'bamboo') {                 /* 마디 있는 대나무 세 그루 한 떨기 */
    const st = MIDG.st || (MIDG.st = new THREE.CylinderGeometry(0.5, 0.55, 1, 7));
    const nd = MIDG.nd || (MIDG.nd = new THREE.CylinderGeometry(0.62, 0.62, 0.05, 7));
    const lf = MIDG.lf || (MIDG.lf = new THREE.ConeGeometry(0.5, 1, 4, 1));
    for (let j = 0; j < 3; j++) {
      const c = new THREE.Group(), hh = h * (0.7 + Math.random() * 0.35);
      const o = new THREE.Mesh(st, mat); o.scale.set(w, hh, w); o.position.y = hh / 2; c.add(o);
      for (let y = 0.6; y < hh; y += 0.55 + Math.random() * 0.2) { const n = new THREE.Mesh(nd, mat); n.scale.set(w, 1, w); n.position.y = y; c.add(n); }
      for (let l = 0; l < 3; l++) { const f = new THREE.Mesh(lf, mat); f.scale.set(0.12, 0.7, 0.03);
        f.position.set(Math.cos(l * 2.1) * 0.25, hh - 0.2 - l * 0.35, Math.sin(l * 2.1) * 0.25); f.rotation.z = 1.1 * (l % 2 ? 1 : -1); f.rotation.y = l * 2.1; c.add(f); }
      c.position.set((j - 1) * 0.35, 0, (Math.random() - 0.5) * 0.4); c.rotation.z = (Math.random() - .5) * 0.12; g.add(c);
    }
  } else if (kind === 'spire') {                  /* 용암 첨탑 — 갈라진 틈이 빛난다 */
    const sp = MIDG.sp || (MIDG.sp = jitter(new THREE.ConeGeometry(0.6, 1, 6, 3), 0.18));
    const lava = MIDG.lava || (MIDG.lava = new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
    add(sp, h / 2, w, h);
    add(sp, h * 0.22, w * 0.55, h * 0.45).position.x = w * 0.5;
    const ln = add(MIDG.ln || (MIDG.ln = new THREE.BoxGeometry(0.05, 1, 0.05)), h * 0.35, 1, h * 0.5, lava);
    ln.position.z = w * 0.33; ln.rotation.z = 0.15;
  } else {                                         /* 기둥 — 받침·기둥머리, 셋에 하나는 부러짐 */
    const sh = MIDG.sh || (MIDG.sh = jitter(new THREE.CylinderGeometry(0.45, 0.5, 1, 8, 4), 0.04));
    const bx = MIDG.bx || (MIDG.bx = jitter(new THREE.BoxGeometry(1, 1, 1), 0.05));
    const broken = Math.random() < 0.34, hh = broken ? h * 0.55 : h;
    add(bx, 0.12, w * 1.5, 0.24);
    add(sh, 0.24 + hh / 2, w, hh);
    if (!broken) add(bx, 0.24 + hh + 0.12, w * 1.35, 0.24);
    else { const r = add(bx, 0.15, w * 0.9, 0.3); r.position.x = w * 1.4; r.rotation.set(0.3, 0.5, 0.2); }
  }
  return g;
}

/* 사냥감 실루엣 — 같은 늑대라도 속성마다 머리·등에 붙는 것이 다르다.
   화 뿔 · 금 수정 가시 · 목 잎 갈기 · 토 바위 등판 · 수 지느러미. 단이 오르면 개수가 는다.
   조각은 뼈(Head·Torso·Neck·Tail)에 붙여 걷고 뛸 때 몸을 따라 움직인다 */
function addCrest(u, el, tier, tint, sc) {
  u.holder.updateMatrixWorld(true);
  const bone = {}; u.holder.traverse(o => { if (o.isBone) bone[o.name] = o; });
  if (!bone.Head || !bone.Torso) return;
  const S = u.wob.scale.x, UP = new THREE.Vector3(0, 1, 0);
  const P = n => bone[n].getWorldPosition(new THREE.Vector3());
  const fwd = P('Head').sub(P('Torso')).setY(0).normalize();
  const side = new THREE.Vector3().crossVectors(UP, fwd).normalize();
  const tilt = a => new THREE.Quaternion().setFromAxisAngle(side, a);
  /* 몸과 같은 색이면 묻힌다 — 속성 색을 밝혀 스스로 빛나게 */
  const CR = { 화: 0xff5a1f, 금: 0xbfe9ff, 목: 0x7dff5a, 토: 0xc9954a, 수: 0x3ab8ff }[el] || 0xffffff;
  const mat = new THREE.MeshStandardMaterial({ color: CR,
    emissive: new THREE.Color(CR).multiplyScalar(el === '토' ? 0.45 : 0.75), roughness: el === '금' ? 0.25 : 0.8, metalness: el === '금' ? 0.6 : 0,
    flatShading: true, side: THREE.DoubleSide });
  mat.userData.baseEm = mat.emissive.clone();
  const put = (geo, bn, off, q, sx, sy, sz) => {
    if (!bone[bn]) return;
    const m = new THREE.Mesh(geo, mat); sc.add(m);
    const lift = bn === 'Back' ? 0.3 : bn === 'Torso' ? 0.6 : bn.startsWith('Tail') ? 0 : 1;
    m.position.copy(P(bn)).addScaledVector(UP, off[1] * lift * S).addScaledVector(fwd, off[0] * S).addScaledVector(side, off[2] * S);
    if (q) m.quaternion.copy(q);
    m.scale.set(sx * S, sy * S, (sz == null ? sx : sz) * S);
    bone[bn].attach(m); u.meshes.push(m);
  };
  /* 엉덩이(Back)부터 목(Neck1)까지 고르게 — 단이 오르면 2개 → 5개 */
  const spine = ['Back', 'Torso', 'Torso2', 'Torso3', 'Neck1'].filter(n => bone[n]);
  const n = Math.min(spine.length, 2 + Math.floor(tier / 3));
  const along = n >= spine.length ? spine : Array.from({ length: n }, (_, i) => spine[Math.round(i * (spine.length - 1) / Math.max(1, n - 1))]);
  const face = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), side);
  if (el === '화') {
    const cone = new THREE.ConeGeometry(0.5, 1, 6);
    for (const z of [-1, 1]) put(cone, 'Head', [-0.03, 0.17, z * 0.07], tilt(0.8).multiply(new THREE.Quaternion().setFromAxisAngle(fwd, z * 0.35)), 0.055, 0.26 + tier * 0.015);
    along.forEach(b => put(cone, b, [0, 0.22, 0], tilt(0.6), 0.08, 0.2));
  } else if (el === '금') {
    const oct = new THREE.OctahedronGeometry(0.5, 0);
    along.forEach((b, k) => { put(oct, b, [0, 0.24, 0.04], tilt(0.35).multiply(new THREE.Quaternion().setFromAxisAngle(fwd, 0.3)), 0.09, 0.4, 0.09);
                             put(oct, b, [0.04, 0.22, -0.05], tilt(0.45).multiply(new THREE.Quaternion().setFromAxisAngle(fwd, -0.3)), 0.07, 0.3, 0.07); });
  } else if (el === '목') {
    const leaf = new THREE.ConeGeometry(0.5, 1, 4);
    along.concat(['Neck2', 'Neck3'].filter(x => bone[x])).forEach(b => put(leaf, b, [0, 0.22, 0], tilt(0.9).multiply(face), 0.18, 0.3, 0.04));
    put(leaf, 'Head', [-0.05, 0.22, 0], tilt(0.5).multiply(face), 0.14, 0.24, 0.04);
  } else if (el === '토') {
    const rock = jitter(new THREE.DodecahedronGeometry(0.5, 0), 0.12);
    along.forEach(b => put(rock, b, [0, 0.12, 0], null, 0.19, 0.1, 0.17));
  } else {
    const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.quadraticCurveTo(0.05, 0.25, -0.35, 0.9); sh.lineTo(-0.5, 0);
    const fin = new THREE.ShapeGeometry(sh);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), fwd.clone().negate());
    const fq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd.clone(), UP.clone(), side.clone()));
    put(fin, 'Torso2', [0, 0.15, 0], fq, 0.4, 0.28 + tier * 0.015, 1);
    if (bone.Tail3) put(fin, 'Tail3', [0, 0, 0], fq, 0.26, 0.2, 1);
  }
}

/* 랜드마크 — 던전마다 눈에 띄는 한 덩어리. 전투 밖 왼쪽 뒤에 세운다 */
function buildLandmark(TH) {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a9184, roughness: 1, flatShading: true, emissive: 0x2a2620 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x584a3c, roughness: 1, flatShading: true, emissive: 0x241c14 });
  const glow  = new THREE.MeshBasicMaterial({ color: TH.rim });
  const box = (w,h,d,m) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  const k = TH.mark;
  if (k === 'torii') {
    const p1 = box(0.7, 6.4, 0.7, dark); p1.position.set(-2.1, 3.2, 0);
    const p2 = box(0.7, 4.5, 0.7, dark); p2.position.set(2.1, 2.25, 0); p2.rotation.z = 0.16;
    const top = box(6.6, 0.6, 0.85, dark); top.position.set(-0.4, 6.5, 0); top.rotation.z = -0.07;
    const sub = box(4.6, 0.3, 0.45, dark); sub.position.set(-0.3, 5.0, 0);
    g.add(p1, p2, top, sub);
  } else if (k === 'stonelamp' || k === 'lantern') {
    const base = box(2.0, 0.7, 2.0, stone); base.position.y = 0.35;
    const col = box(1.1, 2.6, 1.1, stone); col.position.y = 2.0;
    const head = box(1.9, 1.3, 1.9, stone); head.position.y = 4.0;
    const cap = box(2.5, 0.5, 2.5, stone); cap.position.y = 4.9;
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), glow); fire.position.y = 4.0;
    g.add(base, col, head, cap, fire);
    if (k === 'stonelamp') g.rotation.z = 0.12;
  } else if (k === 'stairs') {
    for (let i = 0; i < 5; i++) {
      const st = box(5.0 - i*0.5, 0.42, 1.5, stone);
      st.position.set(i*0.25, 0.21 + i*0.42, -i*1.25); st.rotation.y = (Math.random()-0.5)*0.06; g.add(st);
    }
  } else if (k === 'flags') {
    const p1 = box(0.36, 5.4, 0.36, dark); p1.position.set(-3.2, 2.7, 0);
    const p2 = box(0.36, 4.3, 0.36, dark); p2.position.set(3.2, 2.15, 0); g.add(p1, p2);
    const cols = [0xd94a3a, 0xe8c24a, 0x4aa3d9, 0x4fbf6a, 0xe8e4dc];
    for (let i = 0; i < 12; i++) {
      const t = i / 11, fl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55),
        new THREE.MeshStandardMaterial({ color: cols[i % 5], side: THREE.DoubleSide, emissive: cols[i % 5], emissiveIntensity: 0.15 }));
      fl.position.set(-3.2 + t * 6.4, 4.9 - t - Math.sin(t * Math.PI) * 0.9 - 0.35, 0); fl.rotation.z = (t - 0.5) * 0.5; g.add(fl);
    }
  }
  /* 받침돌과 이끼 낀 돌무더기 — 땅에서 솟은 것처럼 */
  const rk = new THREE.MeshStandardMaterial({ color: new THREE.Color(TH.rock).multiplyScalar(0.9), roughness: 1, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.5, 0), 0.25), rk);
    const a = i / 6 * 6.28; r.position.set(Math.cos(a) * 2.6, 0.15, Math.sin(a) * 1.4); r.scale.y = 0.6; g.add(r);
  }
  const bb = new THREE.Box3().setFromObject(g), hh = Math.max(0.001, bb.max.y - bb.min.y);
  g.scale.setScalar(Math.min(2.3 / hh, 0.6));
  g.position.set(-4.6, 0, -6.5); g.rotation.y = 0.42;
  const pl = new THREE.PointLight(TH.rim, 6, 7, 1.6); pl.position.set(0, 1.6, 0.8); g.add(pl);
  return g;
}

let cache = {};                      /* 한 번 받은 모델은 다시 받지 않는다 */
let loader = null;
const DRACO_DEFAULT = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/';

function getLoader(base, dracoPath) {
  if (loader) return loader;
  const d = new DRACOLoader();
  d.setDecoderPath(dracoPath || DRACO_DEFAULT);
  loader = new GLTFLoader().setDRACOLoader(d);
  loader.setPath(base);
  return loader;
}
function load(base, name, dracoPath) {
  if (cache[name]) return Promise.resolve(cache[name]);
  return new Promise((res, rej) =>
    getLoader(base, dracoPath).load(name + '.glb', g => { cache[name] = g; res(g); }, undefined, rej));
}

function eachMat(mesh, fn) {
  const m = mesh.material;
  if (Array.isArray(m)) m.forEach(fn); else fn(m);
}

/* 화면 밖에서 흐르는 시간에 맞춰 도는 간단한 트윈 */
function mkTween() {
  const all = [];
  return {
    add(from, to, dur, ease, on, done) {
      all.push({ t: 0, from, to, dur, ease, on, done });
    },
    step(dt) {
      for (let i = all.length - 1; i >= 0; i--) {
        const w = all[i]; w.t += dt;
        let p = Math.min(1, w.t / w.dur);
        p = w.ease === 'in' ? p * p : w.ease === 'out' ? 1 - (1 - p) * (1 - p) : p;
        w.on(w.from + (w.to - w.from) * p);
        if (w.t >= w.dur) { all.splice(i, 1); if (w.done) w.done(); }
      }
    },
    clear() { all.length = 0; }
  };
}

export async function runBattle(o) {
  const { mount, base, dracoPath, ground, team, foe, acts, onCaption, onDone, onProgress } = o;
  /* 배속 — 매 프레임 시간과 모든 대기 시간에 같이 곱한다 */
  const sp = () => window.__FPSP || Math.max(1, (o.speed && o.speed()) || 1);   /* __FPSP: 플레이테스터용 슬로모션 */
  /* 대기 시간도 화면 시계로 잰다 — 프레임이 느린 기기에서 글·숫자가 그림보다 앞서 가지 않게 */
  let gT = 0; const due = [];
  const later = (f, ms) => { due.push({ t: gT + ms / 1000, f }); };
  const runDue = () => { for (let i = 0; i < due.length; i++) if (due[i].t <= gT) { const d = due.splice(i--, 1)[0]; try { d.f(); } catch (e) { console.error(e); } } };
  /* o.onLoot(주운 수, 전체) — 화면 위 숫자를 세는 쪽에서 쓴다 */

  /* ── 모델 받기 ── */
  const want = [...new Set(team.map(t => MDL[t.el]))].concat(FOE_MDL(foe.el));
  let got = 0;
  const packs = {};
  for (const n of want) {
    /* 새 짐승 파일이 아직 없으면(배포 전) 늑대로 대신한다 — 전투는 멈추지 않는다 */
    try { packs[n] = await load(base, n, dracoPath); }
    catch (e) { if (n === 'm_enemy') throw e; packs[n] = await load(base, 'm_enemy', dracoPath); packs[n].fallback = true; }
    if (onProgress) onProgress(++got / want.length);
  }

  /* ── 무대 ── */
  const W = mount.clientWidth, H = Math.round(W * (W < 560 ? 0.92 : 0.70));
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  ren.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  ren.setSize(W, H);
  ren.outputColorSpace = THREE.SRGBColorSpace;
  mount.innerHTML = '';
  mount.appendChild(ren.domElement);

  const gc = new THREE.Color(COL[ground.el]);
  const sc = new THREE.Scene();
  const arena = buildArena(sc, ground.el, (base || '/3d/').replace(/3d\/?$/, ''));
  const TH = arena.TH;

  /* 휴대폰은 화면을 세로로 키운 만큼 시야를 넓히고 눈높이를 낮춰, 양 끝 유닛이 잘리지 않게 한다 */
  const tall = W / H < 1.2;
  const cam = new THREE.PerspectiveCamera(tall ? 47 : 41, W / H, 0.1, 80);
  const camBase = tall ? new THREE.Vector3(0.6, 1.5, 6.4) : new THREE.Vector3(0.55, 1.78, 5.9);
  const camAim = tall ? new THREE.Vector3(0.6, 0.95, 0) : new THREE.Vector3(0.55, 0.72, 0);
  {                                    /* 단이 높을수록 사냥감이 커진다 — 카메라를 뒤로 빼 몸이 안 잘리게 */
    const Mc = Math.max(1, Math.min(5, o.foeCount || 1));
    const big = Math.max(0, (Math.min(10, o.tier || 1) - 6)) * 0.22 + (Mc >= 4 ? 1.3 : Mc >= 2 ? 0.6 : 0);
    camBase.z += big; camBase.x += big * 0.3; camAim.x += big * 0.28; camBase.y += big * 0.15;
  }
  cam.position.copy(camBase); cam.lookAt(camAim);

  sc.add(new THREE.HemisphereLight(TH.hemiSky, TH.hemiGnd, TH.hemiI));
  const key = new THREE.DirectionalLight(TH.sun, TH.sunI * 1.35); key.position.set(-3, 6, 4); sc.add(key);
  /* 정면광 — 카메라 쪽에서 비춘다. 개의 얼굴과 몸 앞쪽이 어두운 배경에 묻히지 않게 */
  const fill = new THREE.DirectionalLight(0xffffff, 1.25); fill.position.set(0.6, 2.2, 7); sc.add(fill);
  const rim = new THREE.DirectionalLight(TH.rim, 1.6); rim.position.set(3, 3, -5); sc.add(rim);   /* 뒤에서 윤곽을 따 준다 */

  /* 전투 자리 표시 — 오행 색 고리 하나 */
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.52, 64),
    new THREE.MeshBasicMaterial({ color: gc, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; sc.add(ring);

  /* ── 유닛 ── */
  const TW = mkTween();
  function build(el, modelName, x, z, facing) {
    const g = packs[modelName];
    const root = cloneSkinned(g.scene);
    const box = new THREE.Box3().setFromObject(root);
    const sz = new THREE.Vector3(); box.getSize(sz);
    root.scale.setScalar(0.92 / sz.y);
    const b2 = new THREE.Box3().setFromObject(root);
    root.position.y -= b2.min.y;

    const wob = new THREE.Object3D(); wob.add(root);
    const holder = new THREE.Object3D(); holder.add(wob);
    holder.position.set(x, 0, z); holder.rotation.y = facing;
    sc.add(holder);

    const mx = new THREE.AnimationMixer(root);
    const clip = {};
    g.animations.forEach(a => { clip[a.name] = mx.clipAction(a); });
    /* ★ 재질은 반드시 이 유닛만의 것으로 복제한다.
       SkeletonUtils.clone 은 뼈와 메시는 복제해도 **재질은 원본과 공유**한다.
       쓰러질 때 낮춘 opacity 와 피격 때 올린 emissive 가 캐시된 원본에 남아,
       두 번째 판부터 처음부터 반투명한 개가 나왔다. (2026-09-20) */
    const meshes = [];
    root.traverse(m => {
      if (!m.isMesh) return;
      m.material = Array.isArray(m.material) ? m.material.map(x => x.clone()) : m.material.clone();
      const mm = Array.isArray(m.material) ? m.material : [m.material];
      mm.forEach(x => { x.transparent = false; x.opacity = 1; if (x.emissive) x.emissive.setScalar(0); });
      m.frustumCulled = false;
      meshes.push(m);
    });

    /* 오행 색 외곽선 — 뒷면만 그리는 껍데기를 법선 방향으로 조금 부풀린다(인버티드 헐).
       어두운 던전 바닥 위에서도 실루엣이 끊기지 않고, 누가 무슨 속성인지 색으로 읽힌다. */
    const lineCol = new THREE.Color(COL[el] || 0xffffff).lerp(new THREE.Color(0xffffff), 0.25);
    const outlines = [];
    meshes.slice().forEach(m => {
      if (!m.isSkinnedMesh) return;
      const om = new THREE.MeshBasicMaterial({ color: lineCol, side: THREE.BackSide });
      om.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>',
          '#include <skinning_vertex>\n  transformed += normalize(objectNormal) * 0.018;');
      };
      const o = new THREE.SkinnedMesh(m.geometry, om);
      o.bind(m.skeleton, m.bindMatrix); o.frustumCulled = false; o.visible = false;   /* 맞을 때만 켠다 */
      m.parent.add(o); o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale);
      outlines.push(o);
    });
    /* 발밑 빛 — 오행 색 원판. 바닥과 개를 떼어 놓는다 */
    const glowTex = canvasTex(64, 64, (c, S) => {
      const g = c.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
      g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.55, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, S, S);
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: glowTex,
      color: COL[el] || 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.015; holder.add(glow);

    /* 발밑 그림자 — 바닥에 붙어 있어야 공중에 뜬 것처럼 안 보인다 */
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; holder.add(sh);

    /* 몸 반길이 — 코끝이 맞닿는 거리를 재는 데 쓴다. 모델은 +z 를 보고 있다 */
    const half = (Math.max(sz.z, sz.x) * (0.92 / sz.y)) / 2;   /* Tripo 모델은 옆으로 누운 축일 수 있어 긴 쪽 */
    const u = { el, holder, wob, mx, clip, meshes, outlines, glow, shadow: sh, alive: true, pose: null, one: null, flash: 0, lineT: 0,
                sc: 1, busy: 0, phase: Math.random() * 6.28,
                half, home: holder.position.clone() };
    u.bone = {}; holder.traverse(o => { if (o.isBone) u.bone[o.name] = o; });
    pose(u, 'idle');
    return u;
  }
  function pose(u, p, force) {
    if (u.one && !force) return;
    const to = u.clip[POSE[p]]; if (!to) return;
    const from = u.clip[POSE[u.pose]];
    if (u.pose === p) return;
    u.pose = p; u.one = null;
    to.reset(); to.setLoop(THREE.LoopRepeat, Infinity); to.timeScale = p === 'idle' ? 0.06 : 1;   /* 서 있을 땐 발을 구르지 않는다 */
    to.setEffectiveWeight(1).play();
    if (from && from !== to) from.crossFadeTo(to, 0.18, false);
  }
  /* 반복 재생(달리기 등). speed 로 발놀림 빠르기를 맞춘다 */
  function playLoop(u, p, speed, fade) {
    const a = u.clip[POSE[p]]; if (!a) return;
    const cur = u.clip[POSE[u.pose]];
    if (cur && cur !== a) cur.fadeOut(fade || 0.12);
    a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.timeScale = speed || 1;
    a.setEffectiveWeight(1).fadeIn(fade || 0.12).play();
    u.pose = p; u.one = null;
  }
  /* 클립 중간(from 0~1)부터 한 번 — 공격 클립의 '덮치는' 순간만 뽑아 쓴다 */
  function playFrom(u, p, from, speed, hold) {
    const a = u.clip[POSE[p]]; if (!a) return;
    const cur = u.clip[POSE[u.pose]];
    if (cur && cur !== a) cur.fadeOut(0.06);
    const D = a.getClip().duration;
    a.reset(); a.time = D * from; a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = !!hold;
    a.timeScale = speed || 1; a.setEffectiveWeight(1).fadeIn(0.05).play();
    u.pose = p; u.one = p;
    if (!hold) later(() => { if (u.one === p) { u.one = null; u.pose = null; pose(u, 'idle', true); } }, (D * (1 - from) / (speed || 1)) * 1000);
  }
  function once(u, p, dur, hold) {
    const a = u.clip[POSE[p]]; if (!a) return;
    const cur = u.clip[POSE[u.pose]];
    if (cur && cur !== a) cur.fadeOut(0.07);
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = !!hold;
    a.timeScale = dur ? a.getClip().duration / dur : 1;
    a.setEffectiveWeight(1).fadeIn(0.05).play();
    u.one = p;
    if (!hold) later(() => { if (u.one === p) { u.one = null; pose(u, 'idle', true); } }, dur * 1000);
  }

  /* 파티는 왼쪽에 반원으로, 사냥감은 오른쪽에. 둘 다 옆모습이라
     누가 누구에게 달려드는지 한눈에 읽힌다. 마주 보게 세우면 서로 가린다. */
  const n = team.length;
  const mates = team.map((t, i) => {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;          /* -0.5 ~ +0.5 */
    return build(t.el, MDL[t.el], -1.2 - Math.abs(k) * 0.7 - (k < 0 ? 0.25 : 0), k * 2.5, Math.PI / 2);
  });
  const foeMdl = FOE_MDL(foe.el);
  const tierK = Math.max(1, Math.min(10, o.tier || 1));
  const M = Math.max(1, Math.min(5, o.foeCount || 1));
  /* 마물은 던전 속성 색으로 물들이고, 단이 오를수록 커진다. 여러 마리면 조금 작게, 부채꼴로 선다 */
  const bs0 = (1.45 + (tierK - 1) * 0.05) * (foeMdl === 'm_deer' && !packs[foeMdl].fallback ? 1.18 : 1);
  const bs = bs0 * (M >= 4 ? 0.62 : M === 3 ? 0.72 : M === 2 ? 0.82 : 1);
  const tint = new THREE.Color(COL[foe.el] || 0x888888);
  const white = foeMdl === 'm_tiger' && !packs[foeMdl].fallback;
  const FUR = { 목: 0x1f6b33, 화: 0xa8331c, 토: 0x9a6a22, 수: 0x3a63a8, 금: 0xf4f6fa };
  const bodyTint = new THREE.Color(white ? FUR.금 : (FUR[foe.el] || 0x666666));
  const backX = 2.45 + Math.max(0, tierK - 6) * 0.13 - (M >= 4 ? 0.55 : M >= 2 ? 0.2 : 0);
  const foes = [];
  /* 무리 대형 — 앞줄이 가운데, 뒷줄은 옆으로 벌려 뒤에. (앞뒤 어긋남, 좌우) 순 */
  const FORM = { 1: [[0, 0]], 2: [[0, -0.9], [0, 0.9]], 3: [[0, 0], [0.8, -1.4], [0.8, 1.4]],
                 4: [[0, -0.7], [0, 0.7], [0.95, -1.9], [0.95, 1.9]], 5: [[0, 0], [0.5, -1.25], [0.5, 1.25], [1.1, -2.4], [1.1, 2.4]] }[M];
  for (let i = 0; i < M; i++) {
    const fx = backX + FORM[i][0], fz = FORM[i][1];
    const u = build(foe.el, foeMdl, fx, fz, -Math.PI / 2);
    u.wob.scale.setScalar(bs); u.glow.scale.setScalar(bs); u.shadow.scale.setScalar(bs); u.half *= bs; u.sc = bs; u.idx = i;
    u.meshes.forEach(m => eachMat(m, x => {
      if (x.color) x.color.lerp(bodyTint, white ? 0.55 : 0.62);
      if (x.emissive) { x.userData.baseEm = bodyTint.clone().multiplyScalar(0.06 + tierK * 0.012); x.emissive.copy(x.userData.baseEm); }
      if ('roughness' in x) x.roughness = Math.max(x.roughness, 0.85);
    }));
    /* 속성 장식(뿔·가시…)은 늑대와, 모델을 못 받아 늑대로 대신할 때만 */
    if (foeMdl === 'm_enemy' || packs[foeMdl].fallback) addCrest(u, foe.el, tierK, tint, sc);
    /* 갑단 우두머리 — 앞장선 한 마리 머리 위로 도는 빛 고리 */
    if (tierK >= 10 && i === Math.floor((M - 1) / 2)) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 40),
        new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.80 * bs;
      u.holder.add(ring); u.crown = ring;
    }
    /* 마물 주위를 도는 속성 기운 */
    {
      const n = 26, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const aura = new THREE.Points(g, new THREE.PointsMaterial({ color: tint, size: 0.09, map: sparkTexture(),
        transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      u.holder.add(aura); u.aura = aura; u.auraN = n;
    }
    foes.push(u);
  }
  const boss = foes[Math.floor((M - 1) / 2)];          /* 카메라·연출 기준점 */
  const foeAt = a => foes[Math.min(foes.length - 1, a.foe || 0)];

  /* ── 화면 위 글자 (데미지 숫자) ── */
  const lay = document.createElement('div');
  lay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  mount.style.position = 'relative';
  mount.appendChild(lay);
  /* 머리 위 HP 막대 — 롤토체스처럼 유닛마다 */
  const bars = [];
  function hpBar(u, col, big) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;height:' + (big ? 7 : 6) + 'px;width:' + (big ? 64 : 48) + 'px;transform:translate(-50%,-50%);' +
      'background:rgba(0,0,0,.55);border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.25);overflow:hidden;transition:opacity .3s';
    const fill = document.createElement('i');
    fill.style.cssText = 'display:block;height:100%;width:100%;background:' + col + ';transition:width .25s';
    el.appendChild(fill); lay.appendChild(el);
    const b = { u, el, fill, hp: 1, y: big ? (u.sc || 1) * 0.66 + 0.1 : 1.2 }; bars.push(b); return b;
  }
  function stepBars() {
    bars.forEach(b => {
      const v = b.u.holder.position.clone(); v.y = b.y + (b.u.wob.position.y || 0); v.project(cam);
      b.el.style.left = ((v.x * 0.5 + 0.5) * 100) + '%'; b.el.style.top = ((-v.y * 0.5 + 0.5) * 100) + '%';
      b.el.style.opacity = b.u.alive ? 1 : 0;
    });
  }
  function pop(u, txt, kind, col) {
    const v = u.holder.position.clone(); v.y = 1.25;
    v.project(cam);
    const el = document.createElement('div');
    el.textContent = txt;
    el.style.cssText = 'position:absolute;font-weight:800;font-size:' +
      (kind === 'ult' ? 30 : kind === 'big' ? 22 : 17) + 'px;transform:translate(-50%,-50%);' +
      'color:' + (col ? col : kind === 'ult' ? '#fff3b0' : kind === 'big' ? '#ffd93d' : kind === 'bad' ? '#ff8f8f' : '#ffffff') +
      ';text-shadow:0 2px 6px rgba(0,0,0,.85);transition:transform .7s ease-out,opacity .7s ease-out;' +
      'left:' + ((v.x * 0.5 + 0.5) * 100) + '%;top:' + ((-v.y * 0.5 + 0.5) * 100) + '%';
    lay.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%,-50%) translateY(-38px)'; el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 760);
  }

  /* ── 연기 ── */
  let stop = 0, shake = 0, zoom = 0, dead = false;
  /* 아군 체력은 화면 위 막대(hunt.py)가 맡는다. 마물은 머리 위 빨간 막대 */
  foes.forEach(u => { u.bar = hpBar(u, '#e8483c', true); });
  const setHp = (u, r) => { if (u.bar) u.bar.fill.style.width = Math.max(0, Math.round(r * 100)) + '%'; };
  function hitFx(u, kind) {
    u.flash = kind === 'big' ? 0.13 : 0.07;
    stop = Math.max(stop, kind === 'big' ? 0.11 : 0.06);
    shake = Math.max(shake, kind === 'big' ? 0.16 : 0.08);
    zoom = Math.max(zoom, kind === 'big' ? 0.5 : 0.24);
  }
  /* ── 공격 모션 세 가지 ──
     ★ 예전 버그: 달려드는 방향을 개의 로컬 좌표(wob)에 그대로 넣었다. 개는 옆을 보도록
       90° 돌려 세워져 있어서, '앞으로' 가 실제로는 **화면 안쪽**이 됐다 — 공격할 때
       개가 멀어지며 작아졌고, 마물에 닿지도 않았다. 이제는 몸통(holder)을 **월드 좌표**로
       움직인다. (2026-09-21)
     박치기 · 도약 내려찍기 · 회전 돌진 중 하나를 고른다. 세 모션 모두 **코끝이 맞닿을 때까지**
     파고든다: 멈추는 거리 = 내 반길이 + 상대 반길이 − 겹침. */
  const MOVES = ['ram', 'leap', 'spin'];
  const bursts = [], SPARK = sparkTexture();
  function burst(at, dir, color, big) {
    const n = big ? 26 : 16, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) {
      p[i*3] = at.x; p[i*3+1] = at.y; p[i*3+2] = at.z;
      v.push(new THREE.Vector3(dir.x * (1 + Math.random() * 2.4) + (Math.random() - .5),
        Math.random() * 2.6, (Math.random() - .5) * 2));
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: big ? 0.16 : 0.11, map: SPARK, color,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sc.add(pts); bursts.push({ pts, v, t: 0, max: big ? 0.5 : 0.34 });
    const rg = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.09, 28), new THREE.MeshBasicMaterial({ color,
      transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    rg.position.copy(at); rg.lookAt(cam.position); sc.add(rg);
    bursts.push({ ring: rg, t: 0, max: big ? 0.36 : 0.22, grow: big ? 7 : 4 });
  }
  function shock(at, color) {             /* 도약 착지 — 바닥에 퍼지는 고리 */
    const rg = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 40), new THREE.MeshBasicMaterial({ color,
      transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    rg.rotation.x = -Math.PI / 2; rg.position.set(at.x, 0.02, at.z); sc.add(rg);
    bursts.push({ ring: rg, t: 0, max: 0.4, grow: 3.4, flat: true });
  }

  /* ── 조합 필살기 ── 사주 1·2위 속성이 만든 변화 속성(얼음·가스·번개…)을 터뜨린다.
     ① 화면을 가로지르는 컷인 띠 ② 시전자 기 모으기 ③ 속성마다 다른 현상 ④ 큰 숫자 */
  const fxs = [];
  function fx(obj, max, upd) { sc.add(obj); fxs.push({ obj, t: 0, max, upd }); return obj; }
  function stepFx(dt) {
    for (let i = fxs.length - 1; i >= 0; i--) {
      const f = fxs[i]; f.t += dt; const k = Math.min(1, f.t / f.max);
      f.upd(k, dt, f.obj);
      if (k >= 1) { sc.remove(f.obj); f.obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); fxs.splice(i, 1); }
    }
  }
  const glowMat = (col, op) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2,
    roughness: 0.3, metalness: 0.2, transparent: true, opacity: op == null ? 1 : op, flatShading: true });
  const fade01 = (k, a, b) => k < a ? 1 : k > b ? 0 : 1 - (k - a) / (b - a);
  function cutIn(a) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:0;right:0;top:38%;height:22%;display:flex;align-items:center;gap:14px;' +
      'padding:0 6%;transform:translateX(-105%);transition:transform .32s cubic-bezier(.2,.9,.3,1);pointer-events:none;' +
      'background:linear-gradient(90deg,rgba(8,10,18,.92),' + a.col + '55 55%,rgba(8,10,18,.0));' +
      'border-top:2px solid ' + a.col + ';border-bottom:2px solid ' + a.col + ';box-shadow:0 0 28px ' + a.col + '66';
    d.innerHTML = '<b style="font:900 clamp(22px,6vw,40px) \'Noto Serif KR\',serif;color:' + a.col + ';text-shadow:0 0 14px ' + a.col + '">' + a.pair + '</b>' +
      '<span style="display:flex;flex-direction:column;line-height:1.15"><b style="font:900 clamp(17px,4.4vw,28px) \'Noto Serif KR\',serif;color:#fff;letter-spacing:.06em">' + a.hj + '</b>' +
      '<small style="font-size:clamp(11px,2.6vw,14px);color:#e8ecf3;font-weight:700">' + a.name + ' · ' + a.nm + '</small></span>';
    lay.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = 'translateX(0)'; }));
    /* 배속을 올려도 기술 이름은 읽을 만큼(실제 0.9초 이상) 머문다 */
    const hold = Math.max(900, 1150 / sp());
    setTimeout(() => { d.style.transition = 'transform .28s ease-in,opacity .28s'; d.style.transform = 'translateX(105%)'; d.style.opacity = '0'; }, hold);
    setTimeout(() => d.remove(), hold + 450);
  }
  function screenTint(col, ms) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:' + col + ';opacity:.38;transition:opacity ' + (ms / 1000) + 's ease-out';
    lay.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '0'; }));
    setTimeout(() => d.remove(), ms + 100);
  }
  function charge(u, col) {                         /* 시전자 발밑에서 기둥처럼 솟는 기 */
    const c = new THREE.Color(col), at = u.holder.position;
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 1.8, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.position.set(at.x, 1.1, at.z);
    fx(g, 0.9, k => { g.material.opacity = Math.sin(k * Math.PI) * 0.18; g.scale.set(1 + k * 0.6, 0.4 + k * 0.8, 1 + k * 0.6); g.rotation.y += 0.2; });
    burst(at.clone().setY(0.4), new THREE.Vector3(0, 1, 0), c, true);
    u.lineT = 0.9;                                    /* 붉게 번쩍이면 맞은 것처럼 보인다 — 외곽선만 켠다 */
  }
  function spikes(at, col, n, hMax, shape) {        /* 땅에서 솟는 가시 — 얼음·수정·바위 */
    const grp = new THREE.Group(), m = glowMat(new THREE.Color(col), 0.95);
    const geo = shape === 'oct' ? new THREE.OctahedronGeometry(0.5, 0) : shape === 'rock' ? jitter(new THREE.DodecahedronGeometry(0.5, 0), 0.15) : new THREE.ConeGeometry(0.22, 1, 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, r = 0.35 + Math.random() * 0.75;
      const s = grp.add(new THREE.Mesh(geo, m)) && grp.children[grp.children.length - 1];
      const h = hMax * (0.5 + Math.random() * 0.6);
      s.position.set(at.x + Math.cos(a) * r, 0, at.z + Math.sin(a) * r * 0.7);
      s.rotation.set((Math.random() - .5) * 0.6, Math.random() * 3, (Math.random() - .5) * 0.6);
      s.userData.h = h; s.userData.d = Math.random() * 0.12;
    }
    return fx(grp, 1.5, k => grp.children.forEach(s => {
      const g = Math.min(1, Math.max(0, (k - s.userData.d) / 0.14));
      const sy = s.userData.h * (1 - Math.pow(1 - g, 3));
      if (shape === 'oct' || shape === 'rock') { s.scale.set(sy * 0.55, sy, sy * 0.55); s.position.y = sy * 0.4; }
      else { s.scale.set(1.1, sy, 1.1); s.position.y = sy / 2; }
      m.opacity = fade01(k, 0.7, 1) * 0.95;
    }));
  }
  function cloud(at, col, n, o) {                    /* 퍼지는 연기·안개·김 — o.rise 위로, o.fall 아래로 */
    const c = new THREE.Color(col), g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) {
      p[i*3] = at.x + (Math.random() - .5) * 0.6; p[i*3+1] = 0.2 + Math.random() * 1.1; p[i*3+2] = at.z + (Math.random() - .5) * 0.6;
      v.push([(Math.random() - .5) * (o.spread || 1.4), (o.rise || 0) * (0.5 + Math.random()), (Math.random() - .5) * (o.spread || 1.4)]);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: c, size: o.size || 0.55, map: SPARK, transparent: true,
      opacity: 0, depthWrite: false, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending }));
    return fx(pts, o.dur || 1.8, (k, dt) => {
      const a = pts.geometry.attributes.position.array;
      for (let i = 0; i < n; i++) { a[i*3] += v[i][0] * dt; a[i*3+1] += (v[i][1] - (o.fall || 0)) * dt; a[i*3+2] += v[i][2] * dt;
        if (a[i*3+1] < 0.05) a[i*3+1] = 0.05; }
      pts.geometry.attributes.position.needsUpdate = true;
      pts.material.opacity = Math.min(1, k * 6) * fade01(k, 0.55, 1) * (o.op || 0.85);
      pts.material.size = (o.size || 0.55) * (1 + k * (o.grow || 1.2));
    });
  }
  function bolt(at, col, delay) {                    /* 하늘에서 떨어지는 번개 */
    later(() => {
      const pts = [], x0 = at.x + (Math.random() - .5) * 0.6, z0 = at.z;
      for (let i = 0; i <= 9; i++) { const y = 6.5 - i * 0.68; pts.push(new THREE.Vector3(x0 + (i && i < 9 ? (Math.random() - .5) * 0.7 : 0), Math.max(0.6, y), z0 + (Math.random() - .5) * 0.3)); }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 40, 0.05, 6),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      fx(tube, 0.35, k => { tube.material.opacity = k < 0.2 ? 1 : (Math.random() > 0.4 ? 1 - k : 0.2); });
      screenTint(col, 260); shake = Math.max(shake, 0.22); shock(at, new THREE.Color(col));
      burst(at.clone().setY(0.9), new THREE.Vector3(0, 1, 0), new THREE.Color(col), true);
    }, delay || 0);
  }
  function orbitShards(at, col) {                   /* 수정 조각이 돌다가 꽂힌다 */
    const grp = new THREE.Group(), m = glowMat(new THREE.Color(col), 1);
    for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), m); s.scale.y = 2.2; grp.add(s); }
    grp.position.set(at.x, 0, at.z);
    return fx(grp, 1.2, k => grp.children.forEach((s, i) => {
      const a = i / 7 * Math.PI * 2 + k * 9, r = k < 0.6 ? 1.3 : 1.3 * (1 - (k - 0.6) / 0.4);
      s.position.set(Math.cos(a) * r, 0.9 + Math.sin(a * 2) * 0.2, Math.sin(a) * r * 0.7); s.rotation.y = a;
      m.opacity = fade01(k, 0.9, 1);
    }));
  }
  function blades(at, col, n) {                     /* 칼바람 — 초승달 칼날이 스쳐 간다 */
    for (let i = 0; i < n; i++) later(() => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 6, 30, Math.PI * 0.9),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      arc.position.set(at.x, 0.8, at.z); arc.rotation.set(Math.PI / 2 * (i % 2 ? 1 : 0.4), 0, i * 1.1);
      fx(arc, 0.4, k => { arc.rotation.z += 0.45; arc.scale.setScalar(0.6 + k * 0.9); arc.material.opacity = 1 - k; });
      burst(at.clone().setY(0.9), new THREE.Vector3(-1, 0.5, 0), new THREE.Color(col), false); shake = Math.max(shake, 0.1);
    }, i * 170);
  }
  function drops(at, col, n) {                      /* 쏟아지는 쇳물 방울 */
    const c = new THREE.Color(col), m = glowMat(c, 1), grp = new THREE.Group();
    for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.09 + Math.random() * 0.06, 8, 6), m);
      d.userData = { x: at.x + (Math.random() - .5) * 1.4, z: at.z + (Math.random() - .5) * 0.9, y0: 3.5 + Math.random() * 2.5, dl: Math.random() * 0.35 }; grp.add(d); }
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(at.x, 0.02, at.z); grp.add(pool);
    return fx(grp, 1.6, k => { grp.children.forEach(d => { if (d === pool) return; const t = Math.max(0, (k - d.userData.dl) / 0.35);
      d.position.set(d.userData.x, Math.max(0.05, d.userData.y0 * (1 - t * t)), d.userData.z); });
      pool.material.opacity = Math.min(1, Math.max(0, (k - 0.3) * 3)) * fade01(k, 0.75, 1) * 0.6; m.opacity = fade01(k, 0.8, 1); });
  }
  function freeze(u, col, ms) {                     /* 얼어붙음 — 몸빛이 굳고 모션이 멈춘다 */
    const c = new THREE.Color(col);
    u.meshes.forEach(m => eachMat(m, x => { if (x.emissive) { x.userData.fzCol = c.clone().multiplyScalar(0.55); x.emissive.copy(x.userData.fzCol); } }));
    if (u.mx) u.mx.timeScale = 0;
    later(() => { if (u.mx) u.mx.timeScale = 1; u.meshes.forEach(m => eachMat(m, x => { if (x.userData.fzCol) { delete x.userData.fzCol; if (x.userData.baseEm) x.emissive.copy(x.userData.baseEm); else x.emissive.setScalar(0); } })); }, ms);
  }
  function ultFx(a) {
    const T = foeAt(a); const at = T.holder.position.clone(); at.y = 0; const c = a.col;
    screenTint(c, 500);
    if (a.fx === 'ice')     { spikes(at, 0xbfefff, 11, 1.5); cloud(at, 0xe8fbff, 40, { size: 0.35, spread: 2, dur: 1.4 }); later(() => foes.forEach(F => F.alive && freeze(F, 0x9fe4ff, 1400)), 250); }
    else if (a.fx === 'gas')  { cloud(at, 0x9fd83a, 70, { size: 0.9, spread: 1.1, rise: 0.25, dur: 2.2, op: 0.7, normal: true }); cloud(at, 0xe4ff7a, 30, { size: 0.4, dur: 1.6 }); }
    else if (a.fx === 'crystal') { orbitShards(at, 0xe6b3ff); later(() => spikes(at, 0xd9a8ff, 7, 1.4, 'oct'), 700); }
    else if (a.fx === 'mist') { cloud(at, 0xeef4fa, 80, { size: 1.1, spread: 2.4, dur: 2.2, op: 0.55, normal: true }); }
    else if (a.fx === 'quake'){ for (let i = 0; i < 3; i++) later(() => { shock(at, new THREE.Color(c)); shake = Math.max(shake, 0.35); }, i * 180); spikes(at, 0xa27a45, 9, 0.9, 'rock'); }
    else if (a.fx === 'mud')  { cloud(at, 0x6b4f2e, 50, { size: 0.5, spread: 2.2, rise: 2.2, dur: 1.3, op: 0.9, normal: true }); later(() => cloud(at, 0x4a3520, 30, { size: 0.9, spread: 0.6, dur: 1.4, op: 0.8, normal: true }), 300); }
    else if (a.fx === 'steam'){ cloud(at, 0xffffff, 90, { size: 0.7, spread: 0.7, rise: 2.6, dur: 1.8, op: 0.7, normal: true }); burst(at.clone().setY(0.6), new THREE.Vector3(0, 1, 0), new THREE.Color(0xffc38a), true); }
    else if (a.fx === 'molten'){ drops(at, 0xff7a2a, 16); later(() => shock(at, new THREE.Color(0xff8a3d)), 420); }
    else if (a.fx === 'wind') { blades(at, 0xd7fff0, 3); cloud(at, 0xd7fff0, 30, { size: 0.3, spread: 3, dur: 1.0 }); }
    else if (a.fx === 'bolt') { bolt(at, c, 0); bolt(at, c, 330); }
  }

  function stepBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.t += dt; const k = b.t / b.max;
      if (k >= 1) { const o = b.pts || b.ring; sc.remove(o); o.geometry.dispose(); o.material.dispose(); bursts.splice(i, 1); continue; }
      if (b.pts) {
        const a = b.pts.geometry.attributes.position;
        b.v.forEach((w, n) => { w.y -= 7 * dt; a.array[n*3] += w.x*dt; a.array[n*3+1] += w.y*dt; a.array[n*3+2] += w.z*dt; });
        a.needsUpdate = true; b.pts.material.opacity = 1 - k;
      } else { const g = 1 + k * b.grow; b.ring.scale.set(g, g, g); b.ring.material.opacity = (1 - k) * 0.9; }
    }
  }

  /* ── 맞는 모션 ──
     맞은 쪽은 ① 외곽선이 번쩍 켜지고 ② 뒤로 튕겨 나가며 살짝 떠오르고
     ③ 코가 들리도록 몸이 뒤로 젖혀졌다가 ④ 제자리로 비틀거리며 돌아온다.
     세게 맞으면(상극·도약) 더 멀리, 더 높이 날아가고 한 번 더 휘청인다. */
  function hurt(u, dir, big) {
    if (!u.alive) return;
    u.lineT = big ? 0.6 : 0.42; u.busy = 1;
    const heavy = u.idx != null ? 0.45 : 1;   /* 마물은 몸집이 커서 덜 날아간다 */
    const h = u.home, far = (big ? 0.34 : 0.18) * heavy, up = (big ? 0.16 : 0.07) * heavy, lean = (big ? 0.34 : 0.2) * heavy;
    const tilt = 1;      /* 모두 +z 를 보고 서 있어 x 축으로 젖히면 코가 들린다 */
    TW.add(0, 1, big ? 0.16 : 0.12, 'out', t => {
      u.holder.position.set(h.x + dir.x * far * t, 0, h.z + dir.z * far * t);
      u.wob.position.y = Math.sin(t * Math.PI * 0.5) * up;
      u.wob.rotation.x = -lean * tilt * t;
    }, () => {
      TW.add(0, 1, big ? 0.5 : 0.36, 'out', t => {
        u.holder.position.set(h.x + dir.x * far * (1 - t), 0, h.z + dir.z * far * (1 - t));
        u.wob.position.y = up * (1 - t) * (1 - t);
        /* 돌아오며 한두 번 휘청 — 감쇠 진동 */
        const wob = Math.sin(t * Math.PI * (big ? 3 : 2)) * (1 - t);
        u.wob.rotation.x = -lean * tilt * (1 - t) * (1 - t);
        u.wob.rotation.z = wob * (big ? 0.22 : 0.12);
      }, () => { u.wob.rotation.x = 0; u.wob.rotation.z = 0; u.wob.position.y = 0; u.busy = 0; });
    });
  }

  function attack(u, target, kind, onLand) {
    const move = kind === 'big' && Math.random() < 0.6 ? 'leap' : MOVES[Math.floor(Math.random() * MOVES.length)];
    const h = u.home.clone(), T = target.home;
    const dir = new THREE.Vector3().subVectors(T, h).setY(0).normalize();
    /* 맞닿는 자리 — 상대 앞, 같은 줄로 들어간다(옆줄에서 비스듬히 박으면 어깨가 스친다) */
    const touch = u.half + target.half - 0.12;
    const hit = new THREE.Vector3(T.x - dir.x * touch, 0, T.z - dir.z * touch * 0.35);
    const back = h.clone().addScaledVector(dir, -0.22);
    const at = hit.clone().addScaledVector(dir, u.half * 0.9); at.y = 0.55;
    const col = new THREE.Color(COL[u.el] || 0xffffff);
    const S = u.sc || 1;
    const lerp = (a, b, t) => u.holder.position.set(a.x + (b.x - a.x) * t, 0, a.z + (b.z - a.z) * t);
    const dist = h.distanceTo(hit);
    /* 발놀림을 이동 속도에 맞춘다 — 질주 클립 한 바퀴(13프레임)에 몸길이 1.1배를 간다고 보고 */
    const stride = Math.max(0.4, u.half * 2 * 1.1), CYCLE = 13 / 24;
    const gallopSpeed = (v) => Math.min(2.4, Math.max(0.9, (v / stride) * CYCLE));
    const land = (big) => { burst(at, dir, col, big); onLand(); hurt(target, dir, big); };
    /* 착지 찌부 — 닿는 순간 몸이 납작해졌다 펴진다 */
    const squash = (k0) => TW.add(0, 1, 0.18, 'out', t => { const k = Math.sin(t * Math.PI) * k0;
      u.wob.scale.set(S * (1 + 0.9 * k), S * (1 - k), S * (1 + 0.5 * k)); }, () => u.wob.scale.setScalar(S));
    /* 웅크림(예비 동작) — 뒤로 살짝 물러앉으며 코를 낮춘다. 그래야 다음 도약이 읽힌다 */
    const crouch = (dur, deep, then) => TW.add(0, 1, dur, 'out', t => { const k = Math.sin(t * Math.PI * 0.5);
      u.wob.position.y = -0.05 * deep * k * S; u.wob.rotation.x = 0.10 * deep * k;
      u.wob.scale.set(S, S * (1 - 0.08 * deep * k), S); lerp(h, back, k * 0.5); }, then);
    /* 돌아오기 — 껑충 뛰어 제자리로. 질주 클립을 천천히 돌려 공중 자세를 만든다 */
    const home = (from, dur) => { playLoop(u, 'gallop', 0.7, 0.08);
      TW.add(0, 1, dur, 'out', t => { lerp(from, h, t); u.wob.position.y = Math.sin(t * Math.PI) * 0.16 * S; u.wob.rotation.x = -0.12 * Math.sin(t * Math.PI); },
        () => { u.wob.rotation.y = 0; u.wob.rotation.x = 0; u.wob.position.y = 0; u.busy = 0; u.one = null; u.pose = null; pose(u, 'idle', true); }); };
    const strike = (big, extra) => {          /* 닿는 순간 — 공격 클립의 덮치는 구간만 빠르게 */
      playFrom(u, 'attack', 0.32, 1.7, true);
      later(() => { land(big); squash(big ? 0.14 : 0.10); if (extra) extra(); }, 90);
    };
    u.busy = 1;

    if (move === 'ram') {                 /* 박치기 — 웅크렸다가 달려들어 머리부터 들이받는다 */
      crouch(0.18, 1, () => {
        const dur = Math.min(0.55, Math.max(0.28, dist / 3.4));
        playLoop(u, 'gallop', gallopSpeed(dist / dur), 0.08);
        TW.add(0, 1, dur, 'in', t => { lerp(back, hit, t); u.wob.position.y = 0; u.wob.rotation.x = 0.16 * t; u.wob.scale.setScalar(S); },
          () => { u.wob.rotation.x = 0.05; strike(kind === 'big'); later(() => { if (!dead) home(hit, 0.42); }, 260); });
      });
    } else if (move === 'leap') {         /* 도약 내려찍기 — 깊게 웅크렸다가 높이 뛰어올라 정수리로 떨어진다 */
      crouch(0.22, 1.5, () => {
        playFrom(u, 'gallop', 0.02, 0.45, true);         /* 공중에서 몸을 쭉 편 자세 */
        const H = (u.idx != null ? 0.45 : 0.95) * S;
        TW.add(0, 1, 0.46, 'in', t => {
          lerp(back, hit, t); u.wob.position.y = Math.sin(t * Math.PI) * H;
          u.wob.rotation.x = 0.25 * Math.sin(t * Math.PI) - 0.35 * Math.max(0, t - 0.55);   /* 올라갈 땐 코를 들고 내려올 땐 내리꽂는다 */
          u.wob.scale.setScalar(S);
        }, () => {
          u.wob.position.y = 0; u.wob.rotation.x = 0;
          strike(true, () => { shock(hit, col); shake = Math.max(shake, 0.2); });
          later(() => { if (!dead) home(hit, 0.4); }, 300);
        });
      });
    } else {                              /* 회전 돌진 — 한 바퀴 돌며 달려들어 몸통으로 부딪친다 */
      crouch(0.14, 0.7, () => {
        const dur = Math.min(0.5, Math.max(0.3, dist / 3.6));
        playLoop(u, 'gallop', gallopSpeed(dist / dur), 0.08);
        TW.add(0, 1, dur, 'in', t => {
          lerp(back, hit, t); u.wob.rotation.y = t * Math.PI * 2; u.wob.position.y = Math.sin(t * Math.PI) * 0.12 * S; u.wob.scale.setScalar(S);
        }, () => {
          u.wob.rotation.y = 0; u.wob.position.y = 0;
          strike(kind === 'big'); later(() => { if (!dead) home(hit, 0.38); }, 240);
        });
      });
    }
    return move;
  }

  /* ── 용신석 ──
     사냥감이 쓰러진 자리에서 돌이 튀어나와 바닥에 흩어지고, 내 개가 앞으로
     걸어 나가 하나씩 빨아들인다. 돌을 개에게 걸어가서 밟게 하면 열 개를
     줍는 데 십몇 초가 걸린다 — 개는 한 번만 걸어 나가고, 돌이 개에게 온다. */
  const stones = [];
  const stoneGeo = new THREE.OctahedronGeometry(0.115, 0);   /* (예전 낱알 — 정리용으로만 남겨 둔다) */
  /* 용신석 — 결정 덩어리. 굵은 기둥 하나에 잔 결정 몇 개가 붙은 모양. 속성마다 몸색·속빛이 다르다.
     유리처럼 비치되(physical 재질) 안쪽이 어둡고 겉이 밝아 참고 이미지의 석류석 느낌을 낸다 */
  const GEM = { 목: [0x2f9d55, 0x0d3d1c], 화: [0xe0452a, 0x5a0f08], 토: [0xf0b62e, 0x6b4308], 금: [0xd6dde8, 0x556173], 수: [0x3b8fe6, 0x0c2e63] };
  function crystalGeo(seed) {
    /* 울퉁불퉁한 원석 — 정이십면체 꼭짓점(12개, 공유)을 흔들어 각진 덩어리를 만들고 잔 덩어리를 붙인다. 면마다 법선을 따로 둬 각이 산다 */
    const g = new THREE.Group(); const rnd = (() => { let x = seed * 9301 + 49297; return () => { x = (x * 233 + 1) % 4093; return x / 4093; }; })();
    const chunk = (r, sx, sy, sz, px, py, pz) => {
      const base = new THREE.IcosahedronGeometry(r, 0); const p = base.attributes.position; const seen = new Map();
      for (let i = 0; i < p.count; i++) { const key = [p.getX(i), p.getY(i), p.getZ(i)].map(v => v.toFixed(4)).join(','); let k = seen.get(key); if (k == null) { k = 0.72 + rnd() * 0.5; seen.set(key, k); }
        p.setXYZ(i, p.getX(i) * k * sx, p.getY(i) * k * sy, p.getZ(i) * k * sz); }
      const geo = base.toNonIndexed(); geo.computeVertexNormals(); base.dispose();
      const m = new THREE.Mesh(geo, null); m.position.set(px, py, pz); m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); g.add(m); return m; };
    chunk(0.13, 1.0, 1.25, 0.9, 0, 0.14, 0);
    chunk(0.08, 1.1, 1.0, 1.0, 0.11, 0.05, 0.05);
    chunk(0.065, 0.9, 1.3, 1.0, -0.09, 0.07, -0.04);
    if (rnd() > 0.5) chunk(0.05, 1, 1, 1, 0.03, 0.03, -0.11);
    return g;
  }
  function crystalMat(el) {
    const [body, deep] = GEM[el] || GEM.토;
    return new THREE.MeshPhysicalMaterial({ color: body, emissive: deep, emissiveIntensity: 1.1, roughness: 0.12, metalness: 0.0,
      clearcoat: 1, clearcoatRoughness: 0.1, flatShading: true, transparent: true, opacity: 0.94 });
  }
  function rimMat(el) { const [body] = GEM[el] || GEM.토; return new THREE.MeshBasicMaterial({ color: new THREE.Color(body).lerp(new THREE.Color(0xffffff), 0.55), transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }); }
  function makeCrystal(el, seed) {
    const g = crystalGeo(seed), mat = crystalMat(el), rm = rimMat(el);
    g.children.slice().forEach(o => { o.material = mat; const r = o.clone(); r.material = rm; r.scale.multiplyScalar(1.03); g.add(r); });
    g.userData.mat = mat; g.userData.rim = rm; return g;
  }

  function dropStones(el, howMany, mid) {
    const c = new THREE.Color(COL[el] || 0xffd93d);
    const shown = Math.min(12, howMany);
    for (let i = 0; i < shown; i++) {
      const m = makeCrystal(el, i + 1);
      m.scale.setScalar(0.85 + Math.random() * 0.4); m.rotation.y = Math.random() * 6;
      /* 바닥에 깔린 빛무리 — 돌이 어디 떨어졌는지 멀리서도 보인다 */
      const halo = new THREE.Mesh(new THREE.CircleGeometry(0.2, 18),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28 }));
      halo.rotation.x = -Math.PI / 2; halo.position.y = 0.014;
      const holder = new THREE.Object3D();
      holder.add(m); holder.add(halo);
      holder.position.copy(mid);
      sc.add(holder);

      const a = (i / shown) * Math.PI * 2 + Math.random();
      const r = 0.55 + Math.random() * 1.15;
      const tx = mid.x - 0.7 - Math.cos(a) * r * 0.55;
      const tz = mid.z + Math.sin(a) * r;
      const top = 0.6 + Math.random() * 0.3;
      const st = { holder, mesh: m, halo, taken: false };
      stones.push(st);
      /* 포물선 한 번 — 0→1 을 높이와 수평 이동에 같이 쓴다 */
      TW.add(0, 1, 0.55 + Math.random() * 0.18, '', v => {
        holder.position.x = mid.x + (tx - mid.x) * v;
        holder.position.z = mid.z + (tz - mid.z) * v;
        m.position.y = 0.02 + Math.sin(v * Math.PI) * top;
        halo.material.opacity = 0.28 * v;
      });
    }
    return shown;
  }

  /* 돌 하나를 개에게 빨아들인다 */
  function suck(st, to, delay, onIn) {
    later(() => {
      if (dead || st.taken) return;
      st.taken = true;
      const from = st.holder.position.clone();
      const y0 = st.mesh.position.y;
      st.halo.visible = false;
      TW.add(0, 1, 0.34, 'in', v => {
        st.holder.position.lerpVectors(from, to, v);
        st.mesh.position.y = y0 + Math.sin(v * Math.PI) * 0.45;
        st.mesh.scale.setScalar(1 - v * 0.55);
        st.mesh.rotation.y += 0.25;
        if (st.mesh.userData.mat) st.mesh.userData.mat.emissiveIntensity = 0.9 + v * 2.4;
      }, () => {
        sc.remove(st.holder);
        st.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
        if (st.mesh.userData.mat) st.mesh.userData.mat.dispose(); if (st.mesh.userData.rim) st.mesh.userData.rim.dispose();
        st.halo.geometry.dispose(); st.halo.material.dispose();
        if (onIn) onIn();
      });
    }, delay);
  }

  function playLoot(a, done) {
    const me = mates[0];
    if (!me) { done(); return; }
    const mid = boss.holder.position.clone(); mid.y = 0;
    const shown = dropStones(a.el, a.n, mid);
    if (onCaption) onCaption(a.text);

    /* 개가 돌밭 앞까지 한 번 걸어 나간다 */
    const home = me.holder.position.clone();
    const walkTo = new THREE.Vector3(mid.x - 1.85, 0, mid.z * 0.4 + home.z * 0.3);
    const face = Math.atan2(walkTo.x - home.x, walkTo.z - home.z);
    const r0 = me.holder.rotation.y;
    if (me.alive) pose(me, 'walk', true);

    TW.add(0, 1, 0.24, '', v => { me.holder.rotation.y = r0 + (face - r0) * v; });
    TW.add(0, 1, 0.95, '', v => {
      me.holder.position.lerpVectors(home, walkTo, v);
    }, () => {
      const at = walkTo.clone(); at.y = 0.55;
      let got = 0;
      stones.forEach((st, i) => suck(st, at, 90 + i * 115, () => {
        got++;
        pop(me, '+1', 'big');
        if (o.onLoot) o.onLoot(got, a.n);
        if (got >= shown) {
          /* 다 주우면 남은 몫을 한 번에 알리고, 제자리로 돌아가 앉는다 */
          if (a.n > shown && o.onLoot) o.onLoot(a.n, a.n);
          later(() => {
            if (dead) return;
            if (me.alive) once(me, 'attack', 0.7);      /* 폴짝 — 기뻐하는 몸짓 */
            TW.add(0, 1, 0.8, '', v => {
              me.holder.position.lerpVectors(walkTo, home, v);
              me.holder.rotation.y = face + (r0 - face) * v;
            }, () => { if (me.alive) pose(me, 'idle', true); done(); });
          }, 420);
        }
      }));
      if (!shown) done();
    });
  }

  /* 쓰러질 때 몸은 서서히 흐려지고, 외곽선·발밑 빛은 먼저 꺼진다 */
  function fade(u, p, k) {
    u.meshes.forEach(m => eachMat(m, x => { if (!x.transparent) { x.transparent = true; x.needsUpdate = true; } x.opacity = 1 - p * k; }));
    if (u.shadow) u.shadow.material.opacity = 0.34 * (1 - p);
    u.lineT = 0;
    u.glow.material.opacity = 0.55 * (1 - p);
  }

  let ai = 0;
  function next() {
    if (dead) return;
    if (ai >= acts.length) { finish(); return; }
    const a = acts[ai++];
    let wait = 620;

    if (a.t === 'turn') { if (onCaption) onCaption(a.text); wait = 260; }
    else if (a.t === 'hit') {
      const u = mates[a.by]; if (!u || !u.alive) return next();
      if (onCaption) onCaption(a.text);
      const F = foeAt(a); if (!F.alive) return next();
      attack(u, F, a.kind, () => {
        F.hpNow = a.foeHp;
        pop(F, '−' + a.dmg, a.kind);
        hitFx(F, a.kind);
        if (F.alive && a.foeHp > 0) once(F, 'hit', 0.5);
        setHp(F, a.foeHp);
        if (o.onFoeHp) o.onFoeHp(a.allHp != null ? a.allHp : a.foeHp);
      });
      wait = M >= 3 ? 640 : 780;
    }
    else if (a.t === 'ult') {
      const u = mates[a.by]; if (!u || !u.alive) return next();
      if (onCaption) onCaption(a.text);
      cutIn(a); charge(u, a.col); once(u, 'attack', 0.9);
      later(() => ultFx(a), 650);
      /* 연쇄·연타는 숫자가 나눠 뜬다 — 번개 두 번, 칼바람 세 번 */
      const parts = (a.splits && a.splits.length) ? a.splits : [a.dmg];
      const F = foeAt(a);
      const hp0 = F.hpNow == null ? 1 : F.hpNow;
      let acc = 0;
      parts.forEach((d, k) => later(() => {
        acc += d; const r = hp0 - (hp0 - a.foeHp) * (acc / Math.max(1, a.dmg));
        F.hpNow = r; pop(F, '−' + d, 'ult'); hitFx(F, 'big');
        if (k === parts.length - 1 && F.alive && a.foeHp > 0 && a.fx !== 'ice') once(F, 'hit', 0.6);
        setHp(F, r); if (o.onFoeHp) o.onFoeHp(r);
      }, 1150 + k * 260));
      wait = 2300 + (parts.length - 1) * 260;
    }
    else if (a.t === 'foedown') {                    /* 마물 한 마리가 쓰러진다 */
      const F = foeAt(a); if (!F.alive) return next();
      if (onCaption && a.text) onCaption(a.text);
      F.alive = false; F.busy = 1; once(F, 'death', 1.0, true);
      TW.add(0, 1, 1.2, 'in', p => fade(F, p, 0.95));
      wait = a.text ? 450 : 80;
    }
    else if (a.t === 'dot') {                        /* 독연·화상 — 사냥감 위로 색 숫자 */
      if (onCaption) onCaption(a.text);
      const F = foeAt(a);
      F.hpNow = a.foeHp; pop(F, '−' + a.dmg, 'dot', a.col); hitFx(F, '');
      setHp(F, a.foeHp); if (o.onFoeHp) o.onFoeHp(a.foeHp);
      wait = 650;
    }
    else if (a.t === 'foehit') {
      const v = mates[a.to]; if (!v) return next();
      if (onCaption) onCaption(a.text);
      const F = foes[Math.min(foes.length - 1, a.from || 0)]; if (!F.alive) return next();
      attack(F, v, a.kind, () => {
        pop(v, '−' + a.dmg, a.kind === 'big' ? 'bad' : '');
        hitFx(v, a.kind);
        if (v.alive) once(v, 'hit', 0.5);
        (a.hp || []).forEach((h, i) => mates[i] && setHp(mates[i], h));
        if (o.onTeamHp) o.onTeamHp(a.hp);
      });
      wait = M >= 4 ? 430 : M >= 2 ? 560 : 820;   /* 마물이 많으면 반격이 잦다 — 짧게 끊는다 */
    }
    else if (a.t === 'down') {
      const v = mates[a.i]; if (!v) return next();
      if (onCaption) onCaption(a.text);
      v.alive = false; v.busy = 1; once(v, 'death', 0.95, true);
      TW.add(0, 1, 1.2, 'in', p => fade(v, p, 0.92));
      wait = 900;
    }
    else if (a.t === 'loot') {
      shake = Math.max(shake, 0.1);
      playLoot(a, () => { if (!dead) next(); });
      return;                                  /* 끝나는 시점을 playLoot 가 안다 */
    }
    else if (a.t === 'end') {
      if (onCaption) onCaption(a.text);
      if (a.win) {
        foes.forEach(F => { if (!F.alive) return; F.alive = false; once(F, 'death', 1.1, true); TW.add(0, 1, 1.3, 'in', p => fade(F, p, 0.95)); });
        /* 쓰러지는 걸 본 다음, 필살기 연출이 다 끝난 뒤에 */
        later(() => { const t0 = performance.now();
          (function wv() { if (dead) return; if (fxs.length && performance.now() - t0 < 2500) return requestAnimationFrame(wv); victory(); })(); }, 1050);
      }
      wait = a.win ? 1900 : 900;
    }
    later(next, wait);
  }
  /* 이긴 순간 — 파티가 두 번 뛰고, 가운데 '승리' 가 찍힌다 */
  function victory() {
    zoom = Math.max(zoom, 0.9);
    mates.forEach((u, i) => { if (!u.alive) return;
      later(() => { if (dead) return;
        TW.add(0, 1, 0.34, 'out', t => { u.wob.position.y = Math.sin(t * Math.PI) * 0.42; }, () => {
          TW.add(0, 1, 0.3, 'out', t => { u.wob.position.y = Math.sin(t * Math.PI) * 0.26; }, () => { u.wob.position.y = 0; }); });
      }, i * 90); });
    const d = document.createElement('div');
    d.textContent = '승리';
    d.style.cssText = 'position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) scale(1.6);opacity:0;pointer-events:none;' +
      'font:900 clamp(34px,10vw,58px) "Noto Serif KR",serif;letter-spacing:.18em;color:#ffe27a;' +
      'text-shadow:0 0 18px rgba(255,200,60,.75),0 3px 8px rgba(0,0,0,.8);transition:transform .35s cubic-bezier(.2,.9,.3,1.3),opacity .35s';
    lay.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '1'; d.style.transform = 'translate(-50%,-50%) scale(1)'; });
    const hold = Math.max(800, 1300 / sp());
    setTimeout(() => { d.style.opacity = '0'; d.style.transform = 'translate(-50%,-60%) scale(.96)'; }, hold);
    setTimeout(() => d.remove(), hold + 450);
  }
  function finish() { if (onDone) onDone(); }

  /* 서 있을 때의 위협 자세 — 몸을 낮추고 고개를 숙인 채 상대를 노려본다.
     클립은 멈춰 두고(발 구르기 없음) 뼈를 직접 돌린다: 목·머리를 숙이고, 천천히 좌우로 훑고, 숨을 쉰다.
     mixer.update 뒤에 덧씌우므로 클립 값 위에 더해진다 */
  const STANCE = { neck: -0.15, head: -0.20, scan: 0.14, breath: 0.010, sink: 0.035 };
  const _E = new THREE.Euler();
  /* 서 있을 때의 위협 자세 — 몸을 낮추고 고개를 숙인 채 상대를 노려본다.
     클립(Idle)은 거의 멈춰 두고, 매 프레임 '클립이 준 뼈 자세' 위에 굽힘을 더한다.
     더한 값이 쌓이지 않도록 뼈 자세를 먼저 저장해 두고(base) 거기서 출발한다. */
  function stance(u) {
    const tt = performance.now() / 1000 + u.phase, S = u.sc || 1, B = u.bone || {};
    if (!u.base) { u.base = {}; for (const n in B) u.base[n] = B[n].quaternion.clone(); }
    for (const n in B) B[n].quaternion.copy(u.base[n]);
    const br = Math.sin(tt * 2.0) * STANCE.breath;
    u.wob.position.y = -STANCE.sink * S;
    u.wob.scale.set(S * (1 - br * 0.4), S * (1 + br), S * (1 - br * 0.4));
    u.wob.rotation.z = 0.015 * Math.sin(tt * 0.6);
    const R = (n, dx, dy) => { const b = B[n]; if (!b) return; _E.setFromQuaternion(b.quaternion); _E.x += dx; if (dy) _E.y += dy; b.quaternion.setFromEuler(_E); };
    /* 다리 — 어깨·팔꿈치·무릎을 굽혀 낮게 선다(늑대 아마추어 51본 기준, 없는 뼈는 건너뛴다) */
    R('FrontShoulderL', -0.30); R('FrontShoulderR', -0.30);
    R('FrontUpperLegL', 0.50);  R('FrontUpperLegR', 0.50);
    R('FrontLowerLegL', -0.20); R('FrontLowerLegR', -0.20);
    R('BackShoulderL', 0.35);   R('BackShoulderR', 0.35);
    R('BackUpperLegL', -0.50);  R('BackUpperLegR', -0.50);
    R('BackLowerLegL', 0.30);   R('BackLowerLegR', 0.30);
    /* 목·머리를 숙이고 천천히 좌우로 훑는다 · 꼬리는 낮게 */
    R('Neck1', STANCE.neck); R('Neck2', STANCE.neck);
    R('Head', STANCE.head, Math.sin(tt * 1.1) * STANCE.scan);
    R('Tail1', -0.10); R('Tail2', -0.10); R('Tail3', -0.10);
  }

  /* ── 매 프레임 ── */
  const clock = new THREE.Clock();
  (function loop() {
    if (dead) return;
    requestAnimationFrame(loop);
    let dt = Math.min(0.25, clock.getDelta()) * sp();      /* 4fps 까지는 실제 시간대로 — 아주 느린 기기에서도 전투 길이 유지 */
    if (stop > 0) { stop -= dt; dt *= 0.08; }           /* 타격 순간 시간을 눌러 준다 */
    gT += dt; runDue();
    TW.step(dt);
    stepBursts(dt); stepFx(dt);
    stepBars();
    foes.forEach(F => {
      if (F.crown) { F.crown.rotation.z += dt * 1.2; F.crown.position.y = 0.80 * F.sc + Math.sin(performance.now() / 700) * 0.05; F.crown.visible = F.alive; }
      if (F.aura) {
        const a = F.aura.geometry.attributes.position.array, t = performance.now() / 1000 + F.idx;
        for (let i = 0; i < F.auraN; i++) {
          const ang = t * 0.9 + i * (Math.PI * 2 / F.auraN), r = 0.42 + 0.1 * Math.sin(t * 2 + i);
          a[i*3] = Math.cos(ang) * r; a[i*3+1] = 0.15 + ((t * 0.35 + i / F.auraN) % 1) * 0.75; a[i*3+2] = Math.sin(ang) * r;
        }
        F.aura.geometry.attributes.position.needsUpdate = true; F.aura.visible = F.alive;
      }
    });
    arena.step(dt, performance.now() / 1000);
    [...mates, ...foes].forEach(u => {
      u.mx.update(dt);
      if (u.alive && !u.busy && u.pose === 'idle') stance(u); else u.base = null;
      if (u.lineT > 0) u.lineT -= dt;
      const on = u.alive && u.lineT > 0;
      if (u.outlines[0] && u.outlines[0].visible !== on) u.outlines.forEach(o => { o.visible = on; });
      if (u.flash > 0) {
        u.flash -= dt;
        const k = Math.max(0, u.flash) * 1.6;
        u.meshes.forEach(m => eachMat(m, x => { if (x.emissive) { const bE = x.userData.fzCol || x.userData.baseEm; if (bE) x.emissive.copy(bE); else x.emissive.setScalar(0); x.emissive.r += k * 0.9; x.emissive.g += k * 0.3; x.emissive.b += k * 0.22; } }));
      }
    });
    shake = Math.max(0, shake - dt * 1.6);
    zoom = Math.max(0, zoom - dt * 1.8);
    const t = performance.now() * 0.00016;
    cam.position.set(
      camBase.x + Math.sin(t) * 0.35 + (Math.random() - 0.5) * shake,
      camBase.y + (Math.random() - 0.5) * shake * 0.6,
      camBase.z - zoom + Math.cos(t) * 0.18);
    cam.lookAt(camAim);
    ren.render(sc, cam);
  })();

  function onResize() {
    const w = mount.clientWidth, h = Math.round(w * (w < 560 ? 0.92 : 0.70));
    ren.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', onResize);

  next();

  return {
    destroy() {
      dead = true; TW.clear();
      stones.forEach(st => { if (st.holder.parent) sc.remove(st.holder); });
      stoneGeo.dispose();
      removeEventListener('resize', onResize);
      ren.dispose(); mount.innerHTML = '';
    }
  };
}
