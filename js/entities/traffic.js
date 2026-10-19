import { scene, onN } from '../core/scene.js';
import { M, BX, CY, add, flat, glow, warmG, redG, grnG, whtG, poolM, poolG, bulbG } from '../core/materials.js';
import { Dtex, mkc } from '../utils/textures.js';
import { clamp, lerp, rr, wn, Pp, cum, resample, segD } from '../utils/math.js';
import { RL, LR, CC, PAT, SUPER_PAL } from '../config.js';
import { asph, bridgeY } from '../world/environment.js';
import { ROADQ, XRD, STSP, HOMES, PARKREG, ASPH2, WHT2, ribbon, LP, inHouse } from '../world/city.js';
import {
  SUPER, FLASH, buildPolice, buildAmb, buildFire, buildSBus, buildBus, buildTruck, buildCar, distStep
} from './vehicles.js';
import { fleet, buildVessel } from './port.js';

export const veh = [];
export const AG = [];
export const dests = { port: [], truck: [], air: [] };
let trLast = 0;
let FD = 0.016;

export function hit(P, o) {
  const dx = o.qx - P.qx,
    dz = o.qz - P.qz;
  for (const [ux, uz] of [
    [P.dx, P.dz],
    [-P.dz, P.dx],
    [o.dx, o.dz],
    [-o.dz, o.dx]
  ]) {
    const pa = P.hl * Math.abs(P.dx * ux + P.dz * uz) + P.hw * Math.abs(-P.dz * ux + P.dx * uz),
      pb = o.r * Math.abs(o.dx * ux + o.dz * uz) + o.w * Math.abs(-o.dz * ux + o.dx * uz);
    if (Math.abs(dx * ux + dz * uz) > pa + pb) return false;
  }
  return true;
}

export function sepUpdate(dt) {
  const P = {};
  for (const a of AG) {
    const p = a.m.position;
    if (a.qx == null) {
      a.qx = p.x;
      a.qz = p.z;
      const h = a.m.rotation.y;
      a.dx = Math.cos(h);
      a.dz = -Math.sin(h);
    } else {
      const dx = p.x - a.qx,
        dz = p.z - a.qz,
        s = Math.hypot(dx, dz);
      if (a.bt) {
        const h = a.m.rotation.y;
        a.dx = Math.cos(h);
        a.dz = -Math.sin(h);
      } else if (s > 2e-3) {
        a.dx = dx / s;
        a.dz = dz / s;
      }
      a.spd = (a.spd || 0) + ((s / Math.max(dt, 1e-3)) - (a.spd || 0)) * 0.3;
      a.qx = p.x;
      a.qz = p.z;
    }
    const pl = a.plan;
    a.fix = a.bt ? !a.sail : !!(a.busy && pl && pl.i === pl.wi);
  }
  for (const a of AG) {
    let b = a.hold ? a : false;
    if (a.gh > 0) a.gh -= dt;
    if (!a.fix && !b) {
      const G = a.bt ? 5 + 1.3 * (a.spd || 0) : a.vh ? 3.4 + 0.7 * (a.spd || 0) : a.g;
      P.qx = a.qx + (a.dx * G) / 2;
      P.qz = a.qz + (a.dz * G) / 2;
      P.dx = a.dx;
      P.dz = a.dz;
      P.hl = a.r + G / 2;
      P.hw = a.w + 0.15;
      const qd = a.bt ? 3.2 : 0.3,
        Q = {
          qx: a.qx + a.dx * qd,
          qz: a.qz + a.dz * qd,
          dx: a.dx,
          dz: a.dz,
          hl: a.r + qd,
          hw: a.w + (a.bt ? 0.6 : 0.05)
        };
      for (const o of AG) {
        if (
          o === a ||
          a.gh > 0 ||
          !!o.bt !== !!a.bt ||
          Math.abs(o.qx - a.qx) > (a.bt ? 32 : 16) ||
          Math.abs(o.qz - a.qz) > (a.bt ? 32 : 16)
        )
          continue;
        if ((o.qx - a.qx) * a.dx + (o.qz - a.qz) * a.dz <= -0.3) continue;
        if (o.fix) {
          if (hit(Q, o)) {
            b = o;
            break;
          }
          continue;
        }
        if (
          (hit(P, o) &&
            (o.fix ||
              (o.busy ? o.id : o.id + 1e3) < (a.busy ? a.id : a.id + 1e3) ||
              (a.dx * o.dx + a.dz * o.dz > 0.3 && (a.qx - o.qx) * o.dx + (a.qz - o.qz) * o.dz < 0))) ||
          ((o.sf < 0.3 || a.bt) && hit(Q, o))
        ) {
          b = o;
          break;
        }
      }
    }
    a.by = b;
    a.wait = b ? (a.wait || 0) + dt : 0;
    if (a.bt && b && a.wait > 25) a.gh = 6;
    a.sf += ((b ? 0 : 1) - a.sf) * Math.min(1, dt * (b ? 10 : 1.5));
  }
}

export const RM = (() => {
  const STEP = 1,
    TR = 6.2,
    CR = 4.5,
    TOL = 9,
    roads = [],
    nodes = [],
    lanes = [],
    outL = [];

  const addRoad = (P, w, o) => {
    const Q = resample(P, 2.2);
    const R = Object.assign({ P: Q, S: cum(Q), w: w, ow: 0, sp: 0 }, o || {});
    if (R.rw == null) R.rw = (R.hw || 5) - 0.3;
    roads.push(R);
  };
  const circ = (cx, cz, r, n, dir) => {
    const P = [];
    for (let k = 0; k <= n; k++) {
      const t = ((dir * k) / n) * 6.2832;
      P.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r]);
    }
    return P;
  };

  const initRoads = () => {
    ROADQ.forEach(q => addRoad(q.P, 2.4, { hw: 5.3, g: 1 }));
    XRD.forEach(r => addRoad([r.S, r.E], 3, { hw: r.w / 2 + 0.3, g: 1 }));
    addRoad(circ(0, 0, 40.9, 96, -1), 1.45, { hw: 5.9, ow: 1 });
    addRoad([[0, -40.9], [0, -325]], 1.8, { sp: 1, hw: 5.4, rw: 3.5 });
    addRoad([[0, -103], [-140, -103]], 2.2, { hw: 5 });
    addRoad([[-108, -103], [-108, -131]], 1.7, { hw: 3.7 });
    RL.forEach(a => {
      const cx = Math.cos(a) * LR,
        cz = Math.sin(a) * LR,
        t0 = Math.atan2(-cz, -cx),
        P = [];
      for (let k = 0; k <= 40; k++) {
        const t = t0 - (k / 40) * 6.2832;
        P.push([cx + Math.cos(t) * 17, cz + Math.sin(t) * 17]);
      }
      addRoad(P, 1.6, { hw: 3.3, ow: 1 });
    });
  };

  const probe = () => {
    const cand = [];
    const bb = roads.map(R => {
      let x0 = 1e9,
        x1 = -1e9,
        z0 = 1e9,
        z1 = -1e9;
      R.P.forEach(p => {
        x0 = Math.min(x0, p[0]);
        x1 = Math.max(x1, p[0]);
        z0 = Math.min(z0, p[1]);
        z1 = Math.max(z1, p[1]);
      });
      return [x0 - 1, x1 + 1, z0 - 1, z1 + 1];
    });
    const ov = (a, b) =>
      bb[a][0] <= bb[b][1] && bb[b][0] <= bb[a][1] && bb[a][2] <= bb[b][3] && bb[b][2] <= bb[a][3];
    const segX = (a, b, c, d) => {
      const rx = b[0] - a[0],
        rz = b[1] - a[1],
        sx = d[0] - c[0],
        sz = d[1] - c[1],
        den = rx * sz - rz * sx;
      if (Math.abs(den) < 1e-9) return null;
      const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den,
        u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) return null;
      return [a[0] + t * rx, a[1] + t * rz];
    };
    const nearest = (R, x, z) => {
      let b = { d: 1e9 };
      const P = R.P,
        S = R.S;
      for (let i = 1; i < P.length; i++) {
        const ax = P[i - 1][0],
          az = P[i - 1][1],
          dx = P[i][0] - ax,
          dz = P[i][1] - az,
          l = dx * dx + dz * dz || 1,
          t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)),
          px = ax + t * dx,
          pz = az + t * dz,
          d = Math.hypot(x - px, z - pz);
        if (d < b.d) b = { d: d, x: px, z: pz, s: S[i - 1] + t * Math.sqrt(l) };
      }
      return b;
    };

    for (let a = 0; a < roads.length; a++)
      for (let b = a + 1; b < roads.length; b++) {
        if (!ov(a, b)) continue;
        const A = roads[a],
          B = roads[b];
        for (let i = 1; i < A.P.length; i++)
          for (let j = 1; j < B.P.length; j++) {
            const p = segX(A.P[i - 1], A.P[i], B.P[j - 1], B.P[j]);
            if (p)
              cand.push({
                x: p[0],
                z: p[1],
                m: [
                  [a, A.S[i - 1] + Math.hypot(p[0] - A.P[i - 1][0], p[1] - A.P[i - 1][1])],
                  [b, B.S[j - 1] + Math.hypot(p[0] - B.P[j - 1][0], p[1] - B.P[j - 1][1])]
                ]
              });
          }
      }

    roads.forEach((R, a) => {
      [[R.P[0], 0], [R.P[R.P.length - 1], R.S[R.S.length - 1]]].forEach(([e, s]) => {
        let any = false;
        roads.forEach((O, b) => {
          if (b === a) return;
          const n = nearest(O, e[0], e[1]);
          if (n.d < TOL) {
            const atEnd = n.s < 0.5 || n.s > O.S[O.S.length - 1] - 0.5;
            if (atEnd && n.d > 0.5) return;
            any = true;
            cand.push({ x: n.x, z: n.z, m: [[a, s], [b, n.s]] });
          }
        });
        if (!any) cand.push({ x: e[0], z: e[1], m: [[a, s]] });
      });
    });

    const par = cand.map((_, i) => i),
      fd = i => {
        while (par[i] !== i) {
          par[i] = par[par[i]];
          i = par[i];
        }
        return i;
      };
    for (let i = 0; i < cand.length; i++)
      for (let j = i + 1; j < cand.length; j++)
        if (Math.hypot(cand[i].x - cand[j].x, cand[i].z - cand[j].z) < CR) par[fd(i)] = fd(j);

    const G = {};
    cand.forEach((c, i) => {
      const r = fd(i),
        g = G[r] || (G[r] = { x: 0, z: 0, n: 0, ent: {} });
      g.x += c.x;
      g.z += c.z;
      g.n++;
      c.m.forEach(([rd, s]) => (g.ent[rd] || (g.ent[rd] = [])).push(s));
    });
    const res = [];
    Object.values(G).forEach(g => res.push({ x: g.x / g.n, z: g.z / g.n, ent: g.ent }));
    return res;
  };

  const RINGS = [],
    RC = 8.5,
    IS = 5;

  const buildGraph = () => {
    initRoads();
    const sel = [];
    probe().forEach(N => {
      let arms = 0,
        ok = true;
      for (const k in N.ent) {
        const R = roads[k],
          ss = N.ent[k],
          len = R.S[R.S.length - 1];
        if (!R.g) {
          ok = false;
          break;
        }
        arms += (Math.min(...ss) > 2 ? 1 : 0) + (Math.max(...ss) < len - 2 ? 1 : 0);
      }
      if (
        !ok ||
        arms < 3 ||
        arms > 4 ||
        Math.hypot(N.x, N.z) < 58 ||
        sel.some(q => Math.hypot(q.x - N.x, q.z - N.z) < 38)
      )
        return;
      sel.push({ x: N.x, z: N.z });
    });

    sel.forEach(c => {
      const old = roads.slice();
      roads.length = 0;
      old.forEach(R => {
        const P = R.P,
          dd = p => Math.hypot(p[0] - c.x, p[1] - c.z);
        if (!P.some(p => dd(p) < RC + 1.5)) {
          roads.push(R);
          return;
        }
        const runs = [];
        let run = [];
        for (let i = 0; i < P.length; i++) {
          const d = dd(P[i]),
            dp = i ? dd(P[i - 1]) : 0;
          if (d > RC) {
            if (!run.length && i && dp <= RC) {
              const t = (RC - dp) / (d - dp);
              run.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]);
            }
            run.push(P[i]);
          } else if (run.length) {
            const t = (RC - dp) / (d - dp);
            run.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]);
            runs.push(run);
            run = [];
          }
        }
        if (run.length) runs.push(run);
        runs.forEach(r => {
          if (r.length >= 2 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) > 3)
            addRoad(r, R.w, { hw: R.hw, g: R.g, sp: R.sp, ow: R.ow, rw: R.rw });
        });
      });
      addRoad(circ(c.x, c.z, RC, 28, -1), 0, { hw: RC + 3, ow: 1 });
      RINGS.push({ x: c.x, z: c.z, R: RC });
    });

    const am = ASPH2;
    const wm = new THREE.MeshLambertMaterial({
      color: 0xF2F2EE,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5
    });

    RINGS.forEach(r => {
      const a = new THREE.Mesh(new THREE.RingGeometry(IS, RC + 3, 40), am);
      a.rotation.x = -Math.PI / 2;
      a.position.set(r.x, 0.105, r.z);
      a.receiveShadow = true;
      scene.add(a);
      for (let k = 0; k < 16; k++) {
        const d = new THREE.Mesh(new THREE.RingGeometry(RC - 0.09, RC + 0.09, 4, 1, (k * Math.PI) / 8, Math.PI / 16), wm);
        d.rotation.x = -Math.PI / 2;
        d.position.set(r.x, 0.12, r.z);
        scene.add(d);
      }
      CY(scene, IS + 0.3, IS + 0.3, 0.2, 0xD8D5CB, r.x, 0, r.z, 32).castShadow = false;
      CY(scene, IS, IS, 0.3, 0x4C8A38, r.x, 0, r.z, 32).castShadow = false;
    });

    // Planarize again for real nodes
    const finalNodes = probe();
    nodes.length = 0;
    finalNodes.forEach(n => nodes.push(n));

    // Build directed lanes
    const lanePts = (P, w, sp, len) => {
      const C = resample(P, STEP),
        n = C.length,
        O = [];
      for (let i = 0; i < n; i++) {
        const a = C[Math.max(0, i - 2)],
          b = C[Math.min(n - 1, i + 2)];
        let dx = b[0] - a[0],
          dz = b[1] - a[1];
        const l = Math.hypot(dx, dz) || 1;
        dx /= l;
        dz /= l;
        O.push([C[i][0] - dz * w, C[i][1] + dx * w]);
      }
      let R = resample(O, STEP),
        k = Math.round(Math.min(TR, 0.36 * len) / STEP);
      if (R.length - 2 * k < 2) k = Math.max(0, Math.floor((R.length - 2) / 2));
      return R.slice(k, R.length - k).map(p => [p[0], p[1], sp ? bridgeY(p[1]) + 0.15 : 0.05]);
    };

    let LID = 0;
    const mkLane = (a, b, P, w, sp) => {
      const S = cum(P),
        pts = lanePts(P, w, sp, S[S.length - 1]);
      if (pts.length < 2) return null;
      const L = { id: LID++, a: a, b: b, pts: pts, len: pts.length, tw: null, w: w };
      lanes.push(L);
      return L;
    };

    roads.forEach((R, ri) => {
      const ent = [];
      nodes.forEach((N, ni) => {
        const ss = N.ent[ri];
        if (ss) ss.forEach(s => ent.push([s, ni]));
      });
      ent.sort((p, q) => p[0] - q[0]);
      const m = [];
      ent.forEach(e => {
        const l = m[m.length - 1];
        if (l && l[1] === e[1] && e[0] - l[0] < 3 * CR) return;
        m.push(e);
      });
      for (let i = 1; i < m.length; i++) {
        const e1 = m[i - 1],
          e2 = m[i],
          n1 = nodes[e1[1]],
          n2 = nodes[e2[1]];
        if (e2[0] - e1[0] < 0.5) continue;
        const P = [[n1.x, n1.z]];
        for (let k = 0; k < R.P.length; k++)
          if (R.S[k] > e1[0] + 0.3 && R.S[k] < e2[0] - 0.3) P.push(R.P[k]);
        P.push([n2.x, n2.z]);
        if (e1[1] === e2[1] && e2[0] - e1[0] < 15) continue;
        const f = mkLane(e1[1], e2[1], P, R.w, R.sp);
        if (!f) continue;
        f.rw = R.rw;
        f.ow = R.ow;
        if (!R.ow) {
          const g = mkLane(e2[1], e1[1], P.slice().reverse(), R.w, R.sp);
          if (g) {
            g.rw = R.rw;
            g.ow = R.ow;
            f.tw = g;
            g.tw = f;
          }
        }
      }
    });

    outL.length = 0;
    nodes.forEach(() => outL.push([]));
    lanes.forEach(L => outL[L.a].push(L));
  };

  const tcache = {},
    LD = {},
    ldAdd = (r, d) => {
      for (const f of r) LD[f.id] = Math.max(0, (LD[f.id] || 0) + d);
    };

  const turn = (e, f) => {
    const key = e.id * 8192 + f.id;
    if (tcache[key]) return tcache[key];
    const A = e.pts[e.pts.length - 1],
      A0 = e.pts[e.pts.length - 2],
      B = f.pts[0],
      B1 = f.pts[1];
    let t0x = A[0] - A0[0],
      t0z = A[1] - A0[1],
      l0 = Math.hypot(t0x, t0z) || 1;
    t0x /= l0;
    t0z /= l0;
    let t1x = B1[0] - B[0],
      t1z = B1[1] - B[1],
      l1 = Math.hypot(t1x, t1z) || 1;
    t1x /= l1;
    t1z /= l1;
    const dist = Math.hypot(B[0] - A[0], B[1] - A[1]),
      uT = t0x * t1x + t0z * t1z < -0.6,
      h = uT ? Math.max(dist * 0.7, 5.5) : Math.max(dist * 0.38, 0.8),
      D = [];
    for (let k = 0; k <= 48; k++) {
      const t = k / 48,
        u = 1 - t,
        c0 = u * u * u,
        c1 = 3 * u * u * t,
        c2 = 3 * u * t * t,
        c3 = t * t * t;
      D.push([
        c0 * A[0] + c1 * (A[0] + t0x * h) + c2 * (B[0] - t1x * h) + c3 * B[0],
        c0 * A[1] + c1 * (A[1] + t0z * h) + c2 * (B[1] - t1z * h) + c3 * B[1]
      ]);
    }
    const S = cum(D),
      T = S[S.length - 1],
      n = Math.max(2, Math.round(T / STEP)),
      r = [],
      R = resample(D, T / n);
    for (let k = 1; k < n; k++) r.push([R[k][0], R[k][1], A[2] + ((B[2] - A[2]) * k) / n]);
    return (tcache[key] = r);
  };

  const nxt = e => {
    const o = outL[e.b].filter(f => f !== e.tw);
    return o.length ? o : e.tw ? [e.tw] : [];
  };

  const route = (e0, D) => {
    const dist = {},
      par = {},
      done = {};
    dist[e0.id] = 0;
    const q = [[0, e0]];
    while (q.length) {
      let bi = 0;
      for (let i = 1; i < q.length; i++) if (q[i][0] < q[bi][0]) bi = i;
      const [d, e] = q.splice(bi, 1)[0];
      if (done[e.id]) continue;
      done[e.id] = 1;
      if (e.b === D && e !== e0) {
        const r = [];
        for (let x = e; x !== e0; x = par[x.id]) r.push(x);
        return r.reverse();
      }
      for (const f of nxt(e)) {
        const nd = d + f.len + (f === e.tw ? 40 : 0) + (f.w === 1.6 ? f.len : 0);
        if (dist[f.id] === undefined || nd < dist[f.id]) {
          dist[f.id] = nd;
          par[f.id] = e;
          q.push([nd, f]);
        }
      }
    }
    return null;
  };

  const plan = v => {
    const e = v.cur;
    if (v.err && v.home) {
      const H = v.home;
      let r = null;
      if (e.b === H.L.a) r = [];
      else if (e !== H.L) r = route(e, H.L.a);
      if (r) {
        r = r.concat([H.L]);
        v.rt = r;
        ldAdd(r, 1);
        return;
      }
    }
    const N = nodes[e.b];
    let ds = [];
    nodes.forEach((n, i) => {
      if (i !== e.b && Math.hypot(n.x - N.x, n.z - N.z) > 130 && outL[i].length) ds.push(i);
    });
    if (!ds.length)
      nodes.forEach((n, i) => {
        if (i !== e.b && outL[i].length) ds.push(i);
      });
    let bestR = null,
      bs = 1e9;
    for (let t = 0; t < 10; t++) {
      const r = route(e, ds[Math.floor(Math.random() * ds.length)]);
      if (!r || !r.length) continue;
      let sc = 0,
        len = 0;
      for (const f of r) {
        sc += (LD[f.id] || 0) * f.len;
        len += f.len;
      }
      sc = sc / len + Math.random() * 0.4;
      if (sc < bs) {
        bs = sc;
        bestR = r;
      }
    }
    if (bestR) {
      v.rt = bestR;
      ldAdd(bestR, 1);
      return;
    }
    const o = nxt(e);
    v.rt = o.length ? [o[Math.floor(Math.random() * o.length)]]: [];
    ldAdd(v.rt, 1);
  };

  const ext = v => {
    while (v.q.length - v.pp < 100) {
      if (!v.rt.length) plan(v);
      if (!v.rt.length) break;
      const f = v.rt.shift();
      ldAdd([f], -1);
      const tp = turn(v.cur, f);
      for (const p of tp) v.q.push([p[0], p[1], p[2], v.cur.b, v.cur.grp]);
      for (const p of f.pts) v.q.push(p);
      v.cur = f;
    }
  };

  const poseAt = (v, pp) => {
    const q = v.q,
      i = Math.floor(pp),
      k = pp - i,
      A = q[i],
      B = q[i + 1],
      C = q[i + 2] || B,
      h0 = Math.atan2(-(B[1] - A[1]), B[0] - A[0]),
      h1 = Math.atan2(-(C[1] - B[1]), C[0] - B[0]);
    return {
      x: A[0] + (B[0] - A[0]) * k,
      y: A[2] + (B[2] - A[2]) * k,
      z: A[1] + (B[1] - A[1]) * k,
      h: h0 + wn(h1 - h0) * k,
      pit: Math.atan2(B[2] - A[2], Math.hypot(B[0] - A[0], B[1] - A[1]) || 1)
    };
  };

  const place = v => {
    const P = poseAt(v, v.pp);
    v.m.position.set(P.x, P.y, P.z);
    v.m.rotation.set(0, P.h, P.pit);
    v.qx = P.x;
    v.qz = P.z;
    v.dx = Math.cos(P.h);
    v.dz = -Math.sin(P.h);
  };

  const placed = [],
    SPN = {};
  const spawn = v => {
    if (v.rt && v.rt.length) ldAdd(v.rt, -1);
    const ok = lanes.filter(L => L.len >= 16),
      tot = ok.reduce((s, L) => s + L.len, 0);
    let L = ok[0],
      i = 0;
    for (let t = 0; t < 80; t++) {
      let bl = null,
        bs = 1e9;
      for (let c = 0; c < 10; c++) {
        let r = Math.random() * tot;
        const cl = ok.find(l => (r -= l.len) <= 0) || ok[0],
          sc = ((SPN[cl.id] || 0) + Math.random() * 0.5) / cl.len;
        if (sc < bs) {
          bs = sc;
          bl = cl;
        }
      }
      L = bl;
      i = Math.floor(Math.random() * (L.len - 10));
      const p = L.pts[i];
      if (
        !placed.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 14) &&
        !veh.some(o => o !== v && o.m && o.qx != null && Math.hypot(o.qx - p[0], o.qz - p[1]) < 14)
      )
        break;
    }
    if (placed.length > 150) placed.splice(0, 100);
    placed.push(L.pts[i]);
    SPN[L.id] = (SPN[L.id] || 0) + 1;
    v.cur = L;
    v.q = L.pts.slice();
    v.pp = i;
    v.rt = [];
    v.rc = null;
    v.res = null;
    v.spd = v.vs * 0.5;
    v.stk = 0;
    v.sf = 1;
    ext(v);
    place(v);
  };

  const drive = v => {
    if (!v.q) return;
    const dt = FD;
    if (v.stk > 15) spawn(v);
    if (v.q.length - v.pp < 100) ext(v);
    const c = Math.floor(v.pp);
    let tgt = v.vs;

    // Leader check
    let lim = 1e9;
    const q = v.q,
      e = Math.min(q.length - 1, c + 32);
    for (const o of veh) {
      if (o === v || !o.rm || o.qx == null) continue;
      const dx = o.qx - v.qx,
        dz = o.qz - v.qz;
      if (dx * dx + dz * dz > 1500 || dx * v.dx + dz * v.dz <= 0.1) continue;
      let bi = c,
        bd = 1e9;
      for (let i = c; i <= e; i++) {
        const a = q[i][0] - o.qx,
          b = q[i][1] - o.qz,
          d2 = a * a + b * b;
        if (d2 < bd) {
          bd = d2;
          bi = i;
        }
      }
      if (Math.sqrt(bd) > v.w + o.w + 0.4) continue;
      const gap = Math.min(bi - v.pp, Math.sqrt(dx * dx + dz * dz)) - (v.r + o.r) - 0.5,
        os = o.spd || 0;
      lim = Math.min(lim, os + Math.max(0, gap - 1), Math.sqrt(18 * Math.max(0, gap - 0.3)) + os * 0.5);
    }
    tgt = Math.min(tgt, lim);

    v.spd = Math.max(0, v.spd + clamp(tgt - v.spd, -12 * dt, 4.5 * dt));
    let np = v.pp + v.spd * dt;
    if (dt > 0 && np > v.pp) {
      const P = poseAt(v, np),
        A = { qx: P.x, qz: P.z, dx: Math.cos(P.h), dz: -Math.sin(P.h), hl: v.r + 0.8, hw: v.w + 0.3 },
        B = { qx: v.qx, qz: v.qz, dx: v.dx, dz: v.dz, hl: v.r + 0.8, hw: v.w + 0.3 };
      for (const o of veh) {
        if (o === v || !o.rm || o.qx == null) continue;
        const dx = o.qx - P.x,
          dz = o.qz - P.z;
        if (dx * dx + dz * dz > 64) continue;
        if (hit(A, o) && !hit(B, o)) {
          np = v.pp;
          v.spd = 0;
          break;
        }
      }
    }
    v.pp = np;
    v.stk = v.spd < 0.15 && dt > 0 ? v.stk + dt : 0;
    if (v.pp > 220) {
      const k = Math.floor(v.pp) - 30;
      v.q.splice(0, k);
      v.pp -= k;
    }
    place(v);
  };

  const step = (T, dt) => {};

  return {
    roads,
    nodes,
    lanes,
    outL,
    RINGS,
    buildGraph,
    spawn,
    drive,
    step,
    nxt,
    route,
    turn,
    L: { t: 'roam', n: 1, sp: 0 }
  };
})();

export function moveCars(T) {
  distStep(T);
  veh.forEach(v => {
    if (v.L && v.L.t === 'roam') RM.drive(v);
  });
}

export function updateTraffic(T) {
  const dt = Math.min(0.1, Math.max(0, T - trLast));
  trLast = T;
  sepUpdate(dt);
  moveCars(T);
}

/* Statues on the roundabout islands */
function initStatues() {
  const GLSL = `
varying vec3 vWP;float stH=0.,stS=1.,PX=1.;
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p,float k){vec3 q=p*k;float a=.5,s=0.,f=1.,t=0.;for(int i=0;i<5;i++){float w=1.-smoothstep(.3,.8,PX*k*f);s+=a*w*n3(q);t+=a*w;q=q*2.03+vec3(1.7,9.2,3.1);a*=.5;f*=2.03;}return mix(.5,s/max(t,.001),clamp(t*4.,0.,1.));}
`;
  const COL = `{PX=length(fwidth(vWP));vec3 p=vWP;vec3 c;float lo=fbm(p,.9),mid=fbm(p,5.),hi=fbm(p,28.),gy=clamp((vWP.y-.3)/6.,0.,1.);
if(TY==0){float w=sin((p.x*1.1+p.y*1.7+p.z*.9)*1.8+lo*7.),v=pow(1.-abs(w),16.)*smoothstep(.2,.6,mid),w2=sin((p.x*.7-p.y*.6+p.z*1.5)*3.1+mid*5.),v2=pow(1.-abs(w2),30.)*.6;
 c=mix(vec3(.94,.92,.88),vec3(.78,.8,.85),lo*.9);c=mix(c,vec3(.42,.45,.52),clamp(v+v2,0.,1.)*.85);c*=.92+.12*hi;stH=.12*hi+.1*mid;stS=1.-.55*v;}
else if(TY==1){float sp=step(.64,hi),sk=step(.68,fbm(p+7.,22.));c=mix(vec3(.3,.3,.32),vec3(.47,.45,.46),mid);c=mix(c,vec3(.8,.7,.68),sp*.55);c=mix(c,vec3(.06),sk*.7);stH=.3*hi+.1*mid;stS=.75;}
else if(TY==2){float vd=smoothstep(.45,.68,lo*.6+mid*.5+.2*(1.-gy));c=mix(vec3(.45,.28,.14)*(.8+.5*hi),vec3(.2,.58,.48)*(.8+.4*mid),vd);stH=.35*mid+.15*hi;stS=mix(1.,.15,vd);}
else if(TY==3){c=vec3(.97,.74,.26)*(.85+.3*hi);stH=.08*hi;}
else if(TY==4){float fl=step(.76,fbm(p,18.));c=mix(vec3(.07,.15,.45)*(.7+.7*lo),vec3(1.,.85,.4),fl*.85);c=mix(c,vec3(.7,.75,.95),smoothstep(.6,.8,mid)*.25);stH=.05*hi;}
else{c=vec3(.75,.1,.08)*(.85+.25*lo);c=mix(c,vec3(.9,.9,.88),step(.8,mid)*.4);stH=.06*hi;}
if(TY<2){float st=fbm(p*vec3(1.,.1,1.),7.);c*=1.-.25*smoothstep(.45,.8,st);float mo=(1.-smoothstep(0.,.9,vWP.y-.3))*smoothstep(.35,.7,mid+lo*.3);c=mix(c,vec3(.25,.33,.14),mo*.55);}
diffuseColor.rgb*=pow(c,vec3(2.2));}`;
  const BMP = `{vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),r1=cross(sy,normal),r2=cross(normal,sx);float d=dot(sx,r1);normal=normalize(abs(d)*normal-sign(d)*(dFdx(stH)*BS*r1+dFdy(stH)*BS*r2));}`;

  const mk = (ty, sp, sh, bs) => {
    const m = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, specular: sp, shininess: sh });
    m.extensions = { derivatives: true };
    m.customProgramCacheKey = () => 'stn' + ty;
    m.onBeforeCompile = s => {
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GLSL + 'const int TY=' + ty + ';const float BS=' + bs + ';')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + COL)
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength*=stS;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + BMP);
    };
    return m;
  };

  const MB = mk(0, 0x777777, 80, '.05'),
    ST = { marble: MB, plin: MB, bronze: MB, gold: MB, blue: MB, red: MB, flame: MB };
  onN(n => MB.color.setHex(n ? 0x6C7680 : 0xFFFFFF));

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lim = (g, m, a, b, r) => {
    const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
      L = d.length(),
      c = add(g, new THREE.CylinderGeometry(r * 0.8, r, L, 10), m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    add(g, new THREE.SphereGeometry(r * 0.85, 10, 8), m, b[0], b[1], b[2]);
    return c;
  };
  const plinth = (g, h) => {
    const P = ST.plin;
    CY(g, 2.8, 2.9, 0.3, P, 0, 0, 0, 48);
    CY(g, 2.3, 2.4, 0.3, P, 0, 0.3, 0, 48);
    BX(g, 2.2, h, 2.2, P, 0, 0.6, 0);
    BX(g, 2.3, 0.08, 2.3, ST.gold, 0, 0.6 + h * 0.12, 0);
    BX(g, 2.3, 0.08, 2.3, ST.gold, 0, 0.6 + h * 0.88, 0);
    BX(g, 2.6, 0.3, 2.6, P, 0, 0.6 + h, 0);
    BX(g, 1, 0.45, 0.05, ST.gold, 0, 0.6 + h * 0.5 - 0.2, 1.11);
    return 0.9 + h;
  };

  function stTech() {
    const g = new THREE.Group(),
      y = plinth(g, 1.6),
      s = new THREE.Group();
    s.position.y = y;
    g.add(s);
    let yy = 0;
    [[1.8, ST.marble], [1.4, ST.bronze], [1, ST.blue], [0.65, ST.gold]].forEach((c, i) => {
      const b = BX(s, c[0], c[0], c[0], c[1], 0, yy, 0);
      b.rotation.y = i * 0.55;
      yy += c[0];
    });
    const r = add(s, new THREE.TorusGeometry(1.6, 0.05, 8, 60), ST.gold, 0, yy - 0.9, 0);
    r.rotation.x = Math.PI / 2 - 0.35;
    add(s, new THREE.SphereGeometry(0.14, 10, 8), ST.gold, 1.6, yy - 0.9, 0);
    return g;
  }

  function stFinance() {
    const g = new THREE.Group(),
      y = plinth(g, 1.6);
    [1.2, 1.9, 2.6, 3.4, 4.3].forEach((h, i) =>
      BX(g, 0.5, h, 0.5, i === 4 ? ST.gold : i % 2 ? ST.bronze : ST.marble, -1 + i * 0.5, y, 0)
    );
    lim(g, ST.gold, [-1.15, y + 1.7, 0.4], [1.15, y + 4.5, 0.4], 0.05);
    const k = add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.12, 32), ST.gold, 1, y + 4.9, 0);
    k.rotation.x = Math.PI / 2;
    return g;
  }

  function stMarketing() {
    const g = new THREE.Group(),
      y = plinth(g, 1.4),
      m = new THREE.Group();
    m.position.y = y + 2.8;
    m.rotation.z = -1;
    g.add(m);
    CY(g, 0.15, 0.28, 2.3, ST.bronze, 0, y, 0, 12);
    add(g, new THREE.SphereGeometry(0.3, 12, 10), ST.bronze, 0, y + 2.4, 0);
    add(m, new THREE.CylinderGeometry(1, 0.32, 2.2, 32), ST.gold, 0, 0, 0);
    return g;
  }

  function stGear() {
    const g = new THREE.Group(),
      y = plinth(g, 1.6);
    const gear = (R, n, mat, x, yy) => {
      const q = new THREE.Group();
      q.position.set(x, yy, 0);
      g.add(q);
      const b = add(q, new THREE.CylinderGeometry(R, R, 0.35, 36), mat, 0, 0, 0);
      b.rotation.x = Math.PI / 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.2832,
          t = add(q, new THREE.BoxGeometry(0.3, 0.4, 0.35), mat, Math.cos(a) * (R + 0.12), Math.sin(a) * (R + 0.12), 0);
        t.rotation.z = a - Math.PI / 2;
      }
      return [q, b];
    };
    gear(1.3, 14, ST.bronze, -0.9, y + 2.5);
    gear(0.95, 10, ST.gold, 1.3, y + 3.6);
    BX(g, 0.3, 2.5, 0.3, ST.plin, -0.9, y, -0.4);
    BX(g, 0.3, 3.6, 0.3, ST.plin, 1.3, y, -0.4);
    return g;
  }

  function stRocket() {
    const g = new THREE.Group(),
      y = plinth(g, 1.5),
      b = y + 0.9;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832,
        r = 0.9 + (i % 2) * 0.35;
      add(g, new THREE.SphereGeometry(0.45 + (i % 3) * 0.12, 14, 10), ST.marble, Math.cos(a) * r, y + 0.3, Math.sin(a) * r);
    }
    return g;
  }

  function stBulb() {
    const g = new THREE.Group(),
      y = plinth(g, 1.5);
    CY(g, 0.5, 0.5, 0.9, ST.gold, 0, y, 0, 16);
    add(g, new THREE.SphereGeometry(1, 28, 20), MB, 0, y + 2.6, 0).scale.set(1, 1.15, 1);
    return g;
  }

  const KINDS = [stTech, stFinance, stMarketing, stGear, stRocket, stBulb];
  RM.RINGS.forEach((r, i) => {
    const g = KINDS[i % KINDS.length]();
    g.position.set(r.x, 0.3, r.z);
    g.rotation.y = i * 1.1;
    glow(warmG, 0, 1.6, 0, 10, g);
    scene.add(g);
  });
}

export function initTraffic() {
  RM.buildGraph();
  initStatues();

  // Spawn roaming fleet
  const FLEET = [
    ['police', 2],
    ['ambulance', 1],
    ['fire', 1],
    ['sbus', 1]
  ];
  const SPD = {
    sedan: [7.5, 9.5],
    taxi: [8, 10],
    van: [7, 9],
    bus: [5.5, 6.8],
    truck: [5.5, 6.8],
    ambulance: [9.5, 11.5],
    fire: [9, 11],
    police: [9, 11.5],
    sbus: [5.5, 6.5]
  };

  let k = 0;
  FLEET.forEach(([kd, n]) => {
    for (let i = 0; i < n; i++, k++) {
      let m =
        kd === 'fire'
          ? buildFire()
          : kd === 'sbus'
          ? buildSBus()
          : kd === 'police'
          ? buildPolice()
          : kd === 'ambulance'
          ? buildAmb()
          : buildCar(CC[(k * 3) % CC.length]);
      const s = SPD[kd] || [7, 9];
      const v = {
        L: RM.L,
        i: k,
        kind: kd,
        m: m,
        rm: 1,
        vs: s[0] + Math.random() * (s[1] - s[0])
      };
      RM.spawn(v);
      veh.push(v);
    }
  });

  // Additional roaming cars
  for (let i = 0; i < 8; i++) {
    const m = SUPER.make(SUPER_PAL[i % SUPER_PAL.length], i % 2 === 0, i % 3 === 1 ? 1 : 0);
    scene.add(m);
    const v = {
      L: RM.L,
      i: k++,
      kind: 'sedan',
      m: m,
      rm: 1,
      vs: 7 + Math.random() * 2.5
    };
    RM.spawn(v);
    veh.push(v);
  }

  // Setup collision properties
  const KR = {
    sedan: [2.15, 0.95],
    van: [2.2, 0.9],
    ambulance: [2.2, 0.9],
    bus: [3.4, 1.05],
    truck: [2.95, 1.05],
    fire: [3.7, 1.15],
    sbus: [3.8, 1.05],
    police: [1.7, 0.9]
  };

  veh.forEach(v => {
    const k_dim = KR[v.kind] || [1.7, 0.9];
    Object.assign(v, { r: k_dim[0], w: k_dim[1], g: 5.5, vh: 1, id: AG.length, sf: 1, te: 0 });
    if (!v.rm) AG.push(v);
    glow(whtG, ({ bus: 4, truck: 3.4 })[v.kind] || 2.3, 0.7, 0, 3.4, v.m);
    glow(redG, -2.1, 0.7, 0, 1.8, v.m);
  });

  // Marine fleet collision proxy
  fleet.forEach(b => {
    Object.assign(b, { r: 5, w: 2.5, g: 4, vh: 1, id: AG.length, sf: 1, bt: 1 });
    AG.push(b);
  });
}
