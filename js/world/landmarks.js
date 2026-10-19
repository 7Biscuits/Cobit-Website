import { scene, onN } from '../core/scene.js';
import { BX, CY, add, label } from '../core/materials.js';
import { RL, LR } from '../config.js';

export const pickables = [];

/* ===== MODERN RING-ROAD LANDMARKS: clean volumes, glass, concrete, timber. No logos, flags or signage. Front faces -z ===== */
const rbC = {};
const rbMt = (c, o) => {
  const k = c + JSON.stringify(o || 0);
  return rbC[k] || (rbC[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})));
};

const rbGls = new THREE.MeshPhongMaterial({
  color: 0x7FB6D4,
  specular: 0xffffff,
  shininess: 110,
  transparent: true,
  opacity: 0.55
});
onN(n => rbGls.color.setHex(n ? 0x3E7898 : 0x7FB6D4));

const mWH = 0xF2F3F1;
const mCC = 0xC9CCCE;
const mDK = 0x2B3036;
const mTB = 0x9A6B43;

const rbTree = (g, x, z, s) => {
  CY(g, 0.14 * s, 0.2 * s, 2 * s, rbMt(0x5B4332), x, 0, z, 6);
  add(g, new THREE.SphereGeometry(1.2 * s, 10, 8), rbMt(0x4B8A3A), x, 2.7 * s, z);
};

const rbSteps = (g, w, z, n) => {
  for (let i = 0; i < n; i++) BX(g, w, 0.16 * (n - i), 0.5, rbMt(mCC), 0, 0, z - i * 0.5);
};

const rbCurt = (g, w, h, d, x, y, z, fl) => {
  BX(g, w, h - 0.5, d, rbGls, x, y + 0.25, z).castShadow = false;
  for (let i = 0; i <= fl; i++) {
    BX(g, w + 0.4, 0.25, d + 0.4, rbMt(mWH), x, i ? y + i * h / fl - (i < fl ? 0.125 : 0.25) : y, z);
  }
  const n = Math.max(2, Math.round(w / 1.8));
  for (let k = 0; k <= n; k++) {
    [-1, 1].forEach(s => BX(g, 0.1, h - 0.5, 0.1, rbMt(mDK), x - w / 2 + k * w / n, y + 0.25, z + s * (d / 2 + 0.03)));
  }
};

const rbSaw = (g, x, y, z, w, d, h) => {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(-d / 2, h);
  s.closePath();
  const e = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  e.translate(0, 0, -w / 2);
  e.rotateY(Math.PI / 2);
  add(g, e, rbMt(mWH), x, y, z);
  const gl = add(g, new THREE.BoxGeometry(w - 0.3, 0.12, Math.hypot(d, h) - 0.2), rbGls, x, y + h / 2 + 0.05, z);
  gl.rotation.x = -Math.atan2(h, d);
  gl.castShadow = false;
};

const rbScr = new THREE.MeshBasicMaterial({ color: 0x9CCBFF });
const rbLt = new THREE.MeshBasicMaterial({ color: 0xFFF2D2 });

const rbG = (g, x, y, z, ry) => {
  const o = new THREE.Group();
  o.position.set(x, y, z);
  o.rotation.y = ry || 0;
  g.add(o);
  return o;
};

const rbLight = (g, x, y, z) => {
  BX(g, 1.4, 0.05, 1.4, rbLt, x, y, z).castShadow = false;
};

const rbDesk = (g, x, y, z, ry) => {
  const o = rbG(g, x, y, z, ry);
  BX(o, 1.7, 0.07, 0.8, rbMt(0xE9E4DA), 0, 0.72, 0);
  [-0.75, 0.75].forEach(s => BX(o, 0.08, 0.72, 0.7, rbMt(mDK), s, 0, 0));
  BX(o, 0.5, 0.02, 0.32, rbMt(0xB8BEC4), 0, 0.79, -0.05);
  const s = BX(o, 0.5, 0.32, 0.02, rbScr, 0, 0.8, -0.22);
  s.rotation.x = -0.2;
  s.castShadow = false;
  BX(o, 0.5, 0.07, 0.5, rbMt(mDK), 0, 0.42, 0.75);
  BX(o, 0.5, 0.5, 0.07, rbMt(mDK), 0, 0.49, 0.99);
  CY(o, 0.04, 0.04, 0.4, rbMt(mDK), 0, 0, 0.75, 6);
};

const rbRow = (g, x, y, z, n, ry) => {
  for (let i = 0; i < n; i++) rbDesk(g, x + (i - (n - 1) / 2) * 2.1, y, z, ry);
};

const rbPlant = (g, x, y, z) => {
  CY(g, 0.25, 0.18, 0.45, rbMt(mWH), x, y, z, 10);
  add(g, new THREE.SphereGeometry(0.5, 10, 8), rbMt(0x4B8A3A), x, y + 1, z);
  add(g, new THREE.SphereGeometry(0.32, 8, 6), rbMt(0x5FA04A), x + 0.2, y + 1.5, z);
};

const rbSofa = (g, x, y, z, ry) => {
  const o = rbG(g, x, y, z, ry);
  BX(o, 2.2, 0.45, 0.9, rbMt(0x3F7C85), 0, 0, 0);
  BX(o, 2.2, 0.55, 0.25, rbMt(0x356B73), 0, 0.4, 0.38);
};

const rbShelf = (g, x, y, z, w) => {
  BX(g, w, 2.2, 0.4, rbMt(mDK), x, y, z);
  [0.3, 0.95, 1.6].forEach((h, i) =>
    BX(g, w - 0.2, 0.3, 0.44, rbMt([0xE0895A, 0x2E9E9E, 0xE6B84D][i]), x, y + h, z)
  );
};

const rbTable = (g, x, y, z) => {
  BX(g, 2.8, 0.08, 1.2, rbMt(mTB), x, y + 0.75, z);
  CY(g, 0.1, 0.1, 0.75, rbMt(mDK), x, y, z, 8);
  [-0.7, 0.7].forEach(a =>
    [-0.95, 0.95].forEach(b => BX(g, 0.45, 0.07, 0.45, rbMt(mDK), x + a, y + 0.42, z + b))
  );
};

const rbCounter = (g, x, y, z, w) => {
  BX(g, w, 1.1, 0.8, rbMt(mWH), x, y, z);
  BX(g, w + 0.1, 0.06, 0.9, rbMt(mDK), x, y + 1.1, z);
};

const rbBench = (g, x, y, z) => {
  BX(g, 2.8, 0.9, 1, rbMt(mTB), x, y, z);
  BX(g, 0.5, 0.02, 0.32, rbMt(0xB8BEC4), x, y + 0.9, z);
  const s = BX(g, 0.5, 0.32, 0.02, rbScr, x, y + 0.92, z - 0.16);
  s.rotation.x = -0.2;
  s.castShadow = false;
};

const rbMach = (g, x, y, z) => {
  BX(g, 1.7, 1.5, 1.4, rbMt(0xE6B84D), x, y, z);
  BX(g, 1.2, 0.8, 0.05, rbGls, x, y + 0.45, z - 0.72);
  BX(g, 0.5, 0.3, 0.4, rbMt(mDK), x + 0.4, y + 1.5, z);
};

export const B = {
  /* ABOUT */
  about(g) {
    rbCurt(g, 14, 4, 7.5, -1, 0, 1.2, 1);
    BX(g, 12, 3.6, 6.5, rbMt(mWH), 1.5, 4.13, -0.2);
    BX(g, 8.4, 1.3, 0.2, rbGls, 1.5, 5.4, -3.58);
    BX(g, 12.8, 0.3, 7.3, rbMt(mDK), 1.5, 7.73, -0.2);
    BX(g, 5.4, 0.25, 3, rbMt(mDK), 3.5, 3.7, -4.6);
    for (let i = 0; i < 8; i++) BX(g, 0.14, 3.7, 0.45, rbMt(mTB), -7 + i * 0.5, 0, -4.2);
    rbCounter(g, -3, 0.25, -0.9, 4.5);
    rbSofa(g, 3.2, 0.25, -1.5, Math.PI);
    rbPlant(g, -6.8, 0.25, -1.7);
    rbPlant(g, 5, 0.25, -1.7);
    rbRow(g, -4.6, 0.25, 2.2, 2, 0);
    rbRow(g, 0.6, 0.25, 2.2, 2, 0);
    rbTable(g, 3.9, 0.25, 3.4);
    rbShelf(g, -2, 0.25, 4.45, 7);
    [[-5, 2.2], [-1, 2.2], [3, 2.2], [-3, -0.9], [2, -0.9]].forEach(([x, z]) => rbLight(g, x, 3.65, z));
    rbTree(g, -8.5, -1, 1);
    rbTree(g, 8.8, -4.5, 1);
  },

  /* WORKSHOPS */
  workshops(g) {
    rbCurt(g, 18, 4.5, 7, 0, 0, 0.5, 1);
    BX(g, 18, 4.25, 0.4, rbMt(mCC), 0, 0.25, 4.2);
    BX(g, 18.4, 0.3, 7.4, rbMt(mDK), 0, 4.5, 0.5);
    for (let i = 0; i < 4; i++) rbSaw(g, -6.75 + i * 4.5, 4.8, 0.5, 4.4, 7, 2.4);
    BX(g, 5, 3.2, 3.6, rbMt(0x8C4A2F), -6, 0, -5.2);
    BX(g, 5.4, 0.2, 4, rbMt(mDK), -6, 3.2, -5.2);
    BX(g, 4, 0.5, 1, rbMt(mTB), 3, 0, -5.2);
    [-6.5, -3.2, 0.1].forEach(x => rbBench(g, x, 0.25, -1.4));
    [-6, -2.5, 1].forEach(x => rbMach(g, x, 0.25, 3.2));
    rbShelf(g, 6.2, 0.25, 3.7, 4);
    rbRow(g, 5.5, 0.25, 0.6, 2, 0);
    [-6, -2, 2, 6].forEach(x => rbLight(g, x, 4.15, 0.5));
    rbTree(g, 9.2, -3, 1);
  },

  /* MENTORS */
  mentors(g) {
    rbCurt(g, 12, 4, 8, 0, 0, 0, 1);
    rbCurt(g, 7.5, 12, 6, -0.8, 4, 0.3, 4);
    rbCurt(g, 6, 10, 5, 1.6, 16, 0.6, 3);
    BX(g, 6.6, 0.3, 5.6, rbMt(mDK), 1.6, 26, 0.6);
    BX(g, 0.3, 12, 0.3, rbMt(mWH), -4.7, 4.25, -2.9);
    BX(g, 0.3, 12, 0.3, rbMt(mWH), 3.2, 4.25, -2.9);
    BX(g, 6.6, 0.3, 3.6, rbMt(mDK), 0, 3.7, -5.2);
    rbCounter(g, 0, 0.25, -1.5, 4);
    rbSofa(g, -4.5, 0.25, 1.5, 0);
    rbSofa(g, 4.5, 0.25, 1.5, 0);
    rbTable(g, 0, 0.25, 2.6);
    [-5.2, 5.2].forEach(x => rbPlant(g, x, 0.25, -3.2));
    rbPlant(g, 0, 0.25, 3.4);
    [[-3, 0], [3, 0], [0, -2]].forEach(([x, z]) => rbLight(g, x, 3.65, z));
    for (let i = 0; i < 4; i++) {
      const y0 = 4 + 3 * i + 0.25;
      rbRow(g, -0.8, y0, -0.6, 3, 0);
      rbRow(g, -0.8, y0, 1.9, 3, Math.PI);
      rbPlant(g, -4.2, y0, 2.8);
      rbPlant(g, 2.4, y0, -2.2);
      rbLight(g, -0.8, y0 + 2.6, 0.6);
    }
    for (let i = 0; i < 3; i++) {
      const y0 = 16 + i * 10 / 3 + 0.25;
      rbRow(g, 1.6, y0, -0.3, 2, 0);
      rbRow(g, 1.6, y0, 1.9, 2, Math.PI);
      rbPlant(g, -0.7, y0, 2.5);
      rbLight(g, 1.6, y0 + 2.6, 0.8);
    }
    rbTree(g, -7.6, -6, 1);
    rbTree(g, 7.6, -6, 1);
  },

  /* COMPETITIONS */
  competitions(g) {
    CY(g, 3.6, 3.6, 10, rbMt(mCC), 0, 0, 0, 28);
    CY(g, 7.2, 7.2, 5.5, rbGls, 0, 0.25, 0, 40).castShadow = false;
    CY(g, 8.8, 8.8, 0.4, rbMt(mWH), 0, 0, 0, 40);
    CY(g, 9.4, 9.4, 0.4, rbMt(mWH), 0, 5.7, 0, 48);
    CY(g, 5, 5, 3, rbGls, 0, 6.1, 0, 32).castShadow = false;
    CY(g, 6, 6, 0.35, rbMt(mDK), 0, 9.1, 0, 40);
    for (let i = 0; i < 16; i++) {
      if (i == 12) continue;
      const a = (i / 16) * 6.283;
      CY(g, 0.18, 0.18, 5.3, rbMt(mWH), Math.cos(a) * 8.3, 0.4, Math.sin(a) * 8.3, 8);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283 + 0.39;
      rbDesk(g, Math.cos(a) * 4.6, 0.25, Math.sin(a) * 4.6, Math.PI / 2 - a);
      rbPlant(g, Math.cos(a + 0.39) * 6.4, 0.25, Math.sin(a + 0.39) * 6.4);
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.571 + 0.78;
      rbLight(g, Math.cos(a) * 5, 5.6, Math.sin(a) * 5);
    }
    rbSteps(g, 5, -9.4, 3);
  },

  /* PARTNERS */
  partners(g) {
    rbCurt(g, 14, 4, 8, 0, 0, 0, 1);
    BX(g, 10, 4.5, 7, rbMt(mWH), -2, 4.13, 0);
    BX(g, 10.4, 0.25, 7.4, rbMt(mDK), -2, 8.63, 0);
    BX(g, 7, 4.5, 6, rbMt(mDK), 4, 8.88, 0);
    BX(g, 7.4, 0.3, 6.4, rbMt(mWH), 4, 13.38, 0);
    BX(g, 8, 1.4, 0.2, rbGls, -2, 5.8, -3.58);
    BX(g, 5, 1.4, 0.2, rbGls, 4, 10.4, -3.08);
    rbRow(g, -3.5, 0.25, -1, 3, 0);
    rbRow(g, -3.5, 0.25, 1.8, 3, Math.PI);
    rbRow(g, 3.8, 0.25, -1, 2, 0);
    rbRow(g, 3.8, 0.25, 1.8, 2, Math.PI);
    rbShelf(g, 0, 0.25, 3.7, 6);
    [-6.4, 0, 6.4].forEach(x => rbPlant(g, x, 0.25, -3.2));
    rbSofa(g, 6, 0.25, 3, Math.PI);
    [-4, 0, 4].forEach(x => rbLight(g, x, 3.65, 0.4));
    rbTree(g, -8.8, -4, 1);
    rbTree(g, 8.8, -5, 1);
  },

  /* CONTACT */
  contact(g) {
    rbCurt(g, 11, 3.8, 6.5, -1, 0, 1, 1);
    BX(g, 14, 0.3, 9, rbMt(mDK), -1, 3.8, 1);
    BX(g, 3, 4.4, 3.4, rbMt(mCC), 5.4, 0, 1.6);
    BX(g, 5, 0.5, 1, rbMt(mTB), -3, 0, -4.6);
    BX(g, 5, 0.5, 1, rbMt(mTB), 2, 0, -4.6);
    rbCounter(g, -3.5, 0.25, 3.4, 5);
    rbTable(g, -4.2, 0.25, 0.2);
    rbTable(g, -0.8, 0.25, 0.2);
    rbDesk(g, 2.2, 0.25, 0.8, 0);
    [-6, 3.4].forEach(x => rbPlant(g, x, 0.25, x < 0 ? -1.7 : 3.6));
    [[-4.2, 0.2], [-0.8, 0.2], [-3.5, 3.4]].forEach(([x, z]) => rbLight(g, x, 3.45, z));
    rbTree(g, -8.6, -2, 1);
    rbTree(g, 8.4, -3.5, 1);
  }
};

const names = {
  about: 'About',
  workshops: 'Workshops',
  mentors: 'Mentors',
  competitions: 'Competitions',
  partners: 'Partners',
  contact: 'Contact'
};

export function initLandmarks() {
  Object.keys(B).forEach((k, i) => {
    const g = new THREE.Group();
    const a = RL[i];
    g.position.set(Math.cos(a) * LR, 0.03, Math.sin(a) * LR);
    g.rotation.y = -a + Math.PI / 2;
    scene.add(g);
    window.MODERN = true;
    window.NOEQ = 1;
    B[k](g);
    window.NOEQ = 0;
    window.MODERN = false;

    const l = label(names[k]);
    l.position.set(0, 0, 0);
    const top = new THREE.Box3().setFromObject(g).max.y;
    l.position.set(0, top + 3, 0);
    g.add(l);

    g.traverse(o => (o.userData.room = k));
    pickables.push(g);
  });
}
