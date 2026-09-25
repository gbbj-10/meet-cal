/* Four Paws — 궁합소: 두 사람의 오행 댕댕이가 같이 논다.
 *
 * 동작은 실제 강아지 놀이에서 가져왔다(2026-09-24 이미지·글 검색으로 학습, 31_3D 지침 참고).
 *   1. 마주 보고 인사 — 꼬리 흔들기, 고개 갸웃
 *   2. 플레이 바우 — 앞다리를 쭉 뻗고 가슴을 낮추고 엉덩이는 든다("놀자"는 신호). 한 마리가 하면 상대도 받아 준다
 *   3. 쫓기 놀이 — 빙글빙글 돌며 쫓다가 **역할을 바꾼다**(쫓던 쪽이 쫓긴다). 통통 튀는 걸음
 *   4. 코 맞대기 — 가까이 와서 코를 톡, 고개를 서로 반대로 갸웃. 하트가 오른다
 *   5. 나란히 기대기 — 어깨를 맞대고 앉은 듯 서서 같이 꼬리를 흔든다
 * 한 바퀴 16초, 계속 반복한다. 클립(Idle·Walk·Gallop) 위에 뼈 회전을 덧씌운다.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const COL = { 목: 0x4fb95f, 화: 0xe8483c, 토: 0xffd93d, 금: 0x8e9bb0, 수: 0x3f8fe0 };
const MDL = { 목: 'm_mok', 화: 'm_hwa', 토: 'm_to', 금: 'm_geum', 수: 'm_su' };
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/';
const T = 16;                                     /* 한 바퀴 */
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bell = (a, b, x) => (x <= a || x >= b) ? 0 : Math.sin(Math.PI * (x - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;

function heartTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#ff7eb0';
  g.beginPath(); g.moveTo(32, 56);
  g.bezierCurveTo(4, 36, 6, 10, 22, 10); g.bezierCurveTo(28, 10, 32, 15, 32, 20);
  g.bezierCurveTo(32, 15, 36, 10, 42, 10); g.bezierCurveTo(58, 10, 60, 36, 32, 56); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function showPair(o) {
  const { mount, base, elA, elB, height } = o;
  const d = new DRACOLoader(); d.setDecoderPath(o.dracoPath || DRACO);
  const L = new GLTFLoader().setDRACOLoader(d).setPath(base || '/3d/');
  const load = el => new Promise((res, rej) => L.load((MDL[el] || MDL.목) + '.glb', res, undefined, rej));
  const [gA, gB] = await Promise.all([load(elA), load(elB)]);

  const W = mount.clientWidth || 360, H = height || 260;
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ren.setPixelRatio(Math.min(2, devicePixelRatio || 1)); ren.setSize(W, H);
  ren.outputColorSpace = THREE.SRGBColorSpace;
  mount.innerHTML = ''; mount.appendChild(ren.domElement);

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, W / H, 0.1, 40);
  cam.position.set(0, 1.25, 5.0); cam.lookAt(0, 0.38, 0);
  sc.add(new THREE.HemisphereLight(0xffeef6, 0x1a2130, 2.0));
  const key = new THREE.DirectionalLight(0xfff3ea, 2.0); key.position.set(2, 5, 4); sc.add(key);
  const rimA = new THREE.PointLight(COL[elA] || 0xffffff, 7, 6); rimA.position.set(-2, 1.3, -1.5); sc.add(rimA);
  const rimB = new THREE.PointLight(COL[elB] || 0xffffff, 7, 6); rimB.position.set(2, 1.3, -1.5); sc.add(rimB);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48),
    new THREE.MeshBasicMaterial({ color: 0xff7eb0, transparent: true, opacity: 0.10 }));
  floor.rotation.x = -Math.PI / 2; sc.add(floor);

  /* 개 한 마리: holder(위치·방향) → pitch(몸 기울기, 뒷다리 쪽을 축으로) → 모델 */
  function dog(g, el) {
    const root = g.scene;
    root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.frustumCulled = false; } });
    const box = new THREE.Box3().setFromObject(root), sz = new THREE.Vector3(); box.getSize(sz);
    root.scale.setScalar(0.92 / sz.y);
    const b2 = new THREE.Box3().setFromObject(root); root.position.y -= b2.min.y;
    const len = Math.max(b2.max.z - b2.min.z, 0.6);
    const holder = new THREE.Object3D(), pitch = new THREE.Object3D();
    pitch.position.z = -len * 0.38; root.position.z += len * 0.38;      /* 축을 엉덩이 쪽으로 */
    pitch.add(root); holder.add(pitch); sc.add(holder);
    const mx = new THREE.AnimationMixer(root), clip = {};
    g.animations.forEach(a => { clip[a.name] = mx.clipAction(a); });
    const B = {}; root.traverse(n => { if (n.isBone) B[n.name] = n; });
    const rest = {}, restP = {}; for (const n in B) { rest[n] = B[n].quaternion.clone(); restP[n] = B[n].position.clone(); }
    /* 앞발(FFL/FFR)은 다리 뼈가 아니라 IK 뼈(IKFrontLeg*, 몸통 루트 직속)에 붙어 있다.
       다리만 돌리면 발은 제자리에 남아 다리가 늘어나고 반대로 꺾여 보인다 → 아래다리 끝 위치를 기억해 두고 IK 뼈를 거기로 옮긴다 */
    holder.updateMatrixWorld(true);
    const paw = {};
    for (const s of ['L', 'R']) {
      const lo = B['FrontLowerLeg' + s], ik = B['IKFrontLeg' + s];
      if (lo && ik) { const w = new THREE.Vector3(); ik.getWorldPosition(w); paw[s] = { lo, ik, local: lo.worldToLocal(w) }; }
    }
    const u = { holder, pitch, mx, clip, B, rest, restP, paw, cur: null, yaw: 0, el };
    play(u, 'Idle'); return u;
  }
  function play(u, name, ts = 1) {
    const a = u.clip[name]; if (!a) return;
    a.timeScale = ts;
    if (u.cur === name) return;
    const from = u.cur && u.clip[u.cur];
    a.reset().setEffectiveWeight(1).play();
    if (from) from.crossFadeTo(a, 0.25, false);
    u.cur = name;
  }
  const A = dog(gA, elA), Bd = dog(gB, elB);

  /* 하트 */
  const htex = heartTex(), hearts = [];
  function heart(x, y, z) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: htex, transparent: true, depthWrite: false }));
    s.position.set(x, y, z); s.scale.setScalar(0.16); s.userData.t = 0; sc.add(s); hearts.push(s);
  }

  const _E = new THREE.Euler();
  function R(u, n, dx, dy, dz) {
    const b = u.B[n]; if (!b) return;
    _E.setFromQuaternion(b.quaternion);
    _E.x += dx || 0; _E.y += dy || 0; _E.z += dz || 0; b.quaternion.setFromEuler(_E);
  }
  function faceTo(u, yaw, k) {                 /* 부드럽게 돌기 */
    let dYaw = yaw - u.yaw; while (dYaw > Math.PI) dYaw -= 2 * Math.PI; while (dYaw < -Math.PI) dYaw += 2 * Math.PI;
    u.yaw += dYaw * Math.min(1, k); u.holder.rotation.y = u.yaw;
  }
  /* 모델 앞쪽이 +z 라고 두고, 방향 벡터 → yaw */
  const yawOf = (dx, dz) => Math.atan2(dx, dz);

  /* 한 마리의 자세를 한 프레임 계산 — 상대(o)와 역할(s=±1: A 는 왼쪽 -1, B 는 오른쪽 +1) */
  function pose(u, other, s, t, dt, wall) {
    let x, z, yaw = null, bow = 0, wag = 0.35, tilt = 0, lean = 0, nose = 0, hop = 0, clip = 'Idle', ts = 1;
    const far = 0.80, near = 0.47;
    if (t < 2.0) {                                   /* 1. 마주 보고 인사 */
      x = s * far; z = 0; yaw = yawOf(-s, 0); wag = 0.6; tilt = 0.18 * Math.sin(wall * 1.3 + s);
    } else if (t < 4.8) {                            /* 2. 플레이 바우 — A 먼저, B 가 받아 준다 */
      x = s * far; z = 0; yaw = yawOf(-s, 0);
      bow = s < 0 ? bell(2.0, 3.5, t) : bell(3.3, 4.8, t);
      wag = 0.5 + bow * 0.9;
      hop = (s < 0 ? bell(3.35, 3.7, t) : bell(4.65, 4.95, t)) * 0.08;   /* 바우 끝에 통 튄다 */
    } else if (t < 9.2) {                            /* 3. 쫓기 놀이 — 7.0 에 역할을 바꾼다 */
      const r = 0.72, sw = 7.0;
      const dir = t < sw ? 1 : -1;
      const tt = t < sw ? t - 4.8 : sw - 4.8 - (t - sw);                 /* 되감으며 반대로 */
      const lead = s > 0 ? 0 : -1.05;                                   /* B 가 도망, A 가 쫓음 → 바뀌면 거꾸로 */
      const th0 = s > 0 ? 0 : Math.PI;
      const ramp = ss(4.8, 5.4, t) * (1 - ss(8.7, 9.2, t));
      const th = th0 + (tt * 1.55 + lead * 0) * ramp;
      const ex = Math.cos(th) * r, ez = Math.sin(th) * r * 0.55;
      x = lerp(s * far, ex, ramp); z = lerp(0, ez, ramp);
      const vx = -Math.sin(th) * dir, vz = Math.cos(th) * 0.55 * dir;
      yaw = ramp > 0.2 ? yawOf(vx, vz) : yawOf(-s, 0);
      clip = ramp > 0.3 ? 'Gallop' : 'Walk'; ts = 1.0;
      hop = Math.abs(Math.sin(wall * 7 + s)) * 0.05 * ramp; wag = 0.8;
      if (Math.abs(t - sw) < 0.25) { clip = 'Idle'; hop = 0; }          /* 잠깐 멈췄다가 방향 전환 */
    } else if (t < 10.6) {                           /* 4-a. 가까이 다가온다 */
      const k = ss(9.2, 10.4, t);
      x = lerp(u.holder.position.x, s * near, Math.min(1, dt * 4)); z = lerp(u.holder.position.z, 0, Math.min(1, dt * 4));
      yaw = yawOf(-s, 0); clip = k < 0.95 ? 'Walk' : 'Idle'; wag = 0.7;
    } else if (t < 13.0) {                           /* 4-b. 코 맞대기 */
      x = s * near; z = 0; yaw = yawOf(-s, 0);
      nose = ss(10.6, 11.2, t) * (1 - ss(12.6, 13.0, t)); tilt = nose * 0.32 * s; wag = 0.9;
    } else if (t < 15.2) {                           /* 5. 나란히 기대기 — 카메라 쪽을 본다 */
      x = s * 0.30; z = 0.05; yaw = yawOf(0, 1) + s * 0.18; lean = -s * 0.09 * ss(13.2, 13.8, t) * (1 - ss(14.8, 15.2, t));
      wag = 1.0; tilt = -s * 0.12 * ss(13.4, 14, t);
    } else {                                         /* 다시 제자리로 */
      x = lerp(u.holder.position.x, s * far, Math.min(1, dt * 3)); z = lerp(u.holder.position.z, 0, Math.min(1, dt * 3));
      yaw = yawOf(s, 0); clip = 'Walk';
      if (t > 15.75) yaw = yawOf(-s, 0);
    }
    return { x, z, yaw, bow, wag, tilt, lean, nose, hop, clip, ts };
  }

  function apply(u, p, dt, wall) {
    for (const n in u.B) { u.B[n].quaternion.copy(u.rest[n]); u.B[n].position.copy(u.restP[n]); }
    play(u, p.clip, p.ts); u.mx.update(dt);
    u.holder.position.set(p.x, p.hop, p.z);
    if (p.yaw != null) faceTo(u, p.yaw, dt * 6);
    u.pitch.rotation.x = p.bow * 0.40;          /* 앞쪽이 내려간다(+x) */ u.pitch.rotation.z = p.lean;
    /* 플레이 바우: 개의 앞다리처럼 — 위팔은 뒤아래로(팔꿈치가 뒤를 향해 바닥에 닿고), 아래팔은 앞으로 바닥에 납작하게.
       (2026-09-25 수정: 전에는 팔꿈치가 앞을 향해 반대로 꺾였다. 값은 발·팔꿈치 위치를 재어 격자 탐색으로 고름 —
        팔꿈치 높이 ≈0.04, 발 높이 ≈0.05, 아래팔이 앞으로 ≈0.2) */
    if (p.bow) {
      R(u, 'FrontShoulderL', 0.2 * p.bow);   R(u, 'FrontShoulderR', 0.2 * p.bow);
      R(u, 'FrontUpperLegL', -0.4 * p.bow);  R(u, 'FrontUpperLegR', -0.4 * p.bow);
      R(u, 'FrontLowerLegL', -1.5 * p.bow);  R(u, 'FrontLowerLegR', -1.5 * p.bow);
      R(u, 'Neck1', 0.20 * p.bow); R(u, 'Head', 0.25 * p.bow);
      /* 앞발 IK 뼈를 아래다리 끝으로 — 발이 다리를 따라온다 */
      u.holder.updateMatrixWorld(true);
      for (const s in u.paw) {
        const q = u.paw[s], w = q.lo.localToWorld(q.local.clone());
        q.ik.parent.worldToLocal(w); q.ik.position.lerp(w, Math.min(1, p.bow * 4));
      }
    }
    /* 코 맞대기: 목을 내밀고 고개를 낮춘다 */
    if (p.nose) { R(u, 'Neck1', -0.18 * p.nose); R(u, 'Neck2', -0.12 * p.nose); }
    if (p.tilt) R(u, 'Head', 0, 0, p.tilt);
    /* 꼬리 — 빠르게 좌우로 */
    const w = Math.sin(wall * (9 + p.wag * 5)) * 0.35 * p.wag;
    R(u, 'Tail1', 0.25 * p.wag, w); R(u, 'Tail2', 0.10, w * 0.8); R(u, 'Tail3', 0, w * 0.6);
  }

  let dead = false, lastHeart = -1;
  const clock = new THREE.Clock(); let wall = 0;
  (function loop() {
    if (dead) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta()); wall += dt;
    const t = o.fixT != null ? o.fixT : (wall + (o.startAt || 0)) % T;   /* fixT: 시험용 정지 화면 */
    apply(A, pose(A, Bd, -1, t, dt, wall), dt, wall);
    apply(Bd, pose(Bd, A, 1, t, dt, wall), dt, wall);
    /* 코를 맞댈 때와 기댈 때 하트 */
    const slot = Math.floor(t * 1.6);
    if (((t > 11.0 && t < 12.6) || (t > 13.6 && t < 14.9)) && slot !== lastHeart) {
      lastHeart = slot; heart((Math.random() - 0.5) * 0.25, 0.85, 0.1);
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i]; h.userData.t += dt;
      h.position.y += dt * 0.35; h.position.x += Math.sin(h.userData.t * 5) * dt * 0.08;
      h.material.opacity = 1 - h.userData.t / 1.8;
      if (h.userData.t > 1.8) { sc.remove(h); h.material.dispose(); hearts.splice(i, 1); }
    }
    ren.render(sc, cam);
  })();

  function onResize() {
    const w = mount.clientWidth || W;
    ren.setSize(w, H); cam.aspect = w / H; cam.updateProjectionMatrix();
  }
  addEventListener('resize', onResize);
  return { destroy() { dead = true; removeEventListener('resize', onResize); ren.dispose(); mount.innerHTML = ''; } };
}
