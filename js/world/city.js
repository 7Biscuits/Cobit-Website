import { scene, onN } from '../core/scene.js';
import {
  M, BX, CY, add, flat, label, rod, glow, warmG, redG, grnG, whtG,
  poolM, poolG, bulbG, flags, flag, once, TW, roofEq, stoneM, wtex, ltex
} from '../core/materials.js';
import {
  Dtex, mkc, brickCan, asphCan, concCan, roofCan, grassCan, needleCanR, leafCanR, padCan
} from '../utils/textures.js';
import {
  clamp, lerp, rr, sstep, wn, CK, Pp, arcP, radP, cat, offs, segD, cum, resample
} from '../utils/math.js';
import { RL, LR, R2, R3, RADS, LM, SUPER_PAL } from '../config.js';
import { asph, sweep, bridgeY } from './environment.js';
import { pickables } from './landmarks.js';
import { SUPER, buildPolice, buildAmb, buildFire, buildSBus } from '../entities/vehicles.js';

export const CITY = new THREE.Group();
scene.add(CITY);

export const ROADQ = [];
export const XRD = [];
export const NOBU = [];
export const HOUSEPOS = [];
export const STSP = [];
export const HOMES = [];
export const HOUSEFP = [];
export const LAMPREC = [];
export const PARKREG = [];
export const ZT = [];
export const PLC = [];

export var HOSP = null;
export var HELI_S = 0.72;
export var FOUNT = [];
export var RCLf = null;

export function inHouse(x, z, m) {
  for (const f of HOUSEFP) {
    const dx = x - f[0],
      dz = z - f[1],
      c = Math.cos(f[2]),
      s = Math.sin(f[2]),
      lx = dx * c - dz * s,
      lz = dx * s + dz * c;
    if (Math.abs(lx) < 4.8 + m && lz > -3.4 - m && lz < 7.2 + m) return true;
  }
  return false;
}

export function cRoad(P, gaps) {
  ROADQ.push({ P, gaps });
}

export function ribbon(P, w, mat, y, rq) {
  const pos = [], nor = [], idx = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)],
      b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0],
      dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    pos.push(P[i][0] - (dz * w) / 2, y, P[i][1] + (dx * w) / 2, P[i][0] + (dz * w) / 2, y, P[i][1] - (dx * w) / 2);
    nor.push(0, 1, 0, 0, 1, 0);
    if (i) {
      const k = (i - 1) * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2, k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  if (rq) m.renderOrder = rq;
  CITY.add(m);
  return m;
}

const PO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
export const lineM = new THREE.MeshBasicMaterial(Object.assign({ color: 0xE6B84D }, PO));
export const whiteM = new THREE.MeshBasicMaterial(Object.assign({ color: 0xFFFFFF }, PO));

export const ASPH2 = new THREE.MeshLambertMaterial({
  color: 0xFFFFFF,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3
});
onN(n => ASPH2.color.setHex(n ? 0x3A4650 : 0xFFFFFF));

export const WHT2 = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
  polygonOffset: true,
  polygonOffsetFactor: -5,
  polygonOffsetUnits: -5
});
export const YEL2 = new THREE.MeshBasicMaterial({
  color: 0xE6B84D,
  polygonOffset: true,
  polygonOffsetFactor: -5,
  polygonOffsetUnits: -5
});

const OLDR = [
  { P: [[0, -30], [0, -232]], hw: 3.5 },
  { P: [[-6, -103], [-140, -103]], hw: 5 },
  { P: [[-108, -103], [-108, -136]], hw: 3.5 }
];

export function cRoadDraw(r) {
  const P = r.P,
    gaps = r.gaps,
    oth = ROADQ.filter(q => q !== r),
    n = P.length;
  ribbon(P, 10, asph, 0.06);
  const runs = (Q, h, w, m, y) => {
    let cur = [];
    const fl = () => {
      if (cur.length > 2) ribbon(cur, w, m, y);
      cur = [];
    };
    Q.forEach(p => {
      if (
        oth.every(q => segD(p[0], p[1], q.P) > h) &&
        OLDR.every(o => segD(p[0], p[1], o.P) > o.hw + 0.4) &&
        p[0] * p[0] + p[1] * p[1] > 2237
      )
        cur.push(p);
      else fl();
    });
    fl();
  };
  runs(offs(P, 4.6), 5.4, 0.18, whiteM, 0.09);
  runs(offs(P, -4.6), 5.4, 0.18, whiteM, 0.09);
  runs(gaps ? P : P.slice(3, n - 3), 3.9, 0.22, lineM, 0.09);
  let d = 0;
  for (let i = 1; i < n; i++) {
    d += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (d >= 44) {
      d = 0;
      const o = ((i / 10) | 0) & 1 ? 6.9 : -6.9,
        q = offs([P[i - 1], P[i], P[Math.min(n - 1, i + 1)]], o)[1];
      if (oth.every(k => segD(q[0], q[1], k.P) > 7.2)) LP(q[0], q[1]);
    }
  }
}

export function RCL(x, z, skip) {
  let m = 1e9;
  for (const q of ROADQ) if (q.P !== skip) m = Math.min(m, segD(x, z, q.P) - 5.9);
  m = Math.min(
    m,
    segD(x, z, [[0, -30], [0, -232]]) - 5.9,
    segD(x, z, [[6, -103], [-140, -103]]) - 5.9,
    Math.abs(Math.hypot(x, z) - 40.9) - 5.9
  );
  for (const a of RL) {
    m = Math.min(
      m,
      Math.hypot(x - Math.cos(a) * LR, z - Math.sin(a) * LR) - 21.5,
      segD(x, z, [[Math.cos(a) * 12, Math.sin(a) * 12], [Math.cos(a) * 44, Math.sin(a) * 44]]) - 5.9
    );
  }
  return m;
}
RCLf = RCL;

export function LPg(x, z, y = 0) {
  glow(warmG, x, y + 5.1, z, 6);
  const p = new THREE.Mesh(poolG, poolM);
  p.position.set(x, y + 0.12, z);
  scene.add(p);
}

export function LP(x, z, y = 0) {
  const rr = Math.hypot(x, z);
  if (rr > 41 && rr < 49) return;
  if (inHouse(x, z, 0.6)) return;
  const n0 = scene.children.length;
  CY(scene, 0.09, 0.13, 5, 0x2A343D, x, y, z, 6).castShadow = false;
  add(scene, bulbG, lineM, x, y + 5.1, z).castShadow = false;
  LPg(x, z, y);
  LAMPREC.push({ x, z, o: scene.children.slice(n0) });
}

/* Texture caches and building helpers */
const zmem = {};
function zl(c, fn, k, sc, g) {
  const q = k + c;
  return (
    zmem[q] ||
    (zmem[q] = (() => {
      const m = new THREE.MeshLambertMaterial({ color: c });
      ltex(m, once(k, fn), sc, g || 1);
      return m;
    })())
  );
}

function plasCan() {
  const [c, x] = mkc(256, 256);
  x.fillStyle = '#e9e6df';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7000; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '110,100,90') + ',' + rr(0.04, 0.16) + ')';
    x.fillRect(rr(0, 256), rr(0, 256), rr(1, 2.4), rr(1, 2.4));
  }
  x.fillStyle = 'rgba(120,110,100,.08)';
  for (let i = 0; i < 8; i++) x.fillRect(0, i * 32, 256, 2);
  return c;
}

function tileCan() {
  const [c, x] = mkc(256, 256);
  x.fillStyle = '#777c80';
  x.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 16; j++)
    for (let i = -1; i < 9; i++) {
      const o = (j % 2) * 16,
        v = Math.floor(rr(150, 220));
      x.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 12) + ')';
      x.fillRect(i * 32 + o, j * 16, 31, 15);
      x.fillStyle = 'rgba(0,0,0,.3)';
      x.fillRect(i * 32 + o, j * 16 + 13, 31, 2);
      x.fillStyle = 'rgba(255,255,255,.18)';
      x.fillRect(i * 32 + o, j * 16, 31, 2);
    }
  return c;
}

function metCan() {
  const [c, x] = mkc(256, 256);
  x.fillStyle = '#d4d9dc';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 32; i++) {
    const g = x.createLinearGradient(i * 8, 0, i * 8 + 8, 0);
    g.addColorStop(0, 'rgba(255,255,255,.35)');
    g.addColorStop(0.5, 'rgba(0,0,0,.1)');
    g.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = g;
    x.fillRect(i * 8, 0, 8, 256);
  }
  return c;
}

const zPL = c => zl(c, plasCan, 'pls', 1 / 5);
const zTI = c => zl(c, tileCan, 'til', 1 / 3);
const zMT = c => zl(c, metCan, 'met', 1 / 2.5);

function pitchTex() {
  return Dtex(512, 320, (g, W, H) => {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 2 ? '#4A8A2E' : '#57973A';
      g.fillRect((i * W) / 14, 0, W / 14, H);
    }
    g.strokeStyle = '#fff';
    g.lineWidth = 4;
    g.strokeRect(14, 14, W - 28, H - 28);
    g.beginPath();
    g.moveTo(W / 2, 14);
    g.lineTo(W / 2, H - 14);
    g.stroke();
    g.beginPath();
    g.arc(W / 2, H / 2, 38, 0, 6.3);
    g.stroke();
    g.strokeRect(14, H / 2 - 70, 80, 140);
    g.strokeRect(W - 94, H / 2 - 70, 80, 140);
    g.strokeRect(14, H / 2 - 32, 28, 64);
    g.strokeRect(W - 42, H / 2 - 32, 28, 64);
  });
}

function pitchTex2() {
  return Dtex(800, 512, (g, W, H) => {
    const N = 16;
    for (let i = 0; i < N; i++) {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, i % 2 ? '#3f8128' : '#4a8f30');
      gr.addColorStop(0.5, i % 2 ? '#478a2d' : '#549a37');
      gr.addColorStop(1, i % 2 ? '#3f8128' : '#4a8f30');
      g.fillStyle = gr;
      g.fillRect((i * W) / N, 0, W / N + 1, H);
    }
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '20,60,10' : '170,210,120') + ',' + rr(0.03, 0.09) + ')';
      g.fillRect(rr(0, W), rr(0, H), rr(1, 2), rr(2, 5));
    }
    g.strokeStyle = 'rgba(255,255,255,.92)';
    g.fillStyle = 'rgba(255,255,255,.92)';
    g.lineWidth = 4;
    const m = 18;
    g.strokeRect(m, m, W - 2 * m, H - 2 * m);
    g.beginPath();
    g.moveTo(W / 2, m);
    g.lineTo(W / 2, H - m);
    g.stroke();
    g.beginPath();
    g.arc(W / 2, H / 2, 70, 0, 6.3);
    g.stroke();
    g.beginPath();
    g.arc(W / 2, H / 2, 5, 0, 6.3);
    g.fill();
    const pa = 125, pw = 303, ga = 42, gw = 138;
    [0, 1].forEach(s => {
      const x0 = s ? W - m : m,
        d = s ? -1 : 1;
      g.strokeRect(Math.min(x0, x0 + d * pa), H / 2 - pw / 2, pa, pw);
      g.strokeRect(Math.min(x0, x0 + d * ga), H / 2 - gw / 2, ga, gw);
      g.beginPath();
      g.arc(x0 + d * 84, H / 2, 5, 0, 6.3);
      g.fill();
      g.beginPath();
      g.arc(x0 + d * 84, H / 2, 70, s ? Math.PI - 0.93 : -0.93, s ? Math.PI + 0.93 : 0.93);
      g.stroke();
      [[x0, m], [x0, H - m]].forEach(p => {
        g.beginPath();
        g.arc(p[0], p[1], 14, 0, 6.3);
        g.stroke();
      });
    });
    g.fillStyle = 'rgba(31,78,156,.55)';
    g.beginPath();
    g.arc(W / 2, H / 2, 28, 0, 6.3);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.font = 'bold 26px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('CB', W / 2, H / 2 + 1);
  });
}

const zDoor = () =>
  once('zdoor', () =>
    Dtex(256, 256, (g, W, H) => {
      g.fillStyle = '#2b3a46';
      g.fillRect(0, 0, W, H);
      [14, W / 2 + 6].forEach(x => {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, '#9fd0ec');
        gr.addColorStop(1, '#3f7aa2');
        g.fillStyle = gr;
        g.fillRect(x, 14, W / 2 - 20, H - 28);
      });
      g.fillStyle = 'rgba(255,255,255,.3)';
      g.beginPath();
      g.moveTo(14, H - 30);
      g.lineTo(70, 14);
      g.lineTo(100, 14);
      g.lineTo(36, H - 14);
      g.fill();
      g.fillStyle = '#ddd';
      g.fillRect(W / 2 - 14, H / 2 - 20, 6, 40);
      g.fillRect(W / 2 + 8, H / 2 - 20, 6, 40);
    })
  );

const zRoll = col =>
  once('zroll' + col, () =>
    Dtex(256, 256, (g, W, H) => {
      g.fillStyle = col;
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) {
        g.fillStyle = i % 2 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.12)';
        g.fillRect(0, i * 16, W, 16);
      }
      g.fillStyle = 'rgba(20,30,40,.8)';
      for (let i = 0; i < 5; i++) g.fillRect(30 + i * 44, 40, 34, 22);
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, 8);
      g.fillRect(0, H - 8, W, 8);
      g.fillStyle = '#444';
      g.fillRect(W / 2 - 12, H - 34, 24, 6);
    })
  );

const zClock = () =>
  once('zclk', () =>
    Dtex(128, 128, g => {
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(64, 64, 58, 0, 6.3);
      g.fill();
      g.strokeStyle = '#222';
      g.lineWidth = 6;
      g.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48);
        g.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54);
        g.stroke();
      }
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(64, 64);
      g.lineTo(64, 28);
      g.moveTo(64, 64);
      g.lineTo(88, 72);
      g.stroke();
    })
  );

const Gs = (p, w, h, tex, x, y, z, ry) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(x, y, z);
  m.rotation.y = ry || 0;
  p.add(m);
  return m;
};

const txt = (w, h, bg, fg, s, fs) =>
  Dtex(w, h, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = fg;
    g.font = 'bold ' + (fs || Math.round(H * 0.55)) + 'px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(s, W / 2, H / 2 + 2);
  });

const DGL = new THREE.MeshPhongMaterial({ color: 0x7FB6D4, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.62 });
onN(n => {
  DGL.color.setHex(n ? 0x4E86A6 : 0x7FB6D4);
  DGL.emissive.setHex(n ? 0x8A6A30 : 0);
  DGL.opacity = n ? 0.5 : 0.62;
});

const Dbrick = c => {
  const m = new THREE.MeshLambertMaterial({ color: c });
  ltex(m, once('brk', brickCan), 1 / 6, 1);
  return m;
};

function plazaCan() {
  const S = 1024, [c, x] = mkc(S, S);
  x.fillStyle = '#6f6a63';
  x.fillRect(0, 0, S, S);
  const light = ['#cfc8bb', '#c3bcae', '#d8d2c6', '#b9b2a5', '#c8c1b4'],
    dark = ['#a39d92', '#999387', '#aca69b'];
  for (let r = 0; r < 8; r++) {
    const accent = r % 4 == 3,
      cols = accent ? dark : light,
      off = (r % 2) * 128;
    for (let u = -128 + off; u < S + 128; u += 256) {
      const k = Math.abs(Math.round((u + 300) / 256) * 7 + r * 5) % cols.length,
        X = u + 3,
        Y = r * 128 + 3,
        W = 250,
        H = 122;
      for (const ox of [0, -S, S]) {
        const xx = X + ox;
        if (xx > S || xx + W < 0) continue;
        x.fillStyle = cols[k];
        x.fillRect(xx, Y, W, H);
        const g = x.createLinearGradient(xx, Y, xx + W, Y + H);
        g.addColorStop(0, 'rgba(255,255,255,.14)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(40,36,30,.16)');
        x.fillStyle = g;
        x.fillRect(xx, Y, W, H);
        x.strokeStyle = 'rgba(120,112,100,' + rr(0.12, 0.3) + ')';
        x.lineWidth = 1;
        for (let v = 0; v < 3; v++) {
          x.beginPath();
          let px = xx + rr(10, W - 10),
            py = Y + rr(4, H - 4);
          x.moveTo(px, py);
          for (let q = 0; q < 5; q++) {
            px += rr(-24, 24);
            py += rr(-12, 12);
            x.lineTo(px, py);
          }
          x.stroke();
        }
        for (let i = 0; i < 90; i++) {
          x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '70,64,56') + ',' + rr(0.08, 0.28) + ')';
          x.fillRect(xx + rr(2, W - 2), Y + rr(2, H - 2), rr(1, 2.6), rr(1, 2.6));
        }
        x.fillStyle = 'rgba(255,255,255,.28)';
        x.fillRect(xx, Y, W, 2);
        x.fillStyle = 'rgba(30,26,22,.22)';
        x.fillRect(xx, Y + H - 2, W, 2);
      }
    }
  }
  for (let i = 0; i < 46; i++) {
    const px = rr(0, S),
      py = rr(0, S),
      rd = rr(30, 110);
    for (const ox of [0, -S, S])
      for (const oy of [0, -S, S]) {
        const gx = px + ox,
          gy = py + oy;
        if (gx < -rd || gx > S + rd || gy < -rd || gy > S + rd) continue;
        const g = x.createRadialGradient(gx, gy, 0, gx, gy, rd);
        g.addColorStop(0, Math.random() < 0.5 ? 'rgba(70,64,52,.14)' : 'rgba(255,255,255,.1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(gx - rd, gy - rd, rd * 2, rd * 2);
      }
  }
  return c;
}

let PLZM = null, CRBM = null;
export function plazaM() {
  if (!PLZM) {
    PLZM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    wtex(PLZM, plazaCan(), 1 / 12, 0, 1.05);
    onN(n => PLZM.color.setHex(n ? 0x4A5B68 : 0xFFFFFF));
  }
  return PLZM;
}

export function curbM() {
  if (!CRBM) {
    CRBM = new THREE.MeshLambertMaterial({ color: 0x8E9499 });
    onN(n => CRBM.color.setHex(n ? 0x2E3A44 : 0x8E9499));
  }
  return CRBM;
}

export const PW = (G, x, y, z) => {
  const w = new THREE.Group();
  w.position.set(x, y, z);
  w.userData.prop = 1;
  G.add(w);
  return w;
};

const zLawn = (G, w, d, x, z) => {
  BX(G, w, 0.05, d, M(0x567D46), x, 0, z).castShadow = false;
};
const zSlab = (G, w, d, x, z, y = 0) => {
  BX(G, w, 0.1, d, plazaM(), x, y, z).castShadow = false;
  BX(G, w + 0.5, 0.08, d + 0.5, curbM(), x, y, z).castShadow = false;
};
const zAsph = (G, w, d, x, z) => {
  BX(G, w, 0.1, d, asph, x, 0.02, z).castShadow = false;
};
const zHedge = (G, l, x, z, ry) => {
  const h = BX(G, l, 0.9, 0.8, 0x3D7A31, x, 0.1, z);
  h.rotation.y = ry || 0;
  BX(G, l, 0.2, 0.9, 0x4E8F3B, x, 1, z).rotation.y = ry || 0;
  return h;
};
const zTree = (G, x, z, s = 1) => {
  const w = PW(G, x, 0, z);
  ZT.push({ G, w, s });
  CY(w, 0.18 * s, 0.26 * s, 2.2 * s, 0x5B4332, 0, 0, 0, 6);
  add(w, new THREE.SphereGeometry(1.6 * s, 8, 6), M(0x3F7A2E), 0, 3 * s, 0);
  add(w, new THREE.SphereGeometry(1.1 * s, 8, 6), M(0x4F8E3A), 0.6 * s, 4 * s, -0.3 * s);
};
const zLamp = (G, x, z) => {
  const w = PW(G, x, 0, z);
  CY(w, 0.08, 0.12, 5, 0x2A343D, 0, 0, 0, 6);
  BX(w, 0.9, 0.14, 0.3, 0x2A343D, 0, 5, 0);
  glow(warmG, 0, 5.2, 0, 6, w);
};
const zBays = (G, n, x, z, w) => {
  zAsph(G, n * w + 0.6, 5.6, x, z);
  for (let i = 0; i <= n; i++) BX(G, 0.14, 0.02, 4.6, 0xF4F4F0, x - (n * w) / 2 + i * w, 0.12, z);
};
const zStairs = (G, w, x, z, n) => {
  for (let i = 0; i < n; i++) BX(G, w, 0.2 * (n - i), 0.6, 0xDAD4C5, x, 0, z + i * 0.6);
};
const zColo = (G, n, x0, x1, z, h, y, r) => {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    BX(G, r * 2.6, 0.4, r * 2.6, 0xE9E4D8, x, y, z);
    CY(G, r, r * 1.08, h, 0xF3EFE6, x, y + 0.4, z, 12);
    BX(G, r * 2.8, 0.4, r * 2.8, 0xE9E4D8, x, y + h + 0.4, z);
  }
};
const zHvac = (G, x, y, z) => {
  BX(G, 2, 0.9, 1.3, 0xB9C2C8, x, y, z);
  [-0.45, 0.45].forEach(a => CY(G, 0.4, 0.4, 0.1, 0x333F48, x + a, y + 0.9, z, 10));
  BX(G, 0.3, 0.5, 0.1, 0x7C8A94, x, y + 0.2, z + 0.66);
};

export const zPark = (G, x, z, ry, col, f) => {
  let m = f ? f() : SUPER.build(col);
  const w = PW(G, x, 0.1, z);
  w.add(m);
  PARKREG.push({ G, x, z, w });
  m.position.set(0, 0, 0);
  m.rotation.y = ry;
  return m;
};

export function SPOT(G, k, pts) {
  pts.forEach(q => STSP.push([G, k, q[0], q[1]]));
}

const netTexN = () =>
  once('znet2', () => {
    const t = Dtex(32, 32, (g, W, H) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fafafa';
      g.fillRect(0, 0, W, 4);
      g.fillRect(0, 0, 4, H);
      g.fillStyle = '#fff';
      g.fillRect(0, 0, 7, 7);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  });

const netMat = () =>
  once('znetm', () => new THREE.MeshLambertMaterial({ map: netTexN(), alphaTest: 0.25, side: THREE.DoubleSide }));

const netQuad = (G, a, b, c, d, cell) => {
  const L1 = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    L2 = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]),
    u = L1 / cell,
    v = L2 / cell,
    q = new THREE.BufferGeometry();
  q.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  q.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  q.computeVertexNormals();
  const m = new THREE.Mesh(q, netMat());
  m.castShadow = false;
  G.add(m);
  return m;
};

const gRod = (G, a, b, r, col) => {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    L = d.length(),
    m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), M(col));
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  G.add(m);
  return m;
};

const zNetSet = (G, x, y, z, ry, len, h) => {
  const n = new THREE.Group();
  n.position.set(x, y, z);
  n.rotation.y = ry;
  G.add(n);
  const hl = len / 2,
    T = 0xC9D3DA;
  [-1, 1].forEach(s => {
    CY(n, 0.07, 0.09, h + 0.18, T, s * (hl + 0.06), 0, 0, 10);
    BX(n, 0.2, 0.06, 0.2, 0x6E7A84, s * (hl + 0.06), 0, 0);
    add(n, new THREE.SphereGeometry(0.09, 8, 6), M(0xE6ECF0), s * (hl + 0.06), h + 0.18, 0).castShadow = false;
    BX(n, 0.07, h - 0.05, 0.05, 0xFFFFFF, s * (hl - 0.03), 0.05, 0);
  });
  netQuad(n, [-hl, 0.1, 0], [hl, 0.1, 0], [hl, h - 0.1, 0], [-hl, h - 0.1, 0], 0.2);
  BX(n, len, 0.1, 0.07, 0xFFFFFF, 0, h - 0.12, 0);
  BX(n, len, 0.1, 0.04, 0xFFFFFF, 0, h - 0.12, 0);
  BX(n, len, 0.035, 0.035, 0xE8E8E8, 0, 0.08, 0);
  BX(n, 0.06, h - 0.2, 0.045, 0xFFFFFF, 0, 0.1, 0);
  gRod(n, [-hl - 0.06, 0.25, 0], [-hl - 0.5, 0, 0], 0.015, 0x555555);
  gRod(n, [hl + 0.06, 0.25, 0], [hl + 0.5, 0, 0], 0.015, 0x555555);
};

const zGoal = (G, x, z, ry) => {
  const g = new THREE.Group();
  g.rotation.y = ry || 0;
  PW(G, x, 0.1, z).add(g);
  const W = 3.2, H = 2.4, D1 = 1.5, D2 = 2.1, HB = 1.9, F = 0xFAFAF7, S = 0x9AA5AD;
  [-1, 1].forEach(s => {
    BX(g, 0.16, H, 0.16, F, s * W - 0.08, 0, -0.08);
    BX(g, 0.3, 0.05, 0.3, 0x5C6770, s * W, 0, 0);
    gRod(g, [s * W, H, -0.08], [s * W, HB, -D1], 0.045, S);
    gRod(g, [s * W, HB, -D1], [s * W, 0, -D2], 0.045, S);
    gRod(g, [s * W, 0, -D2], [s * W, 0, 0], 0.035, S);
    BX(g, 0.12, 0.06, 0.5, 0x6E7A84, s * W, 0, -D2);
  });
  BX(g, W * 2 + 0.16, 0.16, 0.16, F, 0, H - 0.08, -0.08);
  gRod(g, [-W, HB, -D1], [W, HB, -D1], 0.04, S);
  gRod(g, [-W, 0, -D2], [W, 0, -D2], 0.035, S);
  BX(g, W * 2, 0.012, 0.12, 0xC8302A, 0, H - 0.17, 0);
  BX(g, 0.17, 0.5, 0.17, 0xC8302A, -W, H - 0.5, -0.08);
  BX(g, 0.17, 0.5, 0.17, 0xC8302A, W - 0.17, H - 0.5, -0.08);
  netQuad(g, [-W, H, -0.06], [W, H, -0.06], [W, HB, -D1], [-W, HB, -D1], 0.22);
  netQuad(g, [-W, HB, -D1], [W, HB, -D1], [W, 0, -D2], [-W, 0, -D2], 0.22);
  [-1, 1].forEach(s => {
    netQuad(g, [s * W, 0, 0], [s * W, H, -0.06], [s * W, HB, -D1], [s * W, 0, -D2], 0.22);
  });
  for (let i = 1; i < 7; i++) {
    const t = i / 7,
      xx = -W + 2 * W * t;
    BX(g, 0.02, 0.02, 0, 0xFFFFFF, xx, 0, -D2);
  }
};

const NMP = ['TOWN HALL', 'POLICE', 'COBIT BANK', 'CITY STADIUM', 'SPORTS PARK', 'GREEN VALLEY SCHOOL', 'FIRE DEPT'];
const zSign = (G, w, h, t, bg, fg, x, y, z, fs) =>
  NMP.includes(t) ? null : Gs(G, w, h, txt(Math.round(w * 60), Math.round(h * 60), bg, fg, t, fs), x, y, z);

const zRoof = (G, w, d, h, x, y, z, c) => {
  const sh = new THREE.Shape();
  sh.moveTo(-d / 2 - 0.4, 0);
  sh.lineTo(d / 2 + 0.4, 0);
  sh.lineTo(0, h);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: w + 0.8, bevelEnabled: false });
  g.translate(0, 0, -w / 2 - 0.4);
  g.rotateY(Math.PI / 2);
  return add(G, g, zTI(c), x, y, z);
};

/* Civic buildings */
export function townHall(G) {
  TW(G, 26, 11, 12, 0xE9E2D0, 0, 0, -3);
  [-1, 1].forEach(s => TW(G, 6, 8, 9, 0xDCD3BE, s * 16, 0, -2));
  zLawn(G, 42, 34, 0, 2);
  BX(G, 26, 0.1, 5, stoneM(), 0, 0, 6.8).castShadow = false;
  BX(G, 11, 0.1, 11, stoneM(), 0, 0, 13.2).castShadow = false;
  BX(G, 5, 0.1, 3.6, stoneM(), 0, 0, 19.2).castShadow = false;
  BX(G, 16.4, 0.6, 5, 0xDDD5C0, 0, 0, 5.5);
  zStairs(G, 15, 0, 8, 3);
  BX(G, 26.4, 0.5, 0.5, 0xCFC7B2, 0, 0, 3.2);
  Gs(G, 3.8, 4.6, zDoor(), 0, 2.9, 3.05);
  [-1, 1].forEach(s => Gs(G, 2.4, 3.2, zDoor(), s * 6, 2.4, 3.05));
  zColo(G, 6, -6.5, 6.5, 6, 8, 0.6, 0.45);
  BX(G, 15.6, 1, 4.8, 0xE9E2D0, 0, 9.4, 5.4);
  BX(G, 27, 0.4, 13, 0xDDD5C0, 0, 11.2, -3).castShadow = false;
  const sh = new THREE.Shape();
  sh.moveTo(-7.8, 0);
  sh.lineTo(7.8, 0);
  sh.lineTo(0, 2.6);
  sh.closePath();
  add(G, new THREE.ExtrudeGeometry(sh, { depth: 4.8, bevelEnabled: false }), M(0xEFEAE0), 0, 10.4, 3);
  Gs(G, 1.5, 1.5, zClock(), 0, 11.5, 7.85);
  zSign(G, 8, 1, 'TOWN HALL', '#E9E2D0', '#4A3B2A', 0, 9.9, 8, 34);
  CY(G, 3.4, 3.6, 2.4, 0xE9E2D0, 0, 11.4, -3, 20);
  add(G, new THREE.SphereGeometry(3.4, 22, 10, 0, 6.283, 0, 1.5708), M(0x5C8F86), 0, 13.8, -3);
  CY(G, 0.1, 0.18, 4, 0xC9D3DA, 0, 17.2, -3, 6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283;
    CY(G, 0.18, 0.18, 2.4, 0xF3EFE6, Math.cos(a) * 3.1, 11.4, -3 + Math.sin(a) * 3.1, 6);
  }
  [-1, 1].forEach(s => {
    BX(G, 6.6, 0.4, 9.6, 0xDDD5C0, s * 16, 8.2, -2).castShadow = false;
    flag(G, s * 19.5, 4, 12, 0xC8302A);
  });
  townFountain(G, 0, 14);
  [[-18, -6], [18, -6]].forEach(p => zTree(G, p[0], p[1], 1.2));
}

export function cPolice(G) {
  TW(G, 17, 10, 11, 0xDCE5EE, -4.5, 0, -2);
  TW(G, 9, 6, 9, 0xC9D1D8, 8.5, 0, -3);
  BX(G, 17.5, 1, 11.5, 0x1F4E9C, -4.5, 10.2, -2);
  BX(G, 17.7, 0.18, 11.7, 0xF4F7F9, -4.5, 11.2, -2);
  BX(G, 9.2, 0.5, 9.2, 0x1F4E9C, 8.5, 6.2, -3);
  zLawn(G, 28, 20, 0, 2);
  BX(G, 28, 0.1, 8.5, stoneM(), 0, 0, 8.2).castShadow = false;
  BX(G, 7.4, 5, 1.7, 0xB7C4D0, -5, 0, 4.3);
  BX(G, 7.8, 0.3, 2.1, 0xF4F7F9, -5, 5, 4.3);
  BX(G, 7.9, 0.14, 2.2, 0x1F4E9C, -5, 5.3, 4.3);
  zStairs(G, 6, -5, 5.3, 3);
  Gs(G, 3.4, 3.9, zDoor(), -5, 2.55, 5.17);
  [-2.6, 2.6].forEach(x => BX(G, 1.2, 3.4, 0.1, 0x3E6F8F, -5 + x, 0.5, 5.17));
  zSign(G, 7.4, 1.6, 'POLICE', '#1F4E9C', '#fff', -5, 7.6, 3.8, 56);
  zSign(G, 3.4, 0.8, 'EMERGENCY 911', '#C8302A', '#fff', -10.4, 3.6, 3.8, 22);
  [6.2, 10.8].forEach(x => Gs(G, 3.9, 3.6, zRoll('#8B98A3'), x, 2.2, 1.55));
  BX(G, 9.4, 0.4, 0.8, 0x1F4E9C, 8.5, 4.0, 1.6);
  for (let k = 0; k < 9; k++) BX(G, 1, 0.5, 0.1, k % 2 ? 0xF4F7F9 : 0x1F4E9C, 4.5 + k, 4.5, 1.62);
  CY(G, 0.1, 0.16, 9, 0xC9D3DA, -10, 11.4, -5, 6);
  BX(G, 1.6, 0.08, 0.08, 0xC9D3DA, -10, 19.2, -5);
  flag(G, -12.6, 5.6, 8, 0x1F4E9C);
  zLamp(G, -11, 6.2);
  zLamp(G, 1.2, 6.2);
  zBays(G, 4, -6, 9.2, 3.2);
  SPOT(G, 'police', [[-12.4, 9.2], [-9.2, 9.2], [-6, 9.2]]);
  [-12.4, -9.2, -6].forEach(x => zPark(G, x, 9.2, Math.PI / 2, 0xF4F4F0, () => buildPolice()));
  zPark(G, -3, 9.2, Math.PI / 2, 0x4F6A7A);
  zTree(G, -13, -3, 1.1);
}

export function townFountain(G, x, z) {
  const P = PW(G, x, 0.1, z),
    st = M(0xD9D4C6),
    fw = new THREE.MeshPhongMaterial({
      color: 0x4FA8DE,
      specular: 0xFFFFFF,
      shininess: 90,
      transparent: true,
      opacity: 0.82
    });
  onN(n => fw.color.setHex(n ? 0x2A6A92 : 0x4FA8DE));
  const disc = (r, y) => {
    const g = new THREE.CircleGeometry(r, 40);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, fw);
    m.position.y = y;
    P.add(m);
  };
  CY(P, 3.8, 3.9, 0.55, st, 0, 0, 0, 40);
  const rim = add(P, new THREE.TorusGeometry(3.55, 0.25, 8, 48), st, 0, 0.62, 0);
  rim.rotation.x = Math.PI / 2;
  disc(3.4, 0.6);
  CY(P, 0.7, 0.9, 1.7, st, 0, 0.5, 0, 16);
  CY(P, 2, 0.8, 0.5, st, 0, 1.9, 0, 28);
  disc(1.8, 2.38);
  CY(P, 0.3, 0.42, 1.4, st, 0, 2.4, 0, 12);
  CY(P, 1.05, 0.45, 0.3, st, 0, 3.7, 0, 20);
  disc(0.95, 4.02);
  CY(P, 0.12, 0.2, 0.35, 0xC9D3DA, 0, 4, 0, 8);
  const jet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.16, 1.8, 8),
    new THREE.MeshBasicMaterial({ color: 0xDFF3FF, transparent: true, opacity: 0.7 })
  );
  jet.position.y = 5;
  P.add(jet);
  const dm = new THREE.MeshBasicMaterial({ color: 0xDFF3FF, transparent: true, opacity: 0.85 }),
    dg = new THREE.SphereGeometry(0.09, 6, 5),
    drops = [];
  for (let i = 0; i < 30; i++) {
    const m = new THREE.Mesh(dg, dm);
    P.add(m);
    drops.push({ m, a: (i / 30) * 6.283 * 3.1, ph: (i * 0.37) % 1, k: i % 3 });
  }
  glow(whtG, 0, 1, 0, 10, P);
  glow(warmG, 0, 3, 0, 6, P);
  FOUNT.push({ jet, drops });
}

export function fountTick(T) {
  FOUNT.forEach(f => {
    f.jet.scale.y = 1 + 0.15 * Math.sin(T * 7);
    f.jet.position.y = 4.2 + 0.9 * f.jet.scale.y;
    f.drops.forEach(d => {
      const t = (T * 0.8 + d.ph) % 1;
      let r, y;
      if (d.k === 0) {
        r = 0.15 + t * 0.7 * Math.sin(d.a * 7);
        y = 4 + Math.sin(t * Math.PI) * 2.1;
        r = Math.abs(r);
      } else if (d.k === 1) {
        r = 0.9 + t * 1.1;
        y = 3.9 - t * t * 1.5;
      } else {
        r = 1.9 + t * 1.4;
        y = 2.4 - t * t * 1.75;
      }
      d.m.position.set(Math.cos(d.a) * r, y, Math.sin(d.a) * r);
    });
  });
}

export function skyscrapers(G) {
  TW(G, 32, 5, 13, 0xCFDCE5, 0, 0, 4.5);
  [[-9, -12, 11, 30], [9, -12, 10, 24], [0, 0, 9, 18]].forEach(t => {
    TW(G, t[2], t[3], t[2], 0xDDE7EE, t[0], 0, t[1]);
    BX(G, t[2] - 2, t[3] * 0.07, t[2] - 2, 0x9AA8B2, t[0], t[3] + 0.2, t[1]);
    CY(G, 0.15, 0.3, t[3] * 0.12, 0xC9D3DA, t[0], t[3] + t[3] * 0.07, t[1], 6);
    glow(redG, t[0], t[3] * 1.2, t[1], 3, G);
  });
  BX(G, 32.6, 0.5, 13.6, 0x2E86C1, 0, 5, 4.5);
  BX(G, 11, 0.5, 5, 0xE9F3F9, 0, 3.6, 12.5);
  [-4, 4].forEach(x => CY(G, 0.2, 0.2, 3.6, 0xC9D3DA, x, 0, 14.4, 8));
  BX(G, 8, 3.4, 0.3, DGL, 0, 0.5, 11.2);
  zSign(G, 12, 1.6, 'COBIT BANK', '#111820', '#fff', 0, 6.6, 11.3, 54);
  zLawn(G, 38, 34, 0, 5);
  zSlab(G, 36, 12, 0, 17);
}

function seatCan2() {
  const S = 64, [c, x] = mkc(S, S);
  x.fillStyle = '#55616c';
  x.fillRect(0, 0, S, S);
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 4; i++) {
      const px = i * 16 + 1.5,
        py = j * 16 + 1.5;
      x.fillStyle = '#e9eef2';
      x.beginPath();
      x.moveTo(px + 2, py);
      x.lineTo(px + 11, py);
      x.quadraticCurveTo(px + 13, py, px + 13, py + 2);
      x.lineTo(px + 13, py + 10);
      x.lineTo(px, py + 10);
      x.lineTo(px, py + 2);
      x.quadraticCurveTo(px, py, px + 2, py);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,.5)';
      x.fillRect(px + 1, py + 1, 11, 2);
      x.fillStyle = 'rgba(0,0,0,.18)';
      x.fillRect(px, py + 8, 13, 2);
      x.fillStyle = 'rgba(0,0,0,.25)';
      x.fillRect(px + 3, py + 12, 7, 2);
    }
  return c;
}

function facadeCan() {
  const S = 256, [c, x] = mkc(S, S);
  for (let i = 0; i < 4; i++) {
    const g = x.createLinearGradient(i * 64, 0, i * 64 + 64, 0);
    g.addColorStop(0, '#f6f8fa');
    g.addColorStop(0.5, '#e4e9ed');
    g.addColorStop(1, '#cfd6dc');
    x.fillStyle = g;
    x.fillRect(i * 64, 0, 64, S);
  }
  x.fillStyle = 'rgba(40,50,60,.5)';
  for (let i = 0; i < 4; i++) x.fillRect(i * 64, 0, 2.5, S);
  for (let j = 0; j < 4; j++) x.fillRect(0, j * 64, S, 1.5);
  x.fillStyle = 'rgba(60,70,80,.5)';
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      x.fillRect(i * 64 + 6, j * 64 + 6, 2, 2);
      x.fillRect(i * 64 + 56, j * 64 + 6, 2, 2);
      x.fillRect(i * 64 + 6, j * 64 + 56, 2, 2);
      x.fillRect(i * 64 + 56, j * 64 + 56, 2, 2);
    }
  return c;
}

function glassBandCan() {
  const S = 128, [c, x] = mkc(S, S);
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#7fb0d4');
  g.addColorStop(0.5, '#2e5d82');
  g.addColorStop(1, '#12293b');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 4; i++) {
    x.beginPath();
    x.moveTo(i * 32 + 4, S);
    x.lineTo(i * 32 + 18, 0);
    x.lineTo(i * 32 + 26, 0);
    x.lineTo(i * 32 + 12, S);
    x.fill();
  }
  x.fillStyle = '#dfe6ea';
  for (let i = 0; i < 4; i++) x.fillRect(i * 32, 0, 2.5, S);
  x.fillRect(0, 0, S, 3);
  x.fillRect(0, S / 2, S, 2);
  return c;
}

export function stadium(G) {
  const GW = 3.5,
    ring = (a, b, a2, b2, h, mat, y, gap) => {
      let s;
      if (gap) {
        const TP = 2 * Math.PI,
          q = 1.5 * Math.PI,
          d1 = Math.asin(GW / a),
          d2 = Math.asin(GW / a2),
          N = 72;
        s = new THREE.Shape();
        for (let i = 0; i <= N; i++) {
          const t = q + d1 + (TP - 2 * d1) * (i / N);
          if (i) s.lineTo(a * Math.cos(t), b * Math.sin(t));
          else s.moveTo(a * Math.cos(t), b * Math.sin(t));
        }
        for (let i = N; i >= 0; i--) {
          const t = q + d2 + (TP - 2 * d2) * (i / N);
          s.lineTo(a2 * Math.cos(t), b2 * Math.sin(t));
        }
        s.closePath();
      } else {
        s = new THREE.Shape();
        s.absellipse(0, 0, a, b, 0, 6.2832, false);
        const hl = new THREE.Path();
        hl.absellipse(0, 0, a2, b2, 0, 6.2832, true);
        s.holes.push(hl);
      }
      const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 44 });
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, mat);
      m.position.y = y || 0;
      m.castShadow = m.receiveShadow = true;
      G.add(m);
      return m;
    };
  const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, side: 2 });
  ltex(cm, once('slabc', concCan), 1 / 10, 1);

  const stSeat = c => {
    const m = new THREE.MeshLambertMaterial({ color: c, side: 2 });
    ltex(m, once('seat2', seatCan2), 1 / 2, 1);
    return m;
  };

  const stFacM = (() => {
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, side: 2 });
    ltex(m, once('facC', facadeCan), 1 / 6, 1);
    return m;
  })();

  const stGlassM = (() => {
    const m = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0xBFD8EE, shininess: 120, side: 2 });
    ltex(m, once('gbC', glassBandCan), 1 / 4, 1);
    return m;
  })();

  const stRoofM = (() => {
    const m = new THREE.MeshLambertMaterial({ color: 0xE4E8EB, side: 2 });
    ltex(m, once('roof', roofCan), 1 / 4, 0.95);
    return m;
  })();

  const stLedM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  onN(n => stLedM.emissive.setHex(n ? 0x7A6A40 : 0));

  const lowM = [stSeat(0x1F4E9C), stSeat(0x2A62B5)],
    upM = [stSeat(0x2E86C1), stSeat(0xDDE6EC)];
  for (let k = 0; k < 7; k++) ring(18, 24, 11 + 0.55 * k, 17 + 0.55 * k, 0.5 + 0.45 * k, [lowM[k % 2], cm], 0, 1);
  ring(18, 24, 14.9, 20.9, 3.55, [cm, cm], 0, 1);
  for (let j = 0; j < 7; j++) ring(18, 24, 15.6 + 0.34 * j, 21.6 + 0.34 * j, 4.1 + 0.95 * j, [upM[j % 2], cm], 0, 1);

  ring(18.7, 24.7, 18, 24, 4.4, cm, 0, 1);
  ring(18.7, 24.7, 18, 24, 2.8, stGlassM, 4.4, 1);
  ring(18.7, 24.7, 18, 24, 4.3, stFacM, 7.2, 1);
  ring(19.8, 25.8, 15.2, 21.2, 0.5, stRoofM, 11.6);
  ring(19.8, 25.8, 15.2, 21.2, 0.12, new THREE.MeshLambertMaterial({ color: 0x4A5560, side: 2 }), 11.48);
  ring(19.8, 25.8, 19.5, 25.5, 1.25, stFacM, 10.4);
  ring(19.84, 25.84, 19.5, 25.5, 0.18, stLedM, 10.2);

  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 6.283;
    if (i !== 7) {
      const x = 19 * Math.cos(a),
        z = 25 * Math.sin(a),
        f = BX(G, 0.9, 11.4, 0.5, 0xF2F5F7, x, 0, z);
      f.rotation.y = -Math.atan2(25 * Math.cos(a), -19 * Math.sin(a));
      BX(G, 0.5, 0.3, 0.7, 0x1F4E9C, x, 6.9, z).rotation.y = f.rotation.y;
    }
    const rx = 17.4 * Math.cos(a),
      rz = 23.4 * Math.sin(a),
      r = BX(G, 0.25, 0.3, 4.6, 0x2A343D, rx, 11.2, rz);
    r.rotation.y = Math.atan2(19 * Math.cos(a), 25 * Math.sin(a));
  }

  zLawn(G, 26, 30, 0, 0);
  const pm = Gs(G, 20, 12.6, pitchTex2(), 0, 0.2, 0);
  pm.rotation.order = 'YXZ';
  pm.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  zGoal(G, 0, -9.7, 0);
  zGoal(G, 0, 9.7, Math.PI);

  const flMat = new THREE.MeshBasicMaterial({ color: 0xE8DDB8 });
  [[-14, -19], [14, -19], [-14, 19], [14, 19]].forEach(c => {
    const m = new THREE.Group();
    m.position.set(c[0], 0, c[1]);
    m.rotation.y = Math.atan2(-c[0], -c[1]);
    G.add(m);
    CY(m, 0.2, 0.36, 19, 0xB8C2C8, 0, 0, 0, 10);
    [2, 8, 14].forEach(y => CY(m, 0.42, 0.42, 0.12, 0x8A99A4, 0, y, 0, 10));
    BX(m, 4.2, 0.25, 0.4, 0x2A343D, 0, 18.95, 0.2);
    BX(m, 4.2, 0.25, 0.4, 0x2A343D, 0, 20.9, 0.2);
    [-2, 2].forEach(x => BX(m, 0.2, 2.2, 0.4, 0x2A343D, x, 18.9, 0.2));
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 2; j++) {
        BX(m, 0.9, 0.7, 0.4, 0x333F48, -1.5 + i, 19.2 + j * 0.95, 0.3);
        BX(m, 0.78, 0.58, 0.05, flMat, -1.5 + i, 19.26 + j * 0.95, 0.52);
      }
    glow(warmG, c[0], 20, c[1], 8, G);
  });

  zSlab(G, 7, 12.6, 0, 20.3);
  [-1, 1].forEach(sd => {
    const x = sd * 4.45;
    BX(G, 1.6, 8.2, 3.9, stFacM, x, 0, 25.3);
    BX(G, 1.64, 0.45, 3.94, 0x1F4E9C, x, 6.4, 25.3);
    BX(G, 1.64, 0.18, 3.94, 0xC8302A, x, 5.95, 25.3);
    BX(G, 1.2, 0.3, 3.6, 0xDDE3E7, x, 8.2, 25.3);
    BX(G, 0.9, 2.4, 0.08, stGlassM, x, 1.2, 27.28);
  });
  BX(G, 10.4, 2.4, 3.9, stFacM, 0, 5.8, 25.3);
  BX(G, 10.8, 0.9, 4.0, 0x1F4E9C, 0, 8.2, 25.3);
  BX(G, 11.2, 0.3, 4.3, 0xDDE3E7, 0, 9.1, 25.3);
  BX(G, 7, 0.12, 3.4, 0x2A343D, 0, 5.7, 25.3);
  zLawn(G, 40, 13, 0, 29.5);
  zSlab(G, 32, 9, 0, 31);
  [-8, 8].forEach(x => {
    BX(G, 2.6, 2.8, 2.2, stFacM, x, 0, 29);
    BX(G, 2.2, 1.0, 0.06, stGlassM, x, 1.2, 30.12);
    BX(G, 3.2, 0.22, 2.9, 0x1F4E9C, x, 2.9, 29.2);
    BX(G, 3.3, 0.1, 3.0, 0xC8302A, x, 3.12, 29.2);
  });
  const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 1),
    new THREE.MeshPhongMaterial({ color: 0xF4F4F0, flatShading: true, specular: 0x444444, shininess: 40 })
  );
  ball.position.set(0, 2.4, 33);
  ball.castShadow = true;
  G.add(ball);
  CY(G, 1.5, 1.7, 0.9, 0xD9D4C6, 0, 0.1, 33, 16);
  CY(G, 0.9, 1.1, 0.5, 0x8A99A4, 0, 1.0, 33, 16);
  zHedge(G, 10, -11, 36.2);
  zHedge(G, 10, 11, 36.2);
  [[-5, 27.5], [5, 27.5], [-16, 32], [16, 32]].forEach(p => zLamp(G, p[0], p[1]));
}

export function cHospital(G) {
  TW(G, 22, 18, 14, 0xEEF3F6, 0, 0, -3);
  [-1, 1].forEach(s => TW(G, 9, 12, 11, 0xE8EFF3, s * 15.5, 0, -2));
  zLawn(G, 42, 28, 0, 3);
  zSlab(G, 42, 9, 0, 9.5);
  BX(G, 12, 0.6, 6, 0xFFFFFF, 0, 5.4, 6.5);
  [-5, 5].forEach(a => CY(G, 0.3, 0.3, 5.4, 0xE8EDF0, a, 0, 9, 8));
  BX(G, 10, 4.4, 0.6, DGL, 0, 0.6, 4.1);
  zStairs(G, 9, 0, 4.6, 2);
  Gs(
    G,
    8,
    2.4,
    Dtex(512, 150, (g, W, H) => {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#D8232A';
      g.fillRect(34, 61, 82, 28);
      g.fillRect(61, 34, 28, 82);
      g.fillStyle = '#1a2a3a';
      g.font = 'bold 56px Arial';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText('HOSPITAL', 150, 76);
    }),
    0,
    6.9,
    9.55
  );
  BX(G, 9, 0.5, 7, 0xFFFFFF, -15.5, 5, 7);
  BX(G, 9.2, 0.4, 7.2, 0xD8232A, -15.5, 5.5, 7);
  [-19, -12].forEach(x => CY(G, 0.15, 0.15, 5, 0xE8EDF0, x, 0, 10, 8));
  zSign(G, 5.6, 1.3, 'EMERGENCY', '#D8232A', '#fff', -15.5, 3.8, 10.55, 46);
  SPOT(G, 'ambulance', [[-18.2, 9.5], [-15.5, 9.5], [-12.8, 9.5]]);
  [-18.2, -15.5, -12.8].forEach(x => zPark(G, x, 9.5, -Math.PI / 2, 0xFFFFFF, () => buildAmb()));
  BX(G, 8, 0.04, 5, 0xB02A25, -15.5, 0.1, 13);
  BX(G, 0.8, 0.04, 4, 0xFFFFFF, -15.5, 0.14, 13);
  zBays(G, 5, 11, 10.5, 3.2);
  zPark(G, 8, 10.5, -Math.PI / 2, 0x2E86C1);
  zPark(G, 14.2, 10.5, -Math.PI / 2, 0xC9D3DA);
  rooftopHeliPad(G);
}

function padMat(kind) {
  const t = new THREE.CanvasTexture(padCan(kind));
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  const m = new THREE.MeshLambertMaterial({ map: t });
  onN(n => m.color.setHex(n ? 0x6A7A86 : 0xFFFFFF));
  return m;
}

let HPL = null;
function hplM() {
  return (
    HPL ||
    (HPL = (() => {
      const m = new THREE.MeshBasicMaterial({ color: 0x2F7A45 });
      onN(n => m.color.setHex(n ? 0x56FF98 : 0x2F7A45));
      return m;
    })())
  );
}

function discTop(P, r, mat, y) {
  const g = new THREE.CircleGeometry(r, 72);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = y;
  m.receiveShadow = true;
  P.add(m);
  return m;
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

export function roofPad(P) {
  const m = padMat('roof'),
    Rt = 6.1,
    hl = hplM();
  add(P, new THREE.CylinderGeometry(Rt, Rt + 0.15, 0.36, 64), M(0x6C757B), 0, 0.18, 0).castShadow = false;
  const rim = add(P, new THREE.TorusGeometry(Rt + 0.05, 0.1, 6, 72), M(0xE9B825), 0, 0.34, 0);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = false;
  discTop(P, Rt - 0.02, m, 0.372);
  const bg = new THREE.SphereGeometry(0.15, 8, 6);
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2,
      x = Math.cos(a) * (Rt - 0.3),
      z = Math.sin(a) * (Rt - 0.3);
    add(P, bg, hl, x, 0.45, z).castShadow = false;
    if (k % 2 === 0) glow(grnG, x, 0.75, z, 1.8, P);
  }
}

export function rooftopHeliPad(G) {
  const HP = PW(G, 0, 18.2, -3);
  HP.userData.pad = 1;
  roofPad(HP);
  G.userData.heliPad = HP;
  windsock(PW(G, 9.4, 18.2, -8.4), 0, 0, 0.6);
  BX(G, 3.4, 2.6, 3, 0xDCE2E6, -8.6, 18.2, 0.8);
  BX(G, 3.6, 0.25, 3.2, 0x9AA6AE, -8.6, 20.8, 0.8);
  BX(G, 0.1, 1.9, 0.9, 0x4A5A66, -6.85, 18.2, 0.8);
  zHvac(G, 9, 18.2, 1.2);
  zHvac(G, 9, 18.2, -1.6);
  const rb = new THREE.MeshBasicMaterial({ color: 0xFF3B30 });
  [-1, 1].forEach(s => {
    const w = PW(G, s * 10.3, 18.2, -9.2);
    add(w, bulbG, rb, 0, 0.5, 0).castShadow = false;
    glow(redG, 0, 0.6, 0, 3, w);
  });
}

export function fitRoofPad(G, sc) {
  const HP = G.userData.heliPad;
  if (!HP) return;
  const sx = sc[0],
    sy = sc[1],
    sz = sc[2],
    Rw = clamp(Math.min(11 * sx, 7 * sz) - 0.6, 3.6, 6.4),
    s = Rw / 6.1;
  HP.scale.set(s / sx, s / sy, s / sz);
  HELI_S = Math.min(0.72, ((Rw - 0.4) / 5.3) * 0.92);
  HOSP = G;
}

export function sportsPark(G) {
  zLawn(G, 38, 50, 0, -8);
  const pm = Gs(G, 28, 16, pitchTex(), 0, 0.12, -6);
  pm.rotation.order = 'YXZ';
  pm.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  zGoal(G, 0, -19.6, 0);
  zGoal(G, 0, 7.6, Math.PI);
  [-1, 1].forEach(s => {
    for (let i = 0; i < 3; i++) BX(G, 1.6, 0.5 + i * 0.5, 24, 0xB8C0C6, s * (10.4 + i * 1.4), 0, -6);
    BX(G, 0.2, 0.2, 24, 0xC8302A, s * 8.9, 0.3, -6);
  });
  [[-11, -19], [11, -19], [-11, 8], [11, 8]].forEach(c => {
    CY(G, 0.14, 0.2, 12, 0x9AA5AD, c[0], 0, c[1], 6);
    BX(G, 2.4, 0.5, 0.9, 0xFFF4D0, c[0], 12, c[1]);
    glow(warmG, c[0], 12.2, c[1], 9, G);
  });
  [-9.5, 9.5].forEach(x => {
    const t = Gs(
      G,
      10,
      7,
      Dtex(160, 112, (g, W, H) => {
        g.fillStyle = '#2E7A5A';
        g.fillRect(0, 0, W, H);
        g.fillStyle = '#2F6FA8';
        g.fillRect(8, 8, W - 16, H - 16);
        g.strokeStyle = '#fff';
        g.lineWidth = 2;
        g.strokeRect(14, 14, W - 28, H - 28);
        g.beginPath();
        g.moveTo(W / 2, 14);
        g.lineTo(W / 2, H - 14);
        g.moveTo(14, H / 2);
        g.lineTo(W - 14, H / 2);
        g.stroke();
      }),
      x,
      0.13,
      -27
    );
    t.rotation.x = -Math.PI / 2;
  });
  [-9.5, 9.5].forEach(x => zNetSet(G, x, 0.13, -27, Math.PI / 2, 6.2, 1.15));
  zSlab(G, 38, 9, 0, 12.5);
  BX(G, 14, 4, 6, M(0xDDE3E7), -9, 0, 12);
  BX(G, 15.4, 0.5, 7.2, 0xC8302A, -9, 4, 12);
  BX(G, 14.2, 0.25, 6.2, 0x1F4E9C, -9, 3.75, 12);
  Gs(G, 2.4, 2.2, zDoor(), -9, 1.7, 15.14);
  BX(G, 10.4, 0.22, 3.0, 0x1F4E9C, -9, 2.9, 16.6);
  BX(G, 10.5, 0.08, 3.1, 0xC8302A, -9, 3.12, 16.6);
  [-13.2, -4.8].forEach(x => CY(G, 0.12, 0.12, 2.9, 0xE9EEF2, x, 0, 17.9, 8));
  zHvac(G, -12, 4.5, 12);
  zHvac(G, -6, 4.5, 12);
  flag(G, -16.6, 15.6, 6.5, 0xC8302A);
  zSign(G, 6, 1.2, 'SPORTS PARK', '#1F4E9C', '#fff', -9, 4.7, 15.05, 44);
  zHedge(G, 3, -18, 17.5);
  zHedge(G, 3, 18, 17.5);
  [-17.5, -0.5, 17.5].forEach(x => zLamp(G, x, 16.1));
  zBays(G, 4, 9, 13, 3.2);
  zPark(G, 5.8, 13, Math.PI / 2, 0xC8302A);
  zPark(G, 12.2, 13, Math.PI / 2, 0xE6B84D);
  [[-17, 5], [17, 5], [-18, -24], [18, -24]].forEach(p => zTree(G, p[0], p[1], 1.1));
}

export function cSchool(G) {
  TW(G, 30, 9, 9, 0xE9D9B8, 0, 0, -1);
  TW(G, 9, 13, 10, 0xE3CFA8, 0, 0, -0.5);
  TW(G, 14, 8, 16.5, 0xEFE9D8, 11, 0, -12.95);
  BX(G, 31, 0.7, 9.6, 0xE8E4DC, 0, 9, -1);
  BX(G, 31.1, 0.55, 9.7, 0x1F5E8A, 0, 8.45, -1);
  zRoof(G, 9.4, 9.6, 4, 0, 13, -0.5, 0xB0452F);
  zRoof(G, 30, 9.2, 2.4, 0, 9.7, -1, 0x9A4A36);
  BX(G, 14.6, 0.5, 17.1, 0xC9D1D8, 11, 8, -12.95);
  BX(G, 12.6, 0.25, 15, 0x5E9443, 11, 8.5, -12.95);
  Gs(G, 2, 2, zClock(), 0, 11, 4.55);
  zSign(G, 10, 1.8, 'GREEN VALLEY SCHOOL', '#1F5E8A', '#fff', 0, 7.6, 4.6, 36);
  zLawn(G, 40, 21, 0, 6.5);
  CY(G, 0.08, 0.08, 9, 0xC9D1D8, -11, 0, 7.2, 8);
  zSlab(G, 34, 5, 0, 7.5);
  zStairs(G, 6, 0, 4.9, 3);
  Gs(G, 3.6, 4.2, zDoor(), 0, 2.6, 4.7);
  BX(G, 7, 0.4, 2.6, 0x1F5E8A, 0, 4.9, 6);
  [-3, 3].forEach(x => CY(G, 0.12, 0.12, 4.9, 0xE0C48F, x, 0, 7.1, 8));
  zAsph(G, 12.4, 7.4, 13.8, 13.7);
  [0, 1, 2, 3, 4].forEach(i => BX(G, 0.14, 0.02, 7, 0xE6B84D, 7.6 + i * 3, 0.12, 13.7));
  SPOT(G, 'sbus', [[9.1, 13.3], [12.1, 13.3], [15.1, 13.3]]);
  [9.1, 12.1, 15.1].forEach(x => zPark(G, x, 13.3, -Math.PI / 2, 0xF2B600, () => buildSBus()));
  const fld = Dtex(512, 300, (g, W, H) => {
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i % 2 ? '#4F8A32' : '#5A9638';
      g.fillRect((i * W) / 12, 0, W / 12, H);
    }
    g.strokeStyle = '#fff';
    g.lineWidth = 4;
    g.strokeRect(30, 30, W - 60, H - 60);
    g.beginPath();
    g.moveTo(W / 2, 30);
    g.lineTo(W / 2, H - 30);
    g.stroke();
    g.beginPath();
    g.arc(W / 2, H / 2, 40, 0, 6.3);
    g.stroke();
  });
  zLawn(G, 40, 22, 0, -30);
  Gs(G, 26, 13, fld, 0, 0.14, -30).rotation.x = -Math.PI / 2;
  zGoal(G, -12.4, -30, Math.PI / 2);
  zGoal(G, 12.4, -30, -Math.PI / 2);
  [[-18, -16], [22.5, -16]].forEach(p => zTree(G, p[0], p[1], 1.15));
}

export function fireDept(G) {
  const bk = Dbrick(0xE9B8A4);
  BX(G, 24, 10, 12, bk, -2, 0, -1.5);
  BX(G, 24.6, 0.7, 12.6, 0xE8E4DC, -2, 10, -1.5);
  BX(G, 6, 22, 6, bk, 13.5, 0, -3.5);
  BX(G, 6.8, 0.8, 6.8, 0xE8E4DC, 13.5, 22, -3.5);
  BX(G, 4.8, 3, 4.8, DGL, 13.5, 22.8, -3.5);
  CY(G, 0, 4.6, 2.6, 0xC8302A, 13.5, 25.8, -3.5, 4).rotation.y = Math.PI / 4;
  [-9.5, -2, 5.5].forEach(x => {
    BX(G, 6.4, 0.5, 0.5, 0xE8E4DC, x, 7, 4.55);
    Gs(G, 5.6, 6.4, zRoll('#C8302A'), x, 3.3, 4.55);
  });
  zSign(G, 11, 1.6, 'FIRE DEPT', '#fff', '#C8302A', -2, 9.4, 4.62, 60);
  zSlab(G, 36, 11.5, 1, 10.25);
  BX(G, 25, 0.1, 11.4, asph, -2, 0.02, 10.3).castShadow = false;
  BX(G, 6.4, 0.1, 5.4, asph, 14.8, 0.02, 9.8).castShadow = false;
  [11.7, 14.8, 17.9].forEach(x => BX(G, 0.12, 0.02, 4.6, 0xF4F4F0, x, 0.12, 9.8));
  zPark(G, 13.3, 9.8, Math.PI / 2, 0x4F6A7A);
  zPark(G, 16.4, 9.8, Math.PI / 2, 0xC9D3DA);
  SPOT(G, 'fire', [[-8, 10], [-2, 10], [4, 10]]);
  [-8, -2, 4].forEach(x => zPark(G, x, 10, -Math.PI / 2, 0xC8302A, () => buildFire()));
  zLawn(G, 38, 13.5, 1, -2.25);
  zHedge(G, 5.5, -15.4, 2, Math.PI / 2);
  zTree(G, 19, 0, 1);
  zTree(G, -18, -6, 1.1);
}

/* Block fit geometry */
const CAMP_G = 1.5,
  CAMP_D0 = 5.9 + CAMP_G,
  CAMP_TM = [0, 30, 60, 90, 120, 150, 180];

let RB = [];

function roadD(x, z, lim) {
  let m = 1e18;
  for (let k = 0; k < RB.length; k++) {
    const r = RB[k];
    if (x < r.a - lim || x > r.c + lim || z < r.b - lim || z > r.d + lim) continue;
    const P = r.P;
    for (let i = 1; i < P.length; i++) {
      const ax = P[i - 1][0],
        az = P[i - 1][1],
        dx = P[i][0] - ax,
        dz = P[i][1] - az,
        l = dx * dx + dz * dz || 1;
      let t = ((x - ax) * dx + (z - az) * dz) / l;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x - ax - t * dx,
        ez = z - az - t * dz,
        d = ex * ex + ez * ez;
      if (d < m) m = d;
    }
  }
  return m >= 1e17 ? 1e9 : Math.sqrt(m);
}

function inWedge(x, z, tm) {
  let r = Math.sqrt(x * x + z * z);
  for (let i = 0; i < 6; i++) {
    const q = x / CK(r);
    r = Math.sqrt(q * q + z * z);
  }
  const th = (Math.atan2(z, x / CK(r)) * 180) / Math.PI;
  let dt = th - tm;
  dt = (((dt + 540) % 360) + 360) % 360 - 180;
  return r > R2 && r < R3 && Math.abs(dt) < 15;
}

const FN = 113,
  FH = 56;
function campMask(tm, c0, fz, fx) {
  const m = new Uint8Array(FN * FN),
    thr = CAMP_D0 + 0.75;
  for (let i = 0; i < FN; i++)
    for (let j = 0; j < FN; j++) {
      const a = i - FH,
        b = j - FH,
        x = c0[0] + a * fz[0] + b * fx[0],
        z = c0[1] + a * fz[1] + b * fx[1];
      if (inWedge(x, z, tm) && roadD(x, z, thr + 1) >= thr) m[i * FN + j] = 1;
    }
  return m;
}

function bestRect(m, r, rho, amin, amax) {
  const W1 = FN + 1,
    I = new Int32Array(W1 * W1);
  for (let i = 0; i < FN; i++) {
    let rs = 0;
    for (let j = 0; j < FN; j++) {
      rs += m[i * FN + j];
      I[(i + 1) * W1 + j + 1] = I[i * W1 + j + 1] + rs;
    }
  }
  let best = null;
  for (let i0 = 0; i0 < FN; i0++) {
    if (i0 - FH < amin) continue;
    for (let i1 = i0 + 6; i1 < FN; i1++) {
      if (i1 - FH > amax) break;
      const h = i1 - i0;
      let run = 0,
        mr = 0,
        mrs = 0,
        st = 0;
      for (let j = 0; j < FN; j++) {
        const s = I[(i1 + 1) * W1 + j + 1] - I[i0 * W1 + j + 1] - I[(i1 + 1) * W1 + j] + I[i0 * W1 + j];
        if (s === h + 1) {
          if (!run) st = j;
          run++;
          if (run > mr) {
            mr = run;
            mrs = st;
          }
        } else run = 0;
      }
      const av = mr - 1;
      if (av < 6) continue;
      const w = Math.min(av, Math.floor(h * r * rho));
      if (w < 6 || w < (h * r) / rho) continue;
      const ar = h * w;
      if (!best || ar > best.ar) {
        let j0 = Math.round(FH - w / 2);
        j0 = Math.max(mrs, Math.min(mrs + av - w, j0));
        best = { ar, a0: i0 - FH, a1: i1 - FH, b0: j0 - FH, b1: j0 + w - FH };
      }
    }
  }
  return best;
}

function cleanLoop(L) {
  const X = (a, b, c, d) => {
    const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]),
      o1 = o(a, b, c),
      o2 = o(a, b, d),
      o3 = o(c, d, a),
      o4 = o(c, d, b);
    if (!(o1 * o2 < 0 && o3 * o4 < 0)) return null;
    const t = o3 / (o3 - o4);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  };
  for (let g = 0; g < 20; g++) {
    let hit = false;
    const n = L.length;
    for (let i = 0; i < n && !hit; i++)
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const q = X(L[i], L[i + 1], L[j], L[(j + 1) % n]);
        if (q) {
          L = L.slice(0, i + 1).concat([q], L.slice(j + 1));
          hit = true;
          break;
        }
      }
    if (!hit) break;
  }
  return L;
}

function campLoop(tm) {
  const t0 = tm - 15,
    t1 = tm + 15,
    D0 = CAMP_D0,
    ok = p => inWedge(p[0], p[1], tm) && roadD(p[0], p[1], D0 + 1) >= D0 - 0.3;
  const radRoad = t => {
    const q = Pp(120, t);
    const f = RB.find(r => r.P.length > 20 && segD(q[0], q[1], r.P) < 0.8 && segD(...Pp(100, t), r.P) < 0.8);
    let P = f ? f.P : radP(t, 46, 150);
    if (Math.hypot(P[0][0], P[0][1]) > Math.hypot(P[P.length - 1][0], P[P.length - 1][1])) P = P.slice().reverse();
    return P;
  };
  const side = P => {
    const a = offs(P, D0),
      b = offs(P, -D0),
      k = P.length >> 1;
    return ok(a[k]) ? a : b;
  };
  const keep = P => P.filter(ok);
  const inner = keep(side(arcP(R2, t0, t1, 2.2))),
    outer = keep(side(arcP(R3, t0, t1, 2.2))).reverse(),
    rr = keep(side(radRoad(t1))),
    rl = keep(side(radRoad(t0))).reverse();
  return cleanLoop(inner.concat(rr, outer, rl));
}

function inRectF(p, R, infl) {
  const dx = p[0] - R.O[0],
    dz = p[1] - R.O[1],
    a = dx * R.fz[0] + dz * R.fz[1],
    b = dx * R.fx[0] + dz * R.fx[1];
  return a > R.a0 - infl && a < R.a1 + infl && b > R.b0 - infl && b < R.b1 + infl;
}

function campScatter(loop, rects, tm) {
  const out = { trees: [], bush: [] },
    n = loop.length;
  const free = (p, m, infl) => campFreeW(p, m, tm) && !rects.some(R => inRectF(p, R, infl));
  function campFreeW(p, m, tm) {
    return inWedge(p[0], p[1], tm) && roadD(p[0], p[1], CAMP_D0 + m + 1) >= CAMP_D0 + m;
  }
  const inward = (P, i, o) => {
    const a = P[Math.max(0, i - 1)],
      b = P[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0],
      dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1,
      nx = -dz / l,
      nz = dx / l,
      p1 = [P[i][0] + nx * o, P[i][1] + nz * o],
      p2 = [P[i][0] - nx * o, P[i][1] - nz * o];
    return roadD(p1[0], p1[1], CAMP_D0 + o + 3) > roadD(p2[0], p2[1], CAMP_D0 + o + 3) ? p1 : p2;
  };
  let d = 0,
    dt = 0;
  for (let i = 1; i < n; i++) {
    const s = Math.hypot(loop[i][0] - loop[i-1][0], loop[i][1] - loop[i-1][1]);
    d += s;
    dt += s;
    if (d >= 3.4) {
      d = 0;
      const p = inward(loop, i, 1.1);
      if (free(p, 0.6, 0.8)) out.bush.push([p[0], p[1], 0.8 + ((i * 7) % 5) * 0.12]);
    }
    if (dt >= 10) {
      dt = 0;
      const p = inward(loop, i, 3.3);
      if (free(p, 2.2, 2.4)) out.trees.push([p[0], p[1], 0.8 + ((i * 3) % 4) * 0.1]);
    }
  }
  let xs = 1e9, xe = -1e9, zs = 1e9, ze = -1e9;
  loop.forEach(p => {
    xs = Math.min(xs, p[0]);
    xe = Math.max(xe, p[0]);
    zs = Math.min(zs, p[1]);
    ze = Math.max(ze, p[1]);
  });
  let k = 0;
  for (let x = xs; x < xe; x += 9)
    for (let z = zs; z < ze; z += 9) {
      k++;
      const p = [x + ((k * 37) % 9) - 4.5, z + ((k * 53) % 9) - 4.5];
      if (free(p, 4.4, 3.2) && !out.trees.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 7))
        out.trees.push([p[0], p[1], 0.85 + (k % 4) * 0.1]);
    }
  return out;
}

const CAMP_TR = [], CAMP_BU = [], PSU = 0.9;
const inFrontPol = p =>
  NOBU.some(r => {
    const dx = p[0] - r.O[0],
      dz = p[1] - r.O[1],
      a = dx * r.fz[0] + dz * r.fz[1],
      b = dx * r.fx[0] + dz * r.fx[1];
    return a > (r.a0 + r.a1) / 2 && a < r.a1 + 9 && b > r.b0 - 3 && b < r.b1 + 3;
  });

function mkLink(G, P, R, xl, w) {
  const p0 = G.localToWorld(new THREE.Vector3(xl, 0, 0)),
    O = P.c0,
    fz = P.fz,
    fx = P.fx,
    bc = (p0.x - O[0]) * fx[0] + (p0.z - O[1]) * fx[1],
    pt = (a, o) => [O[0] + a * fz[0] + (bc + (o || 0)) * fx[0], O[1] + a * fz[1] + (bc + (o || 0)) * fx[1]];
  const a0 = R.a1 - 0.8;
  let a = a0,
    a2 = a0;
  for (; a < a0 + 75; a += 0.2) {
    const q = pt(a);
    if (roadD(q[0], q[1], 12) < 3.2) break;
  }
  for (; a2 < a0 + 75; a2 += 0.2) {
    const q = pt(a2);
    if (roadD(q[0], q[1], 12) < 3.9) break;
  }
  const S = pt(a0),
    E = pt(a),
    L = Math.hypot(E[0] - S[0], E[1] - S[1]);
  if (L < 1) return;
  XRD.push({ S, E, w });
  ribbon([S, E], w, ASPH2, 0.13);
  [-1, 1].forEach(sd => {
    ribbon(offs([S, E], sd * (w / 2 - 0.55)), 0.2, WHT2, 0.17);
  });
  const dx = (E[0] - S[0]) / L,
    dz = (E[1] - S[1]) / L;
  for (let d = 0.8; d + 1.6 < L - 1; d += 3.2)
    ribbon([[S[0] + dx * d, S[1] + dz * d], [S[0] + dx * (d + 1.6), S[1] + dz * (d + 1.6)]], 0.22, YEL2, 0.17);
  if (L > 7)
    for (let o = -w / 2 + 1.2; o < w / 2 - 0.9; o += 1.1)
      ribbon([pt(a - 3.4, o), pt(a - 2.2, o)], 0.55, WHT2, 0.17);
}

const campM = new THREE.MeshLambertMaterial({ color: 0xffffff });
wtex(campM, grassCan(), 1 / 13, 0, 1.08);
onN(n => campM.color.setHex(n ? 0x2A4A58 : 0xFFFFFF));

function xzBox(G) {
  G.updateMatrixWorld(true);
  const b = new THREE.Box3(),
    t = new THREE.Box3();
  G.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    b.union(t);
  });
  return b;
}

const campProps = (G, sx, sy, sz) =>
  G.traverse(o => {
    if (o.userData && o.userData.prop) o.scale.set(PSU / sx, PSU / sy, PSU / sz);
  });

function campPrep(tm, outf) {
  const A = Pp(R2, tm),
    B = Pp(R3, tm),
    c0 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2],
    tr = (tm * Math.PI) / 180,
    vx = Math.cos(tr),
    vz = Math.sin(tr) * CK(outf ? R3 : R2),
    vl = Math.hypot(vx, vz),
    ux = vx / vl,
    uz = vz / vl,
    ry = outf ? Math.atan2(ux, uz) : Math.atan2(-ux, -uz);
  return { c0, ry, fz: [Math.sin(ry), Math.cos(ry)], fx: [Math.cos(ry), -Math.sin(ry)] };
}

function campBuild(fn) {
  const G = new THREE.Group();
  fn(G);
  campProps(G, 1, 1, 1);
  const b = xzBox(G);
  return { G, bW: b.max.x - b.min.x, bD: b.max.z - b.min.z };
}

function campApply(B, P, R) {
  const G = B.G,
    I = 0.3,
    tw = R.b1 - R.b0 - 2 * I,
    td = R.a1 - R.a0 - 2 * I;
  let sx = tw / B.bW,
    sz = td / B.bD,
    sy = clamp(Math.sqrt(sx * sz), 0.85, 1.1),
    b;
  const set = () => {
    G.rotation.y = 0;
    G.position.set(0, 0, 0);
    G.scale.set(sx, sy, sz);
    campProps(G, sx, sy, sz);
    b = xzBox(G);
  };
  for (let k = 0; k < 4; k++) {
    set();
    sx *= tw / (b.max.x - b.min.x);
    sz *= td / (b.max.z - b.min.z);
    sy = clamp(Math.sqrt(sx * sz), 0.85, 1.1);
  }
  set();
  const bo = R.b0 + I - b.min.x,
    ao = R.a0 + I - b.min.z;
  G.rotation.y = P.ry;
  G.position.set(P.c0[0] + bo * P.fx[0] + ao * P.fz[0], 0, P.c0[1] + bo * P.fx[1] + ao * P.fz[1]);
  G.updateMatrixWorld(true);
  return [sx, sy, sz];
}

function campGround(tm, rects) {
  const L = campLoop(tm);
  if (L.length < 8) return;
  const sh = new THREE.Shape();
  L.forEach((p, i) => (i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1])));
  sh.closePath();
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, campM);
  m.position.y = 0.03;
  m.receiveShadow = true;
  CITY.add(m);
  const S = campScatter(L, rects, tm);
  S.trees.forEach(p => CAMP_TR.push(p));
  S.bush.forEach(p => CAMP_BU.push(p));
}

/* Residential houses builder */
function initHouses(STN, STW) {
  const T = c => {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };

  function hCan(kind, em) {
    const W = kind == 1 ? 300 : 360,
      H = 204,
      [c, x] = mkc(W, H);
    if (em) {
      x.fillStyle = '#000';
      x.fillRect(0, 0, W, H);
    } else {
      x.fillStyle = '#f3f0e8';
      x.fillRect(0, 0, W, H);
      for (let i = 0; i < 2500; i++) {
        x.fillStyle = 'rgba(120,110,100,' + rr(0.03, 0.1) + ')';
        x.fillRect(rr(0, W), rr(0, H), 1.5, 1.5);
      }
      x.fillStyle = 'rgba(90,80,70,.38)';
      x.fillRect(0, H - 14, W, 14);
      x.fillStyle = 'rgba(60,50,45,.25)';
      x.fillRect(0, 0, W, 9);
    }
    const win = (cx, cy, w, h) => {
      if (em) {
        if (Math.random() < 0.65) {
          x.fillStyle = Math.random() < 0.5 ? '#FFD27A' : '#FFE9BA';
          x.fillRect(cx - w / 2, cy - h / 2, w, h);
        }
        return;
      }
      x.fillStyle = '#2A3036';
      x.fillRect(cx - w / 2 - 5, cy - h / 2 - 5, w + 10, h + 10);
      const g = x.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
      g.addColorStop(0, '#a9d2ea');
      g.addColorStop(1, '#46799e');
      x.fillStyle = g;
      x.fillRect(cx - w / 2, cy - h / 2, w, h);
      x.fillStyle = '#2A3036';
      x.fillRect(cx - 1.5, cy - h / 2, 3, h);
      if (w > 90) x.fillRect(cx + w / 4 - 1.5, cy - h / 2, 3, h);
    };
    if (kind == 1) {
      win(W / 2, H * 0.46, 170, 110);
    } else if (kind == 2) {
      win(W / 2, H * 0.46, 300, 110);
    } else {
      win(W * 0.19, H * 0.46, 110, 116);
      win(W * 0.81, H * 0.46, 110, 116);
      if (!em) {
        x.fillStyle = '#3a2a20';
        x.fillRect(W / 2 - 27, H - 124, 54, 110);
        x.fillStyle = '#8fc2de';
        x.fillRect(W / 2 - 19, H - 116, 38, 34);
        x.fillStyle = 'rgba(0,0,0,.25)';
        x.fillRect(W / 2 - 27, H - 124, 54, 6);
        x.fillStyle = '#e8c25a';
        x.fillRect(W / 2 + 14, H - 70, 6, 6);
        x.fillStyle = '#fff';
        x.fillRect(W / 2 - 34, H - 132, 68, 8);
      }
    }
    return c;
  }

  const mkMat = k =>
    new THREE.MeshLambertMaterial({
      map: T(hCan(k, 0)),
      emissive: 0xffffff,
      emissiveMap: T(hCan(k, 1)),
      emissiveIntensity: 0
    });
  const plMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const hm = [mkMat(1), mkMat(1), plMat, plMat, mkMat(0), mkMat(2)];

  const bx = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  };

  const mg = geoms => {
    // simple container geometry
    const g = new THREE.BoxGeometry(1, 1, 1);
    return g;
  };

  const BXG = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  };

  const HV = [
    {
      hb: BXG(4.6, 3, 4.4, -1.6, 1.5, 0),
      w2: BXG(7.6, 2.8, 4.6, 0.3, 4.4, 0.1),
      hr: BXG(8.2, 0.3, 5.2, 0.3, 5.95, 0.1),
      ch: BXG(0.35, 3, 3, 3.9, 1.5, 0.9),
      pc: BXG(3, 0.16, 1.6, -1.6, 2.9, 3),
      cc: 0x8A5A3B, cn: 0x42301F, pcc: 0xD8DADB, pcn: 0x6C6F72
    },
    {
      hb: BXG(4.8, 2.8, 4.4, 1.4, 1.4, 0.2),
      w2: BXG(3.4, 7, 3.8, -2.5, 3.5, 0),
      hr: BXG(4.2, 0.3, 4.6, -2.5, 7, 0),
      ch: BXG(5.6, 0.25, 5.2, 1.4, 2.9, 0.3),
      pc: BXG(2.2, 0.12, 1.2, 1.4, 0.06, 3),
      cc: 0x9A6B43, cn: 0x4A3322, pcc: 0xE6E3DC, pcn: 0x7A7870
    },
    {
      hb: BXG(7.8, 3, 4.2, 0, 1.5, 0),
      w2: BXG(3.2, 2.2, 3, -2.2, 4.4, -0.4),
      hr: BXG(8.6, 0.32, 6, 0, 3.2, 0.5),
      ch: BXG(3.8, 0.2, 3.6, -2.2, 5.6, -0.4),
      pc: BXG(4, 0.12, 1.4, 0, 0.06, 3.2),
      cc: 0xB5573A, cn: 0x5A2E22, pcc: 0xCFCFCB, pcn: 0x6A6A68
    },
    {
      hb: BXG(5.6, 3.2, 4.6, -1.4, 1.6, -0.2),
      w2: BXG(4.8, 2.6, 3.8, 1, 4.5, 0.4),
      hr: BXG(5.4, 0.28, 4.4, 1, 5.95, 0.4),
      ch: BXG(1.2, 6.2, 1.2, -3.6, 3.1, -1.4),
      pc: BXG(3, 0.14, 2, 2.4, 0.07, 3.2),
      cc: 0x2D3338, cn: 0x161A1D, pcc: 0xC9694A, pcn: 0x6A3526
    }
  ].map(v => {
    const I = (g, m) => new THREE.InstancedMesh(g, m, 70);
    const U = [hm[0], hm[1], plMat, plMat, hm[5], hm[5]];
    return {
      w2: I(v.w2, U),
      hb: I(v.hb, hm),
      hr: I(v.hr, new THREE.MeshLambertMaterial({ color: 0xffffff })),
      ch: I(v.ch, new THREE.MeshLambertMaterial({ color: v.cc })),
      pc: I(v.pc, new THREE.MeshLambertMaterial({ color: v.pcc })),
      v,
      k: 0
    };
  });

  const mt = new THREE.Matrix4(),
    lm = new THREE.Matrix4(),
    bm = new THREE.Matrix4(),
    o3 = new THREE.Object3D(),
    col = new THREE.Color(),
    WC = [0xF2F2EF, 0xE4E6E7, 0xD0D4D6, 0xF7F4EE, 0xBFC5C9, 0xE9E5DC, 0xD9D2C5, 0xD8C7A8, 0xB9C4B3, 0x8F9AA3],
    RC = [0x2B3036, 0x3A4047, 0x4B5259, 0x22272B, 0x5A6168];
  let n = 0;

  const sI = (im, k, x, y, z) => {
    lm.makeTranslation(x, y, z);
    mt.multiplyMatrices(bm, lm);
    im.setMatrixAt(k, mt);
  };

  const place = (P, off, skipFn) => {
    let d = 0;
    for (let i = 1; i < P.length; i++) {
      d += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (d < 9.2) continue;
      d = 0;
      const q2 = offs([P[i - 1], P[i], P[Math.min(P.length - 1, i + 1)]], off)[1];
      if (skipFn(q2[0], q2[1]) || n >= 250 || RCL(q2[0], q2[1], P) < 5) continue;
      const dx = P[Math.min(P.length - 1, i + 1)][0] - P[i - 1][0],
        dz = P[Math.min(P.length - 1, i + 1)][1] - P[i - 1][1],
        yaw = -Math.atan2(dz, dx) + (off > 0 ? Math.PI : 0);
      o3.position.set(q2[0], 0, q2[1]);
      o3.rotation.y = yaw;
      o3.updateMatrix();
      bm.copy(o3.matrix);
      const H = HV[n % HV.length],
        k = H.k++;
      if (k >= 70) continue;
      sI(H.hb, k, 0, 0, 0);
      H.hb.setColorAt(k, col.setHex(WC[(n * 5 + 2) % WC.length]));
      sI(H.hr, k, 0, 0, 0);
      H.hr.setColorAt(k, col.setHex(RC[(n * 3 + 1) % 5]));
      sI(H.ch, k, 0, 0, 0);
      sI(H.pc, k, 0, 0, 0);
      sI(H.w2, k, 0, 0, 0);
      H.w2.setColorAt(k, col.setHex(WC[(n * 3 + 4) % WC.length]));
      HOUSEPOS.push([q2[0], q2[1]]);
      HOUSEFP.push([q2[0], q2[1], yaw]);
      HOMES.push([q2[0] + 4.9 * Math.sin(yaw), q2[1] + 4.9 * Math.cos(yaw), 0, Math.cos(yaw) > 0 ? -1 : 1]);
      n++;
    }
  };

  const skipNE = (x, z) => Math.abs(x) < 14 || Math.abs(x - 44) < 10 || x > 180 || Math.hypot(x - 44, z + 44) < 20;
  const skipNW = (x, z) => Math.abs(x) < 14 || Math.abs(x + 16) < 10 || x < -176 || Math.hypot(x + 16, z + 60) < 20;
  place(STN, 12.5, skipNE);
  place(STW, -12.5, skipNW);

  HV.forEach(H =>
    [H.hb, H.w2, H.hr, H.ch, H.pc].forEach(m => {
      m.count = H.k;
      m.castShadow = true;
      CITY.add(m);
    })
  );

  onN(k => {
    hm.forEach(m => {
      if (m !== plMat) m.emissiveIntensity = k ? 1 : 0;
      m.color.setHex(k ? 0x6A7A86 : 0xFFFFFF);
    });
    HV.forEach(H => {
      H.hr.material.color.setHex(k ? 0x4A5560 : 0xFFFFFF);
      H.ch.material.color.setHex(k ? H.v.cn : H.v.cc);
      H.pc.material.color.setHex(k ? H.v.pcn : H.v.pcc);
    });
  });
}

export function initCity() {
  /* Arcs & radial road markings */
  const W = 0xFFFFFF;
  const RA = [...RL.slice(0, 5), Math.PI * 1.5, RL[5]];
  function arcs(r0, r1, c, y, gap, A) {
    A = A || RA;
    A.forEach((a, k) => {
      const b = k < A.length - 1 ? A[k + 1] : A[0] + Math.PI * 2,
        g = new THREE.RingGeometry(r0, r1, 14, 1, -(b - gap / r1), b - a - (2 * gap) / r1);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, typeof c == 'number' ? M(c) : c);
      m.position.y = y;
      m.receiveShadow = true;
      scene.add(m);
    });
  }
  arcs(35.3, 35.5, W, 0.07, 3.6);
  arcs(
    46.3,
    46.5,
    W,
    0.07,
    5.6,
    [...RA, ...[-15, 45, 105, 165].map(d => (d * Math.PI) / 180)]
      .map(a => (a + 2 * Math.PI) % (2 * Math.PI))
      .sort((x, y) => x - y)
  );
  arcs(40.82, 40.98, W, 0.07, 6);

  RL.forEach(a => {
    const g = new THREE.Group();
    g.rotation.y = -a;
    scene.add(g);
    for (let x = 14; x <= 31; x += 4.5) BX(g, 2.2, 0.02, 0.25, W, x, 0.06, 0);
    for (let k = -2; k <= 2; k++) BX(g, 2.6, 0.02, 0.55, W, 33, 0.06, k * 1.05);
    [-1, 1].forEach(s => {
      BX(g, 22, 0.02, 0.2, W, 23, 0.06, s * 2.7);
      BX(g, 5.5, 0.02, 0.2, W, 46.4, 0.06, s * 2.7);
    });
  });

  RL.forEach(a => {
    const g = new THREE.Group();
    g.rotation.y = -a;
    scene.add(g);
    const KC = 0xB4BEC6;
    [-1, 1].forEach(s => {
      BX(g, 19.6, 0.14, 0.3, KC, 24, 0.02, s * 3.15).castShadow = false;
      BX(g, 19.6, 0.08, 1.7, curbM(), 24, 0.02, s * 4.15).castShadow = false;
      BX(g, 19.6, 0.14, 0.22, KC, 24, 0.02, s * 5.1).castShadow = false;
      const f1 = BX(g, 2.05, 0.14, 0.3, KC, 13.2, 0.02, s * 3.78);
      f1.rotation.y = s * 0.66;
      f1.castShadow = false;
      const f2 = BX(g, 1.7, 0.14, 0.3, KC, 34.35, 0.02, s * 3.78);
      f2.rotation.y = -s * 0.85;
      f2.castShadow = false;
      [17.5, 21.5, 25.5, 29.5].forEach(x => {
        CY(g, 0.1, 0.12, 0.7, 0x2B3642, x, 0.1, s * 4.15, 8);
        CY(g, 0.115, 0.115, 0.06, 0xD9E2E8, x, 0.8, s * 4.15, 8);
      });
      [19.5, 27.5].forEach(x => {
        const b = new THREE.Group();
        b.position.set(x, 0.1, s * 4.5);
        b.rotation.y = s > 0 ? Math.PI : 0;
        g.add(b);
        BX(b, 1.9, 0.1, 0.5, 0x8A6A43, 0, 0.42, 0);
        BX(b, 1.9, 0.4, 0.08, 0x8A6A43, 0, 0.62, -0.24);
        [-0.8, 0.8].forEach(u => BX(b, 0.08, 0.42, 0.46, 0x2A343D, u, 0, 0));
      });
      CY(g, 0.24, 0.28, 0.75, 0x2B3642, 23.5, 0.1, s * 4.4, 10);
      CY(g, 0.27, 0.27, 0.08, 0x9AA7B0, 23.5, 0.85, s * 4.4, 10);
    });
  });

  /* River road: edge lines & lamps */
  [-1, 1].forEach(s => {
    flat(0.2, 29.3, W, s * 3.2, -61.65, 0.09);
    flat(0.2, 11.6, W, s * 3.2, -93.5, 0.09);
    flat(0.2, 15, W, s * 3.2, -227.5, 0.09);
    [-52, -65, -93].forEach(z => LP(s * 5.8, z, 0));
    for (let z = -150; z >= -182; z -= 11) LP(s * 4.5, z, 9);
  });
  for (let k = -3; k <= 3; k++) flat(0.7, 3.2, W, k * 1, -58, 0.09);
  sweep(-3.3, 0.2, 0.05, 0.17, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: 2 }));
  sweep(3.3, 0.2, 0.05, 0.17, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: 2 }));

  /* Port access road */
  flat(120.3, 0.2, W, -79.85, -98.4, 0.09);
  flat(8.8, 0.2, W, -7.9, -98.4, 0.09);
  flat(29, 0.2, W, -125.5, -107.6, 0.09);
  flat(101.5, 0.2, W, -54.25, -107.6, 0.09);
  for (let x = -136; x <= -6; x += 8)
    if (Math.abs(x + 108) > 6 && Math.abs(x + 16) > 6.5) flat(3, 0.25, W, x, -103, 0.09);
  flat(0.2, 28, W, -111.2, -121.5, 0.09);
  flat(0.2, 28, W, -104.8, -121.5, 0.09);

  /* Build ROADQ routes */
  [R2, R3].forEach(r => {
    for (let i = 0; i < RADS.length - 1; i++) {
      cRoad(arcP(r, RADS[i], RADS[i + 1], 2.2), 0);
    }
  });
  RADS.forEach(t => {
    if (LM.includes(t)) {
      const c = [Math.cos((t * Math.PI) / 180) * 79, Math.sin((t * Math.PI) / 180) * 79];
      cRoad(cat([c, Pp(84, t), Pp(100, t), Pp(125, t), Pp(150, t)], 60));
    } else cRoad(radP(t, 46, 150));
  });

  cRoad(cat([Pp(150, -15), [198, -62], [192, -84], [160, -96], [110, -100], [60, -103], [0, -103]]));
  cRoad(cat([Pp(150, 195), [-198, -62], [-190, -86], [-168, -100], [-140, -103]]));
  cRoad(cat([[-29.1, -71.2], [-27.5, -82], [-20, -94], [-16, -103]]));
  cRoad(Array.from({ length: 17 }, (_, k) => [44, -61 - (k * 42) / 16]));

  const STN = cat([[0, -80], [50, -82], [100, -80], [150, -76], [188, -68], [198, -62]]),
    STW = cat([[0, -84], [-60, -86], [-110, -84], [-150, -80], [-185, -70], [-198, -62]]);
  cRoad(STN);
  cRoad(STW);

  ROADQ.forEach(cRoadDraw);

  /* Compute bounding boxes for road network */
  RB = ROADQ.map(q => {
    const P = q.P;
    let a = 1e9,
      b = 1e9,
      c = -1e9,
      d = -1e9;
    P.forEach(p => {
      if (p[0] < a) a = p[0];
      if (p[0] > c) c = p[0];
      if (p[1] < b) b = p[1];
      if (p[1] > d) d = p[1];
    });
    return { P, a, b, c, d };
  });

  /* Block Fitting & Placement */
  const BLOCKS = [
    [0, [[townHall, 0], [cPolice, 1]]],
    [30, [[skyscrapers, 0]]],
    [60, [[stadium, 0]]],
    [90, [[cHospital, 0]]],
    [120, [[sportsPark, 0]]],
    [150, [[cSchool, 0]]],
    [180, [[fireDept, 0]]]
  ];

  BLOCKS.forEach(([tm, bl]) => {
    const B = bl.map(([fn, o]) => {
      const P = campPrep(tm, o),
        k = campBuild(fn);
      k.P = P;
      k.fn = fn;
      k.m = campMask(tm, P.c0, P.fz, P.fx);
      return k;
    });
    let R;
    if (B.length === 1) R = [bestRect(B[0].m, B[0].bW / B[0].bD, 1.45, -1e9, 1e9)];
    else {
      const [h, q] = B;
      let best = null;
      for (let sp = -34; sp <= 34; sp += 2) {
        const bh = bestRect(h.m, h.bW / h.bD, 1.45, -sp, 1e9),
          bq = bestRect(q.m, q.bW / q.bD, 1.45, sp + 2, 1e9);
        if (!bh || !bq) continue;
        const t =
          Math.min(Math.sqrt(bh.ar / (h.bW * h.bD)), Math.sqrt(bq.ar / (q.bW * q.bD))) +
          1e-5 * (bh.ar + bq.ar);
        if (!best || t > best.t) best = { t, bh, bq };
      }
      R = best
        ? [best.bh, best.bq]
        : [bestRect(h.m, h.bW / h.bD, 1.45, -1e9, -2), bestRect(q.m, q.bW / q.bD, 1.45, 2, 1e9)];
    }
    const done = [];
    B.forEach((b, i) => {
      const r = R[i];
      if (!r) return;
      const _sc = campApply(b, b.P, r);
      if (b.G.userData.heliPad) fitRoofPad(b.G, _sc);
      CITY.add(b.G);
      b.G.userData.bn = b.fn.name;
      PLC.push(b.G);
      done.push({ a0: r.a0, a1: r.a1, b0: r.b0, b1: r.b1, O: b.P.c0, fx: b.P.fx, fz: b.P.fz });
      NOBU.push({ a0: r.a0, a1: r.a1, b0: r.b0, b1: r.b1, O: b.P.c0, fx: b.P.fx, fz: b.P.fz });
      if (b.fn === townHall) mkLink(b.G, b.P, r, 0, 13);
      if (b.fn === cPolice) mkLink(b.G, b.P, r, -5, 11);
      if (b.fn === fireDept) mkLink(b.G, b.P, r, -2, 12);
    });
    campGround(tm, done);
  });

  const CR = { townHall: 'about', cSchool: 'workshops', skyscrapers: 'partners', stadium: 'competitions' };
  PLC.forEach(g => {
    const k = CR[g.userData.bn] || 'home';
    g.traverse(o => {
      if (!o.userData.room) o.userData.room = k;
    });
    pickables.push(g);
  });

  /* Houses */
  initHouses(STN, STW);

  /* Lamps cleanup */
  LAMPREC.forEach(l => {
    if (XRD.some(r => segD(l.x, l.z, [r.S, r.E]) < r.w / 2 + 1.4)) l.o.forEach(o => (o.visible = false));
  });
}
