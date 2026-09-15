// ─────────────────────────────────────────
//  PLAYER
//  Joystick-driven first-person camera
//  Wall collision via roomBounds from room.js
// ─────────────────────────────────────────

const MOVE_SPEED  = 4.5;   // units per second
const EYE_HEIGHT  = 1.65;  // camera Y, fixed
const JOYSTICK_R  = 60;    // max knob travel in px (matches CSS base radius/2)

export function initPlayer(camera, domElement) {

  // ── Joystick state ──
  const joystick = {
    active:    false,
    touchId:   null,
    baseX:     0,
    baseY:     0,
    dx:        0,   // -1 … 1
    dy:        0,   // -1 … 1
  };

  // ── Look / yaw state (drag on canvas to look) ──
  const look = {
    active:  false,
    touchId: null,
    lastX:   0,
    yaw:     0,     // radians, horizontal only (no vertical tilt — keeps it comfy)
  };

  // ── DOM refs ──
  const joystickZone = document.getElementById('joystick-zone');
  const joystickBase = document.getElementById('joystick-base');
  const joystickKnob = document.getElementById('joystick-knob');

  // Joystick base center in screen coords
  function getBaseCenter() {
    const rect = joystickBase.getBoundingClientRect();
    return {
      x: rect.left + rect.width  / 2,
      y: rect.top  + rect.height / 2,
    };
  }


  // ── Touch handlers for joystick zone ──
  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystick.active) return;

    const t = e.changedTouches[0];
    joystick.active  = true;
    joystick.touchId = t.identifier;

    const c = getBaseCenter();
    joystick.baseX = c.x;
    joystick.baseY = c.y;
  }, { passive: false });

  joystickZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joystick.touchId) continue;

      const rawDx = t.clientX - joystick.baseX;
      const rawDy = t.clientY - joystick.baseY;
      const dist  = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const clamp = Math.min(dist, JOYSTICK_R);
      const angle = Math.atan2(rawDy, rawDx);

      joystick.dx = (clamp / JOYSTICK_R) * Math.cos(angle);
      joystick.dy = (clamp / JOYSTICK_R) * Math.sin(angle);

      // Move knob visually
      const knobX = Math.cos(angle) * clamp;
      const knobY = Math.sin(angle) * clamp;
      joystickKnob.style.transform =
        `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    }
  }, { passive: false });

  joystickZone.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joystick.touchId) continue;
      joystick.active  = false;
      joystick.touchId = null;
      joystick.dx      = 0;
      joystick.dy      = 0;
      joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
  });

  joystickZone.addEventListener('touchcancel', (e) => {
    joystick.active  = false;
    joystick.touchId = null;
    joystick.dx      = 0;
    joystick.dy      = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
  });


  // ── Touch handlers on canvas for look/yaw ──
  domElement.addEventListener('touchstart', (e) => {
    // Only grab touches that are NOT on the joystick zone
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.touchId) continue;
      if (!look.active) {
        look.active  = true;
        look.touchId = t.identifier;
        look.lastX   = t.clientX;
      }
    }
  }, { passive: true });

  domElement.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== look.touchId) continue;
      const dx    = t.clientX - look.lastX;
      look.yaw   -= dx * 0.004;   // sensitivity
      look.lastX  = t.clientX;
    }
  }, { passive: true });

  domElement.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === look.touchId) {
        look.active  = false;
        look.touchId = null;
      }
    }
  });


  // ── Keyboard fallback (desktop testing) ──
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.code] = true;  });
  window.addEventListener('keyup',   (e) => { keys[e.code] = false; });


  // ── Room bounds (set by ui.js once room is loaded) ──
  // Defaults to a large open space until room.js bounds are passed in
  let bounds = [
    { minX: -4.7, maxX: 4.7, minZ: -71, maxZ: 11 },
  ];

  function setBounds(roomBounds) {
    bounds = roomBounds;
  }

  // Find which bound set the player is currently in (or closest to)
  function getActiveBound(pos) {
    for (const b of bounds) {
      if (pos.z >= b.minZ && pos.z <= b.maxZ) return b;
    }
    return bounds[0];
  }


  // ── Update — called every frame from main.js ──
  function update(delta) {
    // --- Keyboard input (desktop testing) ---
    if (keys['ArrowLeft']  || keys['KeyA']) look.yaw += delta * 1.4;
    if (keys['ArrowRight'] || keys['KeyD']) look.yaw -= delta * 1.4;

    // Forward/back from joystick Y, strafe from joystick X
    let moveX = joystick.dx;
    let moveZ = joystick.dy;

    // Keyboard override
    if (keys['ArrowUp']   || keys['KeyW']) moveZ = -1;
    if (keys['ArrowDown'] || keys['KeyS']) moveZ =  1;

    if (Math.abs(moveX) < 0.01 && Math.abs(moveZ) < 0.01) {
      camera.rotation.set(0, look.yaw, 0, 'YXZ');
      return;
    }

    // Rotate movement vector by yaw
    const sin = Math.sin(look.yaw);
    const cos = Math.cos(look.yaw);
    const worldX =  moveX * cos + moveZ * sin;
    const worldZ = -moveX * sin + moveZ * cos;

    // Scale by speed and delta
    const vel = MOVE_SPEED * delta;
    let   nx  = camera.position.x + worldX * vel;
    let   nz  = camera.position.z + worldZ * vel;

    // Wall collision
    const b = getActiveBound({ z: nz });

    // Near a door threshold — loosen X so player can pass through
    const nearDoor = bounds.some(bound =>
      Math.abs(nz - bound.maxZ) < 1.5 || Math.abs(nz - bound.minZ) < 1.5
    );

    if (nearDoor && Math.abs(nx) < 1.1) {
      nx = Math.max(-1.0, Math.min(1.0, nx));
    } else {
      nx = Math.max(b.minX, Math.min(b.maxX, nx));
    }

    nz = Math.max(b.minZ, Math.min(b.maxZ, nz));

    camera.position.set(nx, EYE_HEIGHT, nz);
    camera.rotation.set(0, look.yaw, 0, 'YXZ');
  }


  return {
    update,
    setBounds,
    getYaw:      () => look.yaw,
    getPosition: () => camera.position,
  };
}