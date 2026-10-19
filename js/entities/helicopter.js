import { scene, onN, st } from '../core/scene.js';
import { M, BX, CY, add } from '../core/materials.js';
import { glowTex } from '../utils/textures.js';
import { clamp, lerp } from '../utils/math.js';
import { HOSP, HELI_S, fountTick } from '../world/city.js';
import { MPAD } from '../world/estate.js';

export var heli = null;
export var moveHeli = null;

export function buildHeli() {
  const g = new THREE.Group(),
    WH = 0xF4F6F8,
    BL = 0x1F6FD0,
    NV = 0x123A78,
    DK = 0x1B2A36,
    GR = 0x8E9AA4,
    CH = 0xC9D2D9,
    YL = 0xE6B84D,
    gl3 = new THREE.MeshPhongMaterial({
      color: 0x0B1A27,
      specular: 0xFFFFFF,
      shininess: 140,
      transparent: true,
      opacity: 0.86
    });

  const ell = (rx, ry, rz, c, x, y, z, sg) => {
    const m = add(g, new THREE.SphereGeometry(1, sg || 28, 18), typeof c === 'number' ? M(c) : c, x, y, z);
    m.scale.set(rx, ry, rz);
    return m;
  };
  const NC = o => {
    o.castShadow = false;
    return o;
  };

  const ext = (pts, d, c) => {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    const eg = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    eg.rotateY(-Math.PI / 2);
    eg.translate(d / 2, 0, 0);
    return add(g, eg, typeof c === 'number' ? M(c) : c, 0, 0, 0);
  };

  // Fuselage
  ell(1.06, 1, 2.05, WH, 0, 1.55, 0.05);
  ell(0.92, 0.82, 1.25, WH, 0, 1.48, 1.35);
  ell(1.1, 0.44, 2.3, BL, 0, 0.93, 0.25);
  NC(ell(0.9, 0.65, 1.3, gl3, 0, 1.76, 1.25, 24));
  [-1, 1].forEach(s => {
    NC(ell(0.08, 0.3, 0.5, gl3, s * 0.92, 1.78, 1.0, 14));
    NC(ell(0.08, 0.3, 0.62, gl3, s * 1.01, 1.78, -0.35, 14));
    BX(g, 0.04, 0.05, 0.2, CH, s * 1.03, 1.5, -0.9).castShadow = false;
    BX(g, 0.16, 0.05, 0.5, DK, s * 1.02, 0.55, -0.1).castShadow = false;
  });
  NC(ell(0.18, 0.12, 0.22, DK, 0, 0.62, 1.85, 12));

  // Engine cowling
  ell(0.88, 0.5, 1.55, WH, 0, 2.5, -0.6);
  ell(0.5, 0.06, 1.3, BL, 0, 2.98, -0.6, 16);
  BX(g, 0.7, 0.2, 0.1, DK, 0, 2.4, 0.86).castShadow = false;
  [-1, 1].forEach(s => {
    BX(g, 0.06, 0.22, 0.6, DK, s * 0.84, 2.5, -0.15).castShadow = false;
    const ex = add(g, new THREE.CylinderGeometry(0.13, 0.17, 0.5, 12), M(DK), s * 0.3, 2.55, -2.15);
    ex.rotation.x = Math.PI / 2;
  });

  // Mast
  CY(g, 0.12, 0.15, 0.85, CH, 0, 2.95, -0.5, 12);
  CY(g, 0.25, 0.25, 0.07, DK, 0, 3.45, -0.5, 16);
  CY(g, 0.34, 0.34, 0.22, DK, 0, 3.75, -0.5, 16);
  CY(g, 0.18, 0.18, 0.07, CH, 0, 3.97, -0.5, 12);

  // Tail boom
  const tb = add(g, new THREE.CylinderGeometry(0.11, 0.46, 5.4, 18), M(WH), 0, 1.95, -4.4);
  tb.rotation.x = -Math.PI / 2;
  const band = add(g, new THREE.CylinderGeometry(0.248, 0.27, 0.35, 18), M(BL), 0, 1.95, -5.0);
  band.rotation.x = -Math.PI / 2;
  ext([[-5.3, 2], [-7.2, 1.8], [-7.25, 3.75], [-6.75, 3.75]], 0.12, WH);
  ext([[-6.46, 3.4], [-7.25, 3.4], [-7.25, 3.75], [-6.75, 3.75]], 0.13, BL);
  ext([[-5.9, 1.75], [-7, 1.65], [-6.9, 1.05], [-6.3, 1.25]], 0.08, NV);
  BX(g, 2.1, 0.06, 0.6, WH, 0, 2.15, -5.85);
  [-1, 1].forEach(s => BX(g, 0.06, 0.55, 0.5, BL, s * 1.05, 1.9, -5.85));

  // Tail rotor
  const trot = new THREE.Group();
  trot.position.set(0.22, 2.65, -7.05);
  g.add(trot);
  const bm = new THREE.MeshPhongMaterial({ color: DK, transparent: true, opacity: 1, shininess: 20 });
  [[0.03, 1.9, 0.13], [0.03, 0.13, 1.9]].forEach(d => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(d[0], d[1], d[2]), bm);
    trot.add(m);
  });
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10), M(CH));
  hb.rotation.z = Math.PI / 2;
  trot.add(hb);

  const tbl = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 24),
    new THREE.MeshBasicMaterial({ color: 0x2A323A, transparent: true, opacity: 0, depthWrite: false, side: 2 })
  );
  tbl.rotation.y = Math.PI / 2;
  tbl.position.copy(trot.position);
  g.add(tbl);

  // Skids
  [-1, 1].forEach(s => {
    const sk = add(g, new THREE.CylinderGeometry(0.07, 0.07, 3.7, 8), M(GR), s, 0.07, 0.1);
    sk.rotation.x = Math.PI / 2;
    sk.castShadow = false;
    const up = add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), M(GR), s, 0.27, 2.02);
    up.rotation.x = 0.8;
    up.castShadow = false;
    const hl = add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), M(GR), s, 0.22, -1.8);
    hl.rotation.x = -0.8;
    hl.castShadow = false;
    [0.75, -0.55].forEach(z => {
      const st = add(g, new THREE.CylinderGeometry(0.055, 0.055, 0.81, 6), M(GR), s * 0.81, 0.46, z);
      st.rotation.z = s * 0.488;
      st.castShadow = false;
    });
  });

  // Main rotor
  const rot = new THREE.Group();
  rot.position.set(0, 3.97, -0.5);
  g.add(rot);
  for (let k = 0; k < 4; k++) {
    const a = new THREE.Group();
    a.rotation.y = (k * Math.PI) / 2;
    rot.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(4, 0.045, 0.3), bm);
    b.position.set(2.6, 0, 0);
    b.rotation.x = 0.07;
    a.add(b);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.31), M(YL));
    t.position.set(4.95, 0.002, 0);
    t.rotation.x = 0.07;
    a.add(t);
  }
  const blur = new THREE.Mesh(
    new THREE.CircleGeometry(5.3, 48),
    new THREE.MeshBasicMaterial({ color: 0x2A323A, transparent: true, opacity: 0, depthWrite: false, side: 2 })
  );
  blur.rotation.x = -Math.PI / 2;
  blur.position.set(0, 3.98, -0.5);
  g.add(blur);

  const mkL = (x, y, z, col, sz) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: col }));
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

  g.userData = {
    rot,
    trot,
    blur,
    tbl,
    bm,
    L: {
      nav: [mkL(1.08, 1.45, 0.5, 0xFF2030, 2.6), mkL(-1.08, 1.45, 0.5, 0x30FF70, 2.6)],
      bcn: [mkL(0, 3.08, -1.3, 0xFF2A20, 3.4), mkL(0, 0.5, 0.4, 0xFF2A20, 3.4)],
      str: [mkL(0, 3.82, -7, 0xFFFFFF, 4), mkL(0, 2.2, -7.4, 0xFFFFFF, 2.4)],
      land: [mkL(0, 1.05, 2.5, 0xFFF6D8, 5)]
    }
  };
  g.rotation.order = 'YXZ';
  return g;
}

export function initHelicopter() {
  heli = buildHeli();
  scene.add(heli);
  heli.scale.setScalar(HELI_S);

  const pads = {
    A: { x: 50, z: -302, y: 0.235, psi: Math.PI },
    H: { x: 0, z: 120, y: 18.6, psi: 0 }
  };

  if (MPAD) {
    pads.H = MPAD;
  } else if (HOSP && HOSP.userData.heliPad) {
    const HP = HOSP.userData.heliPad,
      v = new THREE.Vector3(),
      w = new THREE.Vector3(),
      d = new THREE.Vector3(0, 0, -1);
    HOSP.updateMatrixWorld(true);
    HP.getWorldPosition(v);
    HP.getWorldScale(w);
    d.transformDirection(HP.matrixWorld);
    pads.H = { x: v.x, z: v.z, y: v.y + 0.372 * w.y, psi: Math.atan2(d.x, d.z) };
  }

  const FOOT = 0.03 * HELI_S,
    wrap2 = a => Math.atan2(Math.sin(a), Math.cos(a)),
    CRUISE = 52,
    AVG = 24,
    DWELL = 120,
    SPIN = 10,
    LIFT = 6,
    LAND = 7,
    STOP = 8,
    OM = 30;

  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  function mkLeg(a, b) {
    const dx = b.x - a.x,
      dz = b.z - a.z,
      L = Math.hypot(dx, dz),
      ux = dx / L,
      uz = dz / L,
      P = (f, y) => V3(a.x + dx * f, y, a.z + dz * f),
      Ao = (d, y) => V3(a.x + ux * d, y, a.z + uz * d),
      At = (d, y) => V3(b.x - ux * d, y, b.z - uz * d);
    const cv = new THREE.CatmullRomCurve3(
      [
        V3(a.x, a.y + 9, a.z),
        Ao(18, a.y + 19),
        Ao(Math.min(75, L * 0.22), CRUISE * 0.82),
        P(0.4, CRUISE),
        P(0.7, CRUISE),
        At(Math.min(120, L * 0.3), CRUISE * 0.88),
        At(Math.min(60, L * 0.18), b.y + 24),
        At(Math.min(28, L * 0.1), b.y + 14),
        At(10, b.y + 8.5),
        V3(b.x, b.y + 7, b.z)
      ],
      false,
      'centripetal'
    );
    return { cv, dur: cv.getLength() / AVG, psi: Math.atan2(dx, dz) };
  }

  const legAH = mkLeg(pads.A, pads.H),
    legHA = mkLeg(pads.H, pads.A);

  const PH = [
    ['idle', 'A', DWELL],
    ['lift', 'A', LIFT, legAH],
    ['leg', 'A', legAH.dur, legAH, 'H'],
    ['land', 'H', LAND],
    ['idle', 'H', DWELL],
    ['lift', 'H', LIFT, legHA],
    ['leg', 'H', legHA.dur, legHA, 'A'],
    ['land', 'A', LAND]
  ];
  const CYC = PH.reduce((s, p) => s + p[2], 0),
    OFF = DWELL - 15;

  const sm4 = t => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  let hpsi = null,
    hpit = 0,
    hbk = 0,
    hom = 0,
    hprev = null;

  function pose(t) {
    let p = PH[0];
    for (const q of PH) {
      if (t < q[2]) {
        p = q;
        break;
      }
      t -= q[2];
    }
    const k = p[0],
      pad = pads[p[1]];
    let x = pad.x,
      y = pad.y + FOOT,
      z = pad.z,
      psi = pad.psi,
      rotor = 0;
    if (k === 'idle') {
      rotor = t > p[2] - SPIN || t < STOP ? 1 : 0;
    } else if (k === 'lift') {
      const u = sm4(t / p[2]);
      y = lerp(pad.y + FOOT, pad.y + 9, u);
      psi = pad.psi + wrap2(p[3].psi - pad.psi) * u;
      rotor = 1;
    } else if (k === 'leg') {
      const u = sm4(t / p[2]),
        q = p[3].cv.getPointAt(u),
        tg = p[3].cv.getTangentAt(u),
        dest = pads[p[4]];
      x = q.x;
      y = q.y;
      z = q.z;
      const pt = Math.atan2(tg.x, tg.z),
        w = sm4((u - 0.78) / 0.2);
      psi = pt + wrap2(dest.psi - pt) * w;
      rotor = 1;
    } else {
      const u = sm4(t / p[2]);
      y = lerp(pad.y + 7, pad.y + FOOT, u);
      rotor = 1;
    }
    return { x, y, z, psi, rotor };
  }

  moveHeli = function(T, dt) {
    if (!dt) return;
    const s = pose((T + OFF) % CYC);
    hom += ((s.rotor ? OM : 0) - hom) * Math.min(1, dt * 0.45);
    const k = hom / OM,
      u = heli.userData;
    u.rot.rotation.y -= hom * dt;
    u.trot.rotation.x += hom * dt * 4.5;
    u.blur.material.opacity = 0.17 * k * k;
    u.tbl.material.opacity = 0.12 * k * k;
    u.bm.opacity = 1 - 0.55 * k;

    let pit = 0,
      bk = 0;
    if (hprev) {
      const vx = (s.x - hprev.x) / dt,
        vz = (s.z - hprev.z) / dt,
        vh = Math.hypot(vx, vz),
        ac = (vh - (hprev.vh || 0)) / dt,
        air = clamp((s.y - pads.A.y - 2.5) / 4, 0, 1);
      pit = air * (0.2 * clamp(vh / 30, 0, 1) - 0.16 * clamp(-ac / 9, 0, 1));
      const dp = wrap2(s.psi - hprev.psi) / dt;
      bk = -clamp(dp * 0.45, -0.42, 0.42) * air;
      hprev = { x: s.x, z: s.z, psi: s.psi, vh };
    } else hprev = { x: s.x, z: s.z, psi: s.psi, vh: 0 };

    const kk = Math.min(1, dt * 3);
    hpit += (pit - hpit) * kk;
    hbk += (bk - hbk) * kk;
    hpsi = hpsi == null ? s.psi : hpsi + wrap2(s.psi - hpsi) * Math.min(1, dt * 8);

    const air = clamp((s.y - pads.A.y - 1) / 3, 0, 1),
      wob = air * k;
    heli.position.set(s.x + Math.sin(T * 1.7) * 0.07 * wob, s.y, s.z + Math.cos(T * 1.3) * 0.07 * wob);
    heli.rotation.set(hpit + Math.sin(T * 2.3) * 0.012 * wob, hpsi, hbk + Math.sin(T * 1.9) * 0.014 * wob);

    const L = u.L,
      nt = st.n ? 1 : 0.5,
      bc = (T * 1) % 1 < 0.14,
      sb = (T * 1.3) % 1 < 0.09;
    L.nav.forEach(o => {
      o.sp.material.opacity = 0.7 * nt;
    });
    L.bcn.forEach(o => {
      o.m.visible = bc;
      o.sp.material.opacity = bc ? nt : 0;
    });
    L.str.forEach(o => {
      o.m.visible = sb;
      o.sp.material.opacity = sb ? nt : 0;
    });
    L.land.forEach(o => {
      o.sp.material.opacity = st.n && air > 0 ? 0.8 : 0;
    });

    fountTick(T);
  };
}
