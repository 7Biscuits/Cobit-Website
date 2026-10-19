import { scene, cam, onN, add, st } from './scene.js';
import { glowTex, panelCan, fuseCan, hullCan, fabricCan, roofCan, plankCan, contCan, stoneCan } from '../utils/textures.js';
import { R } from '../utils/math.js';

export { add };

export function rod(g, a, b, r, c) {
  const A = new THREE.Vector3(a[0], a[1], a[2]),
    B = new THREE.Vector3(b[0], b[1], b[2]),
    d = B.clone().sub(A),
    m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, d.length(), 4),
      new THREE.MeshBasicMaterial({ color: c })
    );
  m.position.copy(A.clone().add(B).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.add(m);
  return m;
}

let STONEM = null;
export function stoneM() {
  if (!STONEM) {
    STONEM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    wtex(STONEM, stoneCan(), 1 / 9, 0, 1);
    onN(n => STONEM.color.setHex(n ? 0x4A5B68 : 0xFFFFFF));
  }
  return STONEM;
}

let PAINT = false;
let MODERN = false;

export const setPaint = v => {
  PAINT = !!v;
};
export const setModern = v => {
  MODERN = !!v;
};
export const getPaint = () => PAINT;
export const getModern = () => MODERN;

export const mdc = c => {
  if (!MODERN || typeof c !== 'number') return c;
  const k = new THREE.Color(c);
  const h = {};
  k.getHSL(h);
  k.setHSL(h.h, h.s * 0.2, h.l > 0.8 ? 0.84 : h.l < 0.25 ? h.l * 0.9 : h.l * 0.7 + 0.06);
  return k.getHex();
};

const pmc = {};
const mc = {};

export function grainFn(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vGP;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGP=position;');
  sh.fragmentShader = sh.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vGP;float gh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}float gn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(gh(i),gh(i+vec3(1,0,0)),f.x),mix(gh(i+vec3(0,1,0)),gh(i+vec3(1,1,0)),f.x),f.y),mix(mix(gh(i+vec3(0,0,1)),gh(i+vec3(1,0,1)),f.x),mix(gh(i+vec3(0,1,1)),gh(i+vec3(1,1,1)),f.x),f.y),f.z);}'
    )
    .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=.86+.2*gn(vGP*4.)+.1*gn(vGP*17.);');
}

export const paintM = c => pmc[c] || (pmc[c] = new THREE.MeshPhongMaterial({ color: c, specular: 0x666a6e, shininess: 70 }));

export const M = c => {
  if (PAINT) return paintM(c);
  c = mdc(c);
  if (!mc[c]) {
    const m = new THREE.MeshLambertMaterial({ color: c });
    m.onBeforeCompile = grainFn;
    mc[c] = m;
  }
  return mc[c];
};

export const BX = (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? M(c) : c, x, y + h / 2, z);

export const CY = (p, a, b, h, c, x, y, z, s = 24) => add(p, new THREE.CylinderGeometry(a, b, h, s), typeof c === 'number' ? M(c) : c, x, y + h / 2, z);

export const flat = (w, d, c, x, z, y = 0.03, rz = 0) => {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, typeof c === 'number' ? M(c) : c);
  m.position.set(x, y, z);
  m.rotation.y = rz;
  m.receiveShadow = true;
  scene.add(m);
  return m;
};

export const disc = (r0, r1, c, y) => {
  const g = new THREE.RingGeometry(r0, r1, 72);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, typeof c === 'number' ? M(c) : c);
  m.position.y = y;
  m.receiveShadow = true;
  scene.add(m);
  return m;
};

export function wtex(mat, c, sc, alpha, gain) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  const key = 'wt' + sc + '_' + (alpha ? 1 : 0) + '_' + (gain || 0.8);
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = sh => {
    sh.uniforms.wmap = { value: t };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*\n#ifdef USE_INSTANCING\ninstanceMatrix*\n#endif\nvec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;uniform sampler2D wmap;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n{vec4 tc=texture2D(wmap,vWP.xz*' +
          sc.toFixed(5) +
          ');diffuseColor.rgb*=pow(tc.rgb,vec3(2.2))*' +
          (gain || 0.8).toFixed(2) +
          ';' +
          (alpha ? 'diffuseColor.a*=tc.a;' : '') +
          '}'
      );
  };
  mat.needsUpdate = true;
}

export function ltex(mat, c, sc, gain) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  const key = 'lt' + sc + '_' + (gain || 1);
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = sh => {
    sh.uniforms.lmap = { value: t };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;varying vec3 vLN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP=position;vLN=normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;varying vec3 vLN;uniform sampler2D lmap;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n{vec3 an=abs(vLN);vec2 uv=an.y>.6?vLP.xz:(an.x>an.z?vLP.zy:vLP.xy);vec4 tc=texture2D(lmap,uv*' +
          sc.toFixed(4) +
          ');diffuseColor.rgb*=pow(tc.rgb,vec3(2.2))*' +
          (gain || 1).toFixed(2) +
          ';}'
      );
  };
  mat.needsUpdate = true;
}

const cache2 = {};
export const once = (k, f) => cache2[k] || (cache2[k] = f());

let wingMat = null;
export function wingM() {
  if (!wingMat) {
    wingMat = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x555a60, shininess: 50 });
    ltex(wingMat, panelCan(), 1 / 5, 0.97);
  }
  return wingMat;
}

let fuseTex = null;
export function fusM() {
  const m = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x666a70, shininess: 60 });
  fuseTex = fuseTex || new THREE.CanvasTexture(fuseCan());
  fuseTex.anisotropy = 4;
  m.map = fuseTex;
  return m;
}

const hullMc = {};
export function hullMat(c) {
  return hullMc[c] || (hullMc[c] = (() => {
    const m = new THREE.MeshPhongMaterial({ color: c, specular: 0x777b80, shininess: 60 });
    ltex(m, once('hull', hullCan), 1 / 5, 1);
    return m;
  })());
}

const fabMc = {};
export function fabM(c) {
  return fabMc[c] || (fabMc[c] = (() => {
    const m = new THREE.MeshLambertMaterial({ color: c, side: 2 });
    ltex(m, once('fab', fabricCan), 1 / 2, 0.95);
    return m;
  })());
}

const roofMc = {};
export function roofM(c) {
  c = mdc(c);
  return roofMc[c] || (roofMc[c] = (() => {
    const m = new THREE.MeshLambertMaterial({ color: c });
    ltex(m, once('roof', roofCan), 1 / 3, 0.95);
    return m;
  })());
}

let deckMat = null;
export function plankM() {
  if (!deckMat) {
    deckMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    ltex(deckMat, plankCan(), 1 / 3, 1);
  }
  return deckMat;
}

const contMc = {};
export function contM(c) {
  return contMc[c] || (contMc[c] = (() => {
    const m = new THREE.MeshLambertMaterial({ color: c });
    ltex(m, once('cont', contCan), 1 / 2.4, 1);
    return m;
  })());
}

export const MB = c => new THREE.MeshBasicMaterial({ color: c });

/* windowed facades (day map + lit-window emissive map) */
export const wm = [];
export const fcache = {};
export const fcv = (() => {
  const lit = [];
  for (let j = 0; j < 4; j++) {
    lit[j] = [];
    for (let i = 0; i < 4; i++) lit[j][i] = R() < 0.55 ? (R() < 0.4 ? '#FFE9BA' : '#FFD27A') : null;
  }
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    return c;
  };
  const nz = (a, n, al) => {
    for (let i = 0; i < n; i++) {
      a.fillStyle = 'rgba(0,0,0,' + (0.02 + Math.random() * al) + ')';
      a.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  };
  const out = [];
  const V = [
    (a, b, wr) => {
      a.fillStyle = '#34505f';
      a.fillRect(0, 0, 256, 256);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const x = i * 64,
            y = j * 64,
            g = a.createLinearGradient(x, y, x + 64, y + 50);
          g.addColorStop(0, '#9fd0ec');
          g.addColorStop(0.5, '#4f8db4');
          g.addColorStop(1, '#2a587c');
          a.fillStyle = g;
          a.fillRect(x + 2, y + 2, 60, 46);
          a.fillStyle = 'rgba(255,255,255,.22)';
          a.beginPath();
          a.moveTo(x + 4, y + 40);
          a.lineTo(x + 34, y + 4);
          a.lineTo(x + 46, y + 4);
          a.lineTo(x + 4, y + 48);
          a.fill();
          a.fillStyle = '#22404f';
          a.fillRect(x + 2, y + 48, 60, 14);
          a.fillStyle = 'rgba(255,255,255,.08)';
          a.fillRect(x + 2, y + 48, 60, 3);
          a.fillStyle = '#16242e';
          a.fillRect(x + 31, y + 2, 2, 46);
          wr[j][i] = [x + 2, y + 2, 60, 46];
        }
    },
    (a, b, wr) => {
      a.fillStyle = '#e8e9ea';
      a.fillRect(0, 0, 256, 256);
      nz(a, 900, 0.05);
      a.fillStyle = 'rgba(0,0,0,.07)';
      for (let j = 0; j < 4; j++) a.fillRect(0, j * 64 + 54, 256, 6);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const x = i * 64 + 12,
            y = j * 64 + 10,
            w = 40,
            h = 40;
          a.fillStyle = '#cfd4d7';
          a.fillRect(x - 3, y - 3, w + 6, h + 6);
          const g = a.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, '#a8d3ee');
          g.addColorStop(0.55, '#5b94bd');
          g.addColorStop(1, '#3f6f95');
          a.fillStyle = g;
          a.fillRect(x, y, w, h);
          a.fillStyle = 'rgba(255,255,255,.28)';
          a.beginPath();
          a.moveTo(x, y + h * 0.55);
          a.lineTo(x + w * 0.55, y);
          a.lineTo(x + w * 0.8, y);
          a.lineTo(x, y + h * 0.8);
          a.fill();
          a.fillStyle = '#c4cacf';
          a.fillRect(x + w / 2 - 1, y, 2, h);
          a.fillRect(x, y + h * 0.45, w, 2);
          a.fillStyle = 'rgba(0,0,0,.28)';
          a.fillRect(x - 4, y + h + 3, w + 8, 3);
          wr[j][i] = [x, y, w, h];
        }
    },
    (a, b, wr) => {
      a.fillStyle = '#b9b3a7';
      a.fillRect(0, 0, 256, 256);
      const cl = ['#a65a43', '#b4684d', '#9a4f3a', '#c07a5d', '#8f4a38', '#b86f55'];
      for (let j = 0; j < 32; j++)
        for (let i = -1; i < 16; i++) {
          a.fillStyle = cl[(i * 7 + j * 3 + ((i * j) & 3)) % 6];
          a.fillRect(i * 16 + (j % 2) * 8 + 1, j * 8 + 1, 14, 6);
        }
      nz(a, 1500, 0.1);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const x = i * 64 + 14,
            y = j * 64 + 10,
            w = 36,
            h = 40;
          a.fillStyle = '#ebe6da';
          a.fillRect(x - 4, y - 4, w + 8, h + 10);
          const g = a.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, '#8fb8d4');
          g.addColorStop(1, '#35607f');
          a.fillStyle = g;
          a.fillRect(x, y, w, h);
          a.fillStyle = '#ebe6da';
          a.fillRect(x + w / 2 - 1, y, 2, h);
          a.fillRect(x, y + h * 0.4, w, 2);
          a.fillStyle = 'rgba(0,0,0,.3)';
          a.fillRect(x - 5, y + h + 6, w + 10, 3);
          a.fillStyle = '#d8d2c4';
          a.fillRect(x - 4, y - 8, w + 8, 5);
          wr[j][i] = [x, y, w, h];
        }
    },
    (a, b, wr) => {
      a.fillStyle = '#d8d1c2';
      a.fillRect(0, 0, 256, 256);
      nz(a, 1200, 0.06);
      a.strokeStyle = 'rgba(120,110,95,.45)';
      a.lineWidth = 1.4;
      for (let j = 0; j < 16; j++) {
        a.beginPath();
        a.moveTo(0, j * 16);
        a.lineTo(256, j * 16);
        a.stroke();
        for (let i = 0; i < 5; i++) {
          a.beginPath();
          a.moveTo(((i * 2 + j) % 5) * 51 + 8, j * 16);
          a.lineTo(((i * 2 + j) % 5) * 51 + 8, j * 16 + 16);
          a.stroke();
        }
      }
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const x = i * 64 + 4,
            y = j * 64 + 14,
            w = 56,
            h = 32;
          a.fillStyle = '#8c8577';
          a.fillRect(x - 2, y - 2, w + 4, h + 4);
          const g = a.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, '#92c2de');
          g.addColorStop(1, '#356386');
          a.fillStyle = g;
          a.fillRect(x, y, w, h);
          a.fillStyle = '#8c8577';
          for (let k = 1; k < 4; k++) a.fillRect(x + k * 14 - 1, y, 2, h);
          a.fillStyle = 'rgba(0,0,0,.25)';
          a.fillRect(x - 2, y + h + 3, w + 4, 3);
          wr[j][i] = [x, y, w, h];
        }
    }
  ];
  V.forEach(f => {
    const d = mk();
    const n = mk();
    const a = d.getContext('2d');
    const b = n.getContext('2d');
    const wr = [[], [], [], []];
    f(a, b, wr);
    b.fillStyle = '#000';
    b.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++)
        if (lit[j][i]) {
          b.fillStyle = lit[j][i];
          const r = wr[j][i];
          b.fillRect(r[0], r[1], r[2], r[3]);
        }
    out.push([d, n]);
  });
  return out;
})();

export function fm(c, rx, ry) {
  c = mdc(c);
  const cols = Math.max(2, Math.round((rx * 6) / 3.2));
  const flr = Math.max(1, Math.round((ry * 6) / 3.4));
  rx = cols;
  ry = flr;
  const fvv = typeof window.FV !== 'undefined' ? window.FV : -1;
  const k = [c, cols, flr, fvv].join();
  if (fcache[k]) return fcache[k];
  const vi = fvv >= 0 ? fvv : ((c * 31 + Math.round(rx) * 7 + Math.round(ry) * 13) >>> 0) % 4;
  const V = fcv[vi];
  const t = cv => {
    const x = new THREE.CanvasTexture(cv);
    x.wrapS = x.wrapT = THREE.RepeatWrapping;
    x.repeat.set(rx / 4, ry / 4);
    x.encoding = THREE.sRGBEncoding;
    x.anisotropy = 4;
    return x;
  };
  const col = new THREE.Color(c);
  col.lerp(new THREE.Color(0xffffff), vi === 2 ? 1 : vi === 0 ? 0.5 : 0.62);
  const m = new THREE.MeshStandardMaterial({
    color: col,
    map: t(V[0]),
    emissive: 0xffffff,
    emissiveMap: t(V[1]),
    emissiveIntensity: 0,
    roughness: vi === 0 ? 0.28 : 0.7,
    metalness: vi === 0 ? 0.25 : 0
  });
  wm.push(m);
  return (fcache[k] = m);
}

export function roofEq(p, w, d, h, x, y, z) {
  if (window.NOEQ || w * d < 30) return;
  const wx = p.position.x + x;
  const wz = p.position.z + z;
  const hv = k => {
    const q = Math.sin(wx * 12.9898 + wz * 78.233 + h * 3.7 + k * 19.1) * 43758.5453;
    return q - Math.floor(q);
  };
  const n = w * d > 60 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const bw = 1 + hv(k) * 1.6;
    const bd = 1 + hv(k + 5) * 1.4;
    const bh = 0.5 + hv(k + 9) * 0.9;
    BX(p, bw, bh, bd, 0xC4CDD3, x + (hv(k + 2) - 0.5) * (w - bw - 0.6), y + h, z + (hv(k + 7) - 0.5) * (d - bd - 0.6));
  }
  if (h > 14 && hv(3) > 0.4) {
    CY(p, 0.6, 0.6, 1.8, 0xB9C2C8, x + (hv(11) - 0.5) * (w - 1.5), y + h, z + (hv(13) - 0.5) * (d - 1.5), 10);
  }
}

export function TW(p, w, h, d, c, x, y, z) {
  const sx = fm(c, d / 6, h / 6);
  const sz = fm(c, w / 6, h / 6);
  const cap = roofM(c);
  const bm = add(p, new THREE.BoxGeometry(w, h, d), [sx, sx, cap, cap, sz, sz], x, y + h / 2, z);
  roofEq(p, w, d, h, x, y, z);
  BX(p, w + 0.45, 0.32, d + 0.45, 0xE3E7EA, x, y + h - 0.12, z);
  BX(p, w + 0.3, 1, d + 0.3, 0x77838B, x, y, z);
  const fl = Math.max(1, Math.round(h / 3.4));
  if (w * d >= 30 && fl > 1) {
    for (let k = 1; k < fl; k++) {
      BX(p, w + 0.14, 0.16, d + 0.14, 0xE3E7EA, x, y + (k * h) / fl - 0.08, z).castShadow = false;
    }
  }
  return bm;
}

export function CT(p, r, h, c, x, y, z) {
  const s = fm(c, (r * 6.283) / 6, h / 6);
  return add(p, new THREE.CylinderGeometry(r, r, h, 28), [s, M(c), M(c)], x, y + h / 2, z);
}

export const flags = [];
export function flag(p, x, z, h, c) {}

onN(n => wm.forEach(m => (m.emissiveIntensity = n ? 0.6 : 0)));

export const glowSM = col =>
  new THREE.SpriteMaterial({
    map: glowTex,
    color: col,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  });

export const warmG = glowSM(0xFFD68A);
export const redG = glowSM(0xFF3B30);
export const grnG = glowSM(0x3BE07A);
export const whtG = glowSM(0xFFF3C4);

export const poolM = new THREE.MeshBasicMaterial({
  map: glowTex,
  color: 0xFFCF80,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  fog: false
});

export const poolG = new THREE.PlaneGeometry(14, 14);
poolG.rotateX(-Math.PI / 2);

export const lampW = new THREE.MeshBasicMaterial({ color: 0xCFD8DE });
export const bulbG = new THREE.SphereGeometry(0.3, 10, 8);

export const glow = (m, x, y, z, s, p = scene) => {
  const sp = new THREE.Sprite(m);
  sp.position.set(x, y, z);
  sp.scale.set(s, s, 1);
  p.add(sp);
  return sp;
};

export const bulb = (x, y, z, s = 5, m = warmG) => {
  add(scene, bulbG, lampW, x, y, z).castShadow = false;
  glow(m, x, y, z, s);
};

export function label(t) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#111820';
  x.fillRect(0, 0, 512, 96);
  x.strokeStyle = '#4FA8DE';
  x.lineWidth = 6;
  x.strokeRect(3, 3, 506, 90);
  x.fillStyle = '#fff';
  x.font = '700 42px "Space Grotesk",Arial,sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(t.toUpperCase(), 256, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false }));
  s.scale.set(17, 3.2, 1);
  return s;
}

/* Sky dome & atmosphere */
export const SKYN = `float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*ns(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}`;

export const WU = {
  uTime: { value: 0 },
  uNight: { value: 0 },
  uOver: { value: 0 },
  uCloud: { value: 0.45 },
  uSun: { value: new THREE.Vector3(0.45, 0.83, 0.3).normalize() },
  uMoon: { value: new THREE.Vector3(-0.4, 0.55, -0.5).normalize() }
};

export const skyMat = new THREE.ShaderMaterial({
  uniforms: WU,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  vertexShader: 'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:
    'varying vec3 vD;uniform float uTime,uNight,uOver,uCloud;uniform vec3 uSun,uMoon;' +
    SKYN +
    `void main(){vec3 d=normalize(vD);float h=max(d.y,0.);
vec3 zen=mix(vec3(.13,.38,.78),vec3(.012,.025,.08),uNight),hor=mix(vec3(.74,.87,.96),vec3(.08,.13,.21),uNight);
zen=mix(zen,mix(vec3(.46,.5,.56),vec3(.03,.04,.06),uNight),uOver);hor=mix(hor,mix(vec3(.64,.67,.71),vec3(.07,.09,.12),uNight),uOver);
vec3 col=mix(hor,zen,pow(h,.5));float sd=max(dot(d,uSun),0.);col+=vec3(1.,.82,.55)*(pow(sd,6.)*.22+pow(sd,260.)*1.6)*(1.-uNight)*(1.-uOver*.85);
float md=max(dot(d,uMoon),0.);col+=vec3(.85,.9,1.)*pow(md,1100.)*2.2*uNight*(1.-uOver*.8)+vec3(.3,.4,.6)*pow(md,14.)*.14*uNight;
if(d.y>0.){vec2 sp=d.xz/(d.y+.3)*90.;float s=hs(floor(sp));float stv=step(.992,s)*smoothstep(0.,.3,d.y);col+=vec3(stv)*uNight*(1.-uOver)*(.55+.45*sin(uTime*2.+s*50.));}
if(d.y>.015){vec2 cp=d.xz/(d.y+.14)*.8+vec2(uTime*.006,uTime*.003);float c=smoothstep(0.,.32,fb(cp*2.)-(1.-uCloud));vec3 cc=mix(vec3(1.),vec3(.52,.55,.62),uOver);cc=mix(cc,vec3(.07,.09,.15),uNight);
float sh=fb(cp*2.+vec2(.2,.12));cc*=.72+.42*(1.-sh);col=mix(col,cc,c*smoothstep(.015,.22,d.y)*.93);}
col=mix(col,hor,pow(1.-h,7.)*.75);gl_FragColor=vec4(col,1.);}`
});

export const skyDome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 18), skyMat);
skyDome.renderOrder = -20;
skyDome.frustumCulled = false;
scene.add(skyDome);

let skyN = 0;
let skyO = 0;
let skyC = 0.45;

export function skyStep(dt, T) {
  WU.uTime.value = T;
  skyN += ((st.n ? 1 : 0) - skyN) * Math.min(1, dt * 2.2);
  skyO += (([0, 0.25, 1][st.w] || 0) - skyO) * Math.min(1, dt * 1.5);
  skyC += (([0.42, 0.6, 0.92][st.w] || 0.45) - skyC) * Math.min(1, dt * 1.5);
  WU.uNight.value = skyN;
  WU.uOver.value = skyO;
  WU.uCloud.value = skyC;
  skyDome.position.copy(cam.position);
  const hd = [0.74, 0.87, 0.96];
  const hn = [0.08, 0.13, 0.21];
  const ho = [0.64, 0.67, 0.71];
  const hon = [0.07, 0.09, 0.12];
  const c = hd.map((v, i) => {
    const a = v + (hn[i] - v) * skyN;
    const b = ho[i] + (hon[i] - ho[i]) * skyN;
    return a + (b - a) * skyO;
  });
  scene.fog.color.setRGB(c[0], c[1], c[2]);
}

export function makeWater() {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), WU),
    fog: true,
    vertexShader:
      'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:
      'varying vec3 vW;uniform float uTime,uNight,uOver;uniform vec3 uSun,uMoon;\n#include <fog_pars_fragment>\n' +
      SKYN +
      `float zN(float x){return -146.+2.*sin(x*.031+1.)+sin(x*.083);}float zF(float x){return -190.+6.*sin(x*.022+2.)+3.*sin(x*.057+.5)+1.5*sin(x*.13);}
void main(){vec2 p=vW.xz;float t=uTime;vec2 g=vec2(0.);
g+=vec2(.31,.11)*cos(dot(p,vec2(.31,.11))*1.4+t*1.1)*.5;g+=vec2(-.12,.4)*cos(dot(p,vec2(-.12,.4))*1.9+t*1.5)*.35;g+=vec2(.7,-.2)*cos(dot(p,vec2(.7,-.2))*2.3-t*1.9)*.22;g+=vec2(.2,.9)*cos(dot(p,vec2(.2,.9))*3.1+t*2.3)*.14;
vec2 q=p*.9+vec2(t*.25,0.);g+=(vec2(ns(q+3.1),ns(q.yx+7.7))-.5)*.5;
vec3 N=normalize(vec3(-g.x*.35,1.,-g.y*.35));vec3 V=normalize(cameraPosition-vW);float F=.03+.97*pow(1.-max(dot(N,V),0.),4.);vec3 R=reflect(-V,N);R.y=abs(R.y);
vec3 zen=mix(vec3(.13,.38,.78),vec3(.012,.025,.08),uNight),hor=mix(vec3(.74,.87,.96),vec3(.08,.13,.21),uNight);zen=mix(zen,mix(vec3(.46,.5,.56),vec3(.03,.04,.06),uNight),uOver);hor=mix(hor,mix(vec3(.64,.67,.71),vec3(.07,.09,.12),uNight),uOver);
vec3 sk=mix(hor,zen,pow(clamp(R.y,0.,1.),.5));float x=vW.x;float dn=min(vW.z-zF(x),zN(x)-vW.z);dn=max(dn,0.);
vec3 deep=vec3(.02,.18,.27),sh=vec3(.16,.5,.52);vec3 base=mix(sh,deep,smoothstep(0.,11.,dn+ns(p*.25)*3.));base*=mix(1.,.16,uNight);base=mix(base,base*vec3(.7,.75,.7),uOver);
vec3 col=mix(base,sk,F*.88);
float sp=pow(max(dot(R,uSun),0.),300.)*(1.-uNight)*(1.-uOver*.8)*1.8+pow(max(dot(R,uMoon),0.),260.)*uNight*1.1;col+=vec3(1.,.93,.78)*sp;
float fm=smoothstep(1.8,.15,dn+(ns(p*1.3+t*.2)-.5)*1.3);float fo=smoothstep(.42,.72,fb(p*1.1+vec2(t*.12,0.)));col=mix(col,vec3(.9,.95,.97)*mix(1.,.3,uNight),fm*fo*.85);
col+=vec3(.9,.97,1.)*pow(max(g.x*g.x+g.y*g.y-.12,0.),1.)*.18*(1.-uNight);gl_FragColor=vec4(col,1.);
#include <fog_fragment>
}`
  });
}

onN(n => {
  [warmG, redG, grnG, whtG].forEach(m => (m.opacity = n ? 0.5 : 0));
  poolM.opacity = n ? 0.28 : 0;
  lampW.color.setHex(n ? 0xDCC590 : 0xCFD8DE);
});
