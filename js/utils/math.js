export const $ = s => document.querySelector(s);

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const sm = t => t * t * (3 - 2 * t);
export const sm2 = t => t * t * (3 - 2 * t);
export const sm4 = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
export const sstep = t => t * t * (3 - 2 * t);

export const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const trap = (a, q = 0.1) => {
  if (a < q) return (a * a) / (2 * q * (1 - q));
  if (a > 1 - q) return 1 - ((1 - a) * (1 - a)) / (2 * q * (1 - q));
  return (a - q / 2) / (1 - q);
};

export const wn = a => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

let sd = 11;
export const R = () => {
  sd = (sd * 16807) % 2147483647;
  return sd / 2147483647;
};

export const rnd = (a, b) => a + (b - a) * R();

export const pick = a => a[Math.floor(R() * a.length)];

export const rr = (a, b) => a + Math.random() * (b - a);

export function rtH(i, j, s) {
  const h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

export function rtN(x, y, px, py, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const m = (a, q) => ((a % q) + q) % q;
  const a = rtH(m(xi, px), m(yi, py), s);
  const b = rtH(m(xi + 1, px), m(yi, py), s);
  const c = rtH(m(xi, px), m(yi + 1, py), s);
  const d = rtH(m(xi + 1, px), m(yi + 1, py), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function rtF(x, y, px, py, s, o) {
  let t = 0;
  let a = 0.5;
  let f = 1;
  let n = 0;
  for (let i = 0; i < o; i++) {
    t += a * rtN(x * f, y * f, px * f, py * f, s + i * 3);
    n += a;
    a *= 0.5;
    f *= 2;
  }
  return t / n;
}

export function rtS(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const CK = r => 1 + 0.35 * clamp((r - 47) / 45, 0, 1);

export const Pp = (r, t) => {
  const rad = t * Math.PI / 180;
  return [r * Math.cos(rad) * CK(r), r * Math.sin(rad)];
};

export const arcP = (r, t0, t1, st) => {
  const n = Math.max(2, Math.ceil(Math.abs(t1 - t0) * Math.PI / 180 * r / (st || 2.5)));
  const P = [];
  for (let i = 0; i <= n; i++) {
    P.push(Pp(r, t0 + (t1 - t0) * i / n));
  }
  return P;
};

export const radP = (t, r0, r1) => {
  const n = Math.max(2, Math.ceil(Math.abs(r1 - r0) / 2.5));
  const P = [];
  for (let i = 0; i <= n; i++) {
    P.push(Pp(r0 + (r1 - r0) * i / n, t));
  }
  return P;
};

export const cat = (pts, n) => {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  return c.getSpacedPoints(n || Math.ceil(c.getLength() / 3)).map(v => [v.x, v.z]);
};

export const offs = (P, o) =>
  P.map((p, i) => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    return [p[0] - (dz / l) * o, p[1] + (dx / l) * o];
  });

export function segD(x, z, P) {
  let m = 1e9;
  for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1][0];
    const az = P[i - 1][1];
    const dx = P[i][0] - ax;
    const dz = P[i][1] - az;
    const l = dx * dx + dz * dz || 1;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / l, 0, 1);
    const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
    if (d < m) m = d;
  }
  return m;
}

export function xzBox(G) {
  G.updateMatrixWorld(true);
  const b = new THREE.Box3();
  const t = new THREE.Box3();
  G.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    b.union(t);
  });
  return b;
}

export const cum = P => {
  const S = [0];
  for (let i = 1; i < P.length; i++) {
    S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  }
  return S;
};

export const resample = (P, st) => {
  const S = cum(P);
  const L = S[S.length - 1];
  const n = Math.max(1, Math.round(L / st));
  const O = [];
  let j = 1;
  for (let k = 0; k <= n; k++) {
    const s = (L * k) / n;
    while (j < P.length - 1 && S[j] < s) j++;
    const a = P[j - 1];
    const b = P[j];
    const d = S[j] - S[j - 1] || 1;
    const t = Math.min(1, Math.max(0, (s - S[j - 1]) / d));
    O.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return O;
};
