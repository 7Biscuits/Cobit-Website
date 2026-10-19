import { scene, onN } from '../core/scene.js';
import { M, ltex, once } from '../core/materials.js';
import { leafCanR, barkCanR } from '../utils/textures.js';
import { clamp, rr, rnd, R, Pp, segD } from '../utils/math.js';
import { R2, R3, RADS, LM } from '../config.js';
import { grass } from './environment.js';
import { CITY, ROADQ, XRD, NOBU, HOUSEPOS, inHouse, RCL } from './city.js';
import { RM } from '../entities/traffic.js';

export function initVegetation() {
  const hs = (x, y, z) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const foliM = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }),
    barkM = new THREE.MeshLambertMaterial({ color: 0xffffff }),
    stemM = new THREE.MeshLambertMaterial({ color: 0x4C8A35 }),
    petM = new THREE.MeshLambertMaterial({ color: 0xffffff }),
    cenM = new THREE.MeshLambertMaterial({ color: 0xF4C430 });

  const leafCan = () => leafCanR(256),
    barkCan = () => barkCanR();
  ltex(foliM, leafCan(), 1 / 2.4, 1.7);
  ltex(barkM, barkCan(), 1 / 1.8, 2.6);
  {
    const lt = once('leafR2', () => leafCanR(256)),
      bk = once('barkR2', barkCanR);
    [0x3F7A2E, 0x4F8E3A, 0x3D7A31, 0x4E8F3B].forEach(c => {
      const m = M(c);
      m.color.setHex(0xFFFFFF);
      ltex(m, lt, 1 / 2.4, 1.7);
    });
    const tm = M(0x5B4332);
    tm.color.setHex(0xFFFFFF);
    ltex(tm, bk, 1 / 1.8, 2.6);
  }

  onN(n => {
    foliM.color.setHex(n ? 0x4E6A66 : 0xFFFFFF);
    barkM.color.setHex(n ? 0x5A6068 : 0xFFFFFF);
    stemM.color.setHex(n ? 0x2B4D36 : 0x4C8A35);
    petM.color.setHex(n ? 0x6C7C86 : 0xFFFFFF);
    cenM.color.setHex(n ? 0x8A7A30 : 0xF4C430);
  });

  const vm = parts => {
    const P = [], N = [], C = [];
    parts.forEach(p => {
      const g = p.g.index ? p.g.toNonIndexed() : p.g,
        ps = g.attributes.position,
        ns = g.attributes.normal;
      for (let i = 0; i < ps.count; i++) {
        let x = ps.getX(i),
          y = ps.getY(i),
          z = ps.getZ(i);
        const nx = ns.getX(i),
          ny = ns.getY(i),
          nz = ns.getZ(i);
        if (p.j) {
          const j =
            (hs(
              Math.round(x * 50) / 50 + p.x,
              Math.round(y * 50) / 50 + p.y,
              Math.round(z * 50) / 50 + p.z
            ) -
              0.5) *
            p.j;
          x += nx * j;
          y += ny * j;
          z += nz * j;
        }
        const sh = p.sh ? p.sh(y + p.y) : 1;
        P.push(x + p.x, y + p.y, z + p.z);
        N.push(nx, ny, nz);
        C.push(p.c[0] * sh, p.c[1] * sh, p.c[2] * sh);
      }
    });
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    r.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    r.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    return r;
  };

  const blob = (r, x, y, z, c, j) => ({
    g: new THREE.IcosahedronGeometry(r, 1),
    x,
    y,
    z,
    c,
    j: j || 0.3,
    sh: v => 0.66 + 0.34 * Math.min(1, Math.max(0, v / 5.2))
  });

  const cone = (r, h, y, c) => ({
    g: new THREE.ConeGeometry(r, h, 12),
    x: 0,
    y: y + h / 2,
    z: 0,
    c,
    j: 0.14,
    sh: v => 0.62 + 0.38 * Math.min(1, Math.max(0, v / 6.2))
  });

  const GE = [
    vm([
      blob(1.75, 0, 3.5, 0, [0.86, 1, 0.74]),
      blob(1.28, 1.15, 3.0, 0.5, [0.82, 1, 0.7]),
      blob(1.28, -1, 3.1, -0.6, [0.84, 1, 0.72]),
      blob(1.2, 0.2, 3.0, -1.25, [0.8, 0.98, 0.68]),
      blob(1.08, -0.3, 4.6, 0.3, [0.92, 1, 0.8])
    ]),
    vm([
      cone(1.95, 2.5, 1.6, [0.7, 0.92, 0.74]),
      cone(1.55, 2.3, 2.9, [0.72, 0.95, 0.76]),
      cone(1.12, 2.1, 4.1, [0.75, 0.98, 0.78]),
      cone(0.66, 1.7, 5.2, [0.8, 1, 0.82])
    ]),
    vm([
      blob(1.9, 0, 3.2, 0, [0.9, 1, 0.78], 0.35),
      blob(1.15, 1.2, 2.6, 0.4, [0.86, 1, 0.74]),
      blob(1.1, -1.1, 2.7, -0.3, [0.86, 1, 0.74])
    ])
  ];

  const GB = vm([
    blob(0.78, 0, 0.55, 0, [0.84, 1, 0.74], 0.28),
    blob(0.62, 0.72, 0.46, 0.2, [0.8, 1, 0.7], 0.26),
    blob(0.58, -0.62, 0.44, -0.3, [0.82, 1, 0.72], 0.26),
    blob(0.5, 0.1, 0.46, 0.7, [0.86, 1, 0.76], 0.26)
  ]);

  const GT = (() => {
    const g = new THREE.CylinderGeometry(0.2, 0.33, 2.7, 7);
    g.translate(0, 1.35, 0);
    return g;
  })();

  const GS = (() => {
    const g = new THREE.CylinderGeometry(0.012, 0.02, 0.4, 4);
    g.translate(0, 0.2, 0);
    return g;
  })();

  const GH = vm(
    (() => {
      const a = [];
      for (let k = 0; k < 6; k++) {
        const g = new THREE.SphereGeometry(0.1, 6, 4);
        g.scale(1.7, 0.5, 0.85);
        g.translate(0.13, 0, 0);
        g.rotateY((k / 6) * 6.283);
        a.push({ g, x: 0, y: 0, z: 0, c: [1, 1, 1], j: 0, o: 0 });
      }
      return a;
    })()
  );

  const GC = (() => {
    const g = new THREE.SphereGeometry(0.075, 6, 4);
    g.scale(1, 0.7, 1);
    return g;
  })();

  const RDL = (RM.roads || []).map(R => {
    let a = 1e9,
      b = 1e9,
      c = -1e9,
      d = -1e9;
    R.P.forEach(p => {
      if (p[0] < a) a = p[0];
      if (p[0] > c) c = p[0];
      if (p[1] < b) b = p[1];
      if (p[1] > d) d = p[1];
    });
    return { P: R.P, hw: R.hw || 5.3, a, b, c, d };
  });

  const roadFree = (x, z, rad) => {
    rad = rad || 0;
    const r = Math.hypot(x, z);
    if (r < 51.2 + rad) return false;
    if (x < 12 + rad && x > -195 - rad && z < -92 + rad && z > -160 - rad) return false;
    if (Math.abs(x) < 6.7 + rad && z < -30) return false;
    if (z < -134 + rad && z > -208 - rad) return false;
    if (z < -206 + rad && Math.abs(x) < 212 + rad) return false;
    if (RCL(x, z) < rad - 0.55) return false;
    for (let i = 0; i < RDL.length; i++) {
      const q = RDL[i],
        l = q.hw + rad + 0.4;
      if (x < q.a - l || x > q.c + l || z < q.b - l || z > q.d + l) continue;
      if (segD(x, z, q.P) < q.hw + rad + 0.35) return false;
    }
    if (XRD.some(q => segD(x, z, [q.S, q.E]) < q.w / 2 + 0.9 + rad)) return false;
    return true;
  };

  const inFrontPol = p =>
    NOBU.some(r => {
      const dx = p[0] - r.O[0],
        dz = p[1] - r.O[1],
        a = dx * r.fz[0] + dz * r.fz[1],
        b = dx * r.fx[0] + dz * r.fx[1];
      return a > (r.a0 + r.a1) / 2 && a < r.a1 + 9 && b > r.b0 - 3 && b < r.b1 + 3;
    });

  const inRectF = (p, R, infl) => {
    const dx = p[0] - R.O[0],
      dz = p[1] - R.O[1],
      a = dx * R.fz[0] + dz * R.fz[1],
      b = dx * R.fx[0] + dz * R.fx[1];
    return a > R.a0 - infl && a < R.a1 + infl && b > R.b0 - infl && b < R.b1 + infl;
  };

  const GRS = (x, z, rad) => {
    rad = rad || 0;
    if (!roadFree(x, z, rad)) return false;
    if (inFrontPol([x, z])) return false;
    if (NOBU.some(R => inRectF([x, z], R, rad * 0.85))) return false;
    if (inHouse(x, z, rad)) return false;
    if (HOUSEPOS.some(h => Math.hypot(h[0] - x, h[1] - z) < 6.5)) return false;
    return true;
  };

  const TL = [[], [], []],
    BL = [],
    FL = [],
    ALL = [],
    near = (x, z, d) => ALL.some(p => Math.hypot(p[0] - x, p[1] - z) < d);

  const addT = (x, z, s) => {
    if (!GRS(x, z, 2.6 * s) || near(x, z, 4.4 * s)) return false;
    const h = hs(x, 1, z),
      sp = h < 0.5 ? 0 : h < 0.82 ? 1 : 2;
    ALL.push([x, z]);
    TL[sp].push([x, z, s, hs(z, 2, x) * 6.283, h]);
    return true;
  };

  const addB = (x, z, s) => {
    if (!GRS(x, z, 1.3 * s) || near(x, z, 1.6 * s)) return false;
    BL.push([x, z, s, hs(z, 3, x) * 6.283, hs(x, 4, z)]);
    ALL.push([x, z]);
    return true;
  };

  RADS.forEach(t => {
    const r0 = LM.includes(t) ? 92 : 52;
    for (let r = r0; r < 146; r += 17)
      [-1, 1].forEach(s => {
        const p = Pp(r, t + ((s * 8.6 * 57.3) / r));
        addT(p[0], p[1], 0.8 + (((r * 7) | 0) % 5) * 0.07);
      });
  });

  [R2, R3].forEach(r => {
    for (let t = -12; t < 194; t += 9)
      [-1, 1].forEach(s => {
        const p = Pp(r + s * 9, t + 2.5);
        addT(p[0], p[1], 0.75 + (((t * 3) | 0) % 4) * 0.08);
      });
  });

  for (let t = 0, n = 0; t < 9000 && n < 130; t++) {
    const x = rr(-215, 215),
      z = rr(-135, 160);
    if (addT(x, z, rr(0.85, 1.3))) n++;
  }
  for (let t = 0, n = 0; t < 6000 && n < 70; t++) {
    const x = rr(-215, 215),
      z = rr(-135, 160);
    if (addB(x, z, rr(0.8, 1.5))) n++;
  }

  const FC = [0xF2E34C, 0xFFFFFF, 0xE85A8A, 0xB36BE8, 0xFF8A3D, 0xE8453C, 0x6FA8FF];
  const bed = (x, z) => {
    if (!GRS(x, z, 0.4)) return;
    const c = FC[Math.floor(hs(x, 5, z) * 7) % 7],
      c2 = FC[Math.floor(hs(z, 6, x) * 7) % 7],
      k = 5 + Math.floor(hs(x, 7, z) * 5);
    for (let i = 0; i < k; i++) {
      const a = hs(x + i, 8, z) * 6.283,
        d = Math.sqrt(hs(z + i, 9, x)) * 1.5,
        fx = x + Math.cos(a) * d,
        fz = z + Math.sin(a) * d;
      if (GRS(fx, fz, 0.35)) FL.push([fx, fz, 0.75 + hs(fx, 10, fz) * 0.55, hs(fz, 11, fx) * 6.283, i % 4 === 3 ? c2 : c]);
    }
  };

  for (let t = 0, n = 0; t < 6000 && n < 70; t++) {
    const x = rr(-215, 215),
      z = rr(-135, 160);
    const m = FL.length;
    bed(x, z);
    if (FL.length > m) n++;
  }

  // Instanced Meshes
  const M4 = new THREE.Matrix4(),
    VS = new THREE.Vector3(),
    CO = new THREE.Color();
  const inst = (geo, mat, arr, fy, fn, cast) => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, arr.length));
    arr.forEach((a, i) => {
      const s = fn.s(a);
      M4.makeRotationY(fn.r ? fn.r(a) : 0);
      M4.scale(VS.set(s, s * (fn.sy ? fn.sy(a) : 1), s));
      M4.setPosition(a[0], fy, a[1]);
      m.setMatrixAt(i, M4);
      if (fn.c) m.setColorAt(i, CO.setHex(fn.c(a)));
    });
    m.count = arr.length;
    m.castShadow = !!cast;
    m.receiveShadow = false;
    scene.add(m);
    return m;
  };

  const TT = [0xFFFFFF, 0xE9F4D6, 0xD9EDC8, 0xF3F7D2, 0xCFE8D8],
    PT = [0xC4DDC4, 0xADCFB4, 0xD0E3C4],
    ALLT = [].concat(TL[0], TL[1], TL[2]);

  inst(GT, barkM, ALLT, 0, { s: a => a[2] * 0.9, r: a => a[3] }, true);
  inst(GE[0], foliM, TL[0], 0, { s: a => a[2], r: a => a[3], sy: a => 0.9 + hs(a[0], 12, a[1]) * 0.3, c: a => TT[Math.floor(a[4] * 50) % 5] }, true);
  inst(GE[1], foliM, TL[1], 0, { s: a => a[2], r: a => a[3], sy: a => 0.95 + hs(a[0], 12, a[1]) * 0.3, c: a => PT[Math.floor(a[4] * 50) % 3] }, true);
  inst(GE[2], foliM, TL[2], 0, { s: a => a[2], r: a => a[3], sy: a => 0.9 + hs(a[0], 12, a[1]) * 0.25, c: a => TT[Math.floor(a[4] * 50) % 5] }, true);
  inst(GB, foliM, BL, 0, { s: a => a[2], r: a => a[3], sy: a => 0.85 + a[4] * 0.3, c: a => TT[Math.floor(a[4] * 50) % 5] }, true);
  inst(GS, stemM, FL, 0, { s: a => a[2], r: a => a[3] });
  inst(GH, petM, FL, 0.4, { s: a => a[2], r: a => a[3], c: a => a[4] });
  inst(GC, cenM, FL, 0.41, { s: a => a[2], r: a => a[3] });

  window.TREEKIT = { GT, GE, GB, foliM, barkM, TT, PT };
}

export function initAirportVegetation() {
  const K = window.TREEKIT;
  if (!K) return;
  const X0 = -70,
    Z0 = -405,
    CS = 2,
    NX = 140,
    NZ = 85,
    occ = new Uint8Array(NX * NZ);
  const cell = (x, z) => Math.floor((z - Z0) / CS) * NX + Math.floor((x - X0) / CS);
  const mark = (x0, x1, z0, z1, v) => {
    const i0 = Math.max(0, Math.floor((x0 - X0) / CS)),
      i1 = Math.min(NX - 1, Math.floor((x1 - X0) / CS)),
      j0 = Math.max(0, Math.floor((z0 - Z0) / CS)),
      j1 = Math.min(NZ - 1, Math.floor((z1 - Z0) / CS));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) occ[j * NX + i] = v || 1;
  };

  const XA = -62,
    XB = 202,
    ZA = -398,
    ZB = -244,
    nz = (x, z) =>
      0.5 +
      0.5 *
        Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) *
        Math.cos(z * 0.09 + Math.sin(x * 0.04) * 1.7),
    free = (x, z) => x > XA && x < XB && z > ZA && z < ZB && occ[cell(x, z)] === 0,
    T3 = [[], [], []],
    BS = [],
    TU = [];

  for (let t = 0; t < 12000 && T3[0].length + T3[1].length + T3[2].length < 330; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z)) continue;
    const d = Math.min(x - XA, XB - x, z - ZA, ZB - z),
      n = nz(x, z);
    if (R() > (d < 14 ? 0.9 : n > 0.55 ? 0.85 : 0.12)) continue;
    T3[Math.floor(R() * 3)].push([x, z, rnd(0.8, 1.3), rnd(0, 6.28), R()]);
    mark(x - 2, x + 2, z - 2, z + 2, 2);
  }

  for (let t = 0; t < 9000 && BS.length < 400; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z)) continue;
    BS.push([x, z, rnd(0.8, 1.3), rnd(0, 6.28), R()]);
  }

  for (let t = 0; t < 7000 && TU.length < 900; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z)) continue;
    TU.push([x, z, rnd(0.7, 1.5), rnd(0, 6.28), R()]);
  }

  const Mx = new THREE.Matrix4(),
    Vs = new THREE.Vector3(),
    cl = new THREE.Color(),
    mk = (geo, mat, arr, s, sy, c) => {
      if (!arr.length) return;
      const im = new THREE.InstancedMesh(geo, mat, arr.length);
      arr.forEach((a, i) => {
        const q = s(a);
        Mx.makeRotationY(a[3]);
        Mx.scale(Vs.set(q, q * (sy ? sy(a) : 1), q));
        Mx.setPosition(a[0], 0, a[1]);
        im.setMatrixAt(i, Mx);
        if (c) im.setColorAt(i, cl.setHex(c(a)));
      });
      im.frustumCulled = false;
      scene.add(im);
    };

  mk(K.GT, K.barkM, [].concat(T3[0], T3[1], T3[2]), a => a[2] * 0.9);
  mk(K.GE[0], K.foliM, T3[0], a => a[2], a => 0.9 + a[4] * 0.3, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(K.GE[1], K.foliM, T3[1], a => a[2], a => 0.95 + a[4] * 0.3, a => K.PT[Math.floor(a[4] * 50) % 3]);
  mk(K.GE[2], K.foliM, T3[2], a => a[2], a => 0.9 + a[4] * 0.25, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(K.GB, K.foliM, BS, a => a[2], a => 0.85 + a[4] * 0.3, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(
    new THREE.ConeGeometry(0.32, 0.9, 5).translate(0, 0.45, 0),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
    TU,
    a => a[2],
    null,
    a => [0x6FA04A, 0x7DB354, 0x8DB35A, 0x5F9440][Math.floor(a[4] * 40) % 4]
  );
}

export function initOutsideVegetation() {
  const K = window.TREEKIT;
  if (!K) return;
  const XA = -150,
    XB = 290,
    ZA = -470,
    ZB = -212,
    nz = (x, z) =>
      0.5 +
      0.5 *
        Math.sin(x * 0.06 + Math.sin(z * 0.05) * 2) *
        Math.cos(z * 0.08 + Math.sin(x * 0.04) * 1.7),
    dF = (x, z) => Math.hypot(Math.max(-66 - x, 0, x - 206), Math.max(-402 - z, 0, z + 240)),
    free = (x, z) => x > XA && x < XB && z > ZA && z < ZB && !(x > -66 && x < 206 && z > -402 && z < -240),
    dens = d => (d < 8 ? 0.04 : d < 50 ? 0.85 : Math.max(0.1, 0.85 - (d - 50) / 150)),
    T3 = [[], [], []],
    BS = [],
    TU = [],
    RK = [],
    FL = [];

  for (let t = 0; t < 30000 && T3[0].length + T3[1].length + T3[2].length < 380; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z)) continue;
    if (R() > dens(dF(x, z)) * (nz(x, z) > 0.5 ? 1 : 0.2)) continue;
    T3[Math.floor(R() * 3)].push([x, z, rnd(0.8, 1.35), rnd(0, 6.28), R()]);
  }
  for (let z = -216; z > -240; z -= 6)
    [-9.5, 9.5].forEach(x => T3[0].push([x, z, 1, rnd(0, 6.28), R()]));

  for (let t = 0; t < 20000 && BS.length < 450; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z)) continue;
    if (R() > dens(dF(x, z)) * (nz(x, z) > 0.45 ? 0.6 : 0.15)) continue;
    BS.push([x, z, rnd(0.8, 1.3), rnd(0, 6.28), R()]);
  }

  for (let t = 0; t < 20000 && TU.length < 1400; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z) || R() > dens(dF(x, z))) continue;
    TU.push([x, z, rnd(0.7, 1.5), rnd(0, 6.28), R()]);
  }

  for (let t = 0; t < 9000 && RK.length < 90; t++) {
    const x = rnd(XA, XB),
      z = rnd(ZA, ZB);
    if (!free(x, z) || dF(x, z) < 6 || R() > 0.25) continue;
    RK.push([x, z, rnd(0.6, 1.7), rnd(0, 6.28), R()]);
  }

  const Mx = new THREE.Matrix4(),
    Vs = new THREE.Vector3(),
    cl = new THREE.Color(),
    mk = (geo, mat, arr, s, sy, c) => {
      if (!arr.length) return;
      const im = new THREE.InstancedMesh(geo, mat, arr.length);
      arr.forEach((a, i) => {
        const q = s(a);
        Mx.makeRotationY(a[3]);
        Mx.scale(Vs.set(q, q * (sy ? sy(a) : 1), q));
        Mx.setPosition(a[0], 0, a[1]);
        im.setMatrixAt(i, Mx);
        if (c) im.setColorAt(i, cl.setHex(c(a)));
      });
      im.frustumCulled = false;
      scene.add(im);
    };

  mk(K.GT, K.barkM, [].concat(T3[0], T3[1], T3[2]), a => a[2] * 0.9);
  mk(K.GE[0], K.foliM, T3[0], a => a[2], a => 0.9 + a[4] * 0.3, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(K.GE[1], K.foliM, T3[1], a => a[2], a => 0.95 + a[4] * 0.3, a => K.PT[Math.floor(a[4] * 50) % 3]);
  mk(K.GE[2], K.foliM, T3[2], a => a[2], a => 0.9 + a[4] * 0.25, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(K.GB, K.foliM, BS, a => a[2], a => 0.85 + a[4] * 0.3, a => K.TT[Math.floor(a[4] * 50) % 5]);
  mk(
    new THREE.ConeGeometry(0.32, 0.9, 5).translate(0, 0.45, 0),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
    TU,
    a => a[2],
    null,
    a => [0x6FA04A, 0x7DB354, 0x8DB35A, 0x5F9440][Math.floor(a[4] * 40) % 4]
  );
  mk(
    new THREE.IcosahedronGeometry(1, 1).scale(1, 0.55, 1),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
    RK,
    a => a[2],
    null,
    a => [0x8A867E, 0x9A968D, 0x77746C][Math.floor(a[4] * 30) % 3]
  );
}
