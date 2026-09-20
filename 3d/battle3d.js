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
  sc.background = new THREE.Color(0x0b0f17).lerp(gc, 0.06);
  /* 안개를 가깝게 당겨 바닥 가장자리를 배경으로 녹인다. 안 그러면
     큰 원판 하나가 통째로 밝게 떠서 개들이 배경에 묻힌다. */
  sc.fog = new THREE.Fog(sc.background, 4.5, 12);

  const cam = new THREE.PerspectiveCamera(41, W / H, 0.1, 60);
  const camBase = new THREE.Vector3(0.55, 1.78, 5.9);
  const camAim = new THREE.Vector3(0.55, 0.72, 0);
  cam.position.copy(camBase); cam.lookAt(camAim);

  sc.add(new THREE.HemisphereLight(0xbcd2f0, 0x161c28, 1.5));
  const key = new THREE.DirectionalLight(0xfff3e0, 1.35); key.position.set(3.5, 6, 3); sc.add(key);
  const rim = new THREE.PointLight(COL[ground.el], 5, 11); rim.position.set(0, 1.5, -4.2); sc.add(rim);

  /* 바닥 — 사냥터 오행 색을 아주 옅게 깐다 */
  const gmat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0d121b).lerp(gc, 0.04), roughness: 1, metalness: 0
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(9, 48), gmat);
  disc.rotation.x = -Math.PI / 2; sc.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.52, 64),
    new THREE.MeshBasicMaterial({ color: gc, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; sc.add(ring);

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

    /* 발밑 그림자 — 바닥에 붙어 있어야 공중에 뜬 것처럼 안 보인다 */
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; holder.add(sh);

    const u = { el, holder, wob, mx, clip, meshes, alive: true, pose: null, one: null, flash: 0 };
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
  /* 달려드는 거리는 **상대까지의 실제 거리**에서 정한다. 고정값(0.7)을 쓰던 동안에는
     서로 3m 쯤 떨어진 채 허공을 때렸다. 코앞(CONTACT)까지 파고들었다가 돌아온다. */
  const CONTACT = 1.15;
  function lunge(u, target, kind, onLand) {
    const away = new THREE.Vector3().subVectors(target.holder.position, u.holder.position).setY(0);
    const dist = away.length();
    const dir = away.normalize();
    const back = -0.18;
    const push = Math.max(0.35, dist - CONTACT) * (kind === 'big' ? 1.04 : 0.96);
    once(u, 'attack', 0.78 + Math.min(0.5, push * 0.14));
    TW.add(0, back, 0.16, 'out', v => u.wob.position.set(dir.x * v, 0, dir.z * v), () => {
      const run = Math.min(0.34, 0.1 + push * 0.075);
      TW.add(back, push, run, 'in', v => {
        u.wob.position.set(dir.x * v, 0, dir.z * v);
        const p = (v - back) / (push - back);
        u.wob.position.y = Math.sin(Math.max(0, p) * Math.PI) * 0.3;
      }, () => {
        onLand();
        TW.add(push, 0, run + 0.14, 'out', v => u.wob.position.set(dir.x * v, 0, dir.z * v));
      });
    });
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
      lunge(u, boss, a.kind, () => {
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
      lunge(boss, v, a.kind, () => {
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
      TW.add(0, 1, 1.2, 'in', p => v.meshes.forEach(m => eachMat(m, x => {
        x.transparent = true; x.opacity = 1 - p * 0.92;
      })));
      wait = 900;
    }
    else if (a.t === 'end') {
      if (onCaption) onCaption(a.text);
      if (a.win) {
        boss.alive = false; once(boss, 'death', 1.1, true);
        TW.add(0, 1, 1.3, 'in', p => boss.meshes.forEach(m => eachMat(m, x => {
          x.transparent = true; x.opacity = 1 - p * 0.95;
        })));
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
      removeEventListener('resize', onResize);
      ren.dispose(); mount.innerHTML = '';
    }
  };
}
