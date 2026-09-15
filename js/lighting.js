// ─────────────────────────────────────────
//  LIGHTING
//  Warm cozy room lighting:
//  - Low ambient fill (so shadows stay deep)
//  - Point lights mimicking table lamps
//  - One warm ceiling light per room
//  - Spotlight on each AI art frame (Tung room)
// ─────────────────────────────────────────

export function initLighting(scene) {

  // ── Ambient — very dim, just fills pitch black corners ──
  const ambient = new THREE.AmbientLight(0xfff1dc, 0.18);
  scene.add(ambient);


  // ── Room configs ──
  // Each room is offset along the Z axis
  // Entry: z=0, Her Room: z=-20, Jazz: z=-40, Tung: z=-60
  const ROOMS = [
    { name: 'entry',   z:   0 },
    { name: 'her',     z: -18 },
    { name: 'jazz',    z: -36 },
    { name: 'tung',    z: -54 },
  ];

  const lights = {};

  ROOMS.forEach(({ name, z }) => {
    // ── Ceiling light (warm pendant) ──
    const ceiling = new THREE.PointLight(0xffd07a, 1.2, 18);
    ceiling.position.set(0, 3.8, z);
    ceiling.castShadow = true;
    ceiling.shadow.mapSize.set(512, 512);
    ceiling.shadow.camera.near = 0.1;
    ceiling.shadow.camera.far  = 20;
    ceiling.shadow.bias = -0.002;
    scene.add(ceiling);

    // ── Left lamp (table lamp feel) ──
    const lampL = new THREE.PointLight(0xff9f4a, 0.7, 10);
    lampL.position.set(-3.5, 1.2, z + 2);
    scene.add(lampL);

    // ── Right lamp ──
    const lampR = new THREE.PointLight(0xff9f4a, 0.7, 10);
    lampR.position.set(3.5, 1.2, z - 2);
    scene.add(lampR);

    lights[name] = { ceiling, lampL, lampR };
  });


  // ── Tung Tung room — extra dramatic spotlights ──
  const tungZ = -54;

  const spot1 = new THREE.SpotLight(0xff6b3d, 1.5, 14, Math.PI / 7, 0.4, 1.5);
  spot1.position.set(-2, 4.5, tungZ - 2);
  spot1.target.position.set(-2, 0, tungZ - 2);
  spot1.castShadow = true;
  spot1.shadow.mapSize.set(512, 512);
  scene.add(spot1);
  scene.add(spot1.target);

  const spot2 = new THREE.SpotLight(0xffd07a, 1.5, 14, Math.PI / 7, 0.4, 1.5);
  spot2.position.set(2, 4.5, tungZ + 2);
  spot2.target.position.set(2, 0, tungZ + 2);
  spot2.castShadow = true;
  spot2.shadow.mapSize.set(512, 512);
  scene.add(spot2);
  scene.add(spot2.target);

  const spot3 = new THREE.SpotLight(0xff4d6a, 1.2, 14, Math.PI / 7, 0.4, 1.5);
  spot3.position.set(0, 4.5, tungZ - 4);
  spot3.target.position.set(0, 0, tungZ - 4);
  scene.add(spot3);
  scene.add(spot3.target);

  lights['tung_spots'] = { spot1, spot2, spot3 };


  // ── Animate lamps — gentle flicker ──
  const clock = new THREE.Clock();

  function flickerUpdate() {
    requestAnimationFrame(flickerUpdate);
    const t = clock.getElapsedTime();

    // Very subtle intensity variation — feels alive, not broken
    Object.values(lights).forEach(group => {
      if (!group) return;
      if (group.lampL) group.lampL.intensity = 0.7 + Math.sin(t * 1.3) * 0.04;
      if (group.lampR) group.lampR.intensity = 0.7 + Math.sin(t * 1.7 + 1) * 0.04;
    });

    // Tung room spots flicker a bit more dramatically
    if (lights.tung_spots) {
      lights.tung_spots.spot1.intensity = 1.5 + Math.sin(t * 2.1) * 0.12;
      lights.tung_spots.spot2.intensity = 1.5 + Math.sin(t * 1.9 + 0.5) * 0.12;
      lights.tung_spots.spot3.intensity = 1.2 + Math.sin(t * 2.5 + 1.2) * 0.1;
    }
  }

  flickerUpdate();


  return {
    lights,
    // Call this when transitioning rooms to softly boost the target room's ceiling
    focusRoom(roomName) {
      Object.entries(lights).forEach(([name, group]) => {
        if (!group || !group.ceiling) return;
        group.ceiling.intensity = (name === roomName) ? 1.4 : 0.7;
      });
    }
  };
}