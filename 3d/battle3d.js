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
const POSE = { idle:'Idle', attack:'Attack', hit:'Idle_HitReact1', death:'Death', walk:'Walk' };

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
  /* 중경 — 진짜 입체로 세워야 카메라가 흔들릴 때 시차가 난다 */
  const M = TH.mid, geo = M.kind === 'bamboo' ? new THREE.CylinderGeometry(0.55, 0.75, 1, 6)
    : M.kind === 'spire' ? new THREE.ConeGeometry(0.6, 1, 5)
    : M.kind === 'pillar' ? new THREE.CylinderGeometry(0.45, 0.55, 1, 8)
    : new THREE.ConeGeometry(0.5, 1, 7);
  const midMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(M.c).multiplyScalar(0.75), roughness: 1, flatShading: true });
  const inst = new THREE.InstancedMesh(geo, midMat, M.n), dm = new THREE.Object3D();
  for (let i = 0; i < M.n; i++) {
    const x = (Math.random() - 0.5) * 26, z = -6 - Math.random() * 9;
    const h = M.h[0] + Math.random() * (M.h[1] - M.h[0]), w = M.w[0] + Math.random() * (M.w[1] - M.w[0]);
    dm.position.set(x, h * 0.5, z); dm.scale.set(w, h, w);
    dm.rotation.set((Math.random()-0.5)*0.1, Math.random()*3, (Math.random()-0.5)*0.1); dm.updateMatrix();
    inst.setMatrixAt(i, dm.matrix);
  }
  sc.add(inst);
  if (M.kind === 'conifer') {            /* 침엽수는 기둥이 있어야 나무로 읽힌다 */
    const ti = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 1, 5), midMat, M.n);
    const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
    for (let i = 0; i < M.n; i++) {
      inst.getMatrixAt(i, m4); m4.decompose(p, q, sv);
      dm.position.set(p.x, sv.y * 0.22, p.z); dm.scale.set(sv.x, sv.y * 0.45, sv.x); dm.rotation.set(0,0,0); dm.updateMatrix();
      ti.setMatrixAt(i, dm.matrix);
    }
    sc.add(ti);
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
  const bb = new THREE.Box3().setFromObject(g), hh = Math.max(0.001, bb.max.y - bb.min.y);
  g.scale.setScalar(Math.min(2.3 / hh, 0.6));
  g.position.set(-4.6, 0, -6.5); g.rotation.y = 0.42;
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
  /* o.onLoot(주운 수, 전체) — 화면 위 숫자를 세는 쪽에서 쓴다 */

  /* ── 모델 받기 ── */
  const want = [...new Set(team.map(t => MDL[t.el]))].concat('m_enemy');
  let got = 0;
  const packs = {};
  for (const n of want) {
    packs[n] = await load(base, n, dracoPath);
    if (onProgress) onProgress(++got / want.length);
  }

  /* ── 무대 ── */
  const W = mount.clientWidth, H = Math.round(W * 0.70);
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

  const cam = new THREE.PerspectiveCamera(41, W / H, 0.1, 80);
  const camBase = new THREE.Vector3(0.55, 1.78, 5.9);
  const camAim = new THREE.Vector3(0.55, 0.72, 0);
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
      o.bind(m.skeleton, m.bindMatrix); o.frustumCulled = false;
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
    const half = (sz.z * (0.92 / sz.y)) / 2;
    const u = { el, holder, wob, mx, clip, meshes, outlines, glow, alive: true, pose: null, one: null, flash: 0,
                half, home: holder.position.clone() };
    pose(u, 'idle');
    return u;
  }
  function pose(u, p, force) {
    if (u.one && !force) return;
    const to = u.clip[POSE[p]]; if (!to) return;
    const from = u.clip[POSE[u.pose]];
    if (u.pose === p) return;
    u.pose = p; u.one = null;
    to.reset(); to.setLoop(THREE.LoopRepeat, Infinity); to.timeScale = 1;
    to.setEffectiveWeight(1).play();
    if (from && from !== to) from.crossFadeTo(to, 0.18, false);
  }
  function once(u, p, dur, hold) {
    const a = u.clip[POSE[p]]; if (!a) return;
    const cur = u.clip[POSE[u.pose]];
    if (cur && cur !== a) cur.fadeOut(0.07);
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = !!hold;
    a.timeScale = dur ? a.getClip().duration / dur : 1;
    a.setEffectiveWeight(1).fadeIn(0.05).play();
    u.one = p;
    if (!hold) setTimeout(() => { if (u.one === p) { u.one = null; pose(u, 'idle', true); } }, dur * 1000);
  }

  /* 파티는 왼쪽에 반원으로, 사냥감은 오른쪽에. 둘 다 옆모습이라
     누가 누구에게 달려드는지 한눈에 읽힌다. 마주 보게 세우면 서로 가린다. */
  const n = team.length;
  const mates = team.map((t, i) => {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;          /* -0.5 ~ +0.5 */
    return build(t.el, MDL[t.el], -1.15 - Math.abs(k) * 0.55, k * 2.05, Math.PI / 2);
  });
  const boss = build(foe.el, 'm_enemy', 2.45, 0, -Math.PI / 2);
  boss.holder.scale.setScalar(1.55);
  boss.half *= 1.55;

  /* ── 화면 위 글자 (데미지 숫자) ── */
  const lay = document.createElement('div');
  lay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  mount.style.position = 'relative';
  mount.appendChild(lay);
  function pop(u, txt, kind) {
    const v = u.holder.position.clone(); v.y = 1.25;
    v.project(cam);
    const el = document.createElement('div');
    el.textContent = txt;
    el.style.cssText = 'position:absolute;font-weight:800;font-size:' +
      (kind === 'big' ? 22 : 17) + 'px;transform:translate(-50%,-50%);' +
      'color:' + (kind === 'big' ? '#ffd93d' : kind === 'bad' ? '#ff8f8f' : '#ffffff') +
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
    bursts.push({ ring: rg, t: 0, max: 0.45, grow: 5, flat: true });
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

  /* 맞은 쪽이 살짝 밀렸다가 돌아온다 */
  function knock(u, dir, amt) {
    const h = u.home;
    TW.add(0, amt, 0.1, 'out', v => u.holder.position.set(h.x + dir.x * v, 0, h.z + dir.z * v), () =>
      TW.add(amt, 0, 0.35, 'out', v => u.holder.position.set(h.x + dir.x * v, 0, h.z + dir.z * v)));
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
    const lerp = (a, b, t) => u.holder.position.set(a.x + (b.x - a.x) * t, 0, a.z + (b.z - a.z) * t);
    const land = (big) => {
      burst(at, dir, col, big); onLand();
      knock(target, dir, big ? 0.22 : 0.14);
    };
    const home = (from, dur) => TW.add(0, 1, dur, 'out', t => lerp(from, h, t), () => { u.wob.rotation.y = 0; u.wob.position.y = 0; });

    if (move === 'ram') {                 /* 박치기 — 뒤로 물러섰다가 머리부터 들이받는다 */
      once(u, 'attack', 0.9);
      TW.add(0, 1, 0.16, 'out', t => lerp(h, back, t), () =>
        TW.add(0, 1, 0.2, 'in', t => lerp(back, hit, t), () => {
          land(kind === 'big');
          setTimeout(() => { if (!dead) home(hit, 0.42); }, 140);      /* 붙은 채로 잠깐 버틴다 */
        }));
    } else if (move === 'leap') {         /* 도약 내려찍기 — 높이 뛰어올라 정수리로 떨어진다 */
      once(u, 'attack', 1.0);
      TW.add(0, 1, 0.42, 'in', t => {
        lerp(h, hit, t); u.wob.position.y = Math.sin(t * Math.PI) * 0.95;
      }, () => {
        u.wob.position.y = 0; land(true); shock(hit, col); shake = Math.max(shake, 0.2);
        setTimeout(() => { if (!dead) TW.add(0, 1, 0.4, 'out', t => { lerp(hit, h, t); u.wob.position.y = Math.sin(t * Math.PI) * 0.3; },
          () => { u.wob.position.y = 0; }); }, 150);
      });
    } else {                              /* 회전 돌진 — 한 바퀴 돌며 달려들어 몸통으로 부딪친다 */
      once(u, 'attack', 0.9);
      TW.add(0, 1, 0.34, 'in', t => {
        lerp(h, hit, t); u.wob.rotation.y = t * Math.PI * 2; u.wob.position.y = Math.sin(t * Math.PI) * 0.12;
      }, () => {
        u.wob.rotation.y = 0; u.wob.position.y = 0; land(kind === 'big');
        setTimeout(() => { if (!dead) home(hit, 0.38); }, 110);
      });
    }
    return move;
  }

  /* ── 용신석 ──
     사냥감이 쓰러진 자리에서 돌이 튀어나와 바닥에 흩어지고, 내 개가 앞으로
     걸어 나가 하나씩 빨아들인다. 돌을 개에게 걸어가서 밟게 하면 열 개를
     줍는 데 십몇 초가 걸린다 — 개는 한 번만 걸어 나가고, 돌이 개에게 온다. */
  const stones = [];
  const stoneGeo = new THREE.OctahedronGeometry(0.115, 0);

  function dropStones(el, howMany, mid) {
    const c = new THREE.Color(COL[el] || 0xffd93d);
    const shown = Math.min(12, howMany);
    for (let i = 0; i < shown; i++) {
      const m = new THREE.Mesh(stoneGeo, new THREE.MeshStandardMaterial({
        color: c, emissive: c, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.6
      }));
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
      const top = 1.15 + Math.random() * 0.5;
      const st = { holder, mesh: m, halo, taken: false };
      stones.push(st);
      /* 포물선 한 번 — 0→1 을 높이와 수평 이동에 같이 쓴다 */
      TW.add(0, 1, 0.55 + Math.random() * 0.18, '', v => {
        holder.position.x = mid.x + (tx - mid.x) * v;
        holder.position.z = mid.z + (tz - mid.z) * v;
        m.position.y = 0.16 + Math.sin(v * Math.PI) * top - v * 0.02;
        halo.material.opacity = 0.28 * v;
      });
    }
    return shown;
  }

  /* 돌 하나를 개에게 빨아들인다 */
  function suck(st, to, delay, onIn) {
    setTimeout(() => {
      if (dead || st.taken) return;
      st.taken = true;
      const from = st.holder.position.clone();
      const y0 = st.mesh.position.y;
      st.halo.visible = false;
      TW.add(0, 1, 0.34, 'in', v => {
        st.holder.position.lerpVectors(from, to, v);
        st.mesh.position.y = y0 + Math.sin(v * Math.PI) * 0.45;
        st.mesh.scale.setScalar(1 - v * 0.55);
        eachMat(st.mesh, x => { x.emissiveIntensity = 0.85 + v * 2.2; });
      }, () => {
        sc.remove(st.holder);
        st.mesh.geometry === stoneGeo || st.mesh.geometry.dispose();
        eachMat(st.mesh, x => x.dispose());
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
          setTimeout(() => {
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
    u.meshes.forEach(m => eachMat(m, x => { x.transparent = true; x.opacity = 1 - p * k; }));
    u.outlines.forEach(o => { o.visible = p < 0.15; });
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
      attack(u, boss, a.kind, () => {
        boss.hpNow = a.foeHp;
        pop(boss, '−' + a.dmg, a.kind);
        hitFx(boss, a.kind);
        if (boss.alive && a.foeHp > 0) once(boss, 'hit', 0.5);
        if (o.onFoeHp) o.onFoeHp(a.foeHp);
      });
      wait = 780;
    }
    else if (a.t === 'foehit') {
      const v = mates[a.to]; if (!v) return next();
      if (onCaption) onCaption(a.text);
      attack(boss, v, a.kind, () => {
        pop(v, '−' + a.dmg, a.kind === 'big' ? 'bad' : '');
        hitFx(v, a.kind);
        if (v.alive) once(v, 'hit', 0.5);
        if (o.onTeamHp) o.onTeamHp(a.hp);
      });
      wait = 820;
    }
    else if (a.t === 'down') {
      const v = mates[a.i]; if (!v) return next();
      if (onCaption) onCaption(a.text);
      v.alive = false; once(v, 'death', 0.95, true);
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
        boss.alive = false; once(boss, 'death', 1.1, true);
        TW.add(0, 1, 1.3, 'in', p => fade(boss, p, 0.95));
      }
      wait = 1500;
    }
    setTimeout(next, wait);
  }
  function finish() { if (onDone) onDone(); }

  /* ── 매 프레임 ── */
  const clock = new THREE.Clock();
  (function loop() {
    if (dead) return;
    requestAnimationFrame(loop);
    let dt = Math.min(0.05, clock.getDelta());
    if (stop > 0) { stop -= dt; dt *= 0.08; }           /* 타격 순간 시간을 눌러 준다 */
    TW.step(dt);
    stepBursts(dt);
    arena.step(dt, performance.now() / 1000);
    [...mates, boss].forEach(u => {
      u.mx.update(dt);
      if (u.flash > 0) {
        u.flash -= dt;
        const k = Math.max(0, u.flash) * 7;
        u.meshes.forEach(m => eachMat(m, x => { if (x.emissive) x.emissive.setScalar(k); }));
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
    const w = mount.clientWidth, h = Math.round(w * 0.70);
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
