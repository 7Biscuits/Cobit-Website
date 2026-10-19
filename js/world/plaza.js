import { scene, onN, add } from '../core/scene.js';
import { CY, wtex } from '../core/materials.js';
import { flagCan, leafCanR, mkc } from '../utils/textures.js';
import { RL } from '../config.js';

export function initPlaza() {
  const plateM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  wtex(plateM, flagCan(), 1 / 12, 0, 0.92);
  onN(n => plateM.color.setHex(n ? 0x4A5B68 : 0xFFFFFF));
  const g = new THREE.CircleGeometry(34, 64);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, plateM);
  m.position.y = 0.02;
  m.receiveShadow = true;
  scene.add(m);

  /* Plaza Fountain */
  const f = new THREE.Group();
  scene.add(f);

  let sd = 777;
  const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const TAUp = Math.PI * 2;

  const tx = (c, rep, aniso) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso || 8;
    t.encoding = THREE.sRGBEncoding;
    if (rep) t.repeat.set(rep[0], rep[1]);
    return t;
  };

  const speck = (x, S, n, l, d) => {
    for (let i = 0; i < n; i++) {
      x.fillStyle = 'rgba(' + (R() < 0.5 ? l : d) + ',' + (0.04 + R() * 0.12) + ')';
      x.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2);
    }
  };

  const sideT = (() => {
    const W = 256;
    const H = 128;
    const [c, x] = mkc(W, H);
    x.fillStyle = '#8f7b57';
    x.fillRect(0, 0, W, H);
    for (let j = 0; j < 2; j++) {
      for (let i = -1; i < 3; i++) {
        const bw = W / 2;
        const ox = i * bw + (j ? bw / 2 : 0);
        const y = j * 64;
        const gr = x.createLinearGradient(0, y, 0, y + 62);
        gr.addColorStop(0, '#eadbb4');
        gr.addColorStop(0.5, '#dcc794');
        gr.addColorStop(1, '#c9b07c');
        x.fillStyle = gr;
        x.fillRect(ox + 3, y + 3, bw - 6, 56);
        x.fillStyle = 'rgba(255,255,255,.22)';
        x.fillRect(ox + 3, y + 3, bw - 6, 3);
        x.fillStyle = 'rgba(60,44,20,.22)';
        x.fillRect(ox + 3, y + 56, bw - 6, 3);
        for (let k = 0; k < 30; k++) {
          x.strokeStyle = 'rgba(110,90,55,' + (0.08 + R() * 0.14) + ')';
          x.lineWidth = 0.8;
          x.beginPath();
          const px = ox + 6 + R() * (bw - 12);
          const py = y + 6 + R() * 48;
          x.moveTo(px, py);
          x.lineTo(px + R() * 18 - 9, py + R() * 6 - 3);
          x.stroke();
        }
      }
    }
    speck(x, 256, 900, '255,246,220', '70,52,28');
    return tx(c, [12, 1]);
  })();

  const topT = (() => {
    const S = 1024;
    const [c, x] = mkc(S, S);
    const C = S / 2;
    const u = C / 5;
    x.fillStyle = '#e6d3a3';
    x.fillRect(0, 0, S, S);
    speck(x, S, 9000, '255,248,225', '90,70,40');
    const ring = (r0, r1, col) => {
      x.fillStyle = col;
      x.beginPath();
      x.arc(C, C, r1 * u, 0, TAUp);
      x.arc(C, C, r0 * u, 0, TAUp, true);
      x.fill();
    };
    ring(4.86, 5.02, '#0b1d3a');
    ring(4.78, 4.84, '#b8892f');
    const N = 64;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * TAUp;
      const a1 = ((i + 1) / N) * TAUp;
      [[4.2, 4.48], [4.5, 4.76]].forEach(([r0, r1], ri) => {
        x.fillStyle = (i + ri) % 2 ? '#f1e6c3' : '#b6573a';
        x.beginPath();
        x.arc(C, C, r1 * u, a0 + 0.004, a1 - 0.004);
        x.arc(C, C, r0 * u, a1 - 0.004, a0 + 0.004, true);
        x.closePath();
        x.fill();
        x.strokeStyle = 'rgba(60,40,20,.28)';
        x.lineWidth = 1.2;
        x.stroke();
      });
    }
    ring(4.46, 4.5, '#0b1d3a');
    ring(4.15, 4.2, '#b8892f');
    ring(4.08, 4.14, '#0b1d3a');
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAUp;
      x.save();
      x.translate(C + Math.cos(a) * 3.8 * u, C + Math.sin(a) * 3.8 * u);
      x.rotate(a);
      x.fillStyle = '#0F56FE';
      x.beginPath();
      x.moveTo(0.22 * u, 0);
      x.lineTo(0, 0.1 * u);
      x.lineTo(-0.22 * u, 0);
      x.lineTo(0, -0.1 * u);
      x.closePath();
      x.fill();
      x.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.encoding = THREE.sRGBEncoding;
    return t;
  })();

  const apT = (() => {
    const S = 1024;
    const [c, x] = mkc(S, S);
    const C = S / 2;
    const u = C / 6.4;
    x.clearRect(0, 0, S, S);
    const ring = (r0, r1, col) => {
      x.fillStyle = col;
      x.beginPath();
      x.arc(C, C, r1 * u, 0, TAUp);
      x.arc(C, C, r0 * u, 0, TAUp, true);
      x.fill();
    };
    ring(5.45, 6.4, '#cdbb91');
    speck(x, S, 12000, '255,248,225', '80,62,36');
    [[5.62, 5.98, 88], [5.98, 6.3, 104]].forEach(([r0, r1, N], ri) => {
      for (let i = 0; i < N; i++) {
        const a0 = ((i + (ri ? 0.5 : 0)) / N) * TAUp;
        const a1 = ((i + 1 + (ri ? 0.5 : 0)) / N) * TAUp;
        const v = 0.9 + R() * 0.2;
        x.fillStyle =
          (i + ri) % 3 === 0
            ? 'rgb(' + Math.round(168 * v) + ',' + Math.round(120 * v) + ',' + Math.round(86 * v) + ')'
            : 'rgb(' + Math.round(232 * v) + ',' + Math.round(216 * v) + ',' + Math.round(170 * v) + ')';
        x.beginPath();
        x.arc(C, C, r1 * u, a0 + 0.006, a1 - 0.006);
        x.arc(C, C, r0 * u, a1 - 0.006, a0 + 0.006, true);
        x.closePath();
        x.fill();
      }
    });
    ring(5.45, 5.58, '#0b1d3a');
    ring(5.58, 5.62, '#b8892f');
    ring(6.3, 6.34, '#b8892f');
    ring(6.34, 6.4, '#0b1d3a');
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.encoding = THREE.sRGBEncoding;
    return t;
  })();

  const watT = (() => {
    const S = 512;
    const [c, x] = mkc(S, S);
    const C = S / 2;
    const gr = x.createRadialGradient(C, C, 0, C, C, C);
    gr.addColorStop(0, '#7cc8ef');
    gr.addColorStop(0.6, '#4fa8de');
    gr.addColorStop(1, '#2f84bd');
    x.fillStyle = gr;
    x.fillRect(0, 0, S, S);
    for (let i = 1; i < 26; i++) {
      x.strokeStyle = 'rgba(255,255,255,' + (0.05 + R() * 0.14) + ')';
      x.lineWidth = 1 + R() * 2.2;
      x.beginPath();
      x.arc(C + (R() - 0.5) * 6, C + (R() - 0.5) * 6, i * (C / 26), R() * 6, R() * 6 + 2 + R() * 3.4);
      x.stroke();
    }
    for (let i = 0; i < 500; i++) {
      x.fillStyle = 'rgba(255,255,255,' + R() * 0.18 + ')';
      x.beginPath();
      x.arc(R() * S, R() * S, R() * 2.2, 0, TAUp);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  })();

  const lam = o => new THREE.MeshLambertMaterial(o);
  const stone = lam({ color: 0xFFFFFF, map: sideT });
  const topM = lam({ color: 0xFFFFFF, map: topT });
  const botM = lam({ color: 0x8f7b57 });
  const watTop = lam({ color: 0xFFFFFF, map: watT, emissive: 0x0A2A44 });
  const watSide = lam({ color: 0x4FA8DE });
  const apM = lam({ color: 0xFFFFFF, map: apT, transparent: false });

  onN(n => {
    const c = n ? 0x66767F : 0xFFFFFF;
    stone.color.setHex(c);
    topM.color.setHex(c);
    apM.color.setHex(c);
    watTop.color.setHex(n ? 0xA0B4C4 : 0xFFFFFF);
    watSide.color.setHex(n ? 0x2C5A78 : 0x4FA8DE);
  });

  const cyl = (a, b, h, mats) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 72), mats);
    m.position.y = h / 2;
    m.castShadow = m.receiveShadow = true;
    f.add(m);
    return m;
  };
  cyl(5, 5.6, 0.8, [stone, topM, botM]);
  cyl(4.2, 4.2, 0.9, [watSide, watTop, watSide]);
  const apron = new THREE.Mesh(new THREE.RingGeometry(5.45, 6.4, 96, 1), apM);
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.05;
  apron.receiveShadow = true;
  f.add(apron);

  /* CoBit Logo Display */
  CY(f, 2.9, 3.1, 0.45, 0x0E1A2B, 0, 0.9, 0, 48);
  const ring = add(f, new THREE.TorusGeometry(3.05, 0.09, 8, 64), new THREE.MeshBasicMaterial({ color: 0x0F56FE }), 0, 1.15, 0);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;

  CY(f, 2.2, 2.5, 0.55, 0x0B1522, 0, 1.35, 0, 48);
  const ring2 = add(f, new THREE.TorusGeometry(2.2, 0.07, 8, 64), new THREE.MeshBasicMaterial({ color: 0x071544 }), 0, 1.92, 0);
  ring2.rotation.x = Math.PI / 2;
  ring2.castShadow = false;

  const pad = new THREE.Mesh(new THREE.CircleGeometry(2.1, 48), new THREE.MeshBasicMaterial({ color: 0xBFEAFF }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 1.93;
  f.add(pad);

  const gcv = document.createElement('canvas');
  gcv.width = gcv.height = 256;
  {
    const x = gcv.getContext('2d');
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(90,150,255,.95)');
    gr.addColorStop(0.35, 'rgba(15,86,254,.45)');
    gr.addColorStop(1, 'rgba(15,86,254,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
  }
  const gtx = new THREE.CanvasTexture(gcv);
  const LY = 7.4;

  const gnd = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    new THREE.MeshBasicMaterial({ map: gtx, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = 0.97;
  f.add(gnd);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: gtx, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.scale.set(11, 11, 1);
  halo.position.set(0, LY, 0);
  f.add(halo);

  const LG = new THREE.Group();
  LG.position.set(0, LY, 0);
  f.add(LG);

  const LS = 8 / 235.2;
  const mkP = (P, col, em, ei) => {
    const sh = new THREE.Shape();
    P.forEach((q, i) => (i ? sh.lineTo(q[0] * LS, q[1] * LS) : sh.moveTo(q[0] * LS, q[1] * LS)));
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 1
    });
    geo.translate(0, 0, -0.4);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshPhongMaterial({ color: col, emissive: em, emissiveIntensity: ei, specular: 0x6FA8D8, shininess: 70 })
    );
    mesh.castShadow = false;
    LG.add(mesh);
  };

  mkP(
    JSON.parse(
      '[[-11.4,117.6],[-17.2,116.8],[-24.3,112.6],[-27.3,110.3],[-57.0,93.1],[-58.6,91.5],[-58.7,90.0],[-61.4,90.0],[-64.4,88.7],[-106.9,63.1],[-109.5,60.5],[-112.0,56.2],[-113.3,51.7],[-113.6,48.6],[-113.6,-50.0],[-112.9,-54.0],[-111.2,-58.0],[-107.8,-62.7],[-97.0,-69.6],[-93.0,-71.5],[-90.4,-71.2],[-89.8,-73.4],[-84.5,-77.0],[-79.6,-79.5],[-68.6,-86.2],[-66.2,-87.0],[-63.1,-89.4],[-37.6,-104.0],[-17.4,-116.2],[-12.0,-117.6],[-10.1,-117.2],[-6.2,-114.9],[-5.0,-113.3],[-4.8,-111.2],[-4.0,-109.6],[-3.9,-82.0],[-4.6,-79.8],[-14.1,-74.0],[-21.4,-70.1],[-22.5,-69.8],[-24.8,-70.1],[-25.1,-68.4],[-26.3,-67.1],[-67.5,-43.2],[-71.6,-40.1],[-73.9,-37.6],[-75.8,-31.9],[-75.8,30.5],[-75.4,33.9],[-73.2,39.4],[-72.0,40.8],[-37.2,61.1],[-27.1,67.5],[-21.7,70.2],[-8.2,78.1],[-4.5,81.1],[-3.9,83.2],[-3.9,106.0],[-4.6,112.1],[-5.4,114.0],[-7.2,116.2],[-9.2,117.3]]'
    ),
    0x071544,
    0x071544,
    0.35
  );

  mkP(
    JSON.parse(
      '[[14.8,116.8],[12.6,116.5],[10.4,115.3],[8.6,113.5],[7.9,111.7],[7.8,83.6],[8.4,81.2],[19.5,73.9],[21.8,72.9],[46.4,58.0],[49.4,56.7],[75.1,41.0],[76.0,39.8],[78.0,35.4],[78.6,30.4],[78.2,22.7],[77.0,19.6],[75.3,17.3],[71.3,13.8],[50.5,1.9],[49.1,0.5],[48.6,-1.0],[49.1,-2.6],[50.6,-4.0],[70.1,-15.3],[73.3,-17.5],[75.8,-20.0],[78.0,-23.5],[78.5,-26.9],[78.4,-32.9],[77.1,-37.5],[73.7,-40.9],[69.5,-44.2],[55.2,-52.3],[53.4,-54.2],[49.9,-55.2],[25.6,-69.9],[22.9,-71.1],[8.7,-80.1],[8.0,-81.5],[7.7,-84.0],[7.9,-111.5],[8.8,-113.3],[10.7,-115.2],[12.8,-116.3],[15.0,-116.7],[17.8,-116.2],[21.1,-114.5],[37.3,-105.0],[39.1,-103.2],[43.0,-101.7],[64.4,-89.0],[66.7,-87.2],[69.4,-86.1],[92.6,-71.6],[96.5,-69.8],[107.7,-62.6],[109.5,-60.7],[111.5,-57.8],[113.2,-53.9],[113.5,-49.5],[113.6,47.7],[113.2,51.9],[112.2,56.3],[109.6,60.1],[106.7,62.9],[90.8,72.7],[87.3,73.9],[85.4,75.8],[71.2,84.1],[64.2,88.7],[61.3,90.0],[57.9,92.5],[39.3,103.4],[37.5,104.9],[35.2,105.8],[21.2,114.6],[17.8,116.3]]'
    ),
    0x0F56FE,
    0x0F56FE,
    0.3
  );

  const pl = new THREE.PointLight(0x2F6BFF, 0.9, 55, 1.6);
  pl.position.set(0, LY, 0);
  f.add(pl);

  let nOn = false;
  onN(n => {
    nOn = !!n;
  });

  window.__LG = T => {
    LG.rotation.y = T * 0.9;
    const b = Math.sin(T * 1.6);
    LG.position.y = LY + 0.22 * Math.sin(T * 1.1);
    halo.position.y = LG.position.y;
    halo.material.opacity = (nOn ? 0.24 : 0.14) + 0.03 * b;
    gnd.material.opacity = (nOn ? 0.22 : 0.12) + 0.02 * b;
    pl.intensity = (nOn ? 0.35 : 0.15) + 0.03 * b;
    pad.material.color.setHex(b > 0 ? 0x0B2A78 : 0x09236A);
  };

  /* Concentric Plaza Foliage & Bushes */
  let sd2 = 20260;
  const R2 = () => (sd2 = (sd2 * 16807) % 2147483647) / 2147483647;
  const rg = (a, b) => a + (b - a) * R2();
  const TAUb = Math.PI * 2;
  const sst = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const GRN = [0xFFFFFF, 0xE8F5DC, 0xD2EBC0, 0xF2FFE6, 0xC4E2B0, 0xDCEFCB, 0xB9DCA6];
  const FLW = [0xF28CB1, 0xFFD34D, 0xFF9B42, 0xC95BD8, 0x9BD6FF, 0xFF6F6F, 0xFFF0A8];

  const mkT = (canvas, rep) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    if (rep) t.repeat.set(rep[0], rep[1]);
    return t;
  };

  const LEAFC = ['#1e4d24', '#2b6430', '#367a38', '#438e40', '#52a24a', '#2f6f3a', '#5fb056', '#27582f'];
  const leaf = (x, cx, cy, len, wd, ang, col, rib) => {
    x.save();
    x.translate(cx, cy);
    x.rotate(ang);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(-len / 2, 0);
    x.quadraticCurveTo(-len * 0.1, -wd, len / 2, 0);
    x.quadraticCurveTo(-len * 0.1, wd, -len / 2, 0);
    x.fill();
    if (rib) {
      x.strokeStyle = 'rgba(215,240,180,.38)';
      x.lineWidth = 0.8;
      x.beginPath();
      x.moveTo(-len / 2, 0);
      x.lineTo((len / 2) * 0.9, 0);
      x.stroke();
    }
    x.restore();
  };

  const bodyT = mkT(leafCanR(256), [3, 2]);

  const cardT = (() => {
    const S = 256;
    const [c, x] = mkc(S, S);
    x.clearRect(0, 0, S, S);
    const cx = S / 2;
    const cy = S * 0.9;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 46; i++) {
        const t = i / 46;
        const an = -Math.PI / 2 + rg(-1.15, 1.15);
        const d = rg(18, S * 0.78) * (pass ? 0.7 : 1);
        const px = cx + Math.cos(an) * d * 0.55;
        const py = cy + Math.sin(an) * d;
        const l = rg(34, 58) * (1 - 0.25 * t);
        const w = rg(9, 15);
        leaf(x, px, py, l, w, an + rg(-0.5, 0.5), pass ? LEAFC[(R2() * LEAFC.length) | 0] : '#1d4a22', pass === 1);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  })();

  const mulchT = (() => {
    const S = 256;
    const [c, x] = mkc(S, S);
    x.fillStyle = '#2a2418';
    x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = 'rgba(' + (R2() < 0.5 ? '74,58,36' : '30,40,22') + ',' + rg(0.3, 0.8) + ')';
      x.save();
      x.translate(R2() * S, R2() * S);
      x.rotate(R2() * TAUb);
      x.fillRect(0, 0, rg(3, 9), rg(1, 2.4));
      x.restore();
    }
    return mkT(c, [6, 6]);
  })();

  const bg = new THREE.IcosahedronGeometry(1, 1);
  const bp = bg.attributes.position;
  const bn = bg.attributes.normal;
  const bv = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) {
    bv.set(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize();
    const n = 1 + 0.16 * Math.sin(bv.x * 5.3 + bv.y * 3.1) * Math.cos(bv.z * 4.7 + bv.x * 2.3) + 0.07 * Math.sin(bv.y * 9 + bv.z * 7);
    bp.setXYZ(i, bv.x * n, bv.y * n, bv.z * n);
    bn.setXYZ(i, bv.x, bv.y * 0.6 + 0.4, bv.z);
  }
  bg.computeBoundingSphere();

  const cg = (() => {
    const geo = new THREE.BufferGeometry();
    const P = [];
    const U = [];
    const N = [];
    [[-0.5, 0, 0, 0.5, 0, 0], [0, 0, -0.5, 0, 0, 0.5]].forEach(q => {
      const a = [q[0], 0, q[2]];
      const b = [q[3], 0, q[5]];
      [[a, 0, 0], [b, 1, 0], [b, 1, 1], [a, 0, 0], [b, 1, 1], [a, 0, 1]].forEach(([v, u, vv]) => {
        P.push(v[0], vv, v[2]);
        U.push(u, vv);
        N.push(0, 1, 0);
      });
    });
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    return geo;
  })();

  const B = [];
  const C = [];
  const FL = [];
  const avLat = (x, z) => {
    let min = 1e9;
    for (const a of RL) {
      const al = x * Math.cos(a) + z * Math.sin(a);
      if (al > 0) {
        const l = Math.abs(-x * Math.sin(a) + z * Math.cos(a));
        if (l < min) min = l;
      }
    }
    return min;
  };
  const GAP = 4.6;
  const TAPER = 2.6;
  const RIN = 6.3;
  const RCL = 11.2;
  const fit = (x, z) => {
    const r = Math.hypot(x, z);
    if (r < RCL) return 1;
    const l = avLat(x, z);
    return l < GAP ? 0 : 0.4 + 0.6 * sst(GAP, GAP + TAPER, l);
  };
  const blob = (x, z, sc, hy) => {
    if (sc <= 0.05) return;
    B.push([x, sc * hy * 0.72, z, sc, sc * hy, sc * rg(0.9, 1.1), rg(0, TAUb), GRN[(R2() * GRN.length) | 0]]);
  };

  for (let r = RIN + 0.2; r <= 12.9; r += 0.72) {
    const t = sst(RIN, 12, r);
    const n = Math.round((TAUb * r) / 0.62);
    for (let i = 0; i < n; i++) {
      const a = ((i + rg(-0.35, 0.35)) / n) * TAUb;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const k = fit(x, z);
      if (!k) continue;
      blob(x, z, (0.5 + 0.5 * t) * rg(0.8, 1.2) * k, (0.75 + 0.8 * t) * rg(0.85, 1.2));
    }
  }

  for (let i = 0; i < 650; i++) {
    const a = R2() * TAUb;
    const r = rg(RIN, 12.6);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const k = fit(x, z);
    if (!k) continue;
    const t = sst(RIN, 12, r);
    blob(x, z, rg(0.38, 0.75) * k * (0.8 + 0.4 * t), rg(0.8, 1.4) * (0.75 + 0.7 * t));
  }

  RL.forEach(a => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    [-1, 1].forEach(sg => {
      for (let al = 11; al <= 13.4; al += 0.5) {
        [4.8, 5.7].forEach((lt, li) => {
          const k = 1 - sst(11, 13.6, al);
          const sc = (0.5 + 0.5 * k) * rg(0.85, 1.15) * (li ? 0.85 : 1);
          const L = lt + rg(-0.15, 0.15);
          blob(ca * al + sg * L * -sa, sa * al + sg * L * ca, sc, rg(1, 1.35));
        });
      }
    });
  });

  B.slice().forEach(b => {
    const k = Math.round(3 + b[3] * 5);
    for (let j = 0; j < k; j++) {
      const th = R2() * TAUb;
      const ph = Math.acos(rg(0.05, 1));
      const rr2 = b[3] * 0.92;
      const sz = rg(0.55, 0.95) * (0.7 + b[3] * 0.5);
      C.push([
        b[0] + Math.sin(ph) * Math.cos(th) * rr2,
        b[1] + Math.cos(ph) * b[4] * 0.92 - sz * 0.1,
        b[2] + Math.sin(ph) * Math.sin(th) * rr2,
        sz,
        th,
        ph,
        GRN[(R2() * GRN.length) | 0]
      ]);
    }
    if (R2() < 0.3) {
      const th = R2() * TAUb;
      const ph = Math.acos(rg(0.2, 0.9));
      const bx = b[0] + Math.sin(ph) * Math.cos(th) * b[3] * 0.95;
      const by = b[1] + Math.cos(ph) * b[4] * 0.95;
      const bz = b[2] + Math.sin(ph) * Math.sin(th) * b[3] * 0.95;
      const col = FLW[(R2() * FLW.length) | 0];
      for (let q = 0; q < 4; q++) {
        FL.push([bx + rg(-0.18, 0.18), by + rg(-0.08, 0.12), bz + rg(-0.18, 0.18), rg(0.05, 0.1), col]);
      }
    }
  });

  const BM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: bodyT });
  const CM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: cardT, alphaTest: 0.5, side: THREE.DoubleSide });
  const FM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: 0x221008 });
  const SM = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: mulchT });

  onN(n => {
    const c = n ? 0x66767F : 0xFFFFFF;
    BM.color.setHex(c);
    CM.color.setHex(c);
    SM.color.setHex(n ? 0x55606A : 0xFFFFFF);
    FM.color.setHex(n ? 0x8A949B : 0xFFFFFF);
  });

  const bed = new THREE.Mesh(new THREE.RingGeometry(5.9, 11.6, 72, 1), SM);
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = 0.035;
  bed.receiveShadow = true;
  f.add(bed);

  const mkInst = (geo, mat, rows, fn, sh) => {
    const im = new THREE.InstancedMesh(geo, mat, rows.length);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    rows.forEach((q, i) => {
      fn(o, q, c);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    im.castShadow = !!sh;
    im.receiveShadow = true;
    f.add(im);
    return im;
  };

  mkInst(
    bg,
    BM,
    B,
    (o, q, c) => {
      o.position.set(q[0], q[1], q[2]);
      o.rotation.set(0, q[6], 0);
      o.scale.set(q[3], q[4], q[5]);
      c.setHex(q[7]).multiplyScalar(rg(0.8, 1.05));
    },
    true
  );

  mkInst(
    cg,
    CM,
    C,
    (o, q, c) => {
      o.position.set(q[0], q[1], q[2]);
      o.rotation.set(Math.sin(q[5]) * rg(-0.5, 0.5) + (q[5] > 0.9 ? (R2() - 0.5) * 1.6 : 0), q[4], Math.cos(q[4]) * Math.sin(q[5]) * 0.7 + rg(-0.3, 0.3));
      o.scale.set(q[3], q[3] * 1.1, q[3]);
      c.setHex(q[6]).multiplyScalar(rg(0.85, 1.1));
    },
    false
  );

  mkInst(
    new THREE.IcosahedronGeometry(1, 0),
    FM,
    FL,
    (o, q, c) => {
      o.position.set(q[0], q[1], q[2]);
      o.rotation.set(R2(), R2(), R2());
      o.scale.set(q[3], q[3], q[3]);
      c.setHex(q[4]);
    },
    false
  );
}
