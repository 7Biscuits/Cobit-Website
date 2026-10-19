import { cam, sun, scene } from '../core/scene.js';
import { clamp, lerp } from '../utils/math.js';
import { CX, CZ, TH, HH } from '../world/estate.js';

export let th = -0.6,
  ph = 1.0,
  rad = 130;
export const tg2 = { x: 0, y: 4, z: 0 };
let fly = null;

export const V_PRESETS = {
  city: { th: -0.6, ph: 1.0, rad: 130, x: 0, z: 0 },
  port: { th: -0.5, ph: 1.0, rad: 125, x: -108, z: -150 },
  air: { th: -0.25, ph: 1.0, rad: 175, x: 95, z: -305 }
};

const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function flyTo(v) {
  fly = {
    t: 0,
    f: { th, ph, rad, x: tg2.x, z: tg2.z },
    to: v
  };
}

const mv = { f: 0, b: 0, l: 0, r: 0 };

export function camUpd(dt) {
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / 1.3);
    const u = ease(fly.t);
    th = lerp(fly.f.th, fly.to.th, u);
    ph = lerp(fly.f.ph, fly.to.ph, u);
    rad = lerp(fly.f.rad, fly.to.rad, u);
    tg2.x = lerp(fly.f.x, fly.to.x, u);
    tg2.z = lerp(fly.f.z, fly.to.z, u);
    if (fly.t >= 1) fly = null;
  } else if (mv.f || mv.b || mv.l || mv.r) {
    const s = rad * 0.6 * dt,
      fx = Math.sin(th),
      fz = Math.cos(th),
      rx = Math.cos(th),
      rz = -Math.sin(th);
    let dx = 0,
      dz = 0;
    if (mv.f) {
      dx -= fx;
      dz -= fz;
    }
    if (mv.b) {
      dx += fx;
      dz += fz;
    }
    if (mv.r) {
      dx += rx;
      dz += rz;
    }
    if (mv.l) {
      dx -= rx;
      dz -= rz;
    }
    const l = Math.hypot(dx, dz) || 1;
    tg2.x += (dx / l) * s;
    tg2.z += (dz / l) * s;
  }
  tg2.x = clamp(tg2.x, -520, 520);
  tg2.z = clamp(tg2.z, -470, 400);

  cam.position.set(
    tg2.x + rad * Math.sin(ph) * Math.sin(th),
    tg2.y + rad * Math.cos(ph),
    tg2.z + rad * Math.sin(ph) * Math.cos(th)
  );
  cam.lookAt(tg2.x, tg2.y, tg2.z);

  sun.position.set(tg2.x + 60, 110, tg2.z + 40);
  sun.target.position.set(tg2.x, 0, tg2.z);
  sun.target.updateMatrixWorld();
}

export function initCameraControls(onPick) {
  scene.add(sun.target);

  const cv = document.getElementById('c');
  if (!cv) return;

  const ptr = new Map();
  let pinch = null,
    moved = false,
    lx = 0,
    ly = 0;

  cv.addEventListener('pointerdown', e => {
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1) {
      moved = false;
      lx = e.clientX;
      ly = e.clientY;
      fly = null;
    }
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) {
      if (e.pointerType !== 'touch' && onPick) {
        onPick(e, false);
      }
      return;
    }
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size >= 2) {
      const p = [...ptr.values()],
        d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinch != null) rad = clamp(rad - (d - pinch) * 0.25, 25, 300);
      pinch = d;
      return;
    }
    pinch = null;
    const dx = e.clientX - lx,
      dy = e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    th -= dx * 0.0055;
    ph = clamp(ph - dy * 0.0055, 0.3, 1.5);
    fly = null;
  });

  const end = e => {
    ptr.delete(e.pointerId);
    if (ptr.size < 2) pinch = null;
    if (!ptr.size && !moved && onPick) {
      onPick(e, true);
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  cv.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      rad = clamp(rad + e.deltaY * 0.12, 25, 300);
      fly = null;
    },
    { passive: false }
  );

  const KD = {
    KeyW: 'f',
    ArrowUp: 'f',
    KeyS: 'b',
    ArrowDown: 'b',
    KeyA: 'l',
    ArrowLeft: 'l',
    KeyD: 'r',
    ArrowRight: 'r'
  };

  window.addEventListener('keydown', e => {
    if (KD[e.code] && !document.body.classList.contains('open')) {
      mv[KD[e.code]] = 1;
      fly = null;
    }
  });

  window.addEventListener('keyup', e => {
    if (KD[e.code]) mv[KD[e.code]] = 0;
  });

  document.querySelectorAll('.pad button').forEach(b => {
    const d = b.dataset.d;
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      mv[d] = 1;
      fly = null;
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(v =>
      b.addEventListener(v, () => (mv[d] = 0))
    );
  });
}
