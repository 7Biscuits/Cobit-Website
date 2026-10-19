import { scene, onN } from '../core/scene.js';
import { M, BX, CY, add, flat, label, rod, contM, fabM, hullMat, once, ltex, TW, flag, glow, warmG, redG, grnG, whtG, poolM, poolG, lampW, bulbG } from '../core/materials.js';
import { mkc, Dtex2, rustCan, steelCan, corrCan, quayCan, plankCan, hullCan, BNAMES } from '../utils/textures.js';
import { clamp, lerp, rr, sstep, wn, trap } from '../utils/math.js';
import { zNb, zFb, asph } from '../world/environment.js';
import { CTC } from '../config.js';
import { glassM } from './vehicles.js';

export const portG = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10);
portG.rotateX(Math.PI / 2);
export const fendG = new THREE.SphereGeometry(0.17, 6, 5);
export const ringG = new THREE.TorusGeometry(0.26, 0.07, 6, 14);
export const blkM = new THREE.MeshLambertMaterial({ color: 0x15191C });
export const orgM = new THREE.MeshLambertMaterial({ color: 0xF0701E });

const vmc = {};
export function vm(c, tx) {
  const k = c + (tx || 'h');
  return (
    vmc[k] ||
    (vmc[k] = (() => {
      const m = new THREE.MeshPhongMaterial({
        color: c,
        specular: 0x8A9096,
        shininess: 60,
        side: THREE.DoubleSide
      });
      ltex(m, once(tx === 'rust' ? 'rustC' : 'hull', tx === 'rust' ? rustCan : hullCan), 1 / 5, 1);
      return m;
    })())
  );
}

const dmc = {};
export function dm(k) {
  return (
    dmc[k] ||
    (dmc[k] = (() => {
      const m = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
      ltex(m, once(k === 'steel' ? 'steelC' : 'plankC', k === 'steel' ? steelCan : plankCan), k === 'steel' ? 1 / 4 : 1 / 3, 1);
      return m;
    })())
  );
}

const corrc = {};
export function corr(c) {
  return (
    corrc[c] ||
    (corrc[c] = (() => {
      const m = new THREE.MeshLambertMaterial({ color: c });
      ltex(m, once('corrC', corrCan), 1 / 3, 1);
      return m;
    })())
  );
}

export const quayM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
ltex(quayM, once('quayC', quayCan), 1 / 10, 1);
onN(n => quayM.color.setHex(n ? 0x4A5A66 : 0xFFFFFF));

export const winT = (() => {
  const [c, x] = mkc(128, 64);
  x.fillStyle = '#e9eef2';
  x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 2; i++) {
    const px = i * 64 + 5;
    const g = x.createLinearGradient(0, 6, 0, 58);
    g.addColorStop(0, '#86b2d4');
    g.addColorStop(0.45, '#2e506d');
    g.addColorStop(1, '#0f1e2b');
    x.fillStyle = g;
    x.fillRect(px, 7, 54, 50);
    x.fillStyle = 'rgba(255,255,255,.22)';
    x.beginPath();
    x.moveTo(px + 4, 57);
    x.lineTo(px + 20, 7);
    x.lineTo(px + 30, 7);
    x.lineTo(px + 14, 57);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
})();

export const winM = new THREE.MeshPhongMaterial({
  map: winT,
  specular: 0xBFD8EE,
  shininess: 120,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2
});
onN(n => winM.emissive.setHex(n ? 0x2A200F : 0));

export function winStrip(g, x, y, z, len, h, ry) {
  const pg = new THREE.PlaneGeometry(len, h);
  const uv = pg.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * len) / 1.3, uv.getY(i));
  const m = new THREE.Mesh(pg, winM);
  m.position.set(x, y, z);
  m.rotation.y = ry || 0;
  g.add(m);
  return m;
}

const nameT = {};
export function nameTex2(n, dk) {
  const k = n + (dk ? 'd' : 'l');
  return (
    nameT[k] ||
    (nameT[k] = Dtex2(256, 48, (g, W, H) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = dk ? '#F4F1E6' : '#16202A';
      g.font = 'bold 34px Arial';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(n, W / 2, H / 2 + 2);
    }))
  );
}

export function bollard(x, z) {
  CY(scene, 0.34, 0.38, 0.28, 0x1E262C, x, 0.6, z, 12);
  CY(scene, 0.24, 0.28, 0.45, 0x2A343D, x, 0.88, z, 12);
  CY(scene, 0.34, 0.28, 0.14, 0xC8302A, x, 1.3, z, 12);
}

export const zf = (q, f, fl) =>
  q.hw * Math.sqrt(Math.max(0, 1 - Math.pow(f, 2.6))) * (1 + fl * clamp((q.t - 0.5) / 0.5, 0, 1) * (1 - f));

export function stations(L, W, H, o) {
  const NX = 30;
  const bs = 1 - (o.bow || 0.3);
  const tr = o.tr || 0.85;
  const sh = o.sheer == null ? 0.18 : o.sheer;
  const S = [];
  for (let i = 0; i <= NX; i++) {
    const t = i / NX;
    let hw;
    if (t < 0.12) hw = (W / 2) * (tr + (1 - tr) * Math.sin((t / 0.12) * Math.PI * 0.5));
    else if (t <= bs) hw = W / 2;
    else {
      const u = (t - bs) / (1 - bs);
      hw = (W / 2) * Math.pow(Math.max(0, 1 - Math.pow(u, 2.1)), 0.62);
    }
    S.push({
      t,
      x: -L / 2 + L * t,
      hw,
      yt: H - 0.2 + sh * (Math.pow(t, 3) + 0.1 * Math.pow(1 - t, 3)),
      yb: -0.2 + (t > 0.7 ? Math.pow((t - 0.7) / 0.3, 1.7) * H * 0.62 : 0) + (t < 0.1 ? (1 - t / 0.1) * H * 0.1 : 0)
    });
  }
  return S;
}

export function hmesh(g, P, I, mat, sh) {
  const G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  G.setIndex(I);
  G.computeVertexNormals();
  const m = new THREE.Mesh(G, mat);
  m.castShadow = sh !== false;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

export function hreg(g, st, fa, fb, M_steps, mat, fl) {
  const P = [];
  const I = [];
  const K = 2 * (M_steps + 1);
  st.forEach(q => {
    const a = fa(q);
    const b = fb(q);
    for (let j = 0; j < K; j++) {
      const m = j <= M_steps ? j : 2 * M_steps + 1 - j;
      const f = a + ((b - a) * m) / M_steps;
      P.push(q.x, q.yt - (q.yt - q.yb) * f, zf(q, f, fl) * (j <= M_steps ? -1 : 1));
    }
  });
  for (let i = 0; i < st.length - 1; i++) {
    for (let j = 0; j < K - 1; j++) {
      if (j === M_steps) continue;
      const a = i * K + j;
      const c = a + K;
      I.push(a, a + 1, c + 1, a, c + 1, c);
    }
  }
  return hmesh(g, P, I, mat);
}

export function hdeck(g, st, mat, fl) {
  const P = [];
  const I = [];
  st.forEach(q => {
    const w = zf(q, 0, fl) * 0.99;
    P.push(q.x, q.yt, -w, q.x, q.yt + 0.04, 0, q.x, q.yt, w);
  });
  for (let i = 0; i < st.length - 1; i++) {
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j;
      const c = a + 3;
      I.push(a, a + 1, c + 1, a, c + 1, c);
    }
  }
  hmesh(g, P, I, mat, false);
}

export function hwall(g, st, mat, h, fl) {
  [-1, 1].forEach(s => {
    const P = [];
    const I = [];
    st.forEach(q => {
      const z = s * zf(q, 0, fl) * 0.985;
      P.push(q.x, q.yt, z, q.x, q.yt + h, z);
    });
    for (let i = 0; i < st.length - 1; i++) {
      const a = i * 2;
      I.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    hmesh(g, P, I, mat);
  });
  const q = st[0];
  BX(g, 0.06, h, zf(q, 0, fl) * 1.97, mat, q.x + 0.03, q.yt, 0);
}

export function rails(g, st, fl, t0, t1, h, c, two) {
  [-1, 1].forEach(s => {
    let prev = null;
    for (let i = Math.round(t0 * 30); i <= Math.round(t1 * 30); i += 2) {
      const q = st[i];
      const z = s * zf(q, 0, fl) * 0.93;
      const y = q.yt + 0.04;
      if (i % 4 === 0) CY(g, 0.015, 0.015, h, c, q.x, y, z, 4);
      const top = [q.x, y + h, z];
      const mid = [q.x, y + h * 0.5, z];
      if (prev) {
        rod(g, prev.top, top, 0.012, c);
        if (two) rod(g, prev.mid, mid, 0.012, c);
      }
      prev = { top, mid };
    }
  });
}

export function HULL(g, o) {
  const st = stations(o.L, o.W, o.H, o);
  const fl = o.flare == null ? 0.1 : o.flare;
  const dp = q => q.yt - q.yb;
  const top = vm(o.c, o.tx);
  const f17 = q => Math.min(0.98, Math.max(0, (q.yt - 0.17) / dp(q)));
  const f02 = q => Math.min(0.99, Math.max(0.02, (q.yt + 0.02) / dp(q)));
  if (o.stripe) {
    const s1 = o.s1 || 0.17;
    const s2 = o.s2 || 0.28;
    hreg(g, st, () => 0, q => s1 / dp(q), 2, top, fl);
    hreg(g, st, q => s1 / dp(q), q => s2 / dp(q), 1, vm(o.stripe), fl);
    hreg(g, st, q => s2 / dp(q), f17, 3, top, fl);
  } else {
    hreg(g, st, () => 0, f17, 4, top, fl);
  }
  hreg(g, st, f17, f02, 1, vm(o.boot || 0xF1ECE0), fl);
  hreg(g, st, f02, () => 1, 4, vm(o.anti || 0x7A1F1B), fl);
  hdeck(g, st, dm(o.deck || 'teak'), fl);
  if (o.bw) hwall(g, st, vm(o.bwc || o.c, o.tx), o.bw, fl);
  return st;
}

export function hfit(g, st, o) {
  const fl = o.flare == null ? 0.1 : o.flare;
  const nm = o.name || BNAMES[Math.round(o.L * 7) % 8];
  [1, -1].forEach(s => {
    const q = st[22];
    const y = q.yt - 0.45;
    const f = (q.yt - y) / (q.yt - q.yb);
    const z = zf(q, f, fl);
    const pl = new THREE.Mesh(
      new THREE.PlaneGeometry(o.L * 0.3, 0.4),
      new THREE.MeshBasicMaterial({ map: nameTex2(nm, o.dk), transparent: true })
    );
    pl.position.set(q.x - o.L * 0.02, y, s * (z + 0.03));
    pl.rotation.y = s > 0 ? 0 : Math.PI;
    g.add(pl);
    if (!o.noport) {
      const n = Math.max(2, Math.floor(o.L / 2.4));
      for (let k = 0; k < n; k++) {
        const p = st[4 + Math.round((k * 16) / n)];
        const yy = p.yt - 0.3;
        const ff = (p.yt - yy) / (p.yt - p.yb);
        add(g, portG, glassM, p.x, yy, s * (zf(p, ff, fl) + 0.012)).castShadow = false;
      }
    }
    if (o.fend) {
      const step = Math.max(1, Math.floor(20 / o.fend));
      for (let k = 0; k < o.fend; k++) {
        const p = st[5 + k * step];
        if (p) add(g, fendG, blkM, p.x, p.yt - 0.05, s * (zf(p, 0, fl) + 0.12)).castShadow = false;
      }
    }
  });
}

export function cabin(g, x, y, w, h, d, wall, roof, o) {
  o = o || {};
  BX(g, w, h, d, wall, x, y, 0);
  BX(g, w + 0.14, 0.1, d + 0.14, roof, x, y + h, 0);
  const wy = y + h * (o.wy || 0.55);
  const wh = h * (o.wh || 0.45);
  [1, -1].forEach(s => winStrip(g, x, wy, s * (d / 2 + 0.012), w * (o.sw || 0.86), wh, s > 0 ? 0 : Math.PI));
  if (!o.nofront) winStrip(g, x + w / 2 + 0.012, wy, 0, d * 0.86, wh, Math.PI / 2);
  if (o.back) winStrip(g, x - w / 2 - 0.012, wy, 0, d * 0.86, wh, -Math.PI / 2);
}

export function funnel(g, x, y, r, h, c1, c2, band) {
  CY(g, r, r * 1.05, h, c1, x, y, 0, 14);
  CY(g, r * 1.07, r * 1.07, h * 0.18, band || 0xFFFFFF, x, y + h * 0.5, 0, 14);
  CY(g, r * 1.04, r * 1.04, h * 0.17, c2, x, y + h * 0.83, 0, 14);
  BX(g, r * 2.1, 0.04, r * 2.1, 0x222a30, x, y + h, 0);
}

export function lifebuoy(g, x, y, z) {
  add(g, ringG, orgM, x, y, z).castShadow = false;
}

export function sailM(g, A, B, C, bel, c) {
  const n = 8;
  const P = [];
  const I = [];
  const id = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    id[i] = [];
    for (let j = 0; j <= n - i; j++) {
      const u = i / n;
      const v = j / n;
      const w = 1 - u - v;
      P.push(
        A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v,
        A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v,
        A[2] + bel * 27 * u * v * w
      );
      id[i][j] = k++;
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n - i; j++) {
      I.push(id[i][j], id[i + 1][j], id[i][j + 1]);
      if (j < n - i - 1) I.push(id[i + 1][j], id[i + 1][j + 1], id[i][j + 1]);
    }
  hmesh(g, P, I, fabM(c));
}

export const CT2 = [0xC8302A, 0x2E86C1, 0xE6B84D, 0x2E9E6B, 0xE0895A, 0x8A4FD0];

export const VES = {
  speed(g) {
    const o = {
      L: 5,
      W: 1.7,
      H: 0.8,
      c: 0xF6F7F8,
      stripe: 0xC8302A,
      s1: 0.1,
      s2: 0.26,
      boot: 0xF6F7F8,
      anti: 0x20262B,
      bow: 0.36,
      tr: 0.9,
      sheer: 0.12,
      flare: 0.16,
      noport: 1,
      name: 'SEA WOLF'
    };
    const st = HULL(g, o);
    const yd = 0.64;
    hfit(g, st, o);
    BX(g, 0.06, 0.5, 1.3, glassM, 0.75, yd, 0).rotation.z = 0.55;
    BX(g, 0.05, 0.05, 1.34, 0xC9D3DA, 0.66, yd + 0.5, 0);
    BX(g, 0.5, 0.38, 1.0, 0xE9EEF2, 0.4, yd, 0);
    BX(g, 0.52, 0.06, 1.04, 0x1B2430, 0.4, yd + 0.38, 0);
    BX(g, 0.7, 0.26, 1.2, 0x1E2A36, -0.6, yd, 0);
    BX(g, 0.12, 0.42, 1.2, 0x1E2A36, -1.0, yd, 0);
    BX(g, 0.4, 0.3, 0.5, 0x1E2A36, -0.05, yd, 0.0);
    [-0.45, 0.45].forEach(z => {
      BX(g, 0.42, 0.9, 0.34, 0xE9EEF2, -2.62, -0.35, z);
      BX(g, 0.5, 0.34, 0.38, 0xC8302A, -2.58, 0.4, z);
    });
    rails(g, st, o.flare, 0.58, 0.97, 0.2, 0xDDE3E7, 0);
    CY(g, 0.015, 0.015, 0.8, 0xDDE3E7, -2.2, yd, 0, 4);
    add(g, new THREE.PlaneGeometry(0.35, 0.22), new THREE.MeshLambertMaterial({ color: 0xC8302A, side: 2 }), -2.0, yd + 0.7, 0);
  },
  yacht(g) {
    const o = {
      L: 9,
      W: 2.7,
      H: 1,
      c: 0xFAFAF8,
      stripe: 0x1F4E7A,
      s1: 0.14,
      s2: 0.3,
      boot: 0xF1ECE0,
      anti: 0x1B2430,
      bow: 0.36,
      tr: 0.88,
      sheer: 0.22,
      flare: 0.12,
      fend: 4,
      name: 'AURORA'
    };
    const st = HULL(g, o);
    const yd = 0.84;
    hfit(g, st, o);
    cabin(g, -0.9, yd, 5.0, 0.95, 2.15, 0xF8F9F9, 0xE6EAED);
    cabin(g, -1.4, yd + 1.05, 3.1, 0.8, 1.75, 0xF8F9F9, 0xFFFFFF, { back: 1 });
    cabin(g, -0.8, yd + 2.0, 1.5, 0.5, 1.3, 0xF8F9F9, 0xFFFFFF, { wh: 0.6 });
    [-0.82, 0.82].forEach(z => BX(g, 0.1, 0.8, 0.1, 0xE6EAED, -2.5, yd + 2.0, z));
    BX(g, 0.1, 0.1, 1.75, 0xE6EAED, -2.5, yd + 2.8, 0);
    BX(g, 0.7, 0.05, 0.12, 0x444c52, -2.5, yd + 3.0, 0);
    add(g, new THREE.SphereGeometry(0.2, 10, 8), M(0xF4F4F0), -2.5, yd + 2.95, 0);
    CY(g, 0.03, 0.04, 1.0, 0xB8C2C8, -1.0, yd + 2.5, 0, 6);
    BX(g, 1.5, 0.16, 1.3, 0xF3EBDD, 2.3, yd, 0);
    BX(g, 1.1, 0.14, 1.4, 0xF3EBDD, -3.7, yd, 0);
    BX(g, 0.9, 0.07, 2.0, dm('teak'), -4.95, 0.1, 0);
    rails(g, st, o.flare, 0.6, 0.98, 0.3, 0xE9EEF2, 1);
    rails(g, st, o.flare, 0.04, 0.28, 0.3, 0xE9EEF2, 1);
    [1, -1].forEach(s => lifebuoy(g, -2.5, yd + 1.5, s * 0.93));
  },
  sail(g) {
    const o = {
      L: 6.6,
      W: 2.1,
      H: 0.8,
      c: 0xFFFFFF,
      stripe: 0x1F5E8A,
      s1: 0.08,
      s2: 0.2,
      boot: 0xFFFFFF,
      anti: 0x1B2F4A,
      bow: 0.4,
      tr: 0.8,
      sheer: 0.2,
      flare: 0.06,
      name: 'NORTH STAR'
    };
    const st = HULL(g, o);
    const yd = 0.64;
    hfit(g, st, o);
    cabin(g, -0.1, yd, 2.4, 0.5, 1.15, 0xF4F2EA, 0xD8CBB0, { wh: 0.5, sw: 0.82, nofront: 1 });
    BX(g, 0.5, 0.06, 0.6, 0xB8C2C8, 1.3, yd, 0);
    [1, -1].forEach(s => BX(g, 1.8, 0.28, 0.08, 0xD8CBB0, -2.0, yd, s * 0.7));
    BX(g, 0.04, 0.45, 0.04, 0x333F48, -2.6, yd, 0);
    add(g, ringG, M(0x20262B), -2.6, yd + 0.55, 0).rotation.y = Math.PI / 2;
    CY(g, 0.045, 0.06, 6.2, 0xC9D6DF, 1.0, yd, 0, 8);
    rod(g, [1.0, yd + 0.9, 0], [-2.9, yd + 0.75, 0], 0.03, 0xC9D6DF);
    sailM(g, [1.04, yd + 0.9, 0], [1.02, yd + 6.0, 0], [-2.8, yd + 0.85, 0], 0.35, 0xFFFFFF);
    sailM(g, [3.2, yd + 0.3, 0], [1.06, yd + 5.6, 0], [0.15, yd + 0.7, 0], 0.3, 0xFBF3DC);
    rod(g, [1, yd + 6.2, 0], [3.2, yd + 0.3, 0], 0.015, 0xDDE3E7);
    rod(g, [1, yd + 6.2, 0], [-3.1, yd + 0.5, 0], 0.015, 0xDDE3E7);
    [1, -1].forEach(s => {
      rod(g, [1, yd + 5.0, 0], [0.8, yd + 0.05, s * 0.95], 0.012, 0xDDE3E7);
      rod(g, [1, yd + 3.0, s * 0.02], [1, yd + 3.0, s * 0.55], 0.02, 0xC9D6DF);
    });
    rails(g, st, o.flare, 0.58, 0.98, 0.28, 0xDDE3E7, 1);
    add(g, new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshLambertMaterial({ color: 0xC8302A, side: 2 }), -3.1, yd + 0.7, 0);
  },
  trawler(g) {
    const o = {
      L: 7.6,
      W: 2.9,
      H: 1.1,
      c: 0x2A7F5E,
      tx: 'rust',
      stripe: 0xE9EEF2,
      s1: 0.1,
      s2: 0.2,
      boot: 0xE9E4D6,
      anti: 0x6E1D19,
      bow: 0.3,
      tr: 0.92,
      sheer: 0.16,
      flare: 0.14,
      deck: 'steel',
      bw: 0.42,
      name: 'BLUE HERON',
      dk: 1
    };
    const st = HULL(g, o);
    const yd = 0.94;
    hfit(g, st, o);
    cabin(g, 1.6, yd, 2.0, 1.2, 2.2, 0xF4F6F7, 0xC8302A);
    cabin(g, 1.5, yd + 1.3, 1.3, 0.75, 1.7, 0xF4F6F7, 0xE9EEF2, { wh: 0.55, back: 1 });
    funnel(g, 0.4, yd + 1.2, 0.28, 1.0, 0xC8302A, 0x111820, 0xFFFFFF);
    CY(g, 0.06, 0.08, 3.2, 0x333F48, 1.0, yd + 2.05, 0, 8);
    BX(g, 0.1, 0.1, 1.4, 0x333F48, 1.0, yd + 4.6, 0);
    BX(g, 0.5, 0.05, 0.1, 0x444c52, 1.9, yd + 2.1, 0);
    lifebuoy(g, 1.6, yd + 0.7, 1.12);
    lifebuoy(g, 1.6, yd + 0.7, -1.12);
    [1, -1].forEach(s => {
      BX(g, 0.14, 2.4, 0.14, 0x333F48, -3.0, yd, s * 1.05);
      rod(g, [-3, yd, s * 1.05], [-2.3, yd + 2.4, s * 0.2], 0.04, 0x333F48);
    });
    BX(g, 0.14, 0.14, 2.3, 0x333F48, -3.0, yd + 2.4, 0);
    add(g, new THREE.CylinderGeometry(0.34, 0.34, 1.7, 16), M(0xC8302A), -0.5, yd + 0.35, 0).rotation.x = Math.PI / 2;
    [1, -1].forEach(s =>
      add(g, new THREE.CylinderGeometry(0.46, 0.46, 0.06, 16), M(0x333F48), -0.5, yd + 0.35, s * 0.85).rotation.x = Math.PI / 2
    );
    const net = add(g, new THREE.SphereGeometry(0.55, 10, 6), M(0x3F7A55), -1.9, yd + 0.1, 0);
    net.scale.set(1.6, 0.5, 1.5);
    [1, -1].forEach(s => BX(g, 0.08, 0.9, 0.7, 0x333F48, -1.2, yd, s * 1.2));
    [
      [0.3, 0.8, 0xE6B84D],
      [0.3, -0.9, 0x2E86C1],
      [-0.1, 0.85, 0x2E86C1]
    ].forEach(c => BX(g, 0.6, 0.26, 0.4, c[2], c[0] - 0.4, yd, c[1]));
  },
  ferry(g) {
    const o = {
      L: 10,
      W: 3.7,
      H: 1.1,
      c: 0xF6F7F8,
      stripe: 0x1F5E8A,
      s1: 0.12,
      s2: 0.4,
      boot: 0x1F5E8A,
      anti: 0x1B2430,
      bow: 0.28,
      tr: 0.94,
      sheer: 0.14,
      flare: 0.08,
      deck: 'steel',
      bw: 0.3,
      bwc: 0xF6F7F8,
      fend: 5,
      name: 'HARBOUR QUEEN'
    };
    const st = HULL(g, o);
    const yd = 0.94;
    hfit(g, st, o);
    cabin(g, -0.2, yd, 7.6, 1.2, 3.3, 0xFAFAFA, 0xE8ECEF, { sw: 0.92, back: 1 });
    cabin(g, -0.6, yd + 1.3, 5.4, 1.05, 2.9, 0xFAFAFA, 0xFFFFFF, { sw: 0.92, back: 1 });
    cabin(g, 1.6, yd + 2.45, 1.4, 0.8, 2.3, 0xFAFAFA, 0xE8ECEF, { wh: 0.55, back: 1 });
    funnel(g, -2.0, yd + 2.45, 0.38, 1.1, 0xFFFFFF, 0x111820, 0x1F5E8A);
    CY(g, 0.06, 0.08, 1.6, 0xB8C2C8, 1.6, yd + 3.3, 0, 8);
    BX(g, 0.5, 0.05, 0.12, 0x444c52, 1.6, yd + 4.9, 0);
    rails(g, st, o.flare, 0.06, 0.26, 0.8, 0xE9EEF2, 1);
    rails(g, st, o.flare, 0.6, 0.97, 0.7, 0xE9EEF2, 1);
    [1, -1].forEach(s => {
      const b = add(g, new THREE.SphereGeometry(0.4, 10, 8), M(0xF0701E), -1.0, yd + 1.5, s * 1.6);
      b.scale.set(2.2, 0.5, 0.55);
    });
  },
  tug(g) {
    const o = {
      L: 6,
      W: 2.7,
      H: 1.1,
      c: 0x1B2026,
      stripe: 0xC8302A,
      s1: 0.14,
      s2: 0.36,
      boot: 0xC8302A,
      anti: 0x6E1D19,
      bow: 0.26,
      tr: 0.9,
      sheer: 0.12,
      flare: 0.06,
      deck: 'steel',
      bw: 0.22,
      fend: 8,
      name: 'TIDEWATER',
      dk: 1
    };
    const st = HULL(g, o);
    const yd = 0.94;
    hfit(g, st, o);
    cabin(g, -0.5, yd, 2.2, 1.0, 1.9, 0xF4F6F7, 0x1B2026, { sw: 0.8 });
    cabin(g, -0.2, yd + 1.1, 1.5, 0.75, 1.7, 0xF4F6F7, 0xC8302A, { wh: 0.55, back: 1 });
    funnel(g, -1.5, yd + 1.0, 0.36, 1.15, 0xC8302A, 0x111820, 0xFFFFFF);
    CY(g, 0.16, 0.2, 0.4, 0x111820, -2.3, yd, 0, 10);
    CY(g, 0.26, 0.16, 0.1, 0x111820, -2.3, yd + 0.4, 0, 10);
    [1, -1].forEach(s => BX(g, 0.1, 0.9, 0.1, 0x111820, -2.0, yd, s * 1.0));
    BX(g, 0.1, 0.1, 2.1, 0x111820, -2.0, yd + 0.9, 0);
    BX(g, 0.45, 0.7, 1.7, 0x0E141A, 2.45, yd - 0.2, 0);
    lifebuoy(g, -0.5, yd + 0.65, 0.97);
    lifebuoy(g, -0.5, yd + 0.65, -0.97);
  },
  cargo(g) {
    const o = {
      L: 16,
      W: 4.8,
      H: 1.8,
      c: 0x2B3640,
      stripe: null,
      boot: 0xE9EEF2,
      anti: 0x7A1F1B,
      bow: 0.2,
      tr: 0.92,
      sheer: 0.12,
      flare: 0.12,
      deck: 'steel',
      bw: 0.5,
      noport: 0,
      name: 'OCEAN PRIDE',
      dk: 1
    };
    const st = HULL(g, o);
    const yd = 1.64;
    hfit(g, st, o);
    cabin(g, -6.2, yd, 3.0, 1.2, 4.0, 0xF4F6F7, 0xE9EEF2, { back: 1, sw: 0.85 });
    cabin(g, -6.2, yd + 1.2, 2.9, 1.2, 3.9, 0xF4F6F7, 0xE9EEF2, { back: 1, sw: 0.85 });
    cabin(g, -6.2, yd + 2.4, 2.8, 1.2, 3.8, 0xF4F6F7, 0xE9EEF2, { back: 1, sw: 0.85 });
    cabin(g, -5.6, yd + 3.6, 1.7, 0.7, 4.4, 0xF4F6F7, 0xE9EEF2, { wh: 0.55, sw: 0.92, back: 1 });
    funnel(g, -7.3, yd + 3.6, 0.55, 1.6, 0xC8302A, 0x111820, 0xFFFFFF);
    CY(g, 0.05, 0.07, 1.4, 0xB8C2C8, -5.6, yd + 4.4, 0, 8);
    BX(g, 0.9, 0.05, 0.12, 0x444c52, -5.6, yd + 5.4, 0);
    BX(g, 10.4, 0.22, 4.0, 0x4A5560, 0.55, yd, 0);
    [-2.7, -0.2, 2.3, 4.8].forEach((x, i) =>
      [-1.05, 1.05].forEach((z, j) => {
        const T = i === 1 || i === 2 ? 3 : 2;
        for (let t = 0; t < T; t++) BX(g, 2.4, 1.2, 1.9, contM(CT2[(i + j * 2 + t * 3) % 6]), x, yd + 0.22 + t * 1.2, z);
      })
    );
    BX(g, 0.8, 0.4, 1.2, 0x8A99A4, 7.0, yd, 0);
    CY(g, 0.04, 0.04, 1.3, 0xDDE3E7, 7.7, yd, 0, 6);
    [1, -1].forEach(s => {
      BX(g, 0.9, 0.1, 0.1, 0xDDE3E7, -4.0, yd + 0.5, s * 2.0);
    });
  },
  barge(g) {
    const o = {
      L: 12,
      W: 4.3,
      H: 1.2,
      c: 0x6A5240,
      tx: 'rust',
      boot: 0x2A2A2A,
      anti: 0x2A1F1A,
      bow: 0.16,
      tr: 0.96,
      sheer: 0.02,
      flare: 0.02,
      deck: 'steel',
      bw: 0.3,
      noport: 1,
      name: 'MARIANA',
      dk: 1
    };
    const st = HULL(g, o);
    const yd = 1.04;
    hfit(g, st, o);
    [-4, -1.4, 1.2, 3.8].forEach((x, i) =>
      [-1.05, 1.05].forEach((z, j) => {
        for (let t = 0; t < 3; t++) BX(g, 2.4, 1.2, 1.9, contM(CT2[(i * 2 + j + t) % 6]), x, yd + t * 1.2, z);
      })
    );
    [-5.6, 5.4].forEach(x =>
      [1, -1].forEach(s => {
        CY(g, 0.16, 0.2, 0.36, 0x1E262C, x, yd, s * 1.7, 8);
      })
    );
    BX(g, 0.3, 0.6, 3.0, 0x2A1F1A, -5.85, yd, 0);
  }
};

export function buildVessel(k) {
  window.PAINT = true;
  try {
    return buildVessel0(k);
  } finally {
    window.PAINT = false;
  }
}

function buildVessel0(k) {
  const g = new THREE.Group();
  VES[k](g);
  g.traverse(o => {
    if (o.isMesh) o.castShadow = true;
  });
  scene.add(g);
  return g;
}

export const navM = {
  r: new THREE.MeshBasicMaterial({ color: 0x7A2A26 }),
  g: new THREE.MeshBasicMaterial({ color: 0x1F6B45 }),
  w: new THREE.MeshBasicMaterial({ color: 0xB8C4CC })
};
export const navG = new THREE.SphereGeometry(0.14, 8, 6);
export const beamM = new THREE.MeshBasicMaterial({
  color: 0xFFE9A0,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  fog: false
});
export const plights = [];

onN(n => {
  navM.r.color.setHex(n ? 0xFF3B30 : 0x7A2A26);
  navM.g.color.setHex(n ? 0x3BE07A : 0x1F6B45);
  navM.w.color.setHex(n ? 0xFFF3C4 : 0xB8C4CC);
  beamM.opacity = n ? 0.1 : 0;
  plights.forEach(l => (l.intensity = n ? 0.85 : 0));
});

export function quayLamp(x, z, light, ax = 0, az = -1) {
  CY(scene, 0.1, 0.14, 6.4, 0x111820, x, 0.6, z, 6);
  const hx = x + ax * 1.7;
  const hz = z + az * 1.7;
  if (ax) BX(scene, 1.8, 0.14, 0.14, 0x111820, x + ax * 0.9, 6.9, z);
  else BX(scene, 0.14, 0.14, 1.8, 0x111820, x, 6.9, z + az * 0.9);
  BX(scene, 0.7, 0.14, 0.7, 0x111820, hx, 7, hz);
  add(scene, bulbG, lampW, hx, 6.8, hz).castShadow = false;
  glow(warmG, hx, 6.8, hz, 6);
  const p = new THREE.Mesh(poolG, poolM);
  p.position.set(x + ax, 0.66, z + az);
  scene.add(p);
  if (light) {
    const l = new THREE.PointLight(0xFFD79A, 0, 38, 2);
    l.position.set(hx, 6.2, hz);
    scene.add(l);
    plights.push(l);
  }
}

export function gantry(x, c, load) {
  const z0 = -149.4;
  const z1 = -145.9;
  const top = 12.4;
  const leg = (px, pz) => {
    BX(scene, 0.7, top, 0.7, c, px, 0.6, pz);
    [0, 1, 2].forEach(k => BX(scene, 0.76, 0.5, 0.76, k % 2 ? 0x1B242C : 0xE6B84D, px, 0.6 + k * 1.0, pz).castShadow = false);
  };
  [-2.7, 2.7].forEach(dx => [z0, z1].forEach(pz => leg(x + dx, pz)));
  [-2.7, 2.7].forEach(dx => {
    BX(scene, 0.8, 0.8, z1 - z0 + 0.8, c, x + dx, 0.6 + top, (z0 + z1) / 2);
    rod(scene, [x + dx, 0.6 + top * 0.1, z0], [x + dx, 0.6 + top * 0.9, z1], 0.07, 0x4A5560);
    rod(scene, [x + dx, 0.6 + top * 0.1, z1], [x + dx, 0.6 + top * 0.9, z0], 0.07, 0x4A5560);
  });
  BX(scene, 6.2, 0.7, 0.9, c, x, 0.6 + top - 0.05, z0);
  BX(scene, 6.2, 0.7, 0.9, c, x, 0.6 + top - 0.05, z1);
  [-0.9, 0.9].forEach(dx => {
    BX(scene, 0.45, 0.5, 22, c, x + dx, 0.6 + top + 0.8, -150.5);
    BX(scene, 0.3, 0.3, 22, c, x + dx, 0.6 + top + 2.3, -150.5);
    for (let k = 0; k < 11; k++) {
      const zz = -161.5 + k * 2;
      rod(scene, [x + dx, 0.6 + top + 1.3, zz], [x + dx, 0.6 + top + 2.3, zz + 1], 0.05, 0x4A5560);
      rod(scene, [x + dx, 0.6 + top + 2.3, zz + 1], [x + dx, 0.6 + top + 1.3, zz + 2], 0.05, 0x4A5560);
    }
  });
  BX(scene, 2.6, 1.5, 3, 0xE9EEF2, x, 0.6 + top + 1.1, -147);
  BX(scene, 2.8, 0.15, 3.2, 0x2A343D, x, 0.6 + top + 2.6, -147);
  BX(scene, 2.2, 0.6, 1.6, 0x2A343D, x, 0.6 + top + 0.15, -156);
  [-0.5, 0.5].forEach(dx => rod(scene, [x + dx, 0.6 + top + 0.15, -156], [x + dx * 1.2, 6.4, -156], 0.03, 0x111820));
  BX(scene, 2.6, 0.2, 1.1, 0x333F48, x, 6.2, -156);
  if (load) BX(scene, 2.4, 1.2, 1.9, contM(load), x, 5.0, -156);
  add(scene, new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFF3B30 }), x, 0.6 + top + 2.8, -147).castShadow = false;
}

export const meshT = (() => {
  const [c, x] = mkc(64, 64);
  x.strokeStyle = '#fff';
  x.lineWidth = 5;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(64, 64);
  x.moveTo(0, 64);
  x.lineTo(64, 0);
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
})();

export const netM = new THREE.MeshLambertMaterial({
  color: 0xDCE6EC,
  map: meshT,
  side: THREE.DoubleSide,
  alphaTest: 0.4
});
export const STEEL = 0x8FA3B0;
export const GBLUE = 0x2E86C1;
export const capG = new THREE.SphereGeometry(0.12, 8, 6);

export function netPlane(p, w, h, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.7, (uv.getY(i) * h) / 0.7);
  const m = new THREE.Mesh(g, netM);
  m.position.set(x, y, z);
  p.add(m);
  return m;
}

export function rail(p, x0, x1, y, z, r, c = STEEL) {
  const m = add(p, new THREE.CylinderGeometry(r, r, x1 - x0, 8), M(c), (x0 + x1) / 2, y, z);
  m.rotation.z = Math.PI / 2;
  return m;
}

export function fenceRun(xa, xb, z, H = 2.4, p = scene) {
  const len = xb - xa;
  const n = Math.max(1, Math.round(len / 4));
  const sp = len / n;
  const y0 = 0.6;
  for (let i = 0; i <= n; i++) {
    const x = xa + i * sp;
    CY(p, 0.09, 0.09, H, STEEL, x, y0, z, 8);
    add(p, capG, M(0xC9D6DF), x, y0 + H + 0.05, z).castShadow = false;
  }
  rail(p, xa, xb, y0 + H - 0.05, z, 0.06);
  rail(p, xa, xb, y0 + 0.3, z, 0.06);
  rail(p, xa, xb, y0 + 0.08, z, 0.025, 0x5E6E79);
  rail(p, xa, xb, y0 + H + 0.02, z, 0.025, 0x5E6E79);
  netPlane(p, len, H - 0.4, (xa + xb) / 2, y0 + 0.3 + (H - 0.4) / 2, z).castShadow = false;
}

export function fenceZ(x, za, zb) {
  const g = new THREE.Group();
  g.position.set(x, 0, (za + zb) / 2);
  g.rotation.y = Math.PI / 2;
  scene.add(g);
  fenceRun(-Math.abs(zb - za) / 2, Math.abs(zb - za) / 2, 0, 2.4, g);
}

export const gates = [];
export function gate(gx, z, mi) {
  const W = 3;
  const H = 2;
  const y0 = 0.6;
  const PX = W + 0.2;
  [-1, 1].forEach(sd => {
    const px = gx + sd * PX;
    CY(scene, 0.14, 0.14, 3.1, GBLUE, px, y0, z, 8);
    add(scene, capG, M(0xE6B84D), px, y0 + 3.2, z).castShadow = false;
    add(scene, bulbG, lampW, px, y0 + 3.45, z).castShadow = false;
    glow(warmG, px, y0 + 3.45, z, 2.4);
  });
  BX(scene, 2 * PX, 0.12, 0.12, GBLUE, gx, y0 + 2.95, z);
  const sg = label('Port');
  sg.scale.set(4.4, 0.82, 1);
  sg.position.set(gx, y0 + 4.3, z);
  scene.add(sg);
  [-1, 1].forEach(sd => {
    const leaf = new THREE.Group();
    leaf.position.set(gx + sd * W, y0, z);
    leaf.scale.x = -sd;
    scene.add(leaf);
    BX(leaf, W, 0.1, 0.1, GBLUE, W / 2, 0.15, 0);
    BX(leaf, W, 0.1, 0.1, GBLUE, W / 2, H - 0.1, 0);
    BX(leaf, 0.1, H, 0.1, GBLUE, 0.05, 0, 0);
    BX(leaf, 0.1, H, 0.1, GBLUE, W - 0.05, 0, 0);
    add(leaf, new THREE.BoxGeometry(Math.hypot(W, H), 0.06, 0.06), M(GBLUE), W / 2, H / 2, 0).rotation.z = Math.atan2(H, W);
    netPlane(leaf, W - 0.15, H - 0.25, W / 2, H / 2, 0).castShadow = false;
    BX(leaf, 0.14, 0.34, 0.22, 0xE6B84D, W - 0.2, H * 0.45, 0.04);
    add(leaf, new THREE.SphereGeometry(0.06, 6, 4), M(0x111820), 0.05, 0.4, 0.07);
    add(leaf, new THREE.SphereGeometry(0.06, 6, 4), M(0x111820), 0.05, H - 0.4, 0.07);
    gates.push({ leaf, mi, a: 0, s: -sd });
  });
}

export const parked = [];
export const wood = dm('teak');
export const VL = { speed: 5, yacht: 9, sail: 6.6, trawler: 7.6, ferry: 10, tug: 6 };

export function park(k, x, z, ry) {
  const m = buildVessel(k);
  m.position.set(x, 0, z);
  m.rotation.y = ry;
  m.userData.kind = k;
  parked.push(m);
  return m;
}

export function marina(x0, kinds) {
  for (let k = 0; k < 5; k++) {
    const x = x0 + k * 8;
    BX(scene, 1.6, 0.35, 20, wood, x, 0, -160);
    [-0.8, 0.8].forEach(d => CY(scene, 0.14, 0.16, 1.2, 0x3A2E20, x + d, -0.2, -170, 6));
    CY(scene, 0.08, 0.08, 1.6, 0x111820, x, 0.35, -170, 6);
  }
  kinds.forEach((k, i) => park(k, x0 + 4 + i * 8, -151.5 - VL[k] / 2, Math.PI / 2));
  for (let k = 0; k < 5; k++) {
    add(scene, new THREE.SphereGeometry(0.5, 8, 6), M(k % 2 ? 0xFFFFFF : 0xC8302A), x0 + k * 8, 0.2, -172.9).castShadow = false;
  }
  BX(scene, 34, 0.3, 1.4, wood, x0 + 16, 0, -151.2);
}

export const DIM = {
  speed: [5, 1.7, 0.8, 2],
  yacht: [9, 2.7, 1.2, 3.8],
  sail: [6.6, 2.1, 0.9, 7],
  trawler: [7.6, 2.9, 1.2, 5],
  ferry: [10, 3.7, 1.4, 4],
  tug: [6, 2.7, 1.2, 3],
  cargo: [16, 4.8, 2.2, 6.8],
  barge: [12, 4.3, 1.6, 4.5]
};

export const SPD = {
  speed: 9,
  yacht: 7,
  sail: 5.5,
  trawler: 4.5,
  ferry: 5,
  tug: 5.5,
  cargo: 3.8,
  barge: 3.2
};

export const nth = x => {
  const w = sstep(clamp((x + 232) / 50, 0, 1)) * sstep(clamp((18 - x) / 50, 0, 1));
  return lerp(zNb(x) - 3, -173.5, w);
};

export const laneZ = (x, f) => lerp(zFb(x) + 2.6, nth(x), f);

export function navLight(g, t, x, y, z) {
  const m = new THREE.Mesh(navG, navM[t]);
  m.position.set(x, y, z);
  g.add(m);
  glow(t === 'r' ? redG : t === 'g' ? grnG : whtG, x, y, z, 1.9, g);
}

export function pathSeg(pts, v, ease = true) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  const len = c.getLength();
  const n = Math.max(8, Math.ceil(len / 1.2));
  const a = c.getSpacedPoints(n);
  const s = [];
  for (let i = 0; i <= n; i++) {
    const q = a[Math.min(n, i + 1)];
    const r = a[Math.max(0, i - 1)];
    s.push({ x: a[i].x, z: a[i].z, th: Math.atan2(-(q.z - r.z), q.x - r.x) });
  }
  return {
    dur: len / (v * (ease ? 0.9 : 1)),
    at(u) {
      const f = trap(u) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const k = f - i;
      const A = s[i];
      const B = s[i + 1];
      return { x: lerp(A.x, B.x, k), z: lerp(A.z, B.z, k), th: A.th + wn(B.th - A.th) * k };
    },
    first: s[0],
    last: s[n]
  };
}

export const moveSeg = (x0, z0, x1, z1, ta, tb, v) => ({
  dur: Math.max(0.5, Math.hypot(x1 - x0, z1 - z0) / v),
  at(u) {
    const k = sstep(u);
    return { x: lerp(x0, x1, k), z: lerp(z0, z1, k), th: ta + wn(tb - ta) * k };
  }
});

export const pivotSeg = (x, z, t0, t1, d) => ({
  dur: d,
  at(u) {
    return { x, z, th: t0 + wn(t1 - t0) * sstep(u) };
  }
});

export function loopPts(xa, fo, xt, fr, xb) {
  const dir = Math.sign(xt - xa);
  const P = [];
  const N = Math.max(3, Math.ceil(Math.abs(xt - xa) / 14));
  for (let i = 0; i < N; i++) {
    const x = lerp(xa, xt, i / N);
    P.push([x, laneZ(x, fo)]);
  }
  const zo = laneZ(xt, fo);
  const zr = laneZ(xt, fr);
  const rr = Math.max(7, Math.abs(zo - zr) / 2 + 3);
  for (let j = 0; j <= 6; j++) {
    const a = (j / 6) * Math.PI;
    P.push([xt + dir * rr * Math.sin(a), zo + ((zr - zo) * (1 - Math.cos(a))) / 2]);
  }
  const Mn = Math.max(3, Math.ceil(Math.abs(xt - xb) / 14));
  for (let i = 1; i <= Mn; i++) {
    const x = lerp(xt, xb, i / Mn);
    P.push([x, laneZ(x, fr)]);
  }
  return P;
}

export const total = segs => segs.reduce((s, g) => s + g.dur, 0);

export const fleet = [];
export const PI2 = Math.PI / 2;
export const PLAN = [
  { q: 1, xe: 105, xw: -205 },
  { q: 1, xe: 70, xw: -190 },
  { xt: 170 },
  { xt: -215 },
  { xt: 95 },
  { xt: -200 },
  { xt: 135 },
  { xt: -170 },
  { xt: 200 },
  { xt: 55 }
];

export const gateT = [0, 0];
export let vehGate = false;
export const setVehGate = v => {
  vehGate = !!v;
};
export const beam = new THREE.Group();

export function updatePort(T) {
  gateT[0] = gateT[1] = 0;
  const FD = 0.016;
  fleet.forEach(b => {
    b.clk = (b.clk || 0) + FD * (b.sf == null ? 1 : b.sf);
    const m = b.m;
    const ph = b.clk - b.d0;
    let n = 0;
    let tau = -1;
    if (ph >= 0) {
      n = Math.floor(ph / b.cyc);
      tau = ph - n * b.cyc;
    }
    const par = b.quay ? n % 2 : 0;
    const tr = b.trips[par];
    let x = b.hx;
    let z = b.hz;
    let th = b.quay ? (par ? Math.PI : 0) : PI2;
    let sail = false;
    if (tau >= 0 && tau < tr.total) {
      sail = true;
      let t = tau;
      let i = 0;
      while (i < tr.length - 1 && t > tr[i].dur) {
        t -= tr[i].dur;
        i++;
      }
      const p = tr[i].at(clamp(t / tr[i].dur, 0, 1));
      x = p.x;
      z = p.z;
      th = p.th;
    } else if (tau >= tr.total && b.quay) {
      th = par ? 0 : Math.PI;
    }
    if (b.mar >= 0 && ((ph > -4 && tau < 16) || (tau > tr.total - 20 && tau < tr.total + 10))) {
      gateT[b.mar] = 1;
    }
    b.sail = sail;
    if (m.userData.wake) m.userData.wake.visible = sail;
    m.rotation.order = 'YXZ';
    m.position.set(x, Math.sin(T * (sail ? 1.6 : 1.4) + b.k * 1.7) * (sail ? 0.07 : 0.05), z);
    m.rotation.set(0, th, Math.sin(T * 1.1 + b.k) * (sail ? 0.015 : 0.02));
  });
  gateT[0] = gateT[0] || gateT[1] || vehGate;
  gates.forEach(g => {
    g.a += ((gateT[g.mi] ? 1.35 : 0) - g.a) * 0.04;
    g.leaf.rotation.y = g.s * g.a;
  });
  beam.rotation.y = T * 0.9;
}

export function initPort() {
  /* Quay */
  BX(scene, 140, 0.06, 10, asph, -70, 0, -103).castShadow = false;
  BX(scene, 7, 0.06, 33, asph, -108, 0, -119.5).castShadow = false;
  BX(scene, 60, 0.6, 14, quayM, -105, 0, -143);
  for (let x = -130; x <= -80; x += 10) bollard(x, -149.4);
  BX(scene, 18, 6, 8, corr(0xD7E0E7), -125, 0.6, -141);
  BX(scene, 18.4, 0.5, 8.4, 0x2E86C1, -125, 6.6, -141);

  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      const x = -93 + i * 6.4;
      BX(scene, 6, 2.4, 2.4, contM(CTC[(i + j * 2) % 6]), x, 0.6, -139.2);
      if ((i + j) % 2 === 0) BX(scene, 6, 2.4, 2.4, contM(CTC[(i * 2 + 3) % 6]), x, 3, -139.2);
    }
  for (let i = 0; i < 3; i++) BX(scene, 6, 2.4, 2.4, contM(CTC[(i + 4) % 6]), -93 + i * 6.4, 0.6, -142.4);

  BX(scene, 43, 0.6, 14, quayM, -156.5, 0, -143);
  BX(scene, 37, 0.6, 14, quayM, -56.5, 0, -143);
  for (let x = -170; x <= -40; x += 10) if (x < -135 || x > -75) bollard(x, -149.4);
  BX(scene, 140, 0.5, 0.3, 0x1B242C, -108, 0.05, -150.2).castShadow = false;
  flat(140, 0.3, 0xE6B84D, -108, -149, 0.63);
  flat(140, 0.15, 0xFFFFFF, -108, -144.5, 0.63);
  BX(scene, 140, 0.14, 0.55, 0x9AA3A8, -108, 0.6, -149.65).castShadow = false;
  for (let x = -176; x <= -40; x += 6) BX(scene, 0.28, 1.5, 0.28, dm('teak'), x + 1, -0.3, -150.35);

  gantry(-130, 0xC8302A, 0xE6B84D);
  gantry(-102, 0xE6B84D, 0x2E86C1);
  park('cargo', -102, -153.4, 0);
  park('barge', -130, -152.5, 0);

  TW(scene, 10, 6.5, 8, 0xE7F0F7, -163, 0.6, -140);
  BX(scene, 10.6, 0.5, 8.6, 0x2E86C1, -163, 7.1, -140);
  CY(scene, 0.1, 0.14, 4, 0x111820, -163, 7.6, -140, 6);
  BX(scene, 16, 6, 8, corr(0xD7E0E7), -148, 0.6, -140);
  BX(scene, 16.6, 0.5, 8.6, 0x2E86C1, -148, 6.6, -140);
  [-5, 0, 5].forEach(dx => BX(scene, 3, 3.6, 0.2, 0x7C93A0, -148 + dx, 0.6, -135.8));

  for (let i = 0; i < 4; i++) CY(scene, 2.1 - i * 0.12, 2.2 - i * 0.12, 3.4, i % 2 ? 0xFFFFFF : 0xC8302A, -174, 0.6 + i * 3.4, -141, 18);
  CY(scene, 2.4, 2.4, 0.4, 0x1E2A35, -174, 14.2, -141, 18);
  add(scene, new THREE.SphereGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFFE9A0 }), -174, 15.4, -141).castShadow = false;
  add(scene, new THREE.ConeGeometry(2, 1.6, 18), M(0xC8302A), -174, 17.2, -141);

  [-47, -41].forEach(x => {
    CY(scene, 3, 3, 5, 0xE9F3F9, x, 0.6, -141, 20);
    CY(scene, 3.05, 3.05, 0.4, 0x8A99A4, x, 5.6, -141, 20);
    [1.8, 3.6].forEach(y => CY(scene, 3.06, 3.06, 0.12, 0x8A99A4, x, y, -141, 20));
    BX(scene, 0.5, 5, 0.1, 0x8A99A4, x, 0.6, -137.9);
    add(scene, new THREE.SphereGeometry(9.25, 24, 6, 0, 6.2832, 0, 0.33), M(0xE9F3F9), x, 6.5 - 9.25, -141);
  });

  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++)
      BX(scene, 6, 2.4, 2.4, contM(CTC[(i * 2 + j + 1) % 6]), -66 + i * 6.4, 0.6, -139.2 - j * 3.2);
  for (let i = 0; i < 3; i++) BX(scene, 6, 2.4, 2.4, contM(CTC[(i + 3) % 6]), -66 + i * 6.4, 3, -139.2);

  marina(-172, ['speed', 'sail', 'yacht', 'trawler']);
  marina(-80, ['sail', 'tug', 'speed', 'ferry']);

  [[-177, 0xFF3B30], [-39, 0x3BE07A]].forEach(b => {
    CY(scene, 0.15, 0.2, 4, 0x111820, b[0], 0.6, -149, 6);
    add(scene, new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: b[1] }), b[0], 5, -149).castShadow = false;
  });

  [-176, -164, -152, -140, -118, -90, -76, -64, -52, -42].forEach(x =>
    quayLamp(x, -146.2, [-164, -140, -118, -76, -52].includes(x), 0, 1)
  );

  [-172, -80].forEach(x0 => {
    for (let k = 0; k < 5; k++) {
      add(scene, bulbG, lampW, x0 + k * 8, 2.15, -170).castShadow = false;
      glow(warmG, x0 + k * 8, 2.15, -170, 2.6);
    }
  });

  [[-177, 5, -149, redG], [-39, 5, -149, grnG]].forEach(b => glow(b[3], b[0], b[1], b[2], 5));
  glow(warmG, -174, 15.4, -141, 9);

  beam.position.set(-174, 15.4, -141);
  scene.add(beam);
  [0, Math.PI].forEach(r => {
    const g = new THREE.ConeGeometry(3.4, 48, 18, 1, true);
    g.rotateZ(Math.PI / 2);
    g.translate(24, 0, 0);
    const m = new THREE.Mesh(g, beamM);
    m.rotation.y = r;
    beam.add(m);
  });

  const zb = -108.6;
  const GX = -108;
  fenceRun(-182, GX - 3.2, zb);
  fenceRun(GX + 3.2, -34, zb);
  fenceZ(-182, zb, -144);
  fenceZ(-34, zb, -144);
  gate(GX, zb, 0);

  /* Build fleet trips */
  parked.forEach((m, k) => {
    const kind = m.userData.kind;
    const D = DIM[kind];
    const v = SPD[kind];
    const P = PLAN[k];
    const hx = m.position.x;
    const hz = m.position.z;
    const fE = 0.5 + (k % 5) * 0.1;
    const fW = 0.1 + (k % 5) * 0.08;
    const L = D[0];
    const W = D[1];
    const dY = D[2];
    const tY = D[3];
    navLight(m, 'r', L * 0.3, dY, -W * 0.42);
    navLight(m, 'g', L * 0.3, dY, W * 0.42);
    navLight(m, 'w', -L * 0.45, dY, 0);
    navLight(m, 'w', -L * 0.1, tY, 0);
    const b = { m, k, quay: !!P.q, hx, hz, mar: k >= 6 ? 1 : k >= 2 ? 0 : -1, trips: [] };
    if (P.q) {
      [0, 1].forEach(p => {
        const dir = p ? -1 : 1;
        const xt = p ? P.xw : P.xe;
        const fo = dir > 0 ? fE : fW;
        const fr = dir > 0 ? fW : fE;
        const t0 = p ? Math.PI : 0;
        const t1 = p ? 0 : Math.PI;
        const path = pathSeg(loopPts(hx, fo, xt, fr, hx), v);
        const zo = path.first.z;
        const zr = path.last.z;
        const th0 = path.first.th;
        const th1 = path.last.th;
        b.trips[p] = [moveSeg(hx, hz, hx, zo, t0, th0, 2.4), path, moveSeg(hx, zr, hx, hz, th1, t1, 2.4)];
        b.trips[p].th0 = t0;
        b.trips[p].th1 = t1;
      });
    } else {
      const dir = Math.sign(P.xt - hx);
      const fo = dir > 0 ? fE : fW;
      const fr = dir > 0 ? fW : fE;
      const pts = [[hx, hz], [hx, -175], ...loopPts(hx + dir * 12, fo, P.xt, fr, hx)];
      const path = pathSeg(pts, v);
      const pe = path.last;
      b.trips[0] = [
        path,
        pivotSeg(pe.x, pe.z, pe.th, PI2, 3),
        {
          dur: Math.hypot(pe.z - hz, 0) / 2.5 + 0.5,
          at(u) {
            const k2 = sstep(u);
            return { x: hx, z: lerp(pe.z, hz, k2), th: PI2 };
          }
        }
      ];
    }
    b.trips.forEach(t => (t.total = total(t)));
    b.cyc = Math.max(...b.trips.map(t => t.total)) + 90 + ((k * 23) % 60);
    b.d0 = 5 + k * 9;
    fleet.push(b);
  });

  const ex = fleet.map(b => {
    const P = PLAN[b.k];
    let lo, hi;
    if (P.q) {
      lo = P.xw - 25;
      hi = P.xe + 25;
    } else {
      lo = Math.min(b.hx, P.xt) - 25;
      hi = Math.max(b.hx, P.xt) + 25;
    }
    return { lo, hi, tot: Math.max(...b.trips.map(t => t.total)) + 8 };
  });
  const st = [];
  fleet.forEach((b, k) => {
    let s = 6;
    for (let again = true; again; ) {
      again = false;
      for (let j = 0; j < k; j++) {
        if (ex[k].hi < ex[j].lo || ex[k].lo > ex[j].hi) continue;
        if (s < st[j] + ex[j].tot && s + ex[k].tot > st[j]) {
          s = st[j] + ex[j].tot;
          again = true;
        }
      }
    }
    st[k] = s;
  });
  const P_max = Math.max(...st.map((s, k) => s + ex[k].tot)) + 10;
  fleet.forEach((b, k) => {
    b.d0 = st[k];
    b.cyc = P_max;
  });

  /* Container yards */
  const WH = 0xFFFFFF;
  const YL = 0xE6B84D;
  const pad = (w, d, x, z) => {
    BX(scene, w, 0.05, d, asph, x, 0, z).castShadow = false;
  };
  pad(68.5, 28, -145.8, -122);
  pad(68.5, 28, -70.3, -122);
  [-176, -148].forEach((x0, bi) => {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        const h = ((i * 2 + j * 3 + bi) % 3) + 1;
        const x = x0 + i * 6.2;
        const z = -111.5 - j * 2.7;
        for (let t = 0; t < h; t++)
          BX(scene, 6, 2.4, 2.4, contM(CTC[(i + j * 2 + t + bi) % 6]), x, 0.05 + t * 2.4, z);
      }
  });

  const cx = -163;
  const cy = 0x2A343D;
  [-2.6, 2.6].forEach(dx => {
    [-5, 5].forEach(dz => BX(scene, 0.6, 9.4, 0.6, YL, cx + dx, 0.05, -114.2 + dz));
    BX(scene, 0.8, 0.8, 11, YL, cx + dx, 9.4, -114.2);
  });
  BX(scene, 5.8, 0.7, 0.7, YL, cx, 9.5, -109.2);
  BX(scene, 5.8, 0.7, 0.7, YL, cx, 9.5, -119.2);
  BX(scene, 1.6, 1.2, 1.6, 0x2E86C1, cx, 10.2, -114.2);
  BX(scene, 0.2, 2.6, 0.2, cy, cx, 7, -114.2);
  BX(scene, 2.4, 0.3, 1.1, cy, cx, 6.8, -114.2);

  for (let x = -178; x <= -116; x += 7) flat(3.6, 0.22, WH, x, -126.5, 0.08);
  flat(66, 0.2, YL, -146, -120.2, 0.08);
  flat(66, 0.2, YL, -146, -132.6, 0.08);
  [-166, -150, -134].forEach(x => flat(6.6, 0.12, WH, x, -122.7, 0.08));

  BX(scene, 3, 2.8, 2.6, 0xE7F0F7, -114, 0.05, -111.5);
  BX(scene, 3.6, 0.3, 3.2, 0x2E86C1, -114, 2.85, -111.5);
  BX(scene, 0.1, 1, 1.8, 0x1B2A36, -112.45, 1.3, -111.5);
  for (let i = 0; i < 3; i++) BX(scene, 1.6, 1.1, 1.6, 0xE0C48F, -125 + i * 2, 0.05, -130.8);
  for (let i = 0; i < 2; i++) CY(scene, 0.5, 0.5, 1, i ? 0xC8302A : 0x2E86C1, -120.5, 0.05, -130.5 - i * 1.3, 12);

  /* Customs office and warehouse */
  TW(scene, 10, 8, 8, 0xE7F0F7, -70, 0.05, -112);
  BX(scene, 10.6, 0.5, 8.6, 0x2E86C1, -70, 8.05, -112);
  flag(scene, -65.5, -109, 13, 0xC8302A);
  BX(scene, 20, 6.5, 15, corr(0xD7E0E7), -46, 0.05, -124.5);
  BX(scene, 20.6, 0.5, 15.6, 0x2E86C1, -46, 6.55, -124.5);
  BX(scene, 20.1, 0.7, 15.1, 0x2E86C1, -46, 3.2, -124.5);
  [-52, -46, -40].forEach(x => CY(scene, 0.5, 0.5, 0.8, 0x8A99A4, x, 7.05, -124.5, 10));
  [-123.6, -130.6].forEach(z => {
    BX(scene, 0.2, 3.6, 3.2, 0x7C93A0, -56.1, 0.05, z);
    BX(scene, 2.6, 0.25, 5.6, 0x1F5E8A, -57.3, 4.6, z);
    [-1, 1].forEach(k => BX(scene, 0.2, 4.6, 0.2, 0x333F48, -58.5, 0.05, z + k * 2.7));
  });
  BX(scene, 0.5, 0.6, 15, 0x2A343D, -56.3, 0.05, -124.5);
  for (let i = 0; i < 3; i++) BX(scene, 1.8, 1.2, 1.8, 0xE0C48F, -50 + i * 4, 0.05, -115.4);

  [[-172, -131, 0, 0, 1], [-152, -131, 1, 0, 1], [-132, -131, 0, 0, 1], [-76, -111.5, 1, -1, 0], [-76, -130.5, 0, -1, 0], [-65.5, -122, 0, -1, 0]].forEach(
    l => quayLamp(l[0], l[1], !!l[2], l[3], l[4])
  );
}
