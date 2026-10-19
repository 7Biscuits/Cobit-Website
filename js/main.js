import { scene, cam, ren, resize, setN, setW } from './core/scene.js';
import { flags } from './core/materials.js';
import { initEnvironment } from './world/environment.js';
import { initPlaza } from './world/plaza.js';
import { initLandmarks } from './world/landmarks.js';
import { initPort, updatePort } from './entities/port.js';
import { initAirport, movePlanes } from './entities/airport.js';
import { initCity } from './world/city.js';
import { initTraffic, updateTraffic } from './entities/traffic.js';
import { initEstate, updateEstate } from './world/estate.js';
import { initVegetation, initAirportVegetation, initOutsideVegetation } from './world/vegetation.js';
import { initHelicopter, moveHeli } from './entities/helicopter.js';
import { camUpd, initCameraControls } from './ui/camera.js';
import { initClock } from './ui/clock.js';
import { initModal } from './ui/modal.js';
import { initProjects } from './projects.js';

function init() {
  window.addEventListener('resize', resize);
  resize();
  setN(false);
  setW(0);

  // 1. Core world environments
  initEnvironment();
  initPlaza();
  initLandmarks();

  // 2. Transport infrastructure
  initPort();
  initAirport();

  // 3. City blocks, roads, civic centers, residential areas
  initCity();
  initTraffic();

  // 4. Hillside estate & luxury mansion
  initEstate();

  // 5. Instanced vegetation
  initVegetation();
  setTimeout(initAirportVegetation, 1200);
  setTimeout(initOutsideVegetation, 2000);

  // 6. Air mobility (helicopter)
  initHelicopter();

  // 7. Interactive UI, modals, clock, and camera
  const handlePick = initModal();
  initCameraControls(handlePick);
  const updateClock = initClock();
  initProjects();

  // Main coordinated animation loop
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    const T = now / 1000;

    // Wind flags & windsocks
    flags.forEach((f, i) => {
      f.rotation.y = Math.sin(T * 2.2 + i) * 0.15;
    });

    // Central 3D CoBit Logo
    if (window.__LG) window.__LG(T);

    // Entity updates
    updatePort(T);
    movePlanes(T);
    updateTraffic(T);
    updateEstate(dt);
    if (moveHeli) moveHeli(T, dt);

    // Dynamic day-night & clock
    updateClock(now);

    // Camera & render
    camUpd(dt);
    ren.render(scene, cam);
  }

  requestAnimationFrame(tick);
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
