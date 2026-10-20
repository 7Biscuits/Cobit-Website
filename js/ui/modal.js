import { cam } from '../core/scene.js';
import { ROOMS } from '../config.js';
import { pickables } from '../world/landmarks.js';
import { flyTo, V_PRESETS, tg2 } from './camera.js';
import { CX, CZ, TH, HH, Gr } from '../world/estate.js';

export function initModal() {
  const cv = document.getElementById('c'),
    ray = new THREE.Raycaster(),
    tip = document.getElementById('tip'),
    room = document.getElementById('room'),
    nav = document.getElementById('nav'),
    site = document.getElementById('site'),
    adv = document.getElementById('adv'),
    SEC = {};

  if (site) {
    site.querySelectorAll('.sec, .ft').forEach(e => {
      SEC[e.dataset.id] = e;
    });
  }

  ROOMS.home = ['CoBit'];
  ROOMS.how = ['How it works'];
  ROOMS.team = ['Our Team'];
  ROOMS.projects = ['Our Projects'];

  function roomAt(e) {
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    ray.setFromCamera(
      {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -((e.clientY - r.top) / r.height) * 2 + 1
      },
      cam
    );
    const h = ray.intersectObjects(pickables, true);
    return h.length ? h[0].object.userData.room : null;
  }

  function goSec(id, smooth) {
    if (!site) return;
    const e = SEC[id] || SEC.home;
    const sh = site.querySelector('.sh');
    const h = sh ? sh.offsetHeight : 0;
    site.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    site.scrollTop =
      id === 'home' || !SEC[id]
        ? 0
        : e.getBoundingClientRect().top - site.getBoundingClientRect().top + site.scrollTop - h + 1;
    if (!smooth) setTimeout(() => (site.style.scrollBehavior = ''), 0);
  }

  function spy() {
    if (!site) return;
    const sh = site.querySelector('.sh');
    const h = (sh ? sh.offsetHeight : 0) + 30;
    let cur = 'home';
    for (const k in SEC) {
      if (SEC[k].getBoundingClientRect().top - site.getBoundingClientRect().top <= h) cur = k;
    }
    if (site.scrollTop + site.clientHeight >= site.scrollHeight - 4) cur = 'contact';
    site.querySelectorAll('.sn a').forEach(a => a.classList.toggle('on', a.dataset.s === cur));
  }

  // Hamburger navbar controls for the scrollable website modal
  const siteNav = document.getElementById('siteNav');
  const siteMenuBtn = document.getElementById('siteMenuBtn');
  const siteNavBackdrop = document.getElementById('siteNavBackdrop');

  function closeSiteMenu() {
    if (siteNav) siteNav.classList.remove('open');
    if (siteMenuBtn) {
      siteMenuBtn.classList.remove('open');
      siteMenuBtn.setAttribute('aria-expanded', 'false');
    }
    if (siteNavBackdrop) siteNavBackdrop.classList.remove('open');
  }

  function toggleSiteMenu() {
    if (!siteNav || !siteMenuBtn) return;
    const willOpen = !siteNav.classList.contains('open');
    siteNav.classList.toggle('open', willOpen);
    siteMenuBtn.classList.toggle('open', willOpen);
    siteMenuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (siteNavBackdrop) siteNavBackdrop.classList.toggle('open', willOpen);
  }

  if (siteMenuBtn) {
    siteMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleSiteMenu();
    });
  }

  if (siteNavBackdrop) {
    siteNavBackdrop.addEventListener('click', closeSiteMenu);
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && siteNav && siteNav.classList.contains('open')) {
      closeSiteMenu();
    }
  });

  if (site) {
    site.addEventListener('scroll', spy);
    site.querySelectorAll('.sn a').forEach(a => {
      a.onclick = () => {
        closeSiteMenu();
        goSec(a.dataset.s, true);
      };
    });
    site.querySelectorAll('[data-go]').forEach(b => {
      b.onclick = () => {
        closeSiteMenu();
        goSec(b.dataset.go, true);
      };
    });
  }

  exportFunctionOpenClose(room, nav, site, goSec, spy, closeSiteMenu);

  // View buttons
  const bPort = document.getElementById('bPort');
  if (bPort)
    bPort.addEventListener('click', () => {
      if (adv) adv.hidden = true;
      tg2.y = 4;
      flyTo(V_PRESETS.port);
    });

  const bAir = document.getElementById('bAir');
  if (bAir)
    bAir.addEventListener('click', () => {
      if (adv) adv.hidden = true;
      tg2.y = 4;
      flyTo(V_PRESETS.air);
    });

  const bCity = document.getElementById('bCity');
  if (bCity)
    bCity.addEventListener('click', () => {
      if (adv) adv.hidden = true;
      tg2.y = 4;
      flyTo(V_PRESETS.city);
    });

  const bMan = document.getElementById('bMan');
  if (bMan)
    bMan.addEventListener('click', () => {
      if (adv) adv.hidden = false;
      tg2.y = HH;
      flyTo({ th: TH, ph: 1.0, rad: 115, x: CX, z: CZ });
    });

  if (adv) {
    const spots = {
      heli: [27, 25, 32, 0.95],
      pool: [-12, 13, 34, 0.9],
      garage: [23, -1, 30, 0.8],
      gate: [0, 36, 38, 0.9],
      court: [-31, -6, 44, 1.0],
      solar: [2, -9, 40, 0.8],
      fount: [0.8, 17.5, 28, 0.9],
      house: [0, -6, 70, 0.9]
    };
    adv.querySelectorAll('li').forEach(li => {
      li.onclick = () => {
        const s = spots[li.dataset.k];
        if (!s || !Gr) return;
        const w = Gr.localToWorld(new THREE.Vector3(s[0], HH, s[1]));
        tg2.y = HH;
        flyTo({ th: TH, ph: s[3], rad: s[2], x: w.x, z: w.z });
      };
    });
    const advX = adv.querySelector('.x');
    if (advX)
      advX.onclick = () => {
        adv.hidden = true;
      };
  }

  // Pointer picking callback
  return function handlePick(e, isClick) {
    const r = roomAt(e);
    if (isClick) {
      if (r) openRoom(r);
    } else {
      const nw = performance.now();
      if (nw - (window.__hv || 0) < 60) return;
      window.__hv = nw;
      if (r && ROOMS[r]) {
        tip.textContent = ROOMS[r][0];
        tip.style.left = e.clientX + 'px';
        tip.style.top = e.clientY + 'px';
        tip.classList.add('show');
        if (cv) cv.style.cursor = 'pointer';
      } else {
        tip.classList.remove('show');
        if (cv) cv.style.cursor = 'grab';
      }
    }
  };
}

export var openRoom = () => {};
export var closeRoom = () => {};

function exportFunctionOpenClose(room, nav, site, goSec, spy, closeSiteMenu) {
  openRoom = function(id) {
    if (!room) return;
    if (typeof closeSiteMenu === 'function') closeSiteMenu();
    if (!ROOMS[id]) id = 'home';
    room.classList.add('open');
    document.body.classList.add('open');
    if (nav) nav.classList.remove('open');
    goSec(id, false);
    spy();
    if (site) site.focus({ preventScroll: true });
  };

  closeRoom = function() {
    if (!room) return;
    if (typeof closeSiteMenu === 'function') closeSiteMenu();
    room.classList.remove('open');
    document.body.classList.remove('open');
  };

  const back = document.getElementById('back');
  if (back) back.onclick = closeRoom;
  if (room) {
    room.addEventListener('click', e => {
      if (e.target === room) closeRoom();
    });
  }
  const menu = document.getElementById('menu');
  if (menu && nav) {
    menu.onclick = () => nav.classList.toggle('open');
  }
  document.querySelectorAll('.links button').forEach(b => (b.onclick = () => openRoom(b.dataset.r)));

  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      const siteNav = document.getElementById('siteNav');
      if (siteNav && siteNav.classList.contains('open')) {
        if (typeof closeSiteMenu === 'function') closeSiteMenu();
        return;
      }
      closeRoom();
    }
  });
}
