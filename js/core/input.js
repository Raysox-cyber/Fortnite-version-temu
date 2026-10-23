// ============================================================
//  Entrées clavier / souris  (ZQSD = codes physiques KeyW/A/S/D)
// ============================================================
(function () {
  const I = {
    keys: {},          // par e.code
    labels: {},        // par e.key (minuscule)
    pressed: {},       // fronts montants cette frame (code et 'k:'+label)
    mouse: { dx: 0, dy: 0, left: false, right: false, middle: false, leftPressed: false, rightPressed: false, leftReleased: false, rightReleased: false, wheel: 0, x: 0, y: 0 },
    locked: false,
    enabled: true,
    listeners: [],
  };
  G.Input = I;

  const MOVE_CODES = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1 };

  I.isDown = (code) => !!I.keys[code];
  I.wasPressed = (code) => !!I.pressed[code];
  // Action liée à une lettre affichée (AZERTY) : on ignore si la touche est aussi une touche de déplacement
  I.labelPressed = (letter) => !!I.pressed['k:' + letter];
  I.labelDown = (letter) => !!I.labels[letter];

  I.forward = () => (I.keys.KeyW || I.keys.ArrowUp ? 1 : 0) - (I.keys.KeyS || I.keys.ArrowDown ? 1 : 0);
  I.strafe = () => (I.keys.KeyD || I.keys.ArrowRight ? 1 : 0) - (I.keys.KeyA || I.keys.ArrowLeft ? 1 : 0);

  I.onKey = (fn) => I.listeners.push(fn);

  window.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('F') && e.code.length <= 3 || e.code === 'AltLeft') {
      if (!(e.code === 'F5' || e.code === 'F12' || e.code === 'F11')) e.preventDefault();
    }
    if (e.ctrlKey && (e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyD')) e.preventDefault();
    if (!I.keys[e.code]) {
      I.pressed[e.code] = true;
      if (!MOVE_CODES[e.code]) I.pressed['k:' + k] = true;
    }
    I.keys[e.code] = true;
    if (!MOVE_CODES[e.code]) I.labels[k] = true;
    for (const fn of I.listeners) fn(e, true);
  });
  window.addEventListener('keyup', (e) => {
    const k = (e.key || '').toLowerCase();
    I.keys[e.code] = false;
    I.labels[k] = false;
    for (const fn of I.listeners) fn(e, false);
  });
  window.addEventListener('blur', () => { I.keys = {}; I.labels = {}; I.mouse.left = I.mouse.right = false; });

  window.addEventListener('mousemove', (e) => {
    I.mouse.x = e.clientX; I.mouse.y = e.clientY;
    if (I.locked) {
      // limite les sauts parasites de certains navigateurs
      const mx = U_clamp(e.movementX, -250, 250), my = U_clamp(e.movementY, -250, 250);
      I.mouse.dx += mx; I.mouse.dy += my;
    }
  });
  function U_clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { I.mouse.left = true; I.mouse.leftPressed = true; }
    if (e.button === 2) { I.mouse.right = true; I.mouse.rightPressed = true; }
    if (e.button === 1) { I.mouse.middle = true; I.mouse.middlePressed = true; e.preventDefault(); }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { I.mouse.left = false; I.mouse.leftReleased = true; }
    if (e.button === 2) { I.mouse.right = false; I.mouse.rightReleased = true; }
    if (e.button === 1) I.mouse.middle = false;
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('wheel', (e) => { I.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });

  document.addEventListener('pointerlockchange', () => {
    I.locked = document.pointerLockElement != null;
    if (G.Game && G.Game.onPointerLockChange) G.Game.onPointerLockChange(I.locked);
  });

  I.requestLock = () => {
    const c = document.getElementById('game-canvas');
    if (c && !I.locked) {
      try {
        const p = c.requestPointerLock({ unadjustedMovement: false });
        if (p && p.catch) p.catch(() => { try { c.requestPointerLock(); } catch (e) {} });
      } catch (e) { try { c.requestPointerLock(); } catch (e2) {} }
    }
  };
  I.exitLock = () => { if (document.pointerLockElement) document.exitPointerLock(); };

  // Appelé à la fin de chaque frame
  I.endFrame = () => {
    I.pressed = {};
    I.mouse.dx = 0; I.mouse.dy = 0; I.mouse.wheel = 0;
    I.mouse.leftPressed = I.mouse.rightPressed = I.mouse.middlePressed = false;
    I.mouse.leftReleased = I.mouse.rightReleased = false;
  };
})();
