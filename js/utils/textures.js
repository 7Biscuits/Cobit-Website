import { rr, rtF, rtS, clamp } from './math.js';

export const mkc = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
};

export function Dtex(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
}

export function Dtex2(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
}

export function rtLeaf(x, cx, cy, len, wd, ang, col, vein) {
  x.save();
  x.translate(cx, cy);
  x.rotate(ang);
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(-len / 2, 0);
  x.bezierCurveTo(-len * 0.2, -wd * 1.1, len * 0.25, -wd * 0.9, len / 2, 0);
  x.bezierCurveTo(len * 0.25, wd * 0.9, -len * 0.2, wd * 1.1, -len / 2, 0);
  x.fill();
  if (vein) {
    x.strokeStyle = 'rgba(225,245,190,.34)';
    x.lineWidth = Math.max(0.5, len * 0.032);
    x.beginPath();
    x.moveTo(-len / 2, 0);
    x.lineTo(len * 0.46, 0);
    [-0.25, 0, 0.25].forEach(t => {
      x.moveTo(len * t, 0);
      x.lineTo(len * (t + 0.17), -wd * 0.68);
      x.moveTo(len * t, 0);
      x.lineTo(len * (t + 0.17), wd * 0.68);
    });
    x.stroke();
  }
  x.restore();
}

export function leafCanR(S) {
  const [c, x] = mkc(S, S);
  const sc = S / 256;
  x.fillStyle = '#1b3f20';
  x.fillRect(0, 0, S, S);
  const lay = (n, cols, l0, l1, w0, w1, al, vein) => {
    for (let i = 0; i < n; i++) {
      const px = rr(0, S);
      const py = rr(0, S);
      const l = rr(l0, l1) * sc;
      const w = rr(w0, w1) * sc;
      const an = rr(0, 6.283);
      const col = cols[(Math.random() * cols.length) | 0];
      x.globalAlpha = al;
      for (const ox of [0, -S, S]) {
        for (const oy of [0, -S, S]) {
          if (px + ox < -l || px + ox > S + l || py + oy < -l || py + oy > S + l) continue;
          rtLeaf(x, px + ox, py + oy, l, w, an, col, vein);
        }
      }
    }
    x.globalAlpha = 1;
  };
  lay(420, ['#12301a', '#173a1c', '#1c431f'], 16, 30, 5, 9, 1, false);
  lay(720, ['#2b5e26', '#336d2b', '#27552a', '#3b7a30', '#2f6529'], 14, 26, 4.5, 8.5, 1, true);
  lay(520, ['#46902f', '#4f9c35', '#3f8530', '#5aa93c'], 12, 22, 4, 7.5, 0.95, true);
  lay(230, ['#8bc553', '#9fd061', '#78b247'], 9, 16, 3, 5.5, 0.85, true);
  for (let i = 0; i < 70; i++) {
    x.fillStyle = 'rgba(8,24,10,.2)';
    x.beginPath();
    x.arc(rr(0, S), rr(0, S), rr(2, 6) * sc, 0, 6.283);
    x.fill();
  }
  return c;
}

export function needleCanR(S) {
  const [c, x] = mkc(S, S);
  const sc = S / 256;
  x.fillStyle = '#16361f';
  x.fillRect(0, 0, S, S);
  x.lineCap = 'round';
  const st = (n, cols, l0, l1, lw, al) => {
    for (let i = 0; i < n; i++) {
      const px = rr(0, S);
      const py = rr(0, S);
      const l = rr(l0, l1) * sc;
      const an = rr(0, 6.283);
      const dx = Math.cos(an) * l;
      const dy = Math.sin(an) * l;
      x.strokeStyle = cols[(Math.random() * cols.length) | 0];
      x.globalAlpha = al;
      x.lineWidth = lw * sc;
      for (const ox of [0, -S, S]) {
        for (const oy of [0, -S, S]) {
          if (px + ox < -l || px + ox > S + l || py + oy < -l || py + oy > S + l) continue;
          x.beginPath();
          x.moveTo(px + ox, py + oy);
          x.lineTo(px + ox + dx, py + oy + dy);
          x.stroke();
        }
      }
    }
    x.globalAlpha = 1;
  };
  st(120, ['#3a2a1a', '#4a3622'], 28, 58, 2.2, 0.55);
  st(5200, ['#1a4326', '#1f4d2b', '#183c22'], 8, 16, 1.1, 1);
  st(5200, ['#285f35', '#2f6a38', '#32713e', '#2a5a37'], 7, 14, 1, 1);
  st(1900, ['#4b8a52', '#5a9a60', '#6fae70'], 5, 10, 0.9, 0.9);
  return c;
}

export function barkCanR() {
  const W = 128;
  const H = 256;
  const [c, x] = mkc(W, H);
  const id = x.createImageData(W, H);
  const d = id.data;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const u = i / W;
      const v = j / H;
      const wp = rtF(u * 5, v * 2, 5, 2, 3, 2);
      const w = rtF(u * 5 + wp * 1.4, v * 2, 5, 2, 7, 4);
      const r = Math.abs(w - 0.5) * 2;
      const cr = Math.pow(1 - Math.min(1, r * 1.9), 3);
      const m = rtF(u * 14, v * 6, 14, 6, 13, 3);
      const k = 0.5 + 0.75 * r;
      let R = Math.min(255, 112 * k + 26 * m);
      let G = Math.min(255, 86 * k + 20 * m);
      let B = Math.min(255, 62 * k + 14 * m);
      const dk = 1 - 0.7 * cr;
      R *= dk;
      G *= dk;
      B *= dk;
      const q = (j * W + i) * 4;
      d[q] = R;
      d[q + 1] = G;
      d[q + 2] = B;
      d[q + 3] = 255;
    }
  }
  x.putImageData(id, 0, 0);
  for (let i = 0; i < 46; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '132,146,112' : '168,170,150') + ',' + rr(0.08, 0.28) + ')';
    x.beginPath();
    x.ellipse(rr(0, W), rr(0, H), rr(1.5, 5), rr(1, 3), 0, 0, 6.283);
    x.fill();
  }
  return c;
}

export function flagCan() {
  const S = 512;
  const [c, x] = mkc(S, S);
  const id = x.createImageData(S, S);
  const d = id.data;
  const N = 7;
  const CW = S / N;
  const pts = [];
  const cs = [];
  let sd = 5;
  const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      pts.push([(i + 0.15 + 0.7 * rn()) * CW, (j + 0.15 + 0.7 * rn()) * CW]);
      const t = rn();
      cs.push([196 + 34 * t - 14 * rn(), 188 + 30 * t - 14 * rn(), 170 + 28 * t - 12 * rn()]);
    }
  }
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const cx = Math.floor(px / CW);
      const cy = Math.floor(py / CW);
      let d1 = 1e9;
      let d2 = 1e9;
      let k1 = 0;
      let vx = 0;
      let vy = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          let ci = cx + di;
          let cj = cy + dj;
          const ox = ci < 0 ? -S : ci >= N ? S : 0;
          const oy = cj < 0 ? -S : cj >= N ? S : 0;
          ci = (ci + N) % N;
          cj = (cj + N) % N;
          const P = pts[cj * N + ci];
          const qx = P[0] + ox - px;
          const qy = P[1] + oy - py;
          const dd = Math.hypot(qx, qy);
          if (dd < d1) {
            d2 = d1;
            d1 = dd;
            k1 = cj * N + ci;
            vx = qx;
            vy = qy;
          } else if (dd < d2) {
            d2 = dd;
          }
        }
      }
      const e = d2 - d1;
      const u = px / S;
      const v = py / S;
      const sf = 0.86 + 0.26 * rtF(u * 10, v * 10, 10, 10, 5, 4);
      const stn = rtF(u * 6, v * 6, 6, 6, 19, 3);
      const sp = (Math.random() - 0.5) * 16;
      const C = cs[k1];
      let R = C[0] * sf + sp;
      let G = C[1] * sf + sp;
      let B = C[2] * sf + sp;
      if (stn > 0.62) {
        const t = (stn - 0.62) * 0.9;
        R *= 1 - 0.22 * t;
        G *= 1 - 0.2 * t;
        B *= 1 - 0.14 * t;
      }
      const bev = 1 - rtS(3, 16, e);
      if (bev > 0) {
        const l = Math.hypot(vx, vy) || 1;
        const dir = -vx / l * 0.6 - vy / l * 0.8;
        const sh = 1 + bev * (dir > 0 ? 0.12 : -0.2) * Math.abs(dir + 0.2);
        R *= sh;
        G *= sh;
        B *= sh;
      }
      const gr = 1 - rtS(2.2, 6, e);
      if (gr > 0) {
        const mo = rtF(u * 14, v * 14, 14, 14, 29, 3);
        const moss = mo > 0.58 ? rtS(0.58, 0.75, mo) : 0;
        const gR = 84 + (62 - 84) * moss + (Math.random() - 0.5) * 10;
        const gG = 78 + (96 - 78) * moss + (Math.random() - 0.5) * 10;
        const gB = 66 + (48 - 66) * moss;
        R = R * (1 - gr) + gR * gr;
        G = G * (1 - gr) + gG * gr;
        B = B * (1 - gr) + gB * gr;
      }
      const q = (py * S + px) * 4;
      d[q] = R;
      d[q + 1] = G;
      d[q + 2] = B;
      d[q + 3] = 255;
    }
  }
  x.putImageData(id, 0, 0);
  x.strokeStyle = 'rgba(70,64,54,.3)';
  x.lineWidth = 0.8;
  for (let i = 0; i < 14; i++) {
    x.beginPath();
    let px = rr(0, S);
    let py = rr(0, S);
    x.moveTo(px, py);
    for (let k = 0; k < 6; k++) {
      px += rr(-10, 10);
      py += rr(-10, 10);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

export function grassCan() {
  const S = 1024;
  const [c, x] = mkc(S, S);
  const B = 256;
  const [bc, bx] = mkc(B, B);
  const id = bx.createImageData(B, B);
  const d = id.data;
  for (let j = 0; j < B; j++) {
    for (let i = 0; i < B; i++) {
      const u = i / B;
      const v = j / B;
      const f = rtF(u * 8, v * 8, 8, 8, 11, 4);
      const g = rtF(u * 16, v * 16, 16, 16, 23, 3);
      const dry = rtF(u * 5, v * 5, 5, 5, 31, 3);
      const soil = rtF(u * 6, v * 6, 6, 6, 41, 3);
      let r = 58 + 58 * f + 28 * g;
      let gr = 92 + 60 * f + 24 * g;
      let b = 36 + 22 * f;
      const dd = Math.max(0, dry - 0.56) * 2.2;
      r += dd * 66;
      gr += dd * 18;
      b += dd * 4;
      const so = Math.max(0, soil - 0.7) * 3;
      r = r * (1 - so) + 96 * so;
      gr = gr * (1 - so) + 78 * so;
      b = b * (1 - so) + 50 * so;
      const k = (j * B + i) * 4;
      d[k] = r;
      d[k + 1] = gr;
      d[k + 2] = b;
      d[k + 3] = 255;
    }
  }
  bx.putImageData(id, 0, 0);
  x.imageSmoothingEnabled = true;
  x.drawImage(bc, 0, 0, S, S);
  x.lineCap = 'round';
  const base = (px, py) => {
    const q = ((((py / 4) | 0) % B) * B + (((px / 4) | 0) % B)) * 4;
    return [d[q], d[q + 1], d[q + 2]];
  };
  const blade = (n, l0, l1, lw0, lw1, tone, al, tint) => {
    for (let i = 0; i < n; i++) {
      const px = rr(0, S);
      const py = rr(0, S);
      const l = rr(l0, l1);
      const a = -1.5708 + rr(-0.95, 0.95);
      const bend = rr(-0.35, 0.35);
      const ex = px + Math.cos(a) * l;
      const ey = py + Math.sin(a) * l;
      const cxp = px + Math.cos(a + bend) * l * 0.55;
      const cyp = py + Math.sin(a + bend) * l * 0.55;
      const B0 = base(px, py);
      const t = tone * rr(0.85, 1.15);
      const col = 'rgb(' + Math.min(255, (B0[0] * t + tint[0]) | 0) + ',' + Math.min(255, (B0[1] * t + tint[1]) | 0) + ',' + Math.min(255, (B0[2] * t + tint[2]) | 0) + ')';
      x.strokeStyle = col;
      x.globalAlpha = al;
      x.lineWidth = rr(lw0, lw1);
      const e = Math.min(px, py, S - px, S - py) < 24;
      for (const ox of e ? [0, -S, S] : [0]) {
        for (const oy of e ? [0, -S, S] : [0]) {
          x.beginPath();
          x.moveTo(px + ox, py + oy);
          x.quadraticCurveTo(cxp + ox, cyp + oy, ex + ox, ey + oy);
          x.stroke();
        }
      }
    }
    x.globalAlpha = 1;
  };
  blade(24000, 4, 11, 1.3, 2.2, 0.5, 0.65, [0, 0, 0]);
  blade(40000, 8, 20, 0.9, 1.7, 1.05, 0.85, [0, 0, 0]);
  blade(15000, 6, 12, 0.8, 1.3, 1.4, 0.8, [16, 14, 0]);
  for (let i = 0; i < 2200; i++) {
    x.strokeStyle = ['#b9a46a', '#9a8856', '#a89358', '#c8b476'][i & 3];
    x.globalAlpha = rr(0.45, 0.8);
    x.lineWidth = rr(0.8, 1.4);
    const px = rr(0, S);
    const py = rr(0, S);
    const a = -1.5708 + rr(-1, 1);
    const l = rr(7, 16);
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 260; i++) {
    const px = rr(0, S);
    const py = rr(0, S);
    x.fillStyle = 'rgba(60,120,50,.8)';
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + rr(0, 1);
      x.beginPath();
      x.arc(px + Math.cos(a) * 3, py + Math.sin(a) * 3, 3.4, 0, 6.283);
      x.fill();
    }
    x.fillStyle = 'rgba(120,176,84,.55)';
    x.beginPath();
    x.arc(px, py, 2, 0, 6.283);
    x.fill();
  }
  for (let i = 0; i < 90; i++) {
    const px = rr(0, S);
    const py = rr(0, S);
    const dand = i % 3 === 0;
    x.fillStyle = dand ? '#f2cf3a' : '#f6f3e8';
    x.beginPath();
    x.arc(px, py, dand ? 2.6 : 2.2, 0, 6.283);
    x.fill();
    if (!dand) {
      x.fillStyle = '#e6b92e';
      x.beginPath();
      x.arc(px, py, 0.9, 0, 6.283);
      x.fill();
    }
  }
  return c;
}

export function macroCan() {
  const S = 512;
  const [c, x] = mkc(S, S);
  const id = x.createImageData(S, S);
  const d = id.data;
  for (let j = 0; j < S; j++) {
    for (let i = 0; i < S; i++) {
      const u = i / S;
      const v = j / S;
      const f = rtF(u * 4, v * 4, 4, 4, 5, 5);
      const g = rtF(u * 9, v * 9, 9, 9, 17, 4);
      const h = rtF(u * 3, v * 3, 3, 3, 29, 3);
      const wd = rtS(0.56, 0.78, f);
      const wg = rtS(0.44, 0.22, f);
      const we = rtS(0.62, 0.78, h) * rtS(0.5, 0.7, g);
      let r = 104 + (156 - 104) * wd + (36 - 104) * wg;
      let gg = 150 + (146 - 150) * wd + (80 - 150) * wg;
      let b = 58 + (76 - 58) * wd + (30 - 58) * wg;
      r = r * (1 - we) + 120 * we;
      gg = gg * (1 - we) + 98 * we;
      b = b * (1 - we) + 66 * we;
      const a = Math.min(0.7, 0.2 + 0.34 * Math.max(wd, wg) + 0.26 * we);
      const q = (j * S + i) * 4;
      d[q] = r;
      d[q + 1] = gg;
      d[q + 2] = b;
      d[q + 3] = a * 255;
    }
  }
  x.putImageData(id, 0, 0);
  return c;
}

export function paveCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#d6dbde';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,' + rr(0.03, 0.12) + ')' : 'rgba(60,70,80,' + rr(0.03, 0.1) + ')';
      x.fillRect(i * 64, j * 64, 64, 64);
    }
  }
  for (let i = 0; i < 3500; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '70,80,90') + ',' + rr(0.05, 0.18) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.5, 1.5);
  }
  x.strokeStyle = '#9aa3aa';
  x.lineWidth = 2.5;
  for (let i = 0; i <= 4; i++) {
    x.beginPath();
    x.moveTo(i * 64, 0);
    x.lineTo(i * 64, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i * 64);
    x.lineTo(S, i * 64);
    x.stroke();
  }
  return c;
}

export function asphCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#3a4046';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const v = Math.floor(rr(40, 150));
    x.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',' + rr(0.2, 0.7) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 2.4), rr(1, 2.4));
  }
  for (let i = 0; i < 40; i++) {
    x.fillStyle = 'rgba(20,22,26,' + rr(0.08, 0.2) + ')';
    x.beginPath();
    x.ellipse(rr(0, S), rr(0, S), rr(10, 40), rr(6, 22), rr(0, 3), 0, 6.3);
    x.fill();
  }
  return c;
}

export function concCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#c4cacd';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 30; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '120,125,128' : '240,244,246') + ',' + rr(0.05, 0.16) + ')';
    x.beginPath();
    x.ellipse(rr(0, S), rr(0, S), rr(12, 60), rr(8, 40), rr(0, 3), 0, 6.3);
    x.fill();
  }
  for (let i = 0; i < 5000; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '80,86,90') + ',' + rr(0.06, 0.2) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.4, 1.4);
  }
  x.strokeStyle = '#858e94';
  x.lineWidth = 3;
  x.strokeRect(1, 1, S - 2, S - 2);
  x.strokeStyle = 'rgba(90,96,100,.55)';
  x.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    x.beginPath();
    let px = rr(0, S);
    let py = rr(0, S);
    x.moveTo(px, py);
    for (let k = 0; k < 6; k++) {
      px += rr(-14, 14);
      py += rr(4, 16);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

export function rockCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#716a60';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '40,36,32' : '170,160,145') + ',' + rr(0.08, 0.22) + ')';
    x.beginPath();
    x.ellipse(rr(0, S), rr(0, S), rr(10, 48), rr(5, 20), rr(-0.4, 0.4), 0, 6.3);
    x.fill();
  }
  for (let i = 0; i < 6000; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '30,28,26' : '200,190,170') + ',' + rr(0.08, 0.3) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 2.6), rr(1, 2.6));
  }
  x.strokeStyle = 'rgba(25,22,20,.6)';
  x.lineWidth = 1.3;
  for (let i = 0; i < 22; i++) {
    x.beginPath();
    let px = rr(0, S);
    let py = rr(0, S);
    x.moveTo(px, py);
    for (let k = 0; k < 7; k++) {
      px += rr(-12, 12);
      py += rr(-12, 12);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

export function gravelCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#b4a98f';
  x.fillRect(0, 0, S, S);
  const cl = ['#8f8672', '#c9bfa6', '#a39a84', '#6f685a', '#d6ccb2'];
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = cl[i % 5];
    x.beginPath();
    x.ellipse(rr(0, S), rr(0, S), rr(1.2, 3.6), rr(1, 2.6), rr(0, 3), 0, 6.3);
    x.fill();
  }
  return c;
}

export function brickCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#b9b3a7';
  x.fillRect(0, 0, S, S);
  const cl = ['#a65a43', '#b4684d', '#9a4f3a', '#c07a5d', '#8f4a38', '#b86f55'];
  for (let j = 0; j < 16; j++) {
    for (let i = -1; i < 8; i++) {
      const ox = (j % 2) * 16;
      x.fillStyle = cl[(i * 7 + j * 3 + ((i * j) & 3)) % 6];
      x.fillRect(i * 32 + ox + 1, j * 16 + 1, 30, 14);
      x.fillStyle = 'rgba(255,255,255,' + rr(0, 0.08) + ')';
      x.fillRect(i * 32 + ox + 1, j * 16 + 1, 30, 3);
    }
  }
  for (let i = 0; i < 3000; i++) {
    x.fillStyle = 'rgba(0,0,0,' + rr(0.04, 0.14) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.5, 1.5);
  }
  return c;
}

export function cobCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#4d4a45';
  x.fillRect(0, 0, S, S);
  const cl = ['#8c877d', '#a09a8e', '#77726a', '#b0a99b', '#6c6a66', '#948c7e'];
  for (let j = 0; j < 16; j++) {
    for (let i = 0; i < 16; i++) {
      const cx = i * 16 + 8 + rr(-2, 2) + (j % 2) * 8;
      const cy = j * 16 + 8 + rr(-2, 2);
      x.fillStyle = cl[Math.floor(rr(0, 6))];
      x.beginPath();
      x.ellipse(cx, cy, rr(6, 7.6), rr(5.6, 7), rr(-0.3, 0.3), 0, 6.3);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,' + rr(0.04, 0.14) + ')';
      x.beginPath();
      x.ellipse(cx - 1.5, cy - 1.5, 3, 2.4, 0, 0, 6.3);
      x.fill();
    }
  }
  return c;
}

export function slabCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      x.fillStyle = (i + j) % 2 ? '#bdb7ab' : '#cfc9bd';
      x.fillRect(i * 64, j * 64, 64, 64);
      for (let k = 0; k < 6; k++) {
        x.strokeStyle = 'rgba(120,112,100,' + rr(0.05, 0.18) + ')';
        x.lineWidth = rr(0.6, 1.6);
        x.beginPath();
        x.moveTo(i * 64 + rr(0, 64), j * 64);
        x.bezierCurveTo(i * 64 + rr(0, 64), j * 64 + 20, i * 64 + rr(0, 64), j * 64 + 44, i * 64 + rr(0, 64), j * 64 + 64);
        x.stroke();
      }
    }
  }
  for (let i = 0; i < 3000; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '70,64,56') + ',' + rr(0.05, 0.16) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.4, 1.4);
  }
  x.strokeStyle = '#7d786f';
  x.lineWidth = 2.5;
  for (let i = 0; i <= 4; i++) {
    x.beginPath();
    x.moveTo(i * 64, 0);
    x.lineTo(i * 64, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i * 64);
    x.lineTo(S, i * 64);
    x.stroke();
  }
  return c;
}

export function plankCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#8a6a43';
  x.fillRect(0, 0, S, S);
  const cl = ['#a98458', '#b8935f', '#9c7b50', '#c3a06c'];
  for (let j = 0; j < 16; j++) {
    x.fillStyle = cl[j % 4];
    x.fillRect(0, j * 16 + 1, S, 14);
    for (let k = 0; k < 8; k++) {
      x.strokeStyle = 'rgba(70,48,28,' + rr(0.12, 0.3) + ')';
      x.lineWidth = rr(0.5, 1.2);
      x.beginPath();
      let px = rr(0, S);
      let py = j * 16 + rr(3, 13);
      x.moveTo(px, py);
      x.lineTo(px + rr(30, 90), py + rr(-1, 1));
      x.stroke();
    }
    x.fillStyle = 'rgba(40,28,16,.55)';
    x.fillRect((j * 83) % S, j * 16 + 1, 1.5, 14);
  }
  return c;
}

export function hullCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#e9edf0';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(90,100,110,.45)';
  x.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.moveTo(i * 32, 0);
    x.lineTo(i * 32, S);
    x.stroke();
  }
  for (let j = 0; j < 4; j++) {
    x.beginPath();
    x.moveTo(0, j * 64);
    x.lineTo(S, j * 64);
    x.stroke();
  }
  x.fillStyle = 'rgba(60,66,72,.5)';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 16; j++) {
      x.fillRect(i * 32 + 3, j * 16 + 4, 1.6, 1.6);
      x.fillRect(i * 32 + 28, j * 16 + 4, 1.6, 1.6);
    }
  }
  for (let i = 0; i < 14; i++) {
    const g = x.createLinearGradient(0, 0, 0, 70);
    g.addColorStop(0, 'rgba(120,70,40,.22)');
    g.addColorStop(1, 'rgba(120,70,40,0)');
    x.fillStyle = g;
    x.fillRect(rr(0, S), rr(0, S), rr(2, 6), 70);
  }
  return c;
}

export function fabricCan() {
  const S = 128;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#f3f1ea';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(120,116,104,.28)';
  x.lineWidth = 1;
  for (let i = 0; i < S; i += 3) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i);
    x.lineTo(S, i);
    x.stroke();
  }
  x.strokeStyle = 'rgba(80,76,66,.5)';
  x.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    x.beginPath();
    x.moveTo(0, i * 44 + 10);
    x.lineTo(S, i * 44 + 10);
    x.stroke();
  }
  return c;
}

export function panelCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#eef2f5';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(100,112,122,.55)';
  x.lineWidth = 1.6;
  for (let i = 0; i <= 4; i++) {
    x.beginPath();
    x.moveTo(i * 64, 0);
    x.lineTo(i * 64, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i * 64);
    x.lineTo(S, i * 64);
    x.stroke();
  }
  x.fillStyle = 'rgba(70,80,90,.5)';
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      if (i % 8 === 1 || j % 8 === 1) x.fillRect(i * 8 + 2, j * 8 + 2, 1.4, 1.4);
    }
  }
  return c;
}

export function roofCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#8d9296';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) {
    const v = Math.floor(rr(90, 200));
    x.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',' + rr(0.3, 0.8) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 2.6), rr(1, 2.6));
  }
  x.strokeStyle = 'rgba(60,64,68,.45)';
  x.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.moveTo(i * 52, 0);
    x.lineTo(i * 52, S);
    x.stroke();
  }
  return c;
}

export function fuseCan() {
  const S = 1024;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(110,122,134,.5)';
  x.lineWidth = 1.6;
  for (let i = 1; i < 24; i++) {
    x.beginPath();
    x.moveTo(0, (i * S) / 24);
    x.lineTo(S, (i * S) / 24);
    x.stroke();
  }
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.moveTo((i * S) / 8, 0);
    x.lineTo((i * S) / 8, S);
    x.stroke();
  }
  for (const u of [0.25, 0.75]) {
    x.fillStyle = '#223344';
    for (let k = 0; k < 30; k++) {
      const cy = S * (1 - 0.14) - k * S * 0.0235;
      x.beginPath();
      x.ellipse(u * S, cy, 5, 7, 0, 0, 6.3);
      x.fill();
    }
    x.fillStyle = '#2a4a6a';
    x.fillRect(u * S - 12, S * 0.05, 24, S * 0.025);
    x.fillStyle = 'rgba(60,80,110,.75)';
    x.fillRect(u * S + 16, 0, 5, S);
    x.fillRect(u * S - 21, 0, 5, S);
    x.fillStyle = 'rgba(120,130,140,.5)';
    x.fillRect(u * S - 14, S * 0.28, 28, S * 0.05);
  }
  x.fillStyle = '#223344';
  x.fillRect(S * 0.47, S * 0.035, S * 0.06, S * 0.03);
  return c;
}

export function wakeCan() {
  const W = 256;
  const H = 128;
  const [c, x] = mkc(W, H);
  const g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,.8)');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(W, H / 2 - 6);
  x.lineTo(0, 2);
  x.lineTo(0, H - 2);
  x.lineTo(W, H / 2 + 6);
  x.closePath();
  x.fill();
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260; i++) {
    x.fillStyle = 'rgba(0,0,0,' + rr(0.1, 0.5) + ')';
    x.beginPath();
    x.arc(rr(0, W), rr(0, H), rr(1, 4), 0, 6.3);
    x.fill();
  }
  return c;
}

export function rustCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#e4e0d8';
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(70,60,50,.35)';
  x.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.moveTo(i * 32, 0);
    x.lineTo(i * 32, S);
    x.stroke();
  }
  for (let j = 0; j < 4; j++) {
    x.beginPath();
    x.moveTo(0, j * 64);
    x.lineTo(S, j * 64);
    x.stroke();
  }
  for (let i = 0; i < 46; i++) {
    const px = rr(0, S);
    const py = rr(0, S);
    const r = rr(6, 26);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(128,66,28,' + rr(0.18, 0.42) + ')');
    g.addColorStop(1, 'rgba(128,66,28,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 22; i++) {
    const g = x.createLinearGradient(0, 0, 0, 90);
    g.addColorStop(0, 'rgba(110,56,26,.35)');
    g.addColorStop(1, 'rgba(110,56,26,0)');
    x.fillStyle = g;
    x.fillRect(rr(0, S), rr(0, S), rr(1.5, 5), 90);
  }
  for (let i = 0; i < 2500; i++) {
    x.fillStyle = 'rgba(0,0,0,' + rr(0.03, 0.1) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.4, 1.4);
  }
  return c;
}

export function steelCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#8f989e';
  x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(255,255,255,.22)';
  for (let j = 0; j < 16; j++) {
    for (let i = 0; i < 16; i++) {
      const ox = (j % 2) * 8;
      x.save();
      x.translate(i * 16 + ox + 4, j * 16 + 8);
      x.rotate(0.8);
      x.fillRect(-4, -1, 8, 2);
      x.restore();
      x.save();
      x.translate(i * 16 + ox + 12, j * 16 + 8);
      x.rotate(-0.8);
      x.fillRect(-4, -1, 8, 2);
      x.restore();
    }
  }
  x.strokeStyle = 'rgba(30,36,40,.45)';
  x.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    x.beginPath();
    x.moveTo(i * 64, 0);
    x.lineTo(i * 64, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i * 64);
    x.lineTo(S, i * 64);
    x.stroke();
  }
  for (let i = 0; i < 2500; i++) {
    x.fillStyle = 'rgba(0,0,0,' + rr(0.04, 0.12) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.5, 1.5);
  }
  return c;
}

export function corrCan() {
  const S = 128;
  const [c, x] = mkc(S, S);
  for (let i = 0; i < 16; i++) {
    const g = x.createLinearGradient(i * 8, 0, i * 8 + 8, 0);
    g.addColorStop(0, '#f4f7f9');
    g.addColorStop(0.55, '#d3dade');
    g.addColorStop(1, '#aab3b9');
    x.fillStyle = g;
    x.fillRect(i * 8, 0, 8, S);
  }
  for (let i = 0; i < 10; i++) {
    const g = x.createLinearGradient(0, S - 50, 0, S);
    g.addColorStop(0, 'rgba(120,80,50,0)');
    g.addColorStop(1, 'rgba(120,80,50,.22)');
    x.fillStyle = g;
    x.fillRect(rr(0, S), S - 50, rr(3, 10), 50);
  }
  for (let i = 0; i < 1200; i++) {
    x.fillStyle = 'rgba(0,0,0,' + rr(0.02, 0.07) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1.3, 1.3);
  }
  return c;
}

export function quayCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      x.fillStyle = (i + j) % 2 ? '#aeb3b5' : '#bbc0c1';
      x.fillRect(i * 128, j * 128, 128, 128);
    }
  }
  for (let i = 0; i < 5000; i++) {
    x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '60,64,66') + ',' + rr(0.04, 0.14) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 2.2), rr(1, 2.2));
  }
  for (let i = 0; i < 16; i++) {
    const px = rr(0, S);
    const py = rr(0, S);
    const r = rr(8, 26);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(40,36,30,' + rr(0.08, 0.2) + ')');
    g.addColorStop(1, 'rgba(40,36,30,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  x.strokeStyle = 'rgba(70,74,76,.75)';
  x.lineWidth = 2.5;
  [0, 128].forEach(v => {
    x.beginPath();
    x.moveTo(v, 0);
    x.lineTo(v, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, v);
    x.lineTo(S, v);
    x.stroke();
  });
  for (let i = 0; i < 7; i++) {
    x.strokeStyle = 'rgba(60,62,64,' + rr(0.2, 0.45) + ')';
    x.lineWidth = 1;
    x.beginPath();
    let px = rr(0, S);
    let py = rr(0, S);
    x.moveTo(px, py);
    for (let k = 0; k < 4; k++) {
      px += rr(-14, 14);
      py += rr(4, 16);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

export function contCan() {
  const S = 128;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#e8e8e8';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.2)';
    x.fillRect(i * 8, 0, 4, S);
  }
  x.strokeStyle = 'rgba(60,60,60,.5)';
  x.strokeRect(2, 2, S - 4, S - 4);
  for (let i = 0; i < 300; i++) {
    x.fillStyle = 'rgba(60,40,30,' + rr(0.03, 0.12) + ')';
    x.fillRect(rr(0, S), rr(0, S), 1, rr(2, 9));
  }
  return c;
}

const nameT = {};
export function nameTex(n) {
  return (
    nameT[n] ||
    (nameT[n] = Dtex2(256, 48, (g, W, H) => {
      g.fillStyle = 'rgba(0,0,0,0)';
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#16202A';
      g.font = 'bold 34px Arial';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(n, W / 2, H / 2 + 2);
    }))
  );
}

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

export const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

export function pitchTex() {
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

export function pitchTex2() {
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
    const pa = 125;
    const pw = 303;
    const ga = 42;
    const gw = 138;
    [0, 1].forEach(s => {
      const x0 = s ? W - m : m;
      const d = s ? -1 : 1;
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

export function seatCan2() {
  const S = 64;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#55616c';
  x.fillRect(0, 0, S, S);
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      const px = i * 16 + 1.5;
      const py = j * 16 + 1.5;
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
  }
  return c;
}

export function facadeCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
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
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      x.fillRect(i * 64 + 6, j * 64 + 6, 2, 2);
      x.fillRect(i * 64 + 56, j * 64 + 6, 2, 2);
      x.fillRect(i * 64 + 6, j * 64 + 56, 2, 2);
      x.fillRect(i * 64 + 56, j * 64 + 56, 2, 2);
    }
  }
  for (let i = 0; i < 14; i++) {
    const g = x.createLinearGradient(0, 0, 0, 80);
    g.addColorStop(0, 'rgba(90,100,110,.2)');
    g.addColorStop(1, 'rgba(90,100,110,0)');
    x.fillStyle = g;
    x.fillRect(rr(0, S), rr(0, S), rr(2, 5), 80);
  }
  return c;
}

export function glassBandCan() {
  const S = 128;
  const [c, x] = mkc(S, S);
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

export function padCan(kind) {
  const S = 1024;
  const [c, x] = mkc(S, S);
  const C = S / 2;
  const roof = kind === 'roof';
  const TAU = Math.PI * 2;
  x.fillStyle = roof ? '#454d54' : '#9b9d9c';
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 30000; i++) {
    const v = Math.floor(rr(roof ? 55 : 125, roof ? 125 : 205));
    x.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 3) + ',' + rr(0.12, 0.5) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 2.8), rr(1, 2.8));
  }
  if (!roof) {
    x.strokeStyle = 'rgba(38,40,42,.6)';
    x.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
      x.beginPath();
      x.moveTo((i * S) / 4, 0);
      x.lineTo((i * S) / 4, S);
      x.moveTo(0, (i * S) / 4);
      x.lineTo(S, (i * S) / 4);
      x.stroke();
    }
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + rr(0.025, 0.08) + ')';
        x.fillRect((i * S) / 4 + 3, (j * S) / 4 + 3, S / 4 - 6, S / 4 - 6);
      }
    }
    x.strokeStyle = 'rgba(20,20,22,.35)';
    x.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      x.beginPath();
      let px = rr(0, S);
      let py = rr(0, S);
      x.moveTo(px, py);
      for (let k = 0; k < 6; k++) {
        px += rr(-26, 26);
        py += rr(-26, 26);
        x.lineTo(px, py);
      }
      x.stroke();
    }
  }
  for (let i = 0; i < 14; i++) {
    x.fillStyle = 'rgba(12,12,16,' + rr(0.05, 0.15) + ')';
    x.beginPath();
    x.ellipse(rr(S * 0.18, S * 0.82), rr(S * 0.18, S * 0.82), rr(12, 60), rr(7, 30), rr(0, 3), 0, TAU);
    x.fill();
  }
  const paint = '#F2F2EE';
  const yel = '#E9B825';
  const ring = (r, w, col) => {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.beginPath();
    x.arc(C, C, r, 0, TAU);
    x.stroke();
  };
  if (roof) {
    ring(C * 0.945, 18, yel);
    ring(C * 0.8, 30, paint);
  } else {
    ring(C * 0.44, 16, yel);
    ring(C * 0.37, 24, paint);
    x.strokeStyle = paint;
    x.lineWidth = 10;
    x.setLineDash([46, 34]);
    x.strokeRect(34, 34, S - 68, S - 68);
    x.setLineDash([]);
    x.strokeStyle = yel;
    x.lineWidth = 14;
    [[0, 0, 1, 1], [S, 0, -1, 1], [0, S, 1, -1], [S, S, -1, -1]].forEach(q => {
      x.beginPath();
      x.moveTo(q[0] + q[2] * 34, q[1] + q[3] * 130);
      x.lineTo(q[0] + q[2] * 34, q[1] + q[3] * 34);
      x.lineTo(q[0] + q[2] * 130, q[1] + q[3] * 34);
      x.stroke();
    });
  }
  const hw = roof ? C * 0.5 : C * 0.34;
  const hh = roof ? C * 0.62 : C * 0.42;
  const th = roof ? C * 0.115 : C * 0.08;
  x.fillStyle = paint;
  x.fillRect(C - hw / 2, C - hh / 2, th, hh);
  x.fillRect(C + hw / 2 - th, C - hh / 2, th, hh);
  x.fillRect(C - hw / 2, C - th / 2, hw, th);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  if (roof) {
    x.font = 'bold 58px Arial';
    x.fillText('4t', C, C + hh / 2 + 64);
    x.font = 'bold 40px Arial';
    x.fillText('D 9.5', C, C - hh / 2 - 58);
  } else {
    x.font = 'bold 64px Arial';
    x.fillText('CoBit HELI', C, S - 92);
    x.font = 'bold 44px Arial';
    x.fillText('HELIPORT', C, 92);
  }
  for (let i = 0; i < 9000; i++) {
    x.fillStyle = roof ? 'rgba(64,72,78,' + rr(0.25, 0.7) + ')' : 'rgba(150,152,150,' + rr(0.2, 0.6) + ')';
    x.fillRect(rr(0, S), rr(0, S), rr(1, 3.5), rr(1, 3.5));
  }
  return c;
}

export function stoneCan() {
  const S = 512;
  const [c, x] = mkc(S, S);
  const n = 34;
  const pts = [];
  const tone = [];
  for (let k = 0; k < n; k++) {
    pts.push([rr(0, S), rr(0, S)]);
    const v = rr(150, 205);
    tone.push([v, v - 5 - rr(0, 8), v - 16 - rr(0, 10)]);
  }
  const im = x.createImageData(S, S);
  const d = im.data;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      let a = 1e9;
      let b = 1e9;
      let ai = 0;
      for (let k = 0; k < n; k++) {
        let dx = Math.abs(px - pts[k][0]);
        let dy = Math.abs(py - pts[k][1]);
        if (dx > S / 2) dx = S - dx;
        if (dy > S / 2) dy = S - dy;
        const q = Math.sqrt(dx * dx + dy * dy);
        if (q < a) {
          b = a;
          a = q;
          ai = k;
        } else if (q < b) {
          b = q;
        }
      }
      const e = b - a;
      const o = (py * S + px) * 4;
      const t = tone[ai];
      const nz = (Math.random() - 0.5) * 16;
      let f = e < 3.2 ? 0.38 : e < 5 ? 0.7 + (e - 3.2) * 0.15 : 1;
      d[o] = clamp(t[0] * f + nz, 0, 255);
      d[o + 1] = clamp(t[1] * f + nz, 0, 255);
      d[o + 2] = clamp(t[2] * f + nz, 0, 255);
      d[o + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '110,102,90' : '255,250,240') + ',' + rr(0.05, 0.13) + ')';
    x.lineWidth = rr(0.8, 2);
    x.beginPath();
    let px = rr(0, S);
    let py = rr(0, S);
    x.moveTo(px, py);
    for (let m = 0; m < 5; m++) {
      px += rr(-24, 24);
      py += rr(-24, 24);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

export function plazaCan() {
  const S = 1024;
  const [c, x] = mkc(S, S);
  x.fillStyle = '#6f6a63';
  x.fillRect(0, 0, S, S);
  const light = ['#cfc8bb', '#c3bcae', '#d8d2c6', '#b9b2a5', '#c8c1b4'];
  const dark = ['#a39d92', '#999387', '#aca69b'];
  for (let r = 0; r < 8; r++) {
    const accent = r % 4 === 3;
    const cols = accent ? dark : light;
    const off = (r % 2) * 128;
    for (let u = -128 + off; u < S + 128; u += 256) {
      const k = Math.abs(Math.round((u + 300) / 256) * 7 + r * 5) % cols.length;
      const X = u + 3;
      const Y = r * 128 + 3;
      const W = 250;
      const H = 122;
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
          let px = xx + rr(10, W - 10);
          let py = Y + rr(4, H - 4);
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
    const px = rr(0, S);
    const py = rr(0, S);
    const rd = rr(30, 110);
    for (const ox of [0, -S, S]) {
      for (const oy of [0, -S, S]) {
        const gx = px + ox;
        const gy = py + oy;
        if (gx < -rd || gx > S + rd || gy < -rd || gy > S + rd) continue;
        const g = x.createRadialGradient(gx, gy, 0, gx, gy, rd);
        g.addColorStop(0, Math.random() < 0.5 ? 'rgba(70,64,52,.14)' : 'rgba(255,255,255,.1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(gx - rd, gy - rd, rd * 2, rd * 2);
      }
    }
  }
  return c;
}

export function woodCan() {
  const S = 256;
  const [c, x] = mkc(S, S);
  for (let i = 0; i < 16; i++) {
    const v = rr(-12, 12);
    x.fillStyle = 'rgb(' + Math.round(98 + v) + ',' + Math.round(62 + v * 0.7) + ',' + Math.round(36 + v * 0.5) + ')';
    x.fillRect(i * 16, 0, 16, S);
    for (let k = 0; k < 26; k++) {
      x.fillStyle = 'rgba(40,22,10,' + rr(0.08, 0.25) + ')';
      x.fillRect(i * 16 + rr(1, 14), rr(0, S), 1, rr(10, 70));
    }
    x.fillStyle = 'rgba(20,10,4,.85)';
    x.fillRect(i * 16, 0, 1.6, S);
  }
  return c;
}

export function rwTex(a, b) {
  const c = document.createElement('canvas');
  c.width = 1800;
  c.height = 120;
  const x = c.getContext('2d');
  x.fillStyle = '#2B333A';
  x.fillRect(0, 0, 1800, 120);
  x.fillStyle = '#EEF3F6';
  x.fillRect(0, 5, 1800, 3);
  x.fillRect(0, 112, 1800, 3);
  for (let i = 140; i < 1660; i += 60) x.fillRect(i, 58, 30, 4);
  for (let k = 0; k < 8; k++) {
    x.fillRect(14, 16 + k * 11, 44, 6);
    x.fillRect(1742, 16 + k * 11, 44, 6);
  }
  for (let i = 330; i < 1500; i += 170) {
    x.fillRect(i, 34, 50, 5);
    x.fillRect(i, 81, 50, 5);
  }
  x.font = 'bold 34px Arial';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  [[100, a, 1], [1700, b, -1]].forEach(p => {
    x.save();
    x.translate(p[0], 60);
    x.rotate(p[2] * Math.PI / 2);
    x.fillText(p[1], 0, 0);
    x.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  return new THREE.MeshLambertMaterial({
    map: t,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
}

export const BNAMES = [
  'SEA WOLF',
  'NORTH STAR',
  'BLUE HERON',
  'AURORA',
  'HARBOUR QUEEN',
  'TIDEWATER',
  'MARIANA',
  'OCEAN PRIDE'
];

