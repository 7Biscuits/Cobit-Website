import { scene, sun, amb, st, setN } from '../core/scene.js';

export function initClock() {
  const CYC = 180;
  const sm = (a, b, x) => {
    x = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  const dayC = new THREE.Color(),
    nightC = new THREE.Color(0x0C1826),
    duskC = new THREE.Color(0xF3A56F),
    tmp = new THREE.Color();

  const sunI = document.getElementById('dnSunI'),
    moonI = document.getElementById('dnMoonI'),
    hh = document.getElementById('dnH'),
    mm = document.getElementById('dnM'),
    arc = document.getElementById('dnArc');

  let p = 0.1,
    last = performance.now(),
    lastMin = -1;

  return function updateClock(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    p = (p + dt / CYC) % 1;
    const pp = p < 0.5 ? p : p - 1,
      b = sm(-0.02, 0.08, pp) - sm(0.31, 0.41, pp),
      warm = 1 - Math.abs(2 * b - 1);
    const wantN = b < (st.n ? 0.55 : 0.45);
    if (wantN !== st.n) setN(wantN);

    dayC.setHex(st.w === 2 ? 0x9FB4C4 : 0xBEE4FB);
    tmp.copy(nightC).lerp(dayC, b).lerp(duskC, warm * warm * 0.35);
    scene.background.copy(tmp);
    scene.fog.color.copy(tmp);

    sun.intensity = 0.15 + 0.75 * b;
    amb.intensity = 0.35 + 0.4 * b;
    sun.color.setRGB(1, 1 - 0.28 * warm, 1 - 0.5 * warm);

    const h = p >= 0.03 && p < 0.36 ? 6 + (12 * (p - 0.03)) / 0.33 : (18 + (12 * (((p - 0.36 + 1) % 1) / 0.67))) % 24,
      m = Math.floor(h * 60);

    if (m !== lastMin && hh && mm && arc && sunI && moonI) {
      lastMin = m;
      hh.textContent = String(Math.floor(h)).padStart(2, '0');
      mm.textContent = String(m % 60).padStart(2, '0');
      const dy = b > 0.5;
      sunI.setAttribute('opacity', dy ? 1 : 0);
      moonI.setAttribute('opacity', dy ? 0 : 1);
      arc.setAttribute('stroke-dashoffset', (251.33 * (1 - h / 24)).toFixed(1));
    }
  };
}
