/* Four Paws — 내 캐릭터 한 마리를 천천히 돌려 보여 준다.
 * 지도에 들어설 때와 프로필 자리에서 쓴다. 전투와 달리 대본이 없고,
 * 그냥 서 있다가 가끔 숨을 쉰다.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const COL = { 목: 0x4fb95f, 화: 0xe8483c, 토: 0xffd93d, 금: 0x8e9bb0, 수: 0x3f8fe0 };
const MDL = { 목: 'm_mok', 화: 'm_hwa', 토: 'm_to', 금: 'm_geum', 수: 'm_su' };
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/';

export async function showDog(o) {
  const { mount, base, el, dracoPath, height } = o;
  const name = MDL[el]; if (!name) return null;

  const d = new DRACOLoader(); d.setDecoderPath(dracoPath || DRACO);
  const L = new GLTFLoader().setDRACOLoader(d).setPath(base || '/3d/');
  const g = await new Promise((res, rej) => L.load(name + '.glb', res, undefined, rej));

  const W = mount.clientWidth || 320;
  const H = height || Math.round(W * 0.78);
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ren.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  ren.setSize(W, H);
  ren.outputColorSpace = THREE.SRGBColorSpace;
  mount.innerHTML = ''; mount.appendChild(ren.domElement);

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 40);
  cam.position.set(0, 1.05, 4.1); cam.lookAt(0, 0.62, 0);

  sc.add(new THREE.HemisphereLight(0xd6e4ff, 0x1a2130, 2.1));
  const key = new THREE.DirectionalLight(0xfff6e8, 2.0); key.position.set(2.5, 5, 3.5); sc.add(key);
  const rim = new THREE.PointLight(COL[el] || 0xffffff, 9, 6); rim.position.set(-1.6, 1.3, -1.8); sc.add(rim);

  /* 발밑에 오행 색 고리 하나 — 바닥이 없으면 공중에 뜬 것처럼 보인다 */
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.72, 48),
    new THREE.MeshBasicMaterial({ color: COL[el] || 0x888888, transparent: true,
                                  opacity: 0.32, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; sc.add(ring);

  const root = g.scene;
  root.traverse(m => {                       /* 재질은 이 화면 것으로 */
    if (m.isMesh) m.material = Array.isArray(m.material)
      ? m.material.map(x => x.clone()) : m.material.clone();
  });
  const box = new THREE.Box3().setFromObject(root);
  const sz = new THREE.Vector3(); box.getSize(sz);
  root.scale.setScalar(1.15 / sz.y);
  const b2 = new THREE.Box3().setFromObject(root);
  root.position.y -= b2.min.y;
  const spin = new THREE.Object3D(); spin.add(root); sc.add(spin);

  const mx = new THREE.AnimationMixer(root);
  const idle = g.animations.find(a => /idle$/i.test(a.name)) || g.animations[0];
  if (idle) mx.clipAction(idle).play();

  let dead = false;
  const clock = new THREE.Clock();
  (function loop() {
    if (dead) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    mx.update(dt);
    spin.rotation.y += dt * 0.32;            /* 아주 천천히 — 빠르면 구경거리가 된다 */
    ren.render(sc, cam);
  })();

  function onResize() {
    const w = mount.clientWidth || W, h = height || Math.round(w * 0.78);
    ren.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', onResize);

  return { destroy() { dead = true; removeEventListener('resize', onResize); ren.dispose(); mount.innerHTML = ''; } };
}
