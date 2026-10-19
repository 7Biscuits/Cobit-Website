import { scene, onN } from '../core/scene.js';
import { M, BX, CY, add, flat, glow, warmG, redG, grnG, whtG, poolM, poolG, bulbG, once, ltex } from '../core/materials.js';
import { Dtex, mkc, rockCan, roofCan } from '../utils/textures.js';
import { clamp, lerp, rr, rnd, R, Pp, cat, offs } from '../utils/math.js';
import { asph, pave, macroM, grass } from './environment.js';
import { CITY } from './city.js';
import { SUPER } from '../entities/vehicles.js';

export var CX = 0;
export var CZ = 0;
export var TH = 0;
export var HH = 0;
export var MPAD = null;
export var Gr = null;


export function initEstate() {
  CITY.updateMatrixWorld(true);
  const FSg = CITY.children.find(o => o.userData && o.userData.bn === 'fireDept');
  let c = new THREE.Vector3(-150, 0, 0);
  if (FSg) new THREE.Box3().setFromObject(FSg).getCenter(c);

  let dx = c.x,
    dz = c.z,
    dl = Math.hypot(dx, dz);
  if (dl < 20) {
    dx = -1;
    dz = 0;
    dl = 1;
  }
  dx /= dl;
  dz /= dl;

  let mx = 0,
    RP = [c.x, c.z];
  CX = clamp(c.x + dx * (mx + 95), -520, 700);
  CZ = clamp(c.z + dz * (mx + 95), -470, 440);
  TH = Math.atan2(-dx, -dz);

  Gr = new THREE.Group();
  Gr.position.set(CX, 0, CZ);
  Gr.rotation.y = TH;
  scene.add(Gr);

  const hs2 = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const vn = (x, z) => {
    const i = Math.floor(x),
      j = Math.floor(z),
      fx = x - i,
      fz = z - j,
      u = fx * fx * (3 - 2 * fx),
      v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hs2(i, j), hs2(i + 1, j), u), lerp(hs2(i, j + 1), hs2(i + 1, j + 1), u), v);
  };
  const fb = (x, z) => {
    let a = 0.5,
      s = 0,
      f = 1;
    for (let k = 0; k < 4; k++) {
      s += a * vn(x * f, z * f);
      f *= 2.1;
      a *= 0.5;
    }
    return s;
  };
  const sm = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const LUMPS = [
    [-95, -30, 55, 12],
    [100, -50, 60, 14],
    [-30, -85, 50, 10],
    [60, 38, 28, 6],
    [-70, 40, 26, 5],
    [0, -90, 60, 9]
  ];

  const hf = (x, z) => {
    const eM = sm(72, 46, Math.hypot(x, z));
    let h = 16 * eM;
    LUMPS.forEach(l => {
      h = Math.max(h, l[3] * sm(l[2], l[2] * 0.25, Math.hypot(x - l[0], z - l[1])));
    });
    h +=
      (fb(x * 0.045, z * 0.045) - 0.5) * 9 * (1 - eM) * clamp(h / 5, 0, 1) +
      (fb(x * 0.18, z * 0.18) - 0.5) * 1.6 * (1 - eM) * clamp(h / 3, 0, 1);
    return Math.max(0, h * sm(0, 32, Math.min(130 - Math.abs(x), 85 - z, z + 110)));
  };

  HH = hf(0, 0);

  // Mesh terrain
  const cl = new THREE.Color();
  const G = new THREE.PlaneGeometry(260, 195, 130, 98);
  G.rotateX(-Math.PI / 2);
  const P = G.attributes.position,
    C = new Float32Array(P.count * 3),
    lo = new THREE.Color(0x5E8444),
    hi = new THREE.Color(0x9AA062),
    rk = new THREE.Color(0x8E8B83);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i),
      z = P.getZ(i) - 12.5,
      h = hf(x, z);
    P.setXYZ(i, x, h, z);
    const s = Math.hypot(hf(x + 1.5, z) - h, hf(x, z + 1.5) - h) / 1.5,
      n = fb(x * 0.3, z * 0.3);
    cl.copy(lo)
      .lerp(hi, clamp(h / 16, 0, 1) * 0.7 + (n - 0.5) * 0.5)
      .lerp(rk, clamp((s - 0.45) / 0.5, 0, 1) * 0.85);
    C.set([cl.r, cl.g, cl.b], i * 3);
  }
  G.setAttribute('color', new THREE.BufferAttribute(C, 3));
  G.computeVertexNormals();
  const mTerrain = new THREE.Mesh(G, grass);
  mTerrain.receiveShadow = true;
  Gr.add(mTerrain);

  const m2 = new THREE.Mesh(G, macroM);
  m2.position.y = 0.04;
  m2.receiveShadow = true;
  Gr.add(m2);

  // Driveway path
  const px = 12, pz = 70;
  const PS = new THREE.CatmullRomCurve3(
    [[9, 6.4], [9, 12]]
      .concat(
        [0.12, 0.3, 0.5, 0.7, 0.88, 1].map(t => [
          9 + (px - 9) * (3 * t * t - 2 * t * t * t) + 8 * Math.pow(Math.sin(Math.PI * t), 2),
          12 + (pz - 12) * t
        ])
      )
      .map(q => new THREE.Vector3(q[0], 0, q[1])),
    false,
    'centripetal'
  ).getSpacedPoints(240);

  // Mansion main group
  const g = new THREE.Group();
  g.position.set(0, HH, 0);
  Gr.add(g);

  const CT = (S, fn, W) => {
    const c = document.createElement('canvas');
    c.width = W || S;
    c.height = S;
    fn(c.getContext('2d'), W || S, S);
    return c;
  };
  const TXT = (c, rep, rx, ry) => {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (rep) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx || 1, ry || 1);
    }
    return t;
  };
  const fy = (x, z) => hf(x, z) - HH;

  const limeCan = () => {
    const S = 256, [c, x] = mkc(S, S);
    x.fillStyle = '#d9c096';
    x.fillRect(0, 0, S, S);
    const tn = ['#e8d4aa', '#d2b88b', '#c8aa7b', '#dfc79b', '#bd9c6e', '#ead9b6', '#d6ba8e'];
    for (let r = 0; r < 6; r++) {
      const y = r * 43,
        o = (r % 2) * 64;
      for (let k = -1; k < 3; k++) {
        const kk = ((k % 2) + 2) % 2,
          w = 128;
        x.fillStyle = tn[(r * 3 + kk * 5 + ((r * kk) & 3) + 7) % 7];
        x.fillRect(o + k * w + 2, y + 2, w - 4, 39);
      }
    }
    return c;
  };

  const tm = (can, sc, col) => {
    const m = new THREE.MeshLambertMaterial({ color: col || 0xFFFFFF });
    ltex(m, can, sc, 1);
    return m;
  };

  const CR = tm(limeCan(), 1 / 5, 0xEFE1C8),
    ST2 = tm(rockCan(), 1 / 5, 0xD9BD92),
    SL = M(0x8E857A),
    DK = M(0x6B655A),
    GRN = M(0x5F8446),
    BRZ = new THREE.MeshPhongMaterial({ color: 0x33281F, specular: 0x8A7358, shininess: 70 }),
    BRASS = new THREE.MeshPhongMaterial({ color: 0xC9A24A, specular: 0xFFE9A0, shininess: 120 });

  const gt = Dtex(256, 128, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3d5f78');
    gr.addColorStop(0.6, '#2b4256');
    gr.addColorStop(1, '#4a5a4a');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,214,150,.22)';
    c.fillRect(0, h * 0.45, w, h * 0.5);
  });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
  gt.repeat.set(6, 1);
  const GLS = new THREE.MeshPhongMaterial({ map: gt, color: 0xFFFFFF, specular: 0xCFE6F5, shininess: 150, emissive: 0x14100a });
  onN(n => GLS.emissive.setHex(n ? 0x35290F : 0x14100a));

  const glz = (x0, x1, y, h, z, s) => {
    for (let x = x0; x <= x1 + 0.1; x += s || 4.8) BX(g, 0.55, h, 0.5, BRZ, x, y, z);
    BX(g, x1 - x0, h - 0.5, 0.15, GLS, (x0 + x1) / 2, y + 0.25, z - 0.05);
  };
  const bal = (x0, x1, y, z) => {
    const L = x1 - x0,
      cx = (x0 + x1) / 2;
    BX(g, L, 0.12, 0.2, BRZ, cx, y + 0.95, z);
    BX(g, L, 0.22, 0.24, CR, cx, y, z);
    for (let x = x0; x <= x1; x += 1.4) CY(g, 0.05, 0.05, 0.8, BRZ, x, y + 0.15, z, 6);
  };
  const slab = (w, d, y, x, z, h) => {
    const t = h || 0.5;
    return BX(g, w, t, d, [CR, CR, SL, CR, CR, CR], x, y, z);
  };

  // Base + Storeys
  BX(g, 36, 2.2, 15.5, ST2, 0, 0, -7.5);
  BX(g, 34, 4.6, 14, CR, 0, 2.2, -8);
  glz(-15, 15, 2.4, 4.2, -1);
  slab(36, 15, 6.8, 0, -8);
  BX(g, 30, 4.2, 12, CR, -1, 7.3, -9);
  glz(-13, 13, 7.5, 3.8, -3, 4.3);
  slab(32, 13, 11.5, -1, -9);
  slab(31, 2.6, 7, -1, -2, 0.4);
  bal(-16, 14, 7.4, -0.8);
  BX(g, 20, 3.8, 10, CR, 4, 12, -10);
  glz(-4, 12, 12.2, 3.4, -5, 4);
  slab(22, 11, 15.8, 4, -10);
  bal(-7, 15, 16.3, -4.5);

  [[-5, -11], [8, -10]].forEach(c => {
    BX(g, 2, 3, 2, CR, c[0], 16.3, c[1]);
    BX(g, 2.5, 0.3, 2.5, ST2, c[0], 19.3, c[1]);
  });
  BX(g, 2.6, 2, 2.6, CR, -12, 12, -9);
  add(g, new THREE.ConeGeometry(2.1, 1.6, 4), DK, -12, 14.8, -9).rotation.y = 0.785;

  // Garage + Turntable
  const GX = 23, OW = 7.2, OH = 4.7, T = 0.5, fw = (12 - OW) / 2;
  BX(g, 12, 7, T, CR, GX, 0, -7.75);
  BX(g, T, 7, 10, CR, GX - 5.75, 0, -3);
  BX(g, T, 7, 10, CR, GX + 5.75, 0, -3);
  BX(g, fw, 7, T, CR, GX - OW / 2 - fw / 2, 0, 1.75);
  BX(g, fw, 7, T, CR, GX + OW / 2 + fw / 2, 0, 1.75);
  BX(g, OW, 7 - OH, T, CR, GX, OH, 1.75);
  BX(g, 11.2, 0.3, 9.6, CR, GX, 6.7, -3);

  // Turntable
  CY(g, 3.15, 3.25, 0.14, 0x1B2128, GX, 0.14, -2.9, 48);
  CY(g, 3.0, 3.0, 0.04, 0x2B333C, GX, 0.28, -2.9, 48);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.08, 0.05, 6, 72),
    new THREE.MeshBasicMaterial({ color: 0x7FD4FF })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(GX, 0.3, -2.9);
  g.add(ring);

  // Mustang GT on turntable
  const TT = new THREE.Group();
  TT.position.set(GX, 0, -2.9);
  g.add(TT);

  const mCar = SUPER.make(0x3D9DD6, true, 1);
  mCar.scale.setScalar(1.18);
  mCar.position.set(0, 0.32, 0);
  mCar.rotation.y = -Math.PI / 2 + 0.5;
  TT.add(mCar);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.283,
      tb = BX(
        TT,
        0.5,
        0.02,
        0.14,
        new THREE.MeshBasicMaterial({ color: i % 3 ? 0x7FD4FF : 0xFFFFFF }),
        Math.cos(a) * 2.7,
        0.32,
        Math.sin(a) * 2.7
      );
    tb.rotation.y = -a;
    tb.castShadow = false;
  }
  window.__TT = TT;

  // Helipad
  const PX = 27, PZ = 25;
  const padTex = Dtex(512, 512, (c, w, h) => {
    c.fillStyle = '#D9D1C2';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#BBB19F';
    c.lineWidth = 10;
    [240, 205].forEach(r => {
      c.beginPath();
      c.arc(256, 256, r, 0, 6.283);
      c.stroke();
    });
    c.fillStyle = '#8E8573';
    c.fillRect(186, 150, 28, 212);
    c.fillRect(298, 150, 28, 212);
    c.fillRect(186, 242, 140, 28);
  });
  CY(g, 7.7, 7.9, 0.5, CR, PX, 0, PZ, 56);
  const pd = new THREE.Mesh(new THREE.CircleGeometry(7.4, 64), new THREE.MeshLambertMaterial({ map: padTex }));
  pd.rotation.x = -Math.PI / 2;
  pd.rotation.z = Math.PI / 2;
  pd.position.set(PX, 0.52, PZ);
  g.add(pd);
  MPAD = pd;

  // Swimming Pool & Tennis Court
  BX(g, 28, 0.25, 17, M(0x739E4F), -7, 0, 13);
  BX(g, 11, 0.3, 5.6, ST2, -12, 0.2, 12.5);
  const W = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.1, 4.6),
    new THREE.MeshPhongMaterial({ color: 0x3FB0D2, specular: 0xFFFFFF, shininess: 120 })
  );
  W.position.set(-12, 0.52, 12.5);
  g.add(W);

  // Driveway ribbon
  const N = PS.length;
  const rib = (a, b, dy, mat) => {
    const pos = [], nor = [], idx = [];
    PS.forEach((p, i) => {
      const q = PS[Math.min(N - 1, i + 1)],
        o = PS[Math.max(0, i - 1)];
      let tx = q.x - o.x,
        tz = q.z - o.z;
      const l = Math.hypot(tx, tz) || 1;
      tx /= l;
      tz /= l;
      const w = 3.1 - 0.3 * Math.min(1, i / 60) + Math.max(0, (i - (N - 28)) / 28) * 3.6,
        dd = dy - (dy - 0.16) * Math.min(1, Math.max(0, (i - (N - 50)) / 40)),
        xa = p.x - tz * w * a,
        za = p.z + tx * w * a,
        xb = p.x - tz * w * b,
        zb = p.z + tx * w * b;
      pos.push(xa, hf(xa, za) + dd, za, xb, hf(xb, zb) + dd, zb);
      nor.push(0, 1, 0, 0, 1, 0);
      if (i < N - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    });
    const G2 = new THREE.BufferGeometry();
    G2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    G2.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    G2.setIndex(idx);
    const m = new THREE.Mesh(G2, mat);
    m.receiveShadow = true;
    Gr.add(m);
  };
  rib(-1, 1, 0.3, asph);
  rib(1, 1.18, 0.32, pave);
  rib(-1.18, -1, 0.32, pave);

  // Parked luxury supercars
  SUPER.put(28.2, 9.2, -Math.PI / 2, 0.33, 0);
  SUPER.put(31.7, 9.2, -Math.PI / 2, 0.33, 1);
  SUPER.put(35.2, 9.2, -Math.PI / 2, 0.33, 2);
}

export function updateEstate(dt) {
  if (window.__TT) {
    window.__TT.rotation.y += dt * 0.55;
  }
}
