import { $ } from '../utils/math.js';

export const ren = new THREE.WebGLRenderer({
  canvas: $('#c'),
  antialias: true
});
ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
ren.shadowMap.enabled = true;
ren.outputEncoding = THREE.sRGBEncoding;

export const scene = new THREE.Scene();
window.__SCENE = scene;
export const cam = new THREE.PerspectiveCamera(45, 1, 3, 1000);

scene.fog = new THREE.Fog(0xBEE4FB, 180, 520);
scene.background = new THREE.Color(0xBEE4FB);

export const amb = new THREE.AmbientLight(0xffffff, 0.75);
export const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(60, 110, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -140,
  right: 140,
  top: 140,
  bottom: -140,
  near: 1,
  far: 300
});
sun.shadow.bias = -0.001;
scene.add(amb, sun);

export const st = { n: false, w: 0 };
export const night = [];
export const onN = f => {
  night.push(f);
};

export function atmos() {
  scene.background.setHex(st.n ? 0x0C1826 : st.w === 2 ? 0x9FB4C4 : 0xBEE4FB);
  scene.fog.color.copy(scene.background);
  const f = [
    [180, 520],
    [110, 380],
    [50, 220]
  ][st.w];
  scene.fog.near = f[0];
  scene.fog.far = f[1];
}

export function setN(n) {
  st.n = n;
  night.forEach(f => f(n));
  document.documentElement.dataset.mode = n ? 'night' : 'day';
  sun.intensity = n ? 0.15 : 0.9;
  amb.intensity = n ? 0.35 : 0.75;
  atmos();
}

export function setW(w, cg, rain) {
  st.w = w;
  if (cg) cg.visible = false;
  if (rain) rain.visible = w === 2;
  atmos();
}

export const add = (p, g, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
};

export function resize() {
  ren.setSize(window.innerWidth, window.innerHeight);
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
