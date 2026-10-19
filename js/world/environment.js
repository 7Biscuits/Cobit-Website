import { scene, onN } from '../core/scene.js';
import { wtex, makeWater, BX, flat } from '../core/materials.js';
import { grassCan, paveCan, asphCan, rockCan, gravelCan, macroCan } from '../utils/textures.js';
import { clamp, rr, rnd } from '../utils/math.js';
import { Z1, Z2, RL2 } from '../config.js';

export const grass = new THREE.MeshLambertMaterial({ color: 0xCFE9EE });
export const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1000), grass);
ground.rotation.x = -Math.PI / 2;
ground.position.set(60, -0.05, 0);
ground.receiveShadow = true;
scene.add(ground);

export const asph = new THREE.MeshLambertMaterial({
  color: 0x28313A,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1
});
asph.side = THREE.DoubleSide;

export const pave = new THREE.MeshLambertMaterial({ color: 0xF3FAFF });

wtex(grass, grassCan(), 1 / 13, 0, 0.92);
wtex(pave, paveCan(), 1 / 9, 0, 0.85);
wtex(asph, asphCan(), 1 / 7, 0, 0.9);

export const rockM = new THREE.MeshLambertMaterial({ color: 0xffffff });
export const gravM = new THREE.MeshLambertMaterial({ color: 0xffffff });
wtex(rockM, rockCan(), 1 / 5, 0, 0.8);
wtex(gravM, gravelCan(), 1 / 5, 0, 0.8);

export const macroM = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, depthWrite: false });
wtex(macroM, macroCan(), 1 / 230, 1, 1);
{
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1000), macroM);
  m.rotation.x = -Math.PI / 2;
  m.position.set(60, -0.02, 0);
  m.receiveShadow = true;
  m.renderOrder = -1;
  scene.add(m);
}

onN(n => {
  grass.color.setHex(n ? 0x2A4A58 : 0xFFFFFF);
  macroM.color.setHex(n ? 0x2A4A58 : 0xFFFFFF);
  asph.color.setHex(n ? 0x3A4650 : 0xFFFFFF);
  pave.color.setHex(n ? 0x4A5B68 : 0xFFFFFF);
  rockM.color.setHex(n ? 0x3A4650 : 0xFFFFFF);
  gravM.color.setHex(n ? 0x3A4650 : 0xFFFFFF);
});

/* River and Banks */
export const zNb = x => -146 + 2 * Math.sin(x * 0.031 + 1) + Math.sin(x * 0.083);
export const zFb = x => -190 + 6 * Math.sin(x * 0.022 + 2) + 3 * Math.sin(x * 0.057 + 0.5) + 1.5 * Math.sin(x * 0.13);
export const zc = x => (zNb(x) + zFb(x)) / 2;

export const water = makeWater();
{
  const sh = new THREE.Shape();
  sh.moveTo(-600, -zNb(-600));
  for (let x = -600; x <= 760; x += 8) sh.lineTo(x, -zNb(x));
  for (let x = 760; x >= -600; x -= 8) sh.lineTo(x, -zFb(x));
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, water);
  m.position.y = 0.04;
  m.receiveShadow = true;
  scene.add(m);
}

/* Rocky & Gravel River Banks */
{
  const sd = [
    [zNb, 1],
    [zFb, -1]
  ];
  const mkRib = (zf, s, w0, w1, m, y) => {
    const pos = [];
    const nor = [];
    const idx = [];
    let k = 0;
    for (let x = -600; x <= 760; x += 4) {
      const z = zf(x);
      pos.push(x, y, z - s * w0, x, y, z + s * w1);
      nor.push(0, 1, 0, 0, 1, 0);
      if (k > 0) {
        const a = (k - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      k++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    const me = new THREE.Mesh(g, m);
    me.receiveShadow = true;
    scene.add(me);
  };
  sd.forEach(([f, s]) => {
    mkRib(f, s, 0.4, 5.5, gravM, 0.06);
    mkRib(f, s, 0.4, 1.7, rockM, 0.075);
  });

  const ig = new THREE.IcosahedronGeometry(1, 1);
  const pa = ig.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const j = 1 + 0.28 * Math.sin(pa.getX(i) * 5.1 + pa.getZ(i) * 3.7) * Math.cos(pa.getY(i) * 4.3);
    pa.setXYZ(i, pa.getX(i) * j, pa.getY(i) * j, pa.getZ(i) * j);
  }
  ig.computeVertexNormals();

  const N = 420;
  const im = new THREE.InstancedMesh(ig, rockM, N);
  const mt = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eu = new THREE.Euler();
  const sc = new THREE.Vector3();
  const ps = new THREE.Vector3();

  for (let i = 0; i < N; i++) {
    const [f, s] = sd[i & 1];
    let x = rr(-420, 640);
    if (Math.abs(x) < 10 || (x > -150 && x < -60 && s > 0)) x += 90;
    const sz = rr(0.5, 1.7);
    ps.set(x, 0.12 * sz, f(x) + s * rr(0.2, 1.9));
    eu.set(rr(0, 3), rr(0, 6), rr(0, 3));
    q.setFromEuler(eu);
    sc.set(sz * rr(1, 1.6), sz * rr(0.5, 0.9), sz * rr(1, 1.5));
    mt.compose(ps, q, sc);
    im.setMatrixAt(i, mt);
  }
  im.castShadow = im.receiveShadow = true;
  scene.add(im);
}

/* High Bridge */
const sm2 = t => t * t * (3 - 2 * t);
export const bridgeY = z =>
  z > Z1 ? 9 * (1 - sm2(clamp((z - Z1) / RL2, 0, 1))) : z < Z2 ? 9 * (1 - sm2(clamp((Z2 - z) / RL2, 0, 1))) : 9;

export function sweep(xc, w, t, yo, mat) {
  const pos = [];
  const zs = [];
  for (let z = Z1 + RL2; z >= Z2 - RL2 - 0.01; z -= 2) zs.push(z);
  const stFn = z => {
    const y = bridgeY(z) + yo;
    return [
      [xc - w / 2, y, z],
      [xc + w / 2, y, z],
      [xc + w / 2, y - t, z],
      [xc - w / 2, y - t, z]
    ];
  };
  const q = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < zs.length - 1; i++) {
    const A = stFn(zs[i]);
    const B = stFn(zs[i + 1]);
    for (let k = 0; k < 4; k++) q(A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

export const deckM = new THREE.MeshLambertMaterial({ color: 0xC9D6DF, side: 2 });
export const railM = new THREE.MeshLambertMaterial({ color: 0x7C93A0, side: 2 });
export const yelM = new THREE.MeshBasicMaterial({ color: 0xE6B84D, side: 2 });

onN(n => {
  deckM.color.setHex(n ? 0x3D4A55 : 0xC9D6DF);
  railM.color.setHex(n ? 0x2A3640 : 0x7C93A0);
});

sweep(0, 9.4, 0.9, 0, deckM);
sweep(0, 7, 0.1, 0.12, asph);
sweep(0, 0.3, 0.05, 0.17, yelM);
sweep(-4.5, 0.4, 1.1, 1.1, railM);
sweep(4.5, 0.4, 1.1, 1.1, railM);

for (let z = Z1 + RL2; z >= Z2 - RL2; z -= 8) {
  const h = bridgeY(z) - 0.9;
  if (h > 0.5 && !(z < -143 && z > -186)) BX(scene, 5, h, 1.2, 0xAEBBC4, 0, 0, z);
}
[-141.5, -186.5].forEach(z => BX(scene, 8, 8.1, 2.4, 0xAEBBC4, 0, 0, z));

/* Weather (Clouds & Rain) */
export const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
export const cg = new THREE.Group();
cg.visible = false;
scene.add(cg);

for (let i = 0; i < 22; i++) {
  const s = rnd(20, 40);
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), cloudM);
  m.scale.set(s, s * 0.28, s * 0.6);
  m.position.set(rnd(-200, 300), rnd(70, 95), rnd(-250, 250));
  cg.add(m);
}

export const RN = 800;
const rp = new Float32Array(RN * 3);
for (let i = 0; i < RN; i++) {
  rp[i * 3] = rnd(-70, 70);
  rp[i * 3 + 1] = rnd(0, 60);
  rp[i * 3 + 2] = rnd(-70, 70);
}
export const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
export const rain = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({ color: 0xAFC9DE, size: 0.18, transparent: true, opacity: 0.75 })
);
rain.visible = false;
rain.frustumCulled = false;
scene.add(rain);

export function initEnvironment() {
  // Ground, water, river, and clouds initialized
}

