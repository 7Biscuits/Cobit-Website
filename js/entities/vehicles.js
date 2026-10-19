import { scene, onN } from '../core/scene.js';
import { M, BX, CY, add, MB } from '../core/materials.js';
import { mkc } from '../utils/textures.js';
import { rr } from '../utils/math.js';
import { CC } from '../config.js';

/* Vehicle base materials */
export const glassM = new THREE.MeshPhongMaterial({ color: 0x1B2A36, specular: 0xBFD8EE, shininess: 150 });
export const tireM = M(0x0E141A);
export const rimM = M(0xC8D3DA);
export const headM = new THREE.MeshBasicMaterial({ color: 0xDDE8EE });
export const tailM = new THREE.MeshBasicMaterial({ color: 0x8A2A25 });

onN(n => {
  headM.color.setHex(n ? 0xDCCF9C : 0xDDE8EE);
  tailM.color.setHex(n ? 0xC8362D : 0x8A2A25);
});

export const wheelG = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14);
export const hubG = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10);
export const lampG = new THREE.BoxGeometry(0.08, 0.16, 0.4);
wheelG.rotateX(Math.PI / 2);
hubG.rotateX(Math.PI / 2);

export function ext(pts, depth) {
  const s = new THREE.Shape();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

export const PROF = {
  sedan: {
    b: [
      [-1.7, 0.35],
      [-1.7, 0.92],
      [-1.05, 0.98],
      [-0.6, 1.5],
      [0.5, 1.5],
      [1, 0.95],
      [1.7, 0.85],
      [1.7, 0.35]
    ],
    g: [
      [-0.98, 1],
      [-0.6, 1.44],
      [0.48, 1.44],
      [0.9, 1]
    ]
  },
  van: {
    b: [
      [-1.7, 0.35],
      [-1.7, 1.9],
      [0.7, 1.9],
      [1.3, 1.1],
      [1.7, 1],
      [1.7, 0.35]
    ],
    g: [
      [-1.5, 1.15],
      [-1.5, 1.7],
      [0.6, 1.7],
      [1.05, 1.15]
    ]
  }
};

export function buildCar(c, kind) {
  const P = PROF[kind === 'van' ? 'van' : 'sedan'];
  if (!P.bg) {
    P.bg = ext(P.b, 1.6);
    P.gg = ext(P.g, 1.64);
  }
  const g = new THREE.Group();
  add(g, P.bg, M(c));
  add(g, P.gg, glassM);
  [
    [1.05, 0.82],
    [1.05, -0.82],
    [-1.05, 0.82],
    [-1.05, -0.82]
  ].forEach(p => {
    add(g, wheelG, tireM, p[0], 0.36, p[1]).castShadow = false;
    add(g, hubG, rimM, p[0], 0.36, p[1] * 1.01).castShadow = false;
  });
  [-0.55, 0.55].forEach(z => {
    add(g, lampG, headM, 1.72, 0.62, z);
    add(g, lampG, tailM, -1.72, 0.7, z);
  });
  BX(g, 0.2, 0.18, 1.7, 0x1B242C, 1.75, 0.3, 0);
  BX(g, 0.2, 0.18, 1.7, 0x1B242C, -1.75, 0.3, 0);
  if (kind === 'taxi') BX(g, 0.5, 0.16, 0.3, 0xFFF2B0, -0.1, 1.5, 0);
  [0.15, -0.85].forEach(x => [0.81, -0.81].forEach(z => BX(g, 0.03, 0.5, 0.02, 0x1B242C, x, 0.56, z)));
  [0.9, -0.9].forEach(z => BX(g, 0.14, 0.1, 0.16, 0x1B242C, 0.55, 1.02, z));
  BX(g, 0.03, 0.2, 0.5, 0xF4F4F0, 1.73, 0.45, 0);
  BX(g, 0.03, 0.2, 0.5, 0xF4F4F0, -1.73, 0.45, 0);
  BX(g, 0.03, 0.16, 0.8, 0x222A30, 1.72, 0.62, 0);
  BX(g, 0.02, 0.04, 1.6, 0xC9D3DA, 1.72, 0.8, 0);
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export const wheel = (g, x, z, r) =>
  [add(g, wheelG, tireM, x, r, z), add(g, hubG, rimM, x, r, z * 1.01)].forEach(m => {
    m.scale.setScalar(r / 0.36);
    m.castShadow = false;
  });

const GL = 0x1B2A36;

export function buildBus(c) {
  const g = new THREE.Group();
  BX(g, 7, 1.9, 2.1, 0xFFFFFF, 0, 0.45, 0);
  BX(g, 7.02, 0.35, 2.12, c, 0, 0.7, 0);
  BX(g, 6.4, 0.75, 2.16, GL, -0.1, 1.4, 0);
  BX(g, 0.1, 1, 1.9, GL, 3.52, 1.15, 0);
  for (let i = 0; i < 7; i++) BX(g, 0.08, 0.78, 2.18, 0xE9EEF2, -3.1 + i * 0.92, 1.4, 0);
  BX(g, 2.4, 0.28, 1.3, 0xDDE3E7, -0.8, 2.35, 0);
  BX(g, 0.04, 0.22, 1.2, 0xFFB000, 3.53, 2.0, 0);
  BX(g, 0.9, 1.15, 2.18, 0x2A3A48, 1.9, 0.55, 0);
  BX(g, 0.04, 0.12, 1.6, 0xC9D3DA, 3.52, 0.5, 0);
  [2.2, -2.2].forEach(x => [1, -1].forEach(s => wheel(g, x, s * 0.95, 0.5)));
  [0.7, -0.7].forEach(z => {
    add(g, lampG, headM, 3.52, 0.9, z);
    add(g, lampG, tailM, -3.52, 0.9, z);
  });
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export function buildTruck(c) {
  const g = new THREE.Group();
  BX(g, 5.8, 0.3, 1.9, 0x2A343D, 0, 0.45, 0);
  BX(g, 1.5, 1.6, 2, c, 2.1, 0.7, 0);
  BX(g, 0.1, 0.7, 1.8, GL, 2.88, 1.3, 0);
  BX(g, 4, 2.3, 2.1, 0xF4F8FB, -0.8, 0.75, 0);
  BX(g, 4.02, 0.3, 2.12, c, -0.8, 1.2, 0);
  for (let i = 0; i < 6; i++) BX(g, 0.06, 2.3, 2.14, 0xD3DAE0, -2.55 + i * 0.65, 0.75, 0);
  BX(g, 0.05, 2.2, 1.9, 0xBFC8CF, -2.83, 0.8, 0);
  CY(g, 0.07, 0.07, 1.6, 0x777F86, 1.55, 0.9, 0.9, 8);
  BX(g, 0.04, 0.3, 0.5, 0xF2F2F0, 2.9, 0.5, 0);
  [2.1, -0.3, -1.7].forEach(x => [1, -1].forEach(s => wheel(g, x, s * 0.95, 0.45)));
  [0.6, -0.6].forEach(z => {
    add(g, lampG, headM, 2.88, 0.9, z);
    add(g, lampG, tailM, -2.88, 0.9, z);
  });
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export function buildBoat(c) {
  const g = new THREE.Group();
  const h = ext([[-4, -1.4], [2.8, -1.4], [4.4, 0], [2.8, 1.4], [-4, 1.4]], 0.9);
  h.rotateX(Math.PI / 2);
  add(g, h, M(c), 0, 0.3, 0);
  BX(g, 3.4, 1.5, 2.4, 0xFFFFFF, -1, 0.75, 0);
  BX(g, 3.42, 0.5, 2.42, GL, -1, 1.3, 0);
  CY(g, 0.4, 0.4, 1.3, 0xC8302A, -2.4, 2.25, 0, 10);
  BX(g, 6, 0.2, 2.6, 0xE0C48F, 0.2, 0.75, 0);
  return g.parent ? g : (scene.add(g), g);
}

/* Vehicle Texture Utilities */
export const VX = {
  cv(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  },
  L(t, tr) {
    return new THREE.MeshLambertMaterial({ map: t, transparent: !!tr, depthWrite: !tr });
  },
  pl(g, w, h, m, x, y, z, ry) {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    o.position.set(x, y, z);
    o.rotation.y = ry || 0;
    g.add(o);
    return o;
  },
  glass(x, u0, y0, u1, y1) {
    const q = x.createLinearGradient(u0, y0, u1, y1);
    q.addColorStop(0, '#2A4152');
    q.addColorStop(0.5, '#6389A0');
    q.addColorStop(1, '#223644');
    x.fillStyle = q;
    x.fillRect(u0, y0, u1 - u0, y1 - y0);
    x.fillStyle = 'rgba(255,255,255,.2)';
    x.beginPath();
    x.moveTo(u0 + (u1 - u0) * 0.12, y1);
    x.lineTo(u0 + (u1 - u0) * 0.32, y0);
    x.lineTo(u0 + (u1 - u0) * 0.44, y0);
    x.lineTo(u0 + (u1 - u0) * 0.24, y1);
    x.fill();
  },
  star(x, cx, cy, r, col) {
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx, cy, r, 0, 6.3);
    x.fill();
    x.strokeStyle = '#fff';
    x.lineWidth = r * 0.22;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72);
      x.lineTo(cx - Math.cos(a) * r * 0.72, cy - Math.sin(a) * r * 0.72);
      x.stroke();
    }
  },
  sides(W, H, base, txt) {
    const mk = m =>
      VX.cv(W, H, x => {
        if (m) {
          x.translate(W, 0);
          x.scale(-1, 1);
        }
        base(x, W, H);
        if (m) x.setTransform(1, 0, 0, 1, 0, 0);
        txt(x, W, H, m ? u => W - u : u => u);
      });
    return [VX.L(mk(0)), VX.L(mk(1))];
  },
  wheel(g, x, z, r, wd) {
    if (!VX.rimM) {
      VX.rimM = new THREE.MeshLambertMaterial({
        map: VX.cv(128, 128, (c, W, H) => {
          c.fillStyle = '#0c0c0c';
          c.fillRect(0, 0, W, H);
          const q = c.createRadialGradient(64, 64, 6, 64, 64, 62);
          q.addColorStop(0, '#C9D0D6');
          q.addColorStop(1, '#78828A');
          c.fillStyle = q;
          c.beginPath();
          c.arc(64, 64, 62, 0, 6.3);
          c.fill();
          c.fillStyle = '#2B3136';
          c.beginPath();
          c.arc(64, 64, 24, 0, 6.3);
          c.fill();
          for (let i = 0; i < 10; i++) {
            c.fillStyle = '#14181B';
            c.beginPath();
            c.arc(64 + 40 * Math.cos((i * Math.PI) / 5), 64 + 40 * Math.sin((i * Math.PI) / 5), 6, 0, 6.3);
            c.fill();
          }
          c.fillStyle = '#A5AEB5';
          c.beginPath();
          c.arc(64, 64, 10, 0, 6.3);
          c.fill();
        })
      });
    }
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, wd, 22).rotateX(Math.PI / 2), tireM);
    t.position.set(x, r, z);
    t.castShadow = false;
    g.add(t);
    const q = new THREE.Mesh(new THREE.CircleGeometry(r * 0.7, 24), VX.rimM);
    q.position.set(x, r, z + Math.sign(z) * (wd / 2 + 0.004));
    if (z < 0) q.rotation.y = Math.PI;
    g.add(q);
  }
};

/* ===== SUPER CARS ===== */
export const SUPER = (() => {
  const mat4 = (x, y, z, ry, rz) =>
    new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, rz || 0)),
      new THREE.Vector3(1, 1, 1)
    );
  const bxp = (w, h, d, x, y, z, ry, rz) => ({ g: new THREE.BoxGeometry(w, h, d), m: mat4(x, y, z, ry, rz) });
  const cylp = (r, len, x, y, z) => {
    const g = new THREE.CylinderGeometry(r, r, len, 18);
    g.rotateX(Math.PI / 2);
    return { g, m: mat4(x, y, z) };
  };
  const exh = (x, y, z) => {
    const g = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10);
    g.rotateZ(Math.PI / 2);
    return { g, m: mat4(x, y, z) };
  };
  const merge = ps => {
    const gs = ps.map(p => {
      let g = p.g.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(p.m);
      return g;
    });
    let n = 0;
    gs.forEach(g => (n += g.attributes.position.count));
    const P = new Float32Array(n * 3);
    const N = new Float32Array(n * 3);
    const U = new Float32Array(n * 2);
    let o = 0;
    gs.forEach(g => {
      const a = g.attributes;
      const c = a.position.count;
      P.set(a.position.array, o * 3);
      N.set(a.normal.array, o * 3);
      if (a.uv) U.set(a.uv.array, o * 2);
      o += c;
    });
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.BufferAttribute(P, 3));
    G.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    G.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    return G;
  };
  const shp = pts => {
    const s = new THREE.Shape();
    pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
    s.closePath();
    return s;
  };
  const extr = (pts, d, b) => {
    const g = new THREE.ExtrudeGeometry(shp(pts), {
      depth: d,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2,
      curveSegments: 4
    });
    g.translate(0, 0, -d / 2);
    return g;
  };
  const taper = (g, f) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * f(p.getX(i), p.getY(i)));
    g.computeVertexNormals();
    return g;
  };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const arch = (cx, cy, r, yb) => {
    const a0 = -Math.asin((cy - yb) / r);
    const a1 = Math.PI - a0;
    const o = [];
    for (let k = 0; k <= 9; k++) {
      const t = a0 + ((a1 - a0) * k) / 9;
      o.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return o;
  };
  const TX = c => {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };
  const rep = t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const flakeT = rep(
    (() => {
      const [c, x] = mkc(128, 128);
      x.fillStyle = '#F4F4F4';
      x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 1500; i++) {
        const v = rr(150, 255) | 0;
        x.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + rr(0.08, 0.4) + ')';
        x.fillRect(rr(0, 128), rr(0, 128), 1.6, 1.6);
      }
      return TX(c);
    })()
  );
  const carbonT = rep(
    (() => {
      const [c, x] = mkc(64, 64);
      x.fillStyle = '#16181B';
      x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          x.fillStyle = (i + j) % 2 ? '#2C3036' : '#0B0C0E';
          x.fillRect(i * 8, j * 8, 8, 4);
          x.fillStyle = (i + j) % 2 ? '#0B0C0E' : '#2C3036';
          x.fillRect(i * 8, j * 8 + 4, 8, 4);
        }
      const t = TX(c);
      t.repeat.set(3, 3);
      return t;
    })()
  );
  const plateT = (() => {
    const [c, x] = mkc(128, 64);
    x.fillStyle = '#F4F1E6';
    x.fillRect(0, 0, 128, 64);
    x.strokeStyle = '#222';
    x.lineWidth = 3;
    x.strokeRect(3, 3, 122, 58);
    x.fillStyle = '#1C3F8F';
    x.fillRect(3, 3, 14, 58);
    x.fillStyle = '#111';
    x.textAlign = 'center';
    x.font = 'bold 28px sans-serif';
    x.fillText('COBIT', 74, 29);
    x.font = 'bold 22px sans-serif';
    x.fillText('GT-' + ((100 + rr(0, 899)) | 0), 74, 54);
    return TX(c);
  })();
  const rimTex = (spoke, hub) => {
    const [c, x] = mkc(128, 128);
    x.fillStyle = '#0B0D0F';
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#9AA3AB';
    x.beginPath();
    x.arc(64, 64, 63, 0, 6.2832);
    x.fill();
    x.fillStyle = '#0D0F11';
    x.beginPath();
    x.arc(64, 64, 54, 0, 6.2832);
    x.fill();
    x.fillStyle = '#C8302A';
    x.fillRect(66, 16, 30, 30);
    x.fillStyle = '#E8503F';
    x.fillRect(66, 16, 30, 6);
    for (let i = 0; i < 10; i++) {
      x.save();
      x.translate(64, 64);
      x.rotate((i * Math.PI) / 5);
      const g = x.createLinearGradient(0, 0, 52, 0);
      g.addColorStop(0, spoke);
      g.addColorStop(1, '#8C959D');
      x.fillStyle = g;
      x.fillRect(8, -5, 46, 10);
      x.restore();
    }
    x.fillStyle = spoke;
    x.beginPath();
    x.arc(64, 64, 14, 0, 6.2832);
    x.fill();
    x.fillStyle = hub;
    x.beginPath();
    x.arc(64, 64, 6, 0, 6.2832);
    x.fill();
    return TX(c);
  };
  const rimM = [
    new THREE.MeshPhongMaterial({ map: rimTex('#D9DEE2', '#C8302A'), shininess: 110, specular: 0x888888 }),
    new THREE.MeshPhongMaterial({ map: rimTex('#C9A24A', '#111'), shininess: 110, specular: 0x888888 })
  ];
  const glass = new THREE.MeshPhongMaterial({ color: 0x0E1A24, specular: 0xCFE6F5, shininess: 180 });
  const black = new THREE.MeshLambertMaterial({ color: 0x0B0D0F });
  const carbon = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, map: carbonT, shininess: 70, specular: 0x666666 });
  const chrome = new THREE.MeshPhongMaterial({ color: 0xD5DADF, shininess: 200, specular: 0xFFFFFF });
  const tire = new THREE.MeshLambertMaterial({ color: 0x0A0C0E });
  const plate = new THREE.MeshLambertMaterial({ map: plateT });
  const bodyMats = {};
  const bodyMat = c =>
    bodyMats[c] ||
    (bodyMats[c] = new THREE.MeshPhongMaterial({
      color: new THREE.Color(c).multiplyScalar(0.82),
      map: flakeT,
      shininess: 140,
      specular: 0x666666
    }));

  const top = [
    [-1.95, 0.2],
    [-1.98, 0.54],
    [-1.86, 0.72],
    [-1.2, 0.84],
    [-0.8, 0.84],
    [0.55, 0.78],
    [1.4, 0.68],
    [1.8, 0.54],
    [1.97, 0.4],
    [1.97, 0.2],
    [1.62, 0.17]
  ];
  const outline = top.concat(arch(1.15, 0.32, 0.37, 0.17), arch(-1.15, 0.32, 0.37, 0.17), [[-1.62, 0.17]]);
  const GB = taper(extr(outline, 1.76, 0.07), (x, y) =>
    (x > 0 ? 1 - 0.1 * Math.pow(x / 2, 1.5) : 1 - 0.03 * Math.pow(-x / 2, 2)) * (1 - 0.12 * cl((y - 0.5) / 0.35, 0, 1))
  );
  const GG = taper(
    extr([[-0.85, 0.8], [-0.52, 1], [-0.12, 1.07], [0.34, 1.06], [0.92, 0.77], [0.55, 0.77]], 1.2, 0.04),
    (x, y) => 1 - 0.2 * cl((y - 0.8) / 0.3, 0, 1)
  );
  const BL = [
    bxp(3.3, 0.04, 1.5, 0, 0.13, 0),
    cylp(0.355, 1.5, 1.15, 0.32, 0),
    cylp(0.355, 1.5, -1.15, 0.32, 0),
    bxp(0.04, 0.12, 0.7, 2.06, 0.3, 0),
    bxp(0.04, 0.1, 0.38, 2.05, 0.3, 0.6),
    bxp(0.04, 0.1, 0.38, 2.05, 0.3, -0.6)
  ];
  const CA = [
    bxp(0.8, 0.025, 0.55, 0.1, 1.13, 0),
    bxp(0.36, 0.035, 1.8, 2.0, 0.1, 0),
    bxp(0.34, 0.12, 1.3, -2.0, 0.17, 0),
    bxp(0.5, 0.02, 0.2, 1.1, 0.8, 0.32, 0, -0.1),
    bxp(0.5, 0.02, 0.2, 1.1, 0.8, -0.32, 0, -0.1),
    bxp(0.2, 0.09, 0.1, 0.62, 0.9, 1.0),
    bxp(0.2, 0.09, 0.1, 0.62, 0.9, -1.0),
    bxp(1.5, 0.06, 0.1, -0.05, 0.15, 0.97),
    bxp(1.5, 0.06, 0.1, -0.05, 0.15, -0.97)
  ];
  const CH = [];
  const HD = [];
  const TL = [];
  const TI = [];
  const RM = [];
  const PL = [];
  const WG = [];
  [1, -1].forEach(s => {
    BL.push(
      bxp(0.6, 0.2, 0.03, -1.28, 0.52, s * 0.975),
      bxp(0.02, 0.4, 0.03, 0.55, 0.56, s * 0.97),
      bxp(0.02, 0.4, 0.03, -0.78, 0.6, s * 0.97),
      bxp(0.14, 0.03, 0.03, 0.1, 0.66, s * 0.975),
      bxp(0.05, 0.05, 0.14, 0.6, 0.86, s * 0.93)
    );
    HD.push(bxp(0.1, 0.05, 0.42, 1.93, 0.57, s * 0.62, 0, -0.45));
    CA.push(bxp(0.04, 0.03, 0.4, 2.0, 0.5, s * 0.62, 0, -0.45));
    TL.push(bxp(0.04, 0.1, 0.3, -2.07, 0.62, s * 0.7));
    [0.22, 0.46].forEach(z => CH.push(exh(-2.1, 0.3, s * z)));
  });
  TL.push(bxp(0.04, 0.07, 1.5, -2.07, 0.58, 0));
  [
    [1.15, 1],
    [1.15, -1],
    [-1.15, 1],
    [-1.15, -1]
  ].forEach(([wx, s]) => {
    TI.push(cylp(0.32, 0.3, wx, 0.32, s * 0.8));
    const d = new THREE.CircleGeometry(0.235, 24);
    if (s < 0) d.rotateY(Math.PI);
    RM.push({ g: d, m: mat4(wx, 0.32, s * 0.952) });
  });
  const pl = (ry, x, y) => ({ g: new THREE.PlaneGeometry(0.46, 0.23), m: mat4(x, y, 0, ry) });
  PL.push(pl(Math.PI / 2, 2.07, 0.28), pl(-Math.PI / 2, -2.08, 0.4));
  WG.push(
    bxp(0.05, 0.32, 0.08, -1.82, 1.0, 0.5),
    bxp(0.05, 0.32, 0.08, -1.82, 1.0, -0.5),
    bxp(0.55, 0.04, 1.78, -1.88, 1.18, 0, 0, 0.08),
    bxp(0.6, 0.22, 0.03, -1.88, 1.16, 0.9),
    bxp(0.6, 0.22, 0.03, -1.88, 1.16, -0.9)
  );
  const G = {
    GG,
    GBL: merge(BL),
    GCA: merge(CA),
    GCH: merge(CH),
    GHD: merge(HD),
    GTL: merge(TL),
    GTI: merge(TI),
    GRM: merge(RM),
    GPL: merge(PL),
    GW: merge(WG)
  };
  const make = (color, wing, ri) => {
    const g = new THREE.Group();
    const a = (geo, m, sh) => {
      const o = new THREE.Mesh(geo, m);
      o.castShadow = !!sh;
      g.add(o);
      return o;
    };
    a(GB, bodyMat(color), 1);
    a(G.GG, glass);
    a(G.GBL, black);
    a(G.GCA, carbon);
    a(G.GCH, chrome);
    a(G.GHD, headM);
    a(G.GTL, tailM);
    a(G.GTI, tire);
    a(G.GRM, rimM[ri % 2]);
    a(G.GPL, plate);
    if (wing) a(G.GW, carbon, 1);
    return g;
  };
  const PAL = [0xD62828, 0xF2B600, 0x1D6FD6, 0xE9E9EC, 0x15181C, 0x2FA64E, 0xFF6A13, 0x7B3FB0, 0xA9B1B8, 0x00B8A9];
  const build = c => {
    const h = ((c >> 3) ^ (c >> 9) ^ (c >> 15)) & 15;
    const m = make(c, h % 2 === 0, h % 3 === 1 ? 1 : 0);
    scene.add(m);
    return m;
  };
  return {
    make,
    build,
    PAL,
    put: (x, z, th, y, k) => {
      const m = make(PAL[k % PAL.length], k % 2 === 0, k % 3 === 1 ? 1 : 0);
      m.position.set(x, y, z);
      m.rotation.y = th;
      scene.add(m);
      return m;
    }
  };
})();

export const FLASH = [];

export function distStep(T) {
  const on = (T * 3) % 2 < 1;
  FLASH.forEach(f => {
    f.a.visible = on;
    f.b.visible = !on;
  });
}

export function buildSBus() {
  const S =
    buildSBus.S ||
    (buildSBus.S = (() => {
      const Y = '#F5B800';
      const dk = '#101010';
      const cv = (w, h, fn) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        fn(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        t.anisotropy = 4;
        t.encoding = THREE.sRGBEncoding;
        return t;
      };
      const rib = (x, W, H) => {
        x.fillStyle = Y;
        x.fillRect(0, 0, W, H);
        for (let i = 0; i < W; i += 14) {
          x.fillStyle = 'rgba(0,0,0,.07)';
          x.fillRect(i, 0, 2, H);
          x.fillStyle = 'rgba(255,255,255,.08)';
          x.fillRect(i + 2, 0, 2, H);
        }
        x.fillStyle = 'rgba(255,255,255,.1)';
        x.fillRect(0, 0, W, 6);
      };
      const rail = (x, W, y, h) => {
        x.fillStyle = dk;
        x.fillRect(0, y, W, h);
        x.fillStyle = 'rgba(255,255,255,.22)';
        x.fillRect(0, y, W, 2);
      };
      const glassG = (x, u0, y0, u1, y1) => {
        const g = x.createLinearGradient(u0, y0, u1, y1);
        g.addColorStop(0, '#2A4152');
        g.addColorStop(0.5, '#5F8196');
        g.addColorStop(1, '#223644');
        x.fillStyle = g;
        x.fillRect(u0, y0, u1 - u0, y1 - y0);
      };
      const side = door =>
        cv(1024, 256, (x, W, H) => {
          if (!door) {
            x.translate(W, 0);
            x.scale(-1, 1);
          }
          rib(x, W, H);
          rail(x, W, 168, 10);
          rail(x, W, 206, 10);
          rail(x, W, 236, 20);
          [211, 783].forEach(u => {
            x.fillStyle = '#090909';
            x.beginPath();
            x.arc(u, H, 86, Math.PI, 0);
            x.fill();
            x.strokeStyle = '#262626';
            x.lineWidth = 7;
            x.stroke();
          });
          const n = door ? 6 : 7;
          for (let i = 0; i < n; i++) {
            const u0 = 40 + i * 118;
            const u1 = u0 + 104;
            x.fillStyle = dk;
            x.fillRect(u0 - 6, 40, u1 - u0 + 12, 116);
            glassG(x, u0, 46, u1, 150);
            x.fillStyle = 'rgba(255,255,255,.2)';
            x.beginPath();
            x.moveTo(u0 + 8, 150);
            x.lineTo(u0 + 36, 46);
            x.lineTo(u0 + 56, 46);
            x.lineTo(u0 + 28, 150);
            x.fill();
            x.fillStyle = dk;
            x.fillRect(u0, 90, u1 - u0, 5);
            x.fillStyle = '#C3CAD0';
            x.fillRect(u0, 46, u1 - u0, 3);
            x.fillStyle = '#8C949A';
            x.fillRect(u0 + (u1 - u0) / 2 - 3, 95, 6, 12);
          }
          if (door) {
            x.fillStyle = dk;
            x.fillRect(846, 34, 152, 214);
            glassG(x, 852, 42, 918, 150);
            glassG(x, 926, 42, 992, 150);
            glassG(x, 852, 158, 918, 236);
            glassG(x, 926, 158, 992, 236);
            x.fillStyle = dk;
            x.fillRect(918, 34, 8, 214);
            x.fillStyle = '#C3CAD0';
            x.fillRect(930, 150, 5, 30);
          } else {
            x.fillStyle = dk;
            x.fillRect(846, 40, 150, 116);
            glassG(x, 852, 46, 990, 150);
            x.fillStyle = dk;
            x.fillRect(852, 90, 138, 5);
          }
          if (!door) x.setTransform(1, 0, 0, 1, 0, 0);
          const tx = u => (door ? u : W - u);
          x.fillStyle = dk;
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.font = 'bold 30px Arial';
          x.fillText('SCHOOL BUS', tx(430), 20);
          x.font = 'bold 19px Arial';
          x.fillText('GREEN VALLEY SCHOOL DISTRICT', tx(470), 192);
          x.font = 'bold 22px Arial';
          x.fillText('07', tx(60), 192);
          x.fillStyle = 'rgba(0,0,0,.25)';
          for (let i = 0; i < 60; i++) x.fillRect(Math.random() * W, Math.random() * H, 3, 2);
        }),
        front = cv(256, 141, (x, W, H) => {
          x.fillStyle = Y;
          x.fillRect(0, 0, W, H);
          rail(x, W, 96, 6);
          x.fillStyle = dk;
          x.fillRect(0, 112, W, 29);
          x.fillStyle = '#8E969C';
          x.fillRect(10, 116, W - 20, 4);
          x.fillStyle = '#151515';
          x.fillRect(64, 14, 128, 70);
          for (let i = 0; i < 6; i++) {
            x.fillStyle = '#A5AEB4';
            x.fillRect(68, 20 + i * 11, 120, 4);
          }
          x.fillStyle = '#C8302A';
          x.beginPath();
          x.arc(128, 12, 5, 0, 6.3);
          x.fill();
        }),
        hood = cv(224, 176, (x, W, H) => {
          rib(x, W, H);
          rail(x, W, 96, 8);
          rail(x, W, 150, 26);
          x.fillStyle = 'rgba(0,0,0,.25)';
          x.fillRect(0, 0, 6, H);
        }),
        wind = cv(256, 120, (x, W, H) => {
          x.fillStyle = dk;
          x.fillRect(0, 0, W, H);
          glassG(x, 6, 6, W / 2 - 3, H - 6);
          glassG(x, W / 2 + 3, 6, W - 6, H - 6);
          x.fillStyle = 'rgba(255,255,255,.22)';
          [
            [30, 70],
            [150, 190]
          ].forEach(([a, b]) => {
            x.beginPath();
            x.moveTo(a, H - 6);
            x.lineTo(a + 34, 6);
            x.lineTo(a + 54, 6);
            x.lineTo(a + 20, H - 6);
            x.fill();
          });
          x.strokeStyle = '#050505';
          x.lineWidth = 4;
          x.beginPath();
          x.moveTo(40, H - 8);
          x.lineTo(100, H - 52);
          x.moveTo(W / 2 + 40, H - 8);
          x.lineTo(W / 2 + 100, H - 52);
          x.stroke();
        }),
        sign = cv(256, 60, (x, W, H) => {
          x.fillStyle = '#E9A600';
          x.fillRect(0, 0, W, H);
          x.strokeStyle = dk;
          x.lineWidth = 5;
          x.strokeRect(2, 2, W - 4, H - 4);
          x.fillStyle = dk;
          x.font = 'bold 36px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('SCHOOL BUS', W / 2, H / 2 + 2);
        }),
        rear = cv(256, 208, (x, W, H) => {
          rib(x, W, H);
          x.fillStyle = dk;
          x.font = 'bold 24px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('SCHOOL BUS', W / 2, 18);
          x.fillStyle = dk;
          x.fillRect(34, 34, 188, 110);
          glassG(x, 40, 40, 122, 86);
          glassG(x, 134, 40, 216, 86);
          glassG(x, 40, 92, 122, 138);
          glassG(x, 134, 92, 216, 138);
          x.fillStyle = dk;
          x.fillRect(125, 34, 6, 110);
          rail(x, W, 150, 8);
          x.fillStyle = '#C8302A';
          x.font = 'bold 16px Arial';
          x.fillText('EMERGENCY DOOR', W / 2, 168);
          rail(x, W, 178, 6);
          x.fillStyle = dk;
          x.fillRect(0, 188, W, 20);
          x.fillStyle = '#8E969C';
          x.fillRect(10, 192, W - 20, 3);
        }),
        stop = cv(128, 128, (x, W, H) => {
          x.fillStyle = '#fff';
          x.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = Math.PI / 8 + (i * Math.PI) / 4;
            x.lineTo(64 + 62 * Math.cos(a), 64 + 62 * Math.sin(a));
          }
          x.fill();
          x.fillStyle = '#C8201A';
          x.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = Math.PI / 8 + (i * Math.PI) / 4;
            x.lineTo(64 + 55 * Math.cos(a), 64 + 55 * Math.sin(a));
          }
          x.fill();
          x.fillStyle = '#fff';
          x.font = 'bold 40px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('STOP', 64, 66);
        }),
        rim = cv(128, 128, (x, W, H) => {
          x.fillStyle = '#0c0c0c';
          x.fillRect(0, 0, W, H);
          const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
          g.addColorStop(0, '#B9C1C7');
          g.addColorStop(1, '#6F7981');
          x.fillStyle = g;
          x.beginPath();
          x.arc(64, 64, 62, 0, 6.3);
          x.fill();
          c.fillStyle = '#2B3136';
          x.beginPath();
          x.arc(64, 64, 22, 0, 6.3);
          x.fill();
          for (let i = 0; i < 8; i++) {
            x.fillStyle = '#14181B';
            x.beginPath();
            x.arc(64 + 38 * Math.cos((i * Math.PI) / 4), 64 + 38 * Math.sin((i * Math.PI) / 4), 6, 0, 6.3);
            x.fill();
          }
          x.fillStyle = '#9CA5AC';
          x.beginPath();
          x.arc(64, 64, 9, 0, 6.3);
          x.fill();
        });
      const L = t => new THREE.MeshLambertMaterial({ map: t });
      return {
        R: L(side(1)),
        Lm: L(side(0)),
        F: L(front),
        H: L(hood),
        W: new THREE.MeshLambertMaterial({ map: wind }),
        Sg: new THREE.MeshBasicMaterial({ map: sign }),
        Re: L(rear),
        St: new THREE.MeshBasicMaterial({ map: stop, side: THREE.DoubleSide }),
        Rm: new THREE.MeshLambertMaterial({ map: rim }),
        tire: new THREE.CylinderGeometry(0.5, 0.5, 0.34, 22).rotateX(Math.PI / 2),
        rimG: new THREE.CircleGeometry(0.34, 24),
        pl: (w, h) => new THREE.PlaneGeometry(w, h)
      };
    })());
  const g = new THREE.Group();
  const pl = (w, h, m, x, y, z, ry) => {
    const o = new THREE.Mesh(S.pl(w, h), m);
    o.position.set(x, y, z);
    o.rotation.y = ry || 0;
    g.add(o);
    return o;
  };
  BX(g, 6.4, 0.3, 1.7, 0x1A1A1A, -0.2, 0.15, 0);
  BX(g, 6.8, 1.7, 2.1, 0xF5B800, -0.2, 0.45, 0);
  BX(g, 1.4, 1.1, 2.0, 0xF5B800, 3.9, 0.45, 0);
  BX(g, 0.1, 0.9, 1.9, 0x1B2A36, 3.35, 1.4, 0);
  BX(g, 6.8, 0.1, 2.1, 0x4A463A, -0.2, 2.15, 0);
  [-1.6, 0.2, 1.9].forEach(x => BX(g, 0.7, 0.1, 0.7, 0x3C4043, x, 2.25, 0));
  BX(g, 0.9, 0.06, 1.9, 0x423E32, -0.2, 2.25, 0);
  pl(6.8, 1.7, S.R, -0.2, 1.3, 1.056, 0);
  pl(6.8, 1.7, S.Lm, -0.2, 1.3, -1.056, Math.PI);
  pl(1.4, 1.1, S.H, 3.9, 1.0, 1.003, 0);
  pl(1.4, 1.1, S.H, 3.9, 1.0, -1.003, Math.PI);
  pl(2.0, 1.1, S.F, 4.605, 1.0, 0, Math.PI / 2);
  pl(1.9, 0.9, S.W, 3.405, 1.85, 0, Math.PI / 2);
  pl(1.4, 0.32, S.Sg, 3.24, 2.35, 0, Math.PI / 2);
  pl(1.4, 0.32, S.Sg, -3.61, 2.35, 0, -Math.PI / 2);
  pl(2.1, 1.7, S.Re, -3.605, 1.3, 0, -Math.PI / 2);
  [
    [0.55, 0xFF2A20],
    [0.8, 0xFFB000]
  ].forEach(([z, c]) =>
    [1, -1].forEach(s => {
      BX(g, 0.1, 0.2, 0.28, new THREE.MeshBasicMaterial({ color: c }), 3.24, 1.98, s * z);
      BX(g, 0.1, 0.2, 0.28, new THREE.MeshBasicMaterial({ color: c }), -3.62, 1.98, s * z);
    })
  );
  const st = new THREE.Mesh(new THREE.CircleGeometry(0.36, 8), S.St);
  st.position.set(1.9, 1.5, -1.2);
  st.rotation.y = Math.PI;
  st.rotation.z = Math.PI / 8;
  g.add(st);
  BX(g, 0.55, 0.06, 0.06, 0x1A1A1A, 1.9, 1.45, -1.12);
  [1, -1].forEach(s => {
    BX(g, 0.14, 0.34, 0.2, 0x141414, 3.3, 1.75, s * 1.2);
    BX(g, 0.05, 0.05, 0.2, 0x141414, 3.3, 1.6, s * 1.1);
  });
  BX(g, 0.1, 0.5, 0.1, 0x141414, 4.35, 1.2, 0.85);
  [1.6, -2.2].forEach(x =>
    [1, -1].forEach(s => {
      const t = new THREE.Mesh(S.tire, tireM);
      t.position.set(x, 0.5, s * 0.95);
      t.castShadow = false;
      g.add(t);
      const r = new THREE.Mesh(S.rimG, S.Rm);
      r.position.set(x, 0.5, s * 1.123);
      if (s < 0) r.rotation.y = Math.PI;
      g.add(r);
    })
  );
  [0.7, -0.7].forEach(z => {
    add(g, lampG, headM, 4.62, 0.8, z);
    add(g, lampG, tailM, -3.62, 0.8, z);
  });
  BX(g, 0.12, 0.12, 1.9, 0x141414, 4.66, 0.38, 0);
  BX(g, 0.12, 0.12, 2.1, 0x141414, -3.66, 0.36, 0);
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export function buildPolice() {
  const g = SUPER.build(0xF4F4F0);
  const P =
    buildPolice.P ||
    (buildPolice.P = {
      D: VX.L(
        VX.cv(512, 170, (x, W, H) => {
          x.fillStyle = '#0D1220';
          x.fillRect(0, 40, W, 92);
          x.fillStyle = '#1B5FCF';
          x.fillRect(0, 30, W, 9);
          x.fillRect(0, 133, W, 9);
          x.fillStyle = '#fff';
          x.font = 'bold 74px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('POLICE', W / 2 + 34, 88);
          x.fillStyle = '#E8B923';
          x.beginPath();
          x.arc(54, 86, 34, 0, 6.3);
          x.fill();
          x.fillStyle = '#0D1220';
          x.font = 'bold 34px Arial';
          x.fillText('\u2605', 54, 88);
        }),
        1
      ),
      R: MB(0xFF2A20),
      B: MB(0x2A5BFF),
      W: MB(0xEAF4FF)
    });
  [1, -1].forEach(s => VX.pl(g, 1.5, 0.5, P.D, 0, 0.52, s * 0.968, s > 0 ? 0 : Math.PI));
  BX(g, 0.4, 0.07, 1.05, 0x15181B, 0.1, 1.13, 0);
  const A = BX(g, 0.34, 0.11, 0.42, P.R, 0.1, 1.2, 0.27);
  const B = BX(g, 0.34, 0.11, 0.42, P.B, 0.1, 1.2, -0.27);
  BX(g, 0.34, 0.11, 0.18, P.W, 0.1, 1.2, 0);
  FLASH.push({ a: A, b: B });
  BX(g, 0.1, 0.32, 1.25, 0x111111, 2.13, 0.3, 0);
  [-0.5, 0, 0.5].forEach(z => BX(g, 0.06, 0.34, 0.05, 0x111111, 2.16, 0.3, z));
  BX(g, 0.05, 0.05, 0.3, P.R, 2.06, 0.5, 0.34);
  BX(g, 0.05, 0.05, 0.3, P.B, 2.06, 0.5, -0.34);
  [1, -1].forEach(s => BX(g, 0.08, 0.08, 0.14, 0xDDE3E8, 0.6, 0.97, s * 1.0));
  CY(g, 0.015, 0.015, 0.5, 0x111111, -1.4, 1, 0.3, 6);
  return g;
}

export function buildAmb() {
  const g = new THREE.Group();
  const P =
    buildAmb.P ||
    (buildAmb.P = (() => {
      const sd = VX.sides(
        1040,
        440,
        (x, W, H) => {
          const q = x.createLinearGradient(0, 0, 0, H);
          q.addColorStop(0, '#FFFFFF');
          q.addColorStop(1, '#D9DEE2');
          x.fillStyle = q;
          x.fillRect(0, 0, W, H);
          x.fillStyle = '#C8201A';
          x.fillRect(0, 236, W, 66);
          x.fillStyle = '#F4B400';
          x.fillRect(0, 304, W, 10);
          x.fillStyle = '#1B1F23';
          x.fillRect(0, 402, W, 38);
          x.fillStyle = '#090909';
          x.beginPath();
          x.arc(240, H, 92, Math.PI, 0);
          x.fill();
          VX.glass(x, 590, 50, 730, 150);
          VX.glass(x, 770, 50, 910, 150);
          x.strokeStyle = '#9AA2A9';
          x.lineWidth = 3;
          [500, 950].forEach(u => {
            x.beginPath();
            x.moveTo(u, 16);
            x.lineTo(u, 236);
            x.moveTo(u, 314);
            x.lineTo(u, 402);
            x.stroke();
          });
          VX.star(x, 90, 110, 52, '#1F5FBF');
        },
        (x, W, H, X) => {
          x.fillStyle = '#C8201A';
          x.font = 'bold 84px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('AMBULANCE', X(370), 196);
          x.fillStyle = '#fff';
          x.font = 'bold 40px Arial';
          x.fillText('EMS 12', X(780), 270);
        }
      );
      const cb = VX.sides(
        300,
        300,
        (x, W, H) => {
          const q = x.createLinearGradient(0, 0, 0, H);
          q.addColorStop(0, '#FFFFFF');
          q.addColorStop(1, '#D9DEE2');
          x.fillStyle = q;
          x.fillRect(0, 0, W, H);
          x.fillStyle = '#C8201A';
          x.fillRect(0, 96, W, 66);
          x.fillStyle = '#F4B400';
          x.fillRect(0, 164, W, 8);
          x.fillStyle = '#090909';
          x.beginPath();
          x.arc(60, H, 66, Math.PI, 0);
          x.fill();
          x.fillStyle = '#0d0d0d';
          x.fillRect(34, 10, 236, 86);
          VX.glass(x, 40, 16, 264, 90);
          x.fillStyle = '#111';
          x.fillRect(236, 110, 30, 8);
        },
        () => {}
      );
      const fr = VX.cv(400, 300, (x, W, H) => {
        x.fillStyle = '#F2F4F5';
        x.fillRect(0, 0, W, H);
        x.fillStyle = '#0d0d0d';
        x.fillRect(14, 10, 372, 140);
        VX.glass(x, 20, 16, 194, 144);
        VX.glass(x, 206, 16, 380, 144);
        x.strokeStyle = '#050505';
        x.lineWidth = 5;
        x.beginPath();
        x.moveTo(40, 140);
        x.lineTo(110, 96);
        x.moveTo(226, 140);
        x.lineTo(296, 96);
        x.stroke();
        x.fillStyle = '#C8201A';
        x.fillRect(0, 158, W, 50);
        x.fillStyle = '#fff';
        x.font = 'bold 40px Arial';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.save();
        x.translate(W / 2, 184);
        x.scale(-1, 1);
        x.fillText('AMBULANCE', 0, 0);
        x.restore();
        x.fillStyle = '#1A1D20';
        x.fillRect(70, 216, 260, 50);
        for (let i = 0; i < 6; i++) {
          x.fillStyle = '#9AA3AA';
          x.fillRect(76, 222 + i * 7, 248, 3);
        }
        x.fillStyle = '#111';
        x.fillRect(0, 268, W, 32);
      });
      const rr = VX.cv(420, 440, (x, W, H) => {
        const q = x.createLinearGradient(0, 0, 0, H);
        q.addColorStop(0, '#FFFFFF');
        q.addColorStop(1, '#D9DEE2');
        x.fillStyle = q;
        x.fillRect(0, 0, W, H);
        x.fillStyle = '#0d0d0d';
        x.fillRect(26, 40, 174, 170);
        x.fillRect(220, 40, 174, 170);
        VX.glass(x, 32, 46, 194, 204);
        VX.glass(x, 226, 46, 388, 204);
        x.fillStyle = '#9AA2A9';
        x.fillRect(205, 30, 10, 190);
        x.fillStyle = '#C8201A';
        x.fillRect(0, 236, W, 66);
        x.fillStyle = '#F4B400';
        x.fillRect(0, 304, W, 10);
        VX.star(x, 210, 270, 24, '#fff');
        x.fillStyle = '#fff';
        x.font = 'bold 26px Arial';
        x.textAlign = 'center';
        x.fillText('AMBULANCE', 210, 332);
        for (let i = -2; i < 14; i++) {
          x.fillStyle = i % 2 ? '#C8201A' : '#fff';
          x.beginPath();
          x.moveTo(i * 40, 402);
          x.lineTo(i * 40 + 40, 402);
          x.lineTo(i * 40 + 10, 380);
          x.lineTo(i * 40 - 30, 380);
          x.fill();
        }
        x.fillStyle = '#111';
        x.fillRect(0, 402, W, 38);
      });
      return {
        S: sd,
        C: cb,
        F: VX.L(fr),
        Re: VX.L(rr),
        R: MB(0xFF2A20),
        B: MB(0x2A5BFF),
        W: MB(0xEAF4FF)
      };
    })());
  BX(g, 6.8, 0.3, 1.7, 0x1A1A1A, 0.2, 0.2, 0);
  BX(g, 5.2, 2.2, 2.1, 0xF4F6F7, -0.5, 0.55, 0);
  BX(g, 1.5, 1.5, 2.0, 0xF4F6F7, 2.85, 0.55, 0);
  BX(g, 5.2, 0.1, 2.1, 0x6E7276, -0.5, 2.75, 0);
  VX.pl(g, 5.2, 2.2, P.S[0], -0.5, 1.65, 1.056, 0);
  VX.pl(g, 5.2, 2.2, P.S[1], -0.5, 1.65, -1.056, Math.PI);
  VX.pl(g, 1.5, 1.5, P.C[0], 2.85, 1.3, 1.003, 0);
  VX.pl(g, 1.5, 1.5, P.C[1], 2.85, 1.3, -1.003, Math.PI);
  VX.pl(g, 2.0, 1.5, P.F, 3.605, 1.3, 0, Math.PI / 2);
  VX.pl(g, 2.1, 2.2, P.Re, -3.105, 1.65, 0, -Math.PI / 2);
  BX(g, 0.35, 0.14, 1.7, 0x15181B, 1.9, 2.85, 0);
  const A = BX(g, 0.3, 0.12, 0.5, P.R, 1.9, 2.97, 0.5);
  const B = BX(g, 0.3, 0.12, 0.5, P.B, 1.9, 2.97, -0.5);
  BX(g, 0.3, 0.12, 0.4, P.W, 1.9, 2.97, 0);
  FLASH.push({ a: A, b: B });
  BX(g, 0.9, 0.22, 0.9, 0x62666A, -1.4, 2.85, 0);
  [1, -1].forEach(s => {
    BX(g, 0.12, 0.4, 0.1, 0x111111, 3.5, 1.7, s * 1.12);
    add(g, lampG, headM, 3.62, 0.85, s * 0.7);
    BX(g, 0.06, 0.45, 0.14, tailM, -3.12, 0.9, s * 0.98);
  });
  BX(g, 0.14, 0.28, 2.1, 0x1A1A1A, 3.66, 0.4, 0);
  BX(g, 0.14, 0.28, 2.1, 0x1A1A1A, -3.17, 0.4, 0);
  [2.6, -1.9].forEach(x => [1, -1].forEach(s => VX.wheel(g, x, s * 0.95, 0.5, 0.34)));
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export function buildFire() {
  const g = new THREE.Group();
  const P =
    buildFire.P ||
    (buildFire.P = (() => {
      const sd = VX.sides(
        1280,
        400,
        (x, W, H) => {
          const q = x.createLinearGradient(0, 0, 0, H);
          q.addColorStop(0, '#D8271F');
          q.addColorStop(1, '#A81913');
          x.fillStyle = q;
          x.fillRect(0, 0, W, H);
          x.fillStyle = '#fff';
          x.fillRect(0, 64, W, 5);
          x.fillStyle = '#E8C21C';
          x.fillRect(0, 338, W, 12);
          x.fillStyle = '#8E969C';
          x.fillRect(0, 352, W, 48);
          for (let i = 0; i < W; i += 22) {
            x.fillStyle = 'rgba(255,255,255,.2)';
            x.fillRect(i, 356, 10, 6);
            x.fillRect(i + 11, 372, 10, 6);
          }
          [
            [40, 330],
            [370, 660],
            [700, 990]
          ].forEach(([a, b]) => {
            x.fillStyle = '#2A2E32';
            x.fillRect(a - 6, 80, b - a + 12, 230);
            const s = x.createLinearGradient(a, 80, a, 310);
            s.addColorStop(0, '#D2D8DD');
            s.addColorStop(1, '#9AA2A9');
            x.fillStyle = s;
            x.fillRect(a, 86, b - a, 218);
            for (let y = 96; y < 300; y += 14) {
              x.fillStyle = 'rgba(0,0,0,.28)';
              x.fillRect(a, y, b - a, 2);
            }
            x.fillStyle = '#111';
            x.fillRect((a + b) / 2 - 14, 292, 28, 8);
          });
          x.fillStyle = '#090909';
          [240, 600].forEach(u => {
            x.beginPath();
            x.arc(u, H, 100, Math.PI, 0);
            x.fill();
          });
          x.fillStyle = '#2A2E32';
          x.fillRect(1020, 80, 230, 230);
          x.fillStyle = '#B7BEC4';
          x.fillRect(1030, 90, 210, 210);
          [
            [1065, 135],
            [1135, 135],
            [1205, 135]
          ].forEach(([cx, cy]) => {
            x.fillStyle = '#111';
            x.beginPath();
            x.arc(cx, cy, 26, 0, 6.3);
            x.fill();
            x.fillStyle = '#F2F2F2';
            x.beginPath();
            x.arc(cx, cy, 21, 0, 6.3);
            x.fill();
            x.strokeStyle = '#C8201A';
            x.lineWidth = 4;
            x.beginPath();
            x.moveTo(cx, cy);
            x.lineTo(cx + 12, cy - 12);
            x.stroke();
          });
          [1070, 1140, 1210].forEach(u => {
            x.fillStyle = '#555';
            x.fillRect(u - 18, 215, 36, 40);
            x.fillStyle = '#C8201A';
            x.beginPath();
            x.arc(u, 262, 16, 0, 6.3);
            x.fill();
          });
        },
        (x, W, H, X) => {
          x.fillStyle = '#fff';
          x.font = 'bold 40px Arial';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText('CITY FIRE DEPARTMENT', X(500), 38);
        }
      );
      const cb = VX.sides(
        400,
        440,
        (x, W, H) => {
          const q = x.createLinearGradient(0, 0, 0, H);
          q.addColorStop(0, '#D8271F');
          q.addColorStop(1, '#A81913');
          x.fillStyle = q;
          x.fillRect(0, 0, W, H);
          x.fillStyle = '#E8C21C';
          x.fillRect(0, 338, W, 12);
          x.fillStyle = '#8E969C';
          x.fillRect(0, 352, W, 88);
          x.fillStyle = '#090909';
          x.beginPath();
          x.arc(200, H, 100, Math.PI, 0);
          x.fill();
          x.fillStyle = '#0d0d0d';
          x.fillRect(26, 26, 348, 190);
          VX.glass(x, 34, 32, 366, 210);
          x.strokeStyle = '#222';
          x.lineWidth = 4;
          x.beginPath();
          x.moveTo(200, 20);
          x.lineTo(200, 330);
          x.stroke();
          x.fillStyle = '#C9D1D8';
          x.fillRect(176, 240, 16, 8);
          x.fillRect(208, 240, 16, 8);
        },
        (x, W, H, X) => {
          x.fillStyle = '#fff';
          x.font = 'bold 44px Arial';
          x.textAlign = 'center';
          x.fillText('ENGINE 7', X(200), 300);
        }
      );
      const fr = VX.cv(460, 440, (x, W, H) => {
        const q = x.createLinearGradient(0, 0, 0, H);
        q.addColorStop(0, '#D8271F');
        q.addColorStop(1, '#A81913');
        x.fillStyle = q;
        x.fillRect(0, 0, W, H);
        x.fillStyle = '#0d0d0d';
        x.fillRect(20, 20, 420, 200);
        VX.glass(x, 28, 26, 226, 214);
        VX.glass(x, 234, 26, 432, 214);
        x.strokeStyle = '#050505';
        x.lineWidth = 6;
        x.beginPath();
        x.moveTo(60, 206);
        x.lineTo(140, 150);
        x.moveTo(266, 206);
        x.lineTo(346, 150);
        x.stroke();
        x.fillStyle = '#E8C21C';
        x.fillRect(0, 230, W, 12);
        x.fillStyle = '#1A1D20';
        x.fillRect(60, 252, 340, 120);
        for (let i = 0; i < 14; i++) {
          x.fillStyle = '#B7BEC4';
          x.fillRect(66 + i * 24, 258, 10, 108);
        }
        x.fillStyle = '#C9D1D8';
        x.fillRect(0, 384, W, 56);
      });
      const rr = VX.cv(460, 400, (x, W, H) => {
        const q = x.createLinearGradient(0, 0, 0, H);
        q.addColorStop(0, '#D8271F');
        q.addColorStop(1, '#A81913');
        x.fillStyle = q;
        x.fillRect(0, 0, W, H);
        x.fillStyle = '#2A2E32';
        x.fillRect(30, 40, 400, 150);
        x.fillStyle = '#8E969C';
        x.fillRect(36, 46, 388, 138);
        for (let y = 52; y < 180; y += 12) {
          x.fillStyle = 'rgba(0,0,0,.28)';
          x.fillRect(36, y, 388, 2);
        }
        for (let i = -2; i < 14; i++) {
          x.fillStyle = i % 2 ? '#E8C21C' : '#C8201A';
          x.beginPath();
          x.moveTo(i * 44, 350);
          x.lineTo(i * 44 + 44, 350);
          x.lineTo(i * 44 + 14, 214);
          x.lineTo(i * 44 - 30, 214);
          x.fill();
        }
        x.fillStyle = '#8E969C';
        x.fillRect(0, 352, W, 48);
      });
      return {
        S: sd,
        C: cb,
        F: VX.L(fr),
        Re: VX.L(rr),
        R: MB(0xFF2A20),
        W: MB(0xEAF4FF),
        Bl: MB(0x2A5BFF)
      };
    })());
  BX(g, 7.6, 0.3, 1.9, 0x1A1A1A, 0, 0.25, 0);
  BX(g, 6.4, 2.0, 2.3, 0xC8201A, -1.2, 0.6, 0);
  BX(g, 2.0, 2.2, 2.3, 0xC8201A, 3.0, 0.6, 0);
  BX(g, 2.0, 0.12, 2.3, 0x6E1410, 3.0, 2.8, 0);
  BX(g, 6.4, 0.1, 2.3, 0x6E1410, -1.2, 2.6, 0);
  VX.pl(g, 6.4, 2.0, P.S[0], -1.2, 1.6, 1.156, 0);
  VX.pl(g, 6.4, 2.0, P.S[1], -1.2, 1.6, -1.156, Math.PI);
  VX.pl(g, 2.0, 2.2, P.C[0], 3.0, 1.7, 1.156, 0);
  VX.pl(g, 2.0, 2.2, P.C[1], 3.0, 1.7, -1.156, Math.PI);
  VX.pl(g, 2.3, 2.2, P.F, 4.005, 1.7, 0, Math.PI / 2);
  VX.pl(g, 2.3, 2.0, P.Re, -4.405, 1.6, 0, -Math.PI / 2);
  BX(g, 6.0, 0.12, 0.9, 0x7A8086, -1.2, 2.7, 0);
  [0.42, -0.42].forEach(z => {
    BX(g, 5.8, 0.1, 0.1, 0xC9D1D8, -1.3, 2.82, z);
    BX(g, 5.8, 0.1, 0.1, 0xC9D1D8, -1.3, 3.12, z);
  });
  for (let i = 0; i < 15; i++) BX(g, 0.06, 0.06, 0.94, 0xC9D1D8, -4.1 + i * 0.4, 2.86, 0);
  BX(g, 0.08, 0.4, 0.08, 0xC9D1D8, -3.6, 2.82, 0.42);
  BX(g, 0.08, 0.4, 0.08, 0xC9D1D8, -0.6, 2.82, -0.42);
  BX(g, 0.4, 0.12, 1.9, 0x15181B, 3.3, 2.92, 0);
  const A = BX(g, 0.34, 0.12, 0.55, P.R, 3.3, 3.04, 0.6);
  const B = BX(g, 0.34, 0.12, 0.55, P.Bl, 3.3, 3.04, -0.6);
  BX(g, 0.34, 0.12, 0.4, P.W, 3.3, 3.04, 0);
  FLASH.push({ a: A, b: B });
  BX(g, 0.25, 0.3, 2.5, 0xC9D1D8, 4.12, 0.5, 0);
  BX(g, 0.14, 0.28, 2.3, 0x1A1A1A, -4.45, 0.4, 0);
  [1, -1].forEach(s => {
    BX(g, 0.14, 0.5, 0.12, 0x111111, 3.9, 2.0, s * 1.3);
    add(g, lampG, headM, 4.02, 0.95, s * 0.9);
    BX(g, 0.06, 0.4, 0.16, tailM, -4.42, 0.85, s * 1.0);
  });
  [3.0, -1.4, -3.2].forEach(x => [1, -1].forEach(s => VX.wheel(g, x, s * 1.0, 0.55, 0.42)));
  g.scale.setScalar(0.95);
  scene.add(g);
  return g;
}

export const build0 = (k, c) =>
  k === 'bus'
    ? buildBus(c)
    : k === 'truck'
    ? buildTruck(c)
    : k === 'ambulance'
    ? buildAmb()
    : SUPER.build(k === 'taxi' ? 0xE6B84D : c);

export const build = (k, c) => {
  window.PAINT = true;
  try {
    return build0(k, c);
  } finally {
    window.PAINT = false;
  }
};
