// Unified input: keyboard + mouse-look + virtual joystick + jump button.
// Returns a small read-only API the game loop polls each frame.

const keys = new Set();
const move = { x: 0, y: 0 };           // -1..1
const look = { x: 0, y: 0 };           // mouse delta accumulated per frame
let jumpQueued = false;
let pointerLocked = false;

export function initInput(canvas) {
  // --- Keyboard ---
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'Space') {
      jumpQueued = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // --- Mouse look (desktop) ---
  canvas.addEventListener('click', () => {
    if (!pointerLocked && !isTouchDevice()) canvas.requestPointerLock?.();
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  window.addEventListener('mousemove', (e) => {
    if (!pointerLocked) return;
    look.x += e.movementX;
    look.y += e.movementY;
  });

  // --- Touch joystick + jump ---
  if (isTouchDevice()) {
    document.getElementById('touch-controls')?.classList.remove('hidden');
    setupJoystick();
    setupJumpButton();
    setupTouchLook(canvas);
  }
}

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function setupJoystick() {
  const stick = document.getElementById('joystick');
  const thumb = document.getElementById('joystick-thumb');
  if (!stick || !thumb) return;
  let active = null;
  const radius = 56;

  stick.addEventListener('pointerdown', (e) => {
    active = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    update(e);
  });
  stick.addEventListener('pointermove', (e) => {
    if (active !== e.pointerId) return;
    update(e);
  });
  const release = (e) => {
    if (active !== e.pointerId) return;
    active = null;
    move.x = 0; move.y = 0;
    thumb.style.transform = 'translate(-50%, -50%)';
  };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);

  function update(e) {
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const max = rect.width / 2 - 10;
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    move.x = dx / max;
    move.y = dy / max;
  }
}

function setupJumpButton() {
  const btn = document.getElementById('jump-button');
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    jumpQueued = true;
  });
}

function setupTouchLook(canvas) {
  // Right-half drag rotates camera.
  let active = null;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    if (e.clientX < window.innerWidth / 2) return;
    active = e.pointerId;
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (active !== e.pointerId) return;
    look.x += (e.clientX - lastX) * 1.5;
    look.y += (e.clientY - lastY) * 1.5;
    lastX = e.clientX; lastY = e.clientY;
  });
  const end = (e) => { if (active === e.pointerId) active = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

export function readInput() {
  // Keyboard contributes to the same move vector as joystick.
  let kx = 0, ky = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) ky -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) ky += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
  const len = Math.hypot(kx, ky);
  if (len > 1) { kx /= len; ky /= len; }

  // Combine: keyboard takes priority if pressed, else joystick.
  const mx = kx !== 0 || ky !== 0 ? kx : move.x;
  const my = kx !== 0 || ky !== 0 ? ky : move.y;

  const lx = look.x, ly = look.y;
  look.x = 0; look.y = 0;

  const jump = jumpQueued;
  jumpQueued = false;

  return { moveX: mx, moveY: my, lookX: lx, lookY: ly, jump };
}
