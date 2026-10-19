import { scene, onN } from '../core/scene.js';
import { M, BX, CY, add, flat, label, rod, wingM, fusM, glow, warmG, redG, grnG, poolM, poolG, bulbG, flags, once } from '../core/materials.js';
import { glowTex, Dtex, rwTex, padCan, mkc } from '../utils/textures.js';
import { clamp, lerp, sm } from '../utils/math.js';
import { asph } from '../world/environment.js';
import { tireM } from './vehicles.js';

export const ta = new THREE.MeshLambertMaterial({ color: 0x3A444D, side: 2 });
export const yl = new THREE.MeshBasicMaterial({ color: 0xE6B84D, side: 2 });
onN(n => ta.color.setHex(n ? 0x161C22 : 0x3A444D));

export const conc = new THREE.MeshLambertMaterial({ color: 0xC9D6DF });
onN(n => conc.color.setHex(n ? 0x3D4A55 : 0xC9D6DF));

export function mk(P, r = 12) {
  const n = P.length;
  const pts = [];
  const cum = [0];
  const yq = q => {
    let i = 0;
    while (i < n - 2 && cum[i + 1] < q) i++;
    return lerp(P[i][2] || 0, P[i + 1][2] || 0, clamp((q - cum[i]) / (cum[i + 1] - cum[i] || 1), 0, 1));
  };
  for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  pts.push({ x: P[0][0], z: P[0][1], q: 0 });
  for (let i = 1; i < n - 1; i++) {
    const a = P[i - 1],
      b = P[i],
      c = P[i + 1],
      ux = a[0] - b[0],
      uz = a[1] - b[1],
      vx = c[0] - b[0],
      vz = c[1] - b[1],
      lu = Math.hypot(ux, uz),
      lv = Math.hypot(vx, vz),
      th = Math.acos(clamp((ux * vx + uz * vz) / (lu * lv), -1, 1)),
      d = Math.min(r / Math.tan(th / 2), lu / 2, lv / 2),
      p1 = [b[0] + (ux / lu) * d, b[1] + (uz / lu) * d],
      p2 = [b[0] + (vx / lv) * d, b[1] + (vz / lv) * d];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12,
        w0 = (1 - t) * (1 - t),
        w1 = 2 * t * (1 - t),
        w2 = t * t;
      pts.push({
        x: w0 * p1[0] + w1 * b[0] + w2 * p2[0],
        z: w0 * p1[1] + w1 * b[1] + w2 * p2[1],
        q: k === 0 ? cum[i] - d : k === 12 ? cum[i] + d : cum[i]
      });
    }
  }
  pts.push({ x: P[n - 1][0], z: P[n - 1][1], q: cum[n - 1] });
  const S = [0];
  for (let i = 1; i < pts.length; i++) S[i] = S[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return {
    len: S[S.length - 1],
    at(s) {
      s = clamp(s, 0, S[S.length - 1]);
      let lo = 0,
        hi = S.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        S[m] <= s ? (lo = m) : (hi = m);
      }
      const a = pts[lo],
        b = pts[hi],
        f = (s - S[lo]) / (S[hi] - S[lo] || 1);
      return {
        x: lerp(a.x, b.x, f),
        z: lerp(a.z, b.z, f),
        y: yq(lerp(a.q, b.q, f)),
        psi: Math.atan2(b.x - a.x, b.z - a.z)
      };
    }
  };
}

export const sl = (P, a, b) => ({ len: b - a, at: s => P.at(a + s) });
export const fx = (P, s) => ({ len: 0, at: () => P.at(s) });

export function near(P, x, z) {
  let b = 0,
    bd = 1e9;
  for (let s = 0; s <= P.len; s += 0.5) {
    const a = P.at(s),
      d = Math.hypot(a.x - x, a.z - z);
    if (d < bd) {
      bd = d;
      b = s;
    }
  }
  return b;
}

export function rib(P, w, m, y) {
  const pos = [],
    nor = [],
    idx = [],
    n = Math.ceil(P.len / 1.5);
  for (let i = 0; i <= n; i++) {
    const a = P.at((i / n) * P.len),
      dx = (Math.cos(a.psi) * w) / 2,
      dz = (-Math.sin(a.psi) * w) / 2;
    pos.push(a.x + dx, y, a.z + dz, a.x - dx, y, a.z - dz);
    nor.push(0, 1, 0, 0, 1, 0);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const o = new THREE.Mesh(g, m);
  o.receiveShadow = true;
  scene.add(o);
}

export const LRZ = -262;
export const TRZ = -352;
export const rl = new THREE.MeshBasicMaterial({ color: 0xFFE7A0 });
export const gl = new THREE.MeshBasicMaterial({ color: 0x3BE07A });
export const bl = new THREE.MeshBasicMaterial({ color: 0x3B8CFF });

export function wingGeo(s, x0, x1, l0, l1, t0, t1, th) {
  const sh = new THREE.Shape();
  sh.moveTo(s * x0, -l0);
  sh.lineTo(s * x1, -l1);
  sh.lineTo(s * x1, -t1);
  sh.lineTo(s * x0, -t0);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -th / 2, 0);
  return g;
}

export const gW = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
gW.rotateZ(Math.PI / 2);

export function mkPlane(c, parked) {
  window.PAINT = true;
  try {
    return mkPlane0(c, parked);
  } finally {
    window.PAINT = false;
  }
}

function mkPlane0(c, parked) {
  const g = new THREE.Group(),
    W = wingM(),
    K = M(c),
    col = new THREE.Color(c),
    wh = new THREE.Color(0xF4F8FB);
  const pr = [
    [0, -11.2],
    [0.5, -10.6],
    [1, -8.5],
    [1.4, -4],
    [1.5, 0],
    [1.5, 5],
    [1.3, 8.5],
    [0.8, 10.5],
    [0, 11.4]
  ].map(p => new THREE.Vector2(p[0], p[1]));
  const sp = new THREE.SplineCurve(pr)
    .getPoints(48)
    .map(p => new THREE.Vector2(Math.max(0, p.x), p.y));
  const fg = new THREE.LatheGeometry(sp, 28);
  const ps = fg.attributes.position;
  const cs = [];
  for (let i = 0; i < ps.count; i++) {
    const r = Math.hypot(ps.getX(i), ps.getZ(i)) || 1;
    const k = ps.getY(i) < -8.3 || ps.getZ(i) / r > 0.3 ? col : wh;
    cs.push(k.r, k.g, k.b);
  }
  fg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
  fg.rotateX(Math.PI / 2);
  add(g, fg, fusM(), 0, 2.4, 0);
  [-1, 1].forEach(s => {
    BX(g, 0.08, 0.28, 10, 0x1B2A36, s * 1.455, 2.76, 0.8);
    add(g, wingGeo(s, 1.2, 10.8, 2.8, -3.6, -3.2, -5.4, 0.25), W, 0, 1.75, 0).rotation.z = s * 0.07;
    add(g, wingGeo(s, 0.8, 5.4, -8.3, -10.6, -10.7, -11.6, 0.18), W, 0, 2.8, 0);
    BX(g, 0.15, 1.2, 1.6, c, s * 10.9, 1.9, -4.4);
    const e = add(g, new THREE.CylinderGeometry(0.82, 0.7, 3.6, 14), M(0xC9D3DA), s * 4.3, 1.05, 1.7);
    e.rotation.x = Math.PI / 2;
    const f = add(g, new THREE.CylinderGeometry(0.62, 0.62, 0.2, 14), M(0x1E252B), s * 4.3, 1.05, 3.5);
    f.rotation.x = Math.PI / 2;
    BX(g, 0.3, 0.8, 2, 0xC9D3DA, s * 4.3, 1.3, 1.3);
  });
  const fh = new THREE.Shape();
  [
    [-4.5, 3.2],
    [-9.8, 7.8],
    [-11.2, 7.8],
    [-11, 3.2]
  ].forEach((p, i) => (i ? fh.lineTo(p[0], p[1]) : fh.moveTo(p[0], p[1])));
  const fgm = new THREE.ExtrudeGeometry(fh, { depth: 0.25, bevelEnabled: false });
  fgm.rotateY(-Math.PI / 2);
  fgm.translate(0.125, 0, 0);
  add(g, fgm, K, 0, 0, 0);
  add(g, new THREE.SphereGeometry(1, 10, 6), M(0x1B2A36), 0, 3.05, 9.1).scale.set(0.8, 0.45, 1);
  const gear = new THREE.Group();
  g.add(gear);
  [
    [0, 7.6],
    [-2.6, -0.3],
    [2.6, -0.3]
  ].forEach(p => {
    CY(gear, 0.08, 0.08, 1.3, 0x9AA7B0, p[0], 0.4, p[1], 6);
    add(gear, gW, tireM, p[0], 0.5, p[1]);
  });
  const nl = (x, y, z, k) =>
    add(g, new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: k }), x, y, z).castShadow = false;
  nl(10.9, 1.9, -3.6, 0xFF3030);
  nl(-10.9, 1.9, -3.6, 0x30FF70);
  const st = add(g, new THREE.SphereGeometry(0.3, 6, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), 0, 8, -11);
  const mkL = (x, y, z, col, sz) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), new THREE.MeshBasicMaterial({ color: col }));
    m.position.set(x, y, z);
    g.add(m);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: col,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      })
    );
    sp.position.set(x, y, z);
    sp.scale.set(sz, sz, 1);
    g.add(sp);
    return { m, sp };
  };
  const bl2 = {
    s: [mkL(10.9, 1.9, -4.6, 0xFFFFFF, 7), mkL(-10.9, 1.9, -4.6, 0xFFFFFF, 7), mkL(0, 8.4, -10.8, 0xFFFFFF, 7)],
    b: [mkL(0, 3.95, 1.5, 0xFF2A20, 6), mkL(0, 0.75, 1.5, 0xFF2A20, 6)],
    l: [mkL(3.2, 1.0, 6.6, 0xFFF6D8, 8), mkL(-3.2, 1.0, 6.6, 0xFFF6D8, 8)],
    n: [mkL(10.9, 1.9, -3.4, 0xFF2030, 3.5), mkL(-10.9, 1.9, -3.4, 0x30FF70, 3.5)]
  };
  g.userData = { gear, st, bl: bl2 };
  g.rotation.order = 'YXZ';
  g.scale.setScalar(0.62);
  scene.add(g);
  return g;
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export const FL = mk(
  [
    [140, TRZ, 0],
    [175, TRZ, 4],
    [222, TRZ, 26],
    [222, -222, 40],
    [160, -30, 58],
    [150, 125, 62],
    [-150, 128, 62],
    [-150, -40, 58],
    [-120, -170, 40],
    [-110, -225, 26],
    [-110, LRZ, 18],
    [36, LRZ, 0]
  ],
  40
);

export function cycle(sx) {
  const TI = mk([
    [100, LRZ],
    [126, LRZ],
    [142, -280],
    [170, -280],
    [170, -332],
    [sx, -332],
    [sx, -318]
  ]);
  const OUT = mk([
    [sx, -332],
    [30, -332],
    [30, -352],
    [46, -352]
  ]);
  const hs = near(OUT, 30, -340);
  const ph = [];
  const V = (P, a, b, o = {}) => ph.push(Object.assign({ P, sp: [a, b], dur: (2 * P.len) / (a + b) }, o));
  V(mk([[46, TRZ], [140, TRZ]]), 8, 28, { k: 'to' });
  V(FL, 28, 17, { k: 'fl' });
  V(mk([[36, LRZ], [100, LRZ]]), 17, 9);
  V(sl(TI, 0, TI.len - 38), 9, 9);
  V(sl(TI, TI.len - 38, TI.len), 9, 0);
  ph.push({ P: fx(TI, TI.len), dur: 8 });
  ph.push({ P: mk([[sx, -318], [sx, -332]]), dur: 6, rev: 1, sm: 1 });
  ph.push({ P: { len: 1, at: s => ({ x: sx, y: 0, z: -332, psi: lerp(0, -Math.PI / 2, s) }) }, dur: 3, sm: 1 });
  const o1 = sl(OUT, 0, hs);
  ph.push({ P: o1, dur: o1.len / 6, sm: 1 });
  ph.push({ P: fx(OUT, hs), dur: 3 });
  V(sl(OUT, hs, OUT.len), 0, 8);
  return ph;
}

export let flights = [];
let lastT = 0;

export function movePlanes(T) {
  const dt = Math.min(0.1, T - lastT);
  lastT = T;
  flights.forEach(f => {
    let t = (T + f.off) % f.cyc;
    let p = f.ph[0];
    for (const q of f.ph) {
      if (t < q.dur) {
        p = q;
        break;
      }
      t -= q.dur;
    }
    const P = p.P;
    let ss = P.len * sm(t / p.dur);
    if (!p.sm && p.sp) {
      const v = p.sp;
      ss = v[0] * t + (0.5 * (v[1] - v[0])) / p.dur * t * t;
    }
    const a = P.at(ss);
    const psi = a.psi + (p.rev ? Math.PI : 0);
    let pit = 0;
    let bk = 0;
    if (p.k === 'fl' || p.k === 'to') {
      const b = P.at(ss + 6);
      pit = Math.atan2(b.y - a.y, 6);
      if (p.k === 'fl') bk = -clamp(wrap(b.psi - a.psi) * 1.8, -0.55, 0.55);
    }
    if (p.k === 'to') pit = 0.2 * clamp((t / p.dur - 0.72) / 0.2, 0, 1);
    if (p.k === 'fl') pit += 0.08 * clamp((14 - (P.len - ss)) / 14, 0, 1);
    const k = Math.min(1, dt * 4);
    f.pit += (pit - f.pit) * k;
    f.bank += (bk - f.bank) * k;
    f.psi = f.psi == null ? psi : f.psi + wrap(psi - f.psi) * Math.min(1, dt * 7);
    f.g.position.set(a.x, a.y, a.z);
    f.g.rotation.set(-f.pit, f.psi, f.bank);
    const lift = clamp((a.y - 1.5) / 5, 0, 1);
    const u = f.g.userData;
    u.gear.position.y = lift * 1.9;
    u.gear.visible = lift < 0.97;
    u.st.visible = (T * 1.4) % 1 < 0.12;
    const b = u.bl;
    const ph = (T + f.g.id * 0.37) % 1.3;
    const fl = ph < 0.07 || (ph > 0.2 && ph < 0.27);
    const k1 = ((T + f.g.id * 0.5) % 1.8) < 0.28;
    const k2 = ((T + f.g.id * 0.5 + 0.9) % 1.8) < 0.28;
    const lg = u.gear.visible;
    b.s.forEach(o => {
      o.m.visible = fl;
      o.sp.material.opacity = fl ? 1 : 0;
    });
    [k1, k2].forEach((k, i) => {
      b.b[i].m.visible = k;
      b.b[i].sp.material.opacity = k ? 1 : 0;
    });
    b.l.forEach(o => {
      o.m.visible = lg;
      o.sp.material.opacity = lg ? 0.7 : 0;
    });
    b.n.forEach(o => {
      o.sp.material.opacity = 0.55;
    });
  });
}

export const AP = { x: 26, z: -280 };

export function padMat(kind) {
  const t = new THREE.CanvasTexture(padCan(kind));
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  const m = new THREE.MeshLambertMaterial({ map: t });
  onN(n => m.color.setHex(n ? 0x6A7A86 : 0xFFFFFF));
  return m;
}

let HPL = null;
export function hplM() {
  return (
    HPL ||
    (HPL = (() => {
      const m = new THREE.MeshBasicMaterial({ color: 0x2F7A45 });
      onN(n => m.color.setHex(n ? 0x56FF98 : 0x2F7A45));
      return m;
    })())
  );
}

export function windsock(P, x, z, ry) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry || 0;
  P.add(g);
  CY(g, 0.06, 0.09, 3.5, 0xC9D3DA, 0, 0, 0, 8).castShadow = false;
  const pv = new THREE.Group();
  pv.position.set(0, 3.4, 0);
  g.add(pv);
  const tx = Dtex(32, 128, (c, W, H) => {
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? '#F6F6F2' : '#F26B21';
      c.fillRect(0, (i * H) / 5, W, H / 5);
    }
  });
  const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.36, 1.9, 14, 1, true), new THREE.MeshLambertMaterial({ map: tx, side: 2 }));
  cn.rotation.z = -Math.PI / 2;
  cn.position.x = 1;
  pv.add(cn);
  const mr = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 16), M(0xC9D3DA));
  mr.rotation.y = Math.PI / 2;
  pv.add(mr);
  flags.push(pv);
}

export function airPad(P) {
  const m = padMat('air');
  const hl = hplM();
  BX(P, 19, 0.22, 19, 0x8C9094, 0, 0, 0).castShadow = false;
  const g = new THREE.PlaneGeometry(18.6, 18.6);
  g.rotateX(-Math.PI / 2);
  const t = new THREE.Mesh(g, m);
  t.position.y = 0.235;
  t.receiveShadow = true;
  P.add(t);
  const bg = new THREE.SphereGeometry(0.17, 8, 6);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2,
      x = Math.cos(a) * 5.3,
      z = Math.sin(a) * 5.3;
    add(P, bg, hl, x, 0.3, z).castShadow = false;
    if (k % 2 === 0) glow(grnG, x, 0.55, z, 2.2, P);
  }
  const rb = new THREE.MeshBasicMaterial({ color: 0xFFB020 });
  onN(n => rb.color.setHex(n ? 0xFFD060 : 0xFFB020));
  [-1, 1].forEach(a =>
    [-1, 1].forEach(b => {
      const x = a * 10.6,
        z = b * 10.2;
      CY(P, 0.1, 0.15, 7.6, 0x2A343D, x, 0, z, 8).castShadow = false;
      BX(P, 1.3, 0.2, 0.6, 0x2A343D, x - a * 0.5, 7.5, z).castShadow = false;
      add(P, bulbG, new THREE.MeshBasicMaterial({ color: 0xBEE4FB }), x - a * 0.9, 7.4, z).castShadow = false;
      glow(warmG, x - a * 0.9, 7.3, z, 10, P);
    })
  );
  const pl = new THREE.Mesh(poolG, poolM);
  pl.scale.set(1.5, 1, 1.5);
  pl.position.y = 0.3;
  P.add(pl);
  for (let k = -4; k <= 4; k++) {
    add(P, bg, rb, k * 2.1, 0.28, 9.7).castShadow = false;
    add(P, bg, rb, k * 2.1, 0.28, -9.7).castShadow = false;
  }
  windsock(P, -11.6, -6, 0.9);
}

export function hangar(cx, no) {
  const W = 26;
  const D = 22;
  const H = 9;
  const g = new THREE.Group();
  g.position.set(cx, 0, -374);
  scene.add(g);
  BX(g, W + 3, 0.3, D + 3, conc, 0, 0, 0).castShadow = false;
  const ch = 0x3A4046,
    ch2 = 0x4A525A,
    wt = 0xF2F4F5;
  BX(g, 0.6, H, D, ch, -W / 2 + 0.3, 0.3, 0);
  BX(g, 0.6, H, D, ch, W / 2 - 0.3, 0.3, 0);
  BX(g, W, H, 0.6, ch, 0, 0.3, -D / 2 + 0.3);
  BX(g, W - 1.2, 0.04, D - 1, 0x6E757B, 0, 0.3, 0).castShadow = false;
  const fz = D / 2;

  const woodCan = () => {
    const S = 256,
      [c, x] = mkc(S, S);
    for (let i = 0; i < 16; i++) {
      const v = (Math.random() - 0.5) * 24;
      x.fillStyle = 'rgb(' + Math.round(98 + v) + ',' + Math.round(62 + v * 0.7) + ',' + Math.round(36 + v * 0.5) + ')';
      x.fillRect(i * 16, 0, 16, S);
      for (let k = 0; k < 26; k++) {
        x.fillStyle = 'rgba(40,22,10,' + (0.08 + Math.random() * 0.17) + ')';
        x.fillRect(i * 16 + (Math.random() * 13 + 1), Math.random() * S, 1, Math.random() * 60 + 10);
      }
      x.fillStyle = 'rgba(20,10,4,.85)';
      x.fillRect(i * 16, 0, 1.6, S);
    }
    return c;
  };
  const woodT = new THREE.CanvasTexture(woodCan());
  woodT.encoding = THREE.sRGBEncoding;
  woodT.anisotropy = 8;
  const woodM = new THREE.MeshLambertMaterial({ map: woodT });
  onN(n => woodM.color.setHex(n ? 0x6A7A86 : 0xFFFFFF));

  const hGlass = new THREE.MeshPhongMaterial({
    color: 0x6FA8C8,
    specular: 0xFFFFFF,
    shininess: 110,
    transparent: true,
    opacity: 0.55
  });
  onN(n => {
    hGlass.color.setHex(n ? 0xDDB870 : 0x6FA8C8);
    hGlass.opacity = n ? 0.6 : 0.55;
  });

  const ledM = new THREE.MeshBasicMaterial({ color: 0xDCE8EE });
  onN(n => ledM.color.setHex(n ? 0xD9C48E : 0xDCE8EE));

  BX(g, 17, 7.2, 0.35, woodM, 3.75, 0.3, fz).castShadow = true;
  BX(g, 17.4, 0.3, 0.5, 0x23282C, 3.75, 7.5, fz + 0.05);
  BX(g, 17.4, 0.22, 0.5, 0x23282C, 3.75, 0.3, fz + 0.05);
  BX(g, 0.3, 7.4, 0.5, 0x23282C, -4.9, 0.3, fz + 0.05);
  BX(g, 0.3, 7.4, 0.5, 0x23282C, 12.4, 0.3, fz + 0.05);
  BX(g, 0.18, 2.2, 0.2, 0xB9C2C8, -3.9, 2.4, fz + 0.3);
  BX(g, 7.4, H - 0.3, 0.4, 0x1B2A36, -9.4, 0.3, fz - 0.4).castShadow = false;
  BX(g, 7.2, H - 1.2, 0.2, hGlass, -9.4, 0.6, fz + 0.05).castShadow = false;
  for (let k = 0; k <= 4; k++) BX(g, 0.14, H - 0.9, 0.5, 0x23282C, -13 + k * 1.8, 0.5, fz + 0.12);
  BX(g, 7.6, 0.3, 0.55, 0x23282C, -9.4, 4.4, fz + 0.1);
  BX(g, 7.6, 0.3, 0.55, 0x23282C, -9.4, 8.5, fz + 0.1);
  [-12.6, -6.2].forEach(x => BX(g, 0.3, H, 1.1, ch2, x, 0.3, fz + 0.45));
  BX(g, 1, H - 0.6, 0.5, ch2, 13, 0.3, fz);
  BX(g, W, 1.4, 0.7, ch, 0, 7.9, fz - 0.1);
  BX(g, W + 3, 0.5, D + 6, wt, 0, H, 2.5);
  BX(g, W + 3.1, 0.12, 0.16, ledM, 0, H - 0.13, fz + 5.4).castShadow = false;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 7; c++) {
      const p = BX(g, 2.6, 0.08, 1.5, 0x1C3A5A, -9 + c * 3.1, H + 0.5, -6 + r * 3.6);
      p.rotation.x = -0.18;
      p.castShadow = false;
    }
  const sg = Dtex(256, 64, (c, Wd, Ht) => {
    c.fillStyle = '#23282C';
    c.fillRect(0, 0, Wd, Ht);
    c.fillStyle = '#fff';
    c.font = 'bold 34px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('HANGAR ' + no, Wd / 2, Ht / 2 + 2);
  });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({ map: sg }));
  pl.position.set(3.75, 8.6, fz + 0.45);
  g.add(pl);
  [-1, 1].forEach(s => {
    glow(warmG, 3.75 + s * 7.5, 8.6, fz + 1.2, 9, g);
  });
  glow(warmG, -9.4, 5, fz + 1, 14, g);
  const pool = new THREE.Mesh(poolG, poolM);
  pool.scale.set(1.6, 1, 0.9);
  pool.position.set(3.75, 0.1, fz + 6);
  g.add(pool);
}

export function initAirport() {
  BX(scene, 7, 0.06, 30, asph, 0, 0, -250).castShadow = false;
  flat(0.3, 30, 0xE6B84D, 0, -250, 0.1);
  BX(scene, 7, 0.06, 100, asph, 0, 0, -315).castShadow = false;
  flat(0.3, 100, 0xE6B84D, 0, -315, 0.1);
  BX(scene, 50, 0.06, 7, asph, 25, 0, -302).castShadow = false;
  flat(100, 44, conc, 86, -310, 0.02);

  [[LRZ, '09', '27'], [TRZ, '09', '27']].forEach(r => {
    flat(180, 12, rwTex(r[1], r[2]), 101, r[0], 0.04);
    for (let x = 14; x <= 190; x += 16)
      [-6.6, 6.6].forEach(dz => add(scene, new THREE.SphereGeometry(0.3, 6, 6), rl, x, 0.3, r[0] + dz).castShadow = false);
    [-5, -2.5, 0, 2.5, 5].forEach(dz => add(scene, new THREE.SphereGeometry(0.3, 6, 6), gl, 11, 0.3, r[0] + dz).castShadow = false);
  });

  const NET = mk([
    [100, LRZ],
    [126, LRZ],
    [142, -280],
    [170, -280],
    [170, -332],
    [30, -332],
    [30, -352],
    [46, -352]
  ]);
  rib(NET, 8, ta, 0.03);
  let a = 0;
  for (let q = 0; q <= NET.len; q += 0.5) {
    if (NET.at(q).z < -262.3) {
      a = Math.max(0, q - 7);
      break;
    }
  }
  rib(sl(NET, a, NET.len), 0.35, yl, 0.06);

  for (let q = 0; q < NET.len; q += 7) {
    const pt = NET.at(q);
    if (pt.z > -269.5 || pt.z < -345) continue;
    [-1, 1].forEach(k =>
      add(scene, new THREE.SphereGeometry(0.22, 6, 6), bl, pt.x + Math.cos(pt.psi) * 4.3 * k, 0.25, pt.z - Math.sin(pt.psi) * 4.3 * k).castShadow = false
    );
  }

  const STANDS = [64, 88, 112];
  STANDS.forEach(sx => {
    const L = mk([[sx + 24, -332], [sx, -332], [sx, -318]]);
    rib(L, 8, ta, 0.035);
    rib(L, 0.35, yl, 0.065);
    BX(scene, 2.8, 2.6, 3, 0xC9D6DF, sx, 0.6, -309.8);
    BX(scene, 3, 0.5, 3.2, 0x2E86C1, sx, 3, -309.8);
  });
  [-2, 2].forEach(d => flat(8, 0.4, 0xE6B84D, 30, -340 + d, 0.07));

  /* Terminal building */
  const gl2 = new THREE.MeshPhongMaterial({
    color: 0x8FD0EE,
    specular: 0xFFFFFF,
    shininess: 100,
    transparent: true,
    opacity: 0.55
  });
  const inner = new THREE.MeshBasicMaterial({ color: 0x9FB8C6 });
  const fr = M(0x22303B);
  const pan = M(0xE9EFF3);
  const stMat = M(0xB9C4CC);
  const rf = M(0xF7FAFC);
  const led = new THREE.MeshBasicMaterial({ color: 0xCFE6F2 });
  onN(n => {
    gl2.color.setHex(n ? 0x4E86A6 : 0x8FD0EE);
    gl2.opacity = n ? 0.35 : 0.55;
    inner.color.setHex(n ? 0xFFD98A : 0x9FB8C6);
    led.color.setHex(n ? 0xFFF1C8 : 0xCFE6F2);
  });
  const X = 92;
  const Z = -302;
  BX(scene, 88, 0.8, 22, stMat, X, 0, Z);
  BX(scene, 78.4, 7.4, 10.4, inner, X, 0.8, Z);
  BX(scene, 1, 8.4, 12, pan, X - 39.7, 0.8, Z);
  BX(scene, 1, 8.4, 12, pan, X + 39.7, 0.8, Z);
  BX(scene, 0.5, 7.6, 11.6, gl2, X - 40.3, 0.9, Z);
  BX(scene, 79.6, 7.6, 0.5, gl2, X, 0.9, Z - 6.2);
  BX(scene, 79.6, 7.6, 0.5, gl2, X, 0.9, Z + 6.2);
  for (let i = 0; i <= 20; i++) {
    const x = X - 39.6 + i * 3.96;
    BX(scene, 0.3, 8.2, 0.35, fr, x, 0.8, Z - 6.4);
    BX(scene, 0.3, 8.2, 0.35, fr, x, 0.8, Z + 6.4);
  }
  for (let k = 0; k < 7; k++) BX(scene, 0.35, 8.2, 0.3, fr, X - 40.6, 0.8, Z - 5.7 + k * 1.9);
  [3.4, 6.6].forEach(y => {
    BX(scene, 80, 0.22, 0.4, fr, X, y, Z - 6.4);
    BX(scene, 80, 0.22, 0.4, fr, X, y, Z + 6.4);
    BX(scene, 0.4, 0.22, 12, fr, X - 40.6, y, Z);
  });
  [-7.5, 0, 7.5].forEach(dz => BX(scene, 0.5, 3.5, 5, fr, X - 40.7, 0.9, Z + dz));
  const sh = new THREE.Shape();
  sh.moveTo(-9.5, 0);
  sh.quadraticCurveTo(0, 9, 9.5, 0);
  sh.lineTo(9, -0.6);
  sh.quadraticCurveTo(0, 7.9, -9, -0.6);
  sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: 86, bevelEnabled: false, curveSegments: 18 });
  rg.translate(0, 0, -43);
  rg.rotateY(Math.PI / 2);
  const rm = new THREE.Mesh(rg, rf);
  rm.position.set(X, 8.8, Z);
  rm.castShadow = true;
  scene.add(rm);
  for (let i = -3; i <= 3; i++) BX(scene, 1, 0.4, 13, stMat, X + i * 12, 8.4, Z);
  BX(scene, 10, 0.5, 34, pan, X - 45, 6.9, Z);
  BX(scene, 10, 0.12, 34, led, X - 45, 6.78, Z);
  [-316, -312, -308, -296, -292, -288].forEach(zz => {
    CY(scene, 0.32, 0.32, 6.9, stMat, X - 49.2, 0, zz, 10);
    glow(warmG, X - 45, 6.6, zz, 6);
  });
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 200;
  {
    const x = c.getContext('2d'),
      g = x.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, '#0B2A44');
    g.addColorStop(1, '#13507F');
    x.fillStyle = g;
    x.fillRect(0, 0, 1024, 200);
    x.fillStyle = '#fff';
    x.font = 'bold 118px Arial';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('AIRPORT', 560, 92);
    x.font = 'bold 32px Arial';
    x.fillStyle = '#8FD0EE';
    x.fillText('City International - Departures & Arrivals', 560, 168);
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(80, 100);
    x.lineTo(200, 70);
    x.lineTo(230, 100);
    x.lineTo(200, 130);
    x.closePath();
    x.fill();
  }
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(26, 5.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
  sg.position.set(X - 49.9, 10.2, Z);
  sg.rotation.y = -Math.PI / 2;
  scene.add(sg);
  [-11, 11].forEach(dz => CY(scene, 0.18, 0.18, 3, fr, X - 49.7, 7.4, Z + dz, 6));

  /* Control tower */
  const TX = 142;
  const TZ = -296;
  CY(scene, 1.5, 2.4, 26, 0xE2ECF3, TX, 0, TZ, 24);
  [7, 13, 19].forEach(y => CY(scene, 2.5, 2.5, 0.35, fr, TX, y, TZ, 20));
  CY(scene, 5.6, 3.2, 2.6, fr, TX, 26, TZ, 20);
  CY(scene, 5.6, 5.6, 3.2, gl2, TX, 28.6, TZ, 24);
  CY(scene, 5.9, 5.9, 0.5, fr, TX, 31.8, TZ, 24);
  CY(scene, 5.2, 6, 0.6, rf, TX, 32.3, TZ, 24);
  CY(scene, 0.12, 0.2, 6, 0x8A99A4, TX, 32.9, TZ, 6);
  CY(scene, 4.8, 4.8, 0.2, led, TX, 28.9, TZ, 24);
  add(scene, new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFF3B30 }), TX, 39, TZ);
  glow(redG, TX, 39, TZ, 3);
  [76, 100, 124, 148].forEach(x => {
    CY(scene, 0.2, 0.32, 15, fr, x, 0, -324, 8);
    BX(scene, 2.6, 0.4, 0.9, led, x, 15, -324);
    glow(warmG, x, 15, -324, 14);
    const p = new THREE.Mesh(poolG, poolM);
    p.scale.set(2.2, 2.2, 2.2);
    p.position.set(x, 0.12, -322);
    scene.add(p);
  });

  /* Parked plane at middle gate */
  const pGate = mkPlane(0x0B3D91, true);
  pGate.position.set(88, 0, -318);

  /* Flight cycles */
  flights = [[0x1F6FD0, 112], [0x5BB4EC, 64]].map((clr, j) => {
    const ph = cycle(clr[1]);
    const cyc = ph.reduce((tot, step) => tot + step.dur, 0);
    return {
      g: mkPlane(clr[0]),
      ph,
      cyc,
      off: (j * cyc) / 2,
      psi: null,
      pit: 0,
      bank: 0
    };
  });

  /* Hangars and Helipad */
  hangar(66, 1);
  hangar(104, 2);
  hangar(142, 3);

  const apad = new THREE.Group();
  apad.position.set(AP.x, 0, AP.z);
  scene.add(apad);
  airPad(apad);
  BX(apad, 4, 2.6, 3, 0xE9EEF1, 14, 0, 5).castShadow = false;
  BX(apad, 4.4, 0.25, 3.4, 0xC8302A, 14, 2.6, 5);
  BX(apad, 0.12, 1.6, 1.1, 0x4A5A66, 12, 0, 5);
  [[12.4, -1.5], [13.4, -2.1], [14.4, -1.5]].forEach(c => CY(apad, 0.02, 0.2, 0.55, 0xF26B21, c[0], 0, c[1] + 4, 10));

  /* Perimeter fence */
  const FX0 = -64,
    FX1 = 204,
    FZ0 = -242,
    FZ1 = -400;
  const fc = document.createElement('canvas');
  fc.width = fc.height = 32;
  {
    const x = fc.getContext('2d');
    x.strokeStyle = '#fff';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(32, 32);
    x.moveTo(32, 0);
    x.lineTo(0, 32);
    x.stroke();
  }
  const fT = new THREE.CanvasTexture(fc);
  fT.wrapS = fT.wrapT = THREE.RepeatWrapping;
  const fM = new THREE.MeshLambertMaterial({ map: fT, color: 0xB8C4CC, transparent: true, alphaTest: 0.4, side: 2 });
  const fp = [];
  function fence(x1, z1, x2, z2) {
    const L = Math.hypot(x2 - x1, z2 - z1);
    const g = new THREE.PlaneGeometry(L, 3.2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, (uv.getX(i) * L) / 2.4);
      uv.setY(i, uv.getY(i) * 1.3);
    }
    const m = new THREE.Mesh(g, fM);
    const ang = -Math.atan2(z2 - z1, x2 - x1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    m.position.set(cx, 1.9, cz);
    m.rotation.y = ang;
    scene.add(m);
    [0.3, 3.5].forEach(y => {
      const r = BX(scene, L, 0.14, 0.14, 0x8A99A4, cx, y - 0.07, cz);
      r.rotation.y = ang;
      r.castShadow = false;
    });
    const n = Math.ceil(L / 6);
    for (let i = 0; i <= n; i++) fp.push([x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n]);
  }
  fence(FX0, FZ0, -11.6, FZ0);
  fence(11.6, FZ0, FX1, FZ0);
  fence(FX1, FZ0, FX1, FZ1);
  fence(FX1, FZ1, FX0, FZ1);
  fence(FX0, FZ1, FX0, FZ0);
  {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), M(0x7C8B96), fp.length);
    const o = new THREE.Object3D();
    fp.forEach((p, i) => {
      o.position.set(p[0], 1.8, p[1]);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    scene.add(im);
  }

  /* Gate */
  [-1, 1].forEach(s => {
    BX(scene, 2.6, 10, 2.6, 0xE7F0F7, s * 10.6, 0, FZ0);
    BX(scene, 3.2, 0.6, 3.2, 0x2E86C1, s * 10.6, 10, FZ0);
    add(scene, new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFE9A0 }), s * 10.6, 11.1, FZ0).castShadow = false;
    const g = new THREE.Group();
    g.position.set(s * 9.3, 0, FZ0);
    g.rotation.y = -s * 1.35;
    scene.add(g);
    [0.4, 1.8, 3.2, 4.4].forEach(y => BX(g, 8, 0.22, 0.25, 0x2E86C1, -s * 4, y, 0));
    for (let k = 0; k <= 8; k++) BX(g, 0.16, 4.6, 0.2, 0x2E86C1, -s * k, 0, 0);
    BX(g, 0.5, 4.6, 0.3, 0x1F5E8A, 0, 0, 0);
  });
  BX(scene, 25, 1.2, 2.4, 0x2E86C1, 0, 10, FZ0);
  {
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 1024;
    cCanvas.height = 256;
    const x = cCanvas.getContext('2d');
    x.fillStyle = '#111820';
    x.fillRect(0, 0, 1024, 256);
    x.strokeStyle = '#4FA8DE';
    x.lineWidth = 10;
    x.strokeRect(8, 8, 1008, 240);
    x.textAlign = 'center';
    x.fillStyle = '#BEE4FB';
    x.font = '600 40px "Space Grotesk",Arial';
    x.fillText('WELCOME TO', 512, 80);
    x.fillStyle = '#fff';
    x.font = '700 96px "Space Grotesk",Arial';
    x.fillText('CITY AIRPORT', 512, 170);
    x.fillStyle = '#E6B84D';
    x.font = '500 30px Inter,Arial';
    x.fillText('Terminal and gates straight ahead', 512, 222);
    const t = new THREE.CanvasTexture(cCanvas);
    const bm = new THREE.MeshBasicMaterial({ map: t, fog: false });
    t.encoding = THREE.sRGBEncoding;
    [[1, 0], [-1, Math.PI]].forEach(p => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(23, 5.75), bm);
      m.position.set(0, 14.2, FZ0 + p[0] * 1.25);
      m.rotation.y = p[1];
      scene.add(m);
    });
    BX(scene, 23.4, 0.3, 2.6, 0x1F5E8A, 0, 11.2, FZ0);
    BX(scene, 23.4, 0.3, 2.6, 0x1F5E8A, 0, 17.1, FZ0);
  }
  BX(scene, 4.4, 3.4, 3.4, 0xEFD9B4, -16, 0, FZ0 - 4);
  BX(scene, 5, 0.4, 4, 0x2E86C1, -16, 3.4, FZ0 - 4);
  BX(scene, 4.4, 3.4, 3.4, 0xEFD9B4, 16, 0, FZ0 - 4);
  BX(scene, 5, 0.4, 4, 0x2E86C1, 16, 3.4, FZ0 - 4);
}
