// ─────────────────────────────────────────
//  ROOM
//  Builds all 4 rooms connected along Z axis
//  Each room: 10w x 5h x 18d
//  Connected by doorway openings in walls
// ─────────────────────────────────────────

const ROOM_W  = 10;   // width  (X)
const ROOM_H  = 5;    // height (Y)
const ROOM_D  = 18;   // depth  (Z)
const WALL_T  = 0.22; // wall thickness

// Room centers (match lighting.js Z positions)
const ROOMS = [
  { name: 'entry', z:   0, wallColor: 0xf0e6d3, floorColor: 0x6b4c2a, ceilColor: 0xfdf6ec },
  { name: 'her',   z: -18, wallColor: 0xb07080, floorColor: 0x5c3d1e, ceilColor: 0xf5ede0 },
  { name: 'jazz',  z: -36, wallColor: 0xddd5c8, floorColor: 0x4a3018, ceilColor: 0xf0e8dc },
  { name: 'tung',  z: -54, wallColor: 0x2a1f1a, floorColor: 0x1a1008, ceilColor: 0x1e1510 },
];

const DOOR_W = 2.2;
const DOOR_H = 3.2;


export function initRoom(scene, loadManager) {

  // ── Texture loader ──
  const texLoader = new THREE.TextureLoader(loadManager);

  // ── Real wood floor texture ──
  const woodColor     = texLoader.load('assets/textures/WoodFloor/WoodFloor040_1K-JPG_Color.jpg');
  const woodNormal    = texLoader.load('assets/textures/WoodFloor/WoodFloor040_1K-JPG_NormalGL.jpg');
  const woodRoughness = texLoader.load('assets/textures/WoodFloor/WoodFloor040_1K-JPG_Roughness.jpg');

  [woodColor, woodNormal, woodRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
  });

  // ── Wall texture ──
  const wallColor     = texLoader.load('assets/textures/Wallpaper/Wallpaper002A_1K-JPG_Color.jpg');
  const wallNormal    = texLoader.load('assets/textures/Wallpaper/Wallpaper002A_1K-JPG_NormalGL.jpg');
  const wallRoughness = texLoader.load('assets/textures/Wallpaper/Wallpaper002A_1K-JPG_Roughness.jpg');

  [wallColor, wallNormal, wallRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 2);
  });

  // ── Tung room wall texture (dark mahogany) ──
  const tungWallColor     = texLoader.load('assets/textures/Tung/Wood066_1K-JPG_Color.jpg');
  const tungWallNormal    = texLoader.load('assets/textures/Tung/Wood066_1K-JPG_NormalGL.jpg');
  const tungWallRoughness = texLoader.load('assets/textures/Tung/Wood066_1K-JPG_Roughness.jpg');

  [tungWallColor, tungWallNormal, tungWallRoughness].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 2);
  });

  // ── Material helpers ──
  function wallMat(color, isTung = false, tint = null) {
    return new THREE.MeshStandardMaterial({
      map:          isTung ? tungWallColor     : wallColor,
      normalMap:    isTung ? tungWallNormal    : wallNormal,
      roughnessMap: isTung ? tungWallRoughness : wallRoughness,
      roughness:    isTung ? 0.4 : 0.9,
      metalness:    0.0,
      color:        tint ? new THREE.Color(tint) : new THREE.Color(0xffffff),
    });
  }

  function floorMat(color) {
    return new THREE.MeshStandardMaterial({
      map:          woodColor,
      normalMap:    woodNormal,
      roughnessMap: woodRoughness,
      roughness:    0.8,
      metalness:    0.0,
    });
  }

  // ── Build one room ──
  function buildRoom({ name, z, wallColor, floorColor, ceilColor }) {
    const isTung = name === 'tung';
    const group = new THREE.Group();
    group.name  = name;

    const half  = ROOM_D / 2;
    const halfW = ROOM_W / 2;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, WALL_T, ROOM_D),
      floorMat(floorColor)
    );
    floor.position.set(0, -WALL_T / 2, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, WALL_T, ROOM_D),
      wallMat(ceilColor, isTung, name === 'her' ? 0xffb6c1 : null)
    );
    ceil.position.set(0, ROOM_H + WALL_T / 2, 0);
    group.add(ceil);

    // Back wall (far end, -Z side of room)
    // Last room (tung) gets a solid back wall; others get a doorway opening
    if (isTung) {
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_W, ROOM_H, WALL_T),
        wallMat(wallColor, isTung, name === 'her' ? 0xffb6c1 : null)
      );
      backWall.position.set(0, ROOM_H / 2, -half);
      backWall.receiveShadow = true;
      backWall.castShadow    = true;
      group.add(backWall);
    } else {
      const sideW = (ROOM_W - DOOR_W) / 2;

      const backL = new THREE.Mesh(
        new THREE.BoxGeometry(sideW, ROOM_H, WALL_T),
        wallMat(wallColor, isTung)
      );
      backL.position.set(-(DOOR_W / 2 + sideW / 2), ROOM_H / 2, -half);
      backL.receiveShadow = true;
      group.add(backL);

      const backR = new THREE.Mesh(
        new THREE.BoxGeometry(sideW, ROOM_H, WALL_T),
        wallMat(wallColor, isTung)
      );
      backR.position.set((DOOR_W / 2 + sideW / 2), ROOM_H / 2, -half);
      backR.receiveShadow = true;
      group.add(backR);

      const backLintel = new THREE.Mesh(
        new THREE.BoxGeometry(DOOR_W, ROOM_H - DOOR_H, WALL_T),
        wallMat(wallColor, isTung)
      );
      backLintel.position.set(0, DOOR_H + (ROOM_H - DOOR_H) / 2, -half);
      group.add(backLintel);

      addDoorFrame(group, -half, wallColor);
    }

    // Front wall (+Z side) — has a doorway opening
    // Build as two side pieces + lintel above door
    const sideW = (ROOM_W - DOOR_W) / 2;

    const frontL = new THREE.Mesh(
      new THREE.BoxGeometry(sideW, ROOM_H, WALL_T),
      wallMat(wallColor, false, name === 'her' ? 0xffb6c1 : null)
    );
    frontL.position.set(-(DOOR_W / 2 + sideW / 2), ROOM_H / 2, half);
    frontL.receiveShadow = true;
    group.add(frontL);

    const frontR = new THREE.Mesh(
      new THREE.BoxGeometry(sideW, ROOM_H, WALL_T),
      wallMat(wallColor, false, name === 'her' ? 0xffb6c1 : null)
    );
    frontR.position.set((DOOR_W / 2 + sideW / 2), ROOM_H / 2, half);
    frontR.receiveShadow = true;
    group.add(frontR);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_W, ROOM_H - DOOR_H, WALL_T),
      wallMat(wallColor, false, name === 'her' ? 0xffb6c1 : null)
    );
    lintel.position.set(0, DOOR_H + (ROOM_H - DOOR_H) / 2, half);
    group.add(lintel);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_T, ROOM_H, ROOM_D),
      wallMat(wallColor, isTung, name === 'her' ? 0xffb6c1 : null)
    );
    leftWall.position.set(-halfW, ROOM_H / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow    = true;
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_T, ROOM_H, ROOM_D),
      wallMat(wallColor, isTung, name === 'her' ? 0xffb6c1 : null)
    );
    rightWall.position.set(halfW, ROOM_H / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow    = true;
    group.add(rightWall);

    // Door frame trim (subtle visual cue)
    addDoorFrame(group, half, wallColor);

    return group;
  }


  // ── Door frame trim ──
  function addDoorFrame(group, frontZ, wallColor) {
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x8b6340 });
    const trimD   = 0.08;
    const trimW   = 0.12;

    // Left trim
    const trimL = new THREE.Mesh(
      new THREE.BoxGeometry(trimW, DOOR_H, trimD),
      trimMat
    );
    trimL.position.set(-(DOOR_W / 2), DOOR_H / 2, frontZ + 0.01);
    group.add(trimL);

    // Right trim
    const trimR = trimL.clone();
    trimR.position.set(DOOR_W / 2, DOOR_H / 2, frontZ + 0.01);
    group.add(trimR);

    // Top trim
    const trimTop = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_W + trimW * 2, trimW, trimD),
      trimMat
    );
    trimTop.position.set(0, DOOR_H, frontZ + 0.01);
    group.add(trimTop);
  }


  // ── Room-specific furniture ──
  function addEntryFurniture(group) {
    // Small console table
    addTable(group, -3.5, 0, 0x5c3d1e);

    // Birthday banner text plane above table
    const bannerTex  = makeBannerTexture();
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 0.9),
      new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true })
    );
    bannerMesh.position.set(0, 3.8, -8.5);
    group.add(bannerMesh);

    // Bunting string lights along ceiling
    addStringLights(group);
  }

  function addHerRoomFurniture(group) {
    addTable(group, -3, 4, 0x5c3d1e);
    addTable(group,  3, -4, 0x6b4c2a);

    const gltfLoader = new THREE.GLTFLoader(loadManager);
    gltfLoader.load('assets/models/velvet_bean_bag.glb', (gltf) => {
      const beanbag = gltf.scene;
      beanbag.position.set(3, 0, 3);
      beanbag.scale.setScalar(1.0);
      beanbag.rotation.y =  - Math.PI / 4;
      beanbag.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(beanbag);
    });
    gltfLoader.load('assets/models/crochet_baby_yoda_plush_toy.glb', (gltf) => {
      const yoda= gltf.scene;
      yoda.position.set(3, 1, -8);
      yoda.scale.setScalar(0.02);
      yoda.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(yoda);

      const box = new THREE.Box3().setFromObject(yoda);
      console.log('yoda size:', box.getSize(new THREE.Vector3()));
    });
    gltfLoader.load('assets/models/wardrobe_rack.glb', (gltf) => {
      const rack= gltf.scene;
      rack.position.set(-3, 0, 0);
      rack.scale.setScalar(0.3);
      rack.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(rack);

      const box = new THREE.Box3().setFromObject(rack);
      console.log('rack size:', box.getSize(new THREE.Vector3()));
    });
    gltfLoader.load('assets/models/desk_set.glb', (gltf) => {
      const ds = gltf.scene;
      ds.position.set(-4.5, 0, -9.5);
      ds.scale.setScalar(0.0012);
      ds.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(ds);
    });
  }

  function addJazzRoomFurniture(group) {
    // Pet corner rug
    const rugMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const rug    = new THREE.Mesh(new THREE.BoxGeometry(4, 0.04, 3), rugMat);
    rug.position.set(-2.5, 0.02, 3);
    group.add(rug);

    // Paw print on rug (canvas texture)
    const pawTex  = makePawTexture();
    const pawMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 2.5),
      new THREE.MeshBasicMaterial({ map: pawTex, transparent: true })
    );
    pawMesh.rotation.x = -Math.PI / 2;
    pawMesh.position.set(-2.5, 0.06, 3);
    group.add(pawMesh);

    addTable(group, 3, -5, 0x5c3d1e);

    const gltfLoader = new THREE.GLTFLoader(loadManager);

    gltfLoader.load('assets/models/dog_bed.glb', (gltf) => {
      const bed = gltf.scene;
      bed.position.set(3, 0.2, -8);
      bed.scale.setScalar(1.0);
      bed.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(bed);
    });
    gltfLoader.load('assets/models/dog_bowl.glb', (gltf) => {
      const bowl = gltf.scene;
      bowl.position.set(4.5, 0, -8);
      bowl.scale.setScalar(0.25);
      bowl.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(bowl);
    });
    gltfLoader.load('assets/models/monstera_deliciosa_potted_mid-century_plant.glb', (gltf) => {
      const plant = gltf.scene;
      plant.position.set(-4, 0.5, -8);
      plant.scale.setScalar(1.5);
      plant.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(plant);
    });
    gltfLoader.load('assets/models/monstera_deliciosa_potted_mid-century_plant.glb', (gltf) => {
      const plant = gltf.scene;
      plant.position.set(4, 0.5, 8);
      plant.scale.setScalar(1.5);
      plant.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(plant);
    });

    gltfLoader.load('assets/models/white_cartoon_dog.glb', (gltf) => {
      const dog = gltf.scene;
      dog.position.set(-2.5, 0, 3);
      dog.scale.setScalar(0.125);
      dog.rotation.y = Math.PI / 4;
      dog.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(dog);
    });
  }

  function addTungRoomFurniture(group) {
    // Dramatic center pedestal
    const pedMat  = new THREE.MeshLambertMaterial({ color: 0x2a1a0e });
    const pedBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), pedMat);
    pedBase.position.set(0, 0.06, 0);
    group.add(pedBase);

    const pedPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8), pedMat);
    pedPillar.position.set(0, 0.51, 0);
    group.add(pedPillar);

    const pedTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), pedMat);
    pedTop.position.set(0, 1.0, 0);
    group.add(pedTop);

    const gltfLoader = new THREE.GLTFLoader(loadManager);
    gltfLoader.load('assets/models/birthday_cake.glb', (gltf) => {
      const cake = gltf.scene;
      cake.position.set(0, 1.08, 0);  // sits on top of pedestal
      cake.scale.setScalar(2.0);
      cake.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(cake);
    });
    gltfLoader.load('assets/models/food.glb', (gltf) => {
      const food = gltf.scene;
      food.position.set(3.7, 0.5, -6);
      food.scale.setScalar(0.25);
      food.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(food);


    });
    gltfLoader.load('assets/models/statue_of_liberty.glb', (gltf) => {
      const liberty = gltf.scene;
      liberty.position.set(-4, -2.2, -8);
      liberty.scale.setScalar(0.06);
      liberty.rotation.y = -Math.PI / 2;
      liberty.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(liberty);


    });
    gltfLoader.load('assets/models/leather_couch.glb', (gltf) => {
      const couch = gltf.scene;
      couch.position.set(-4, 0, 0);
      couch.scale.setScalar(1.5);
      couch.rotation.y = Math.PI / 2;
      couch.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(couch);

      const box = new THREE.Box3().setFromObject(couch);
      console.log('couch size:', box.getSize(new THREE.Vector3()));

    });
    gltfLoader.load('assets/models/gojo_satoru_-_jujutsu_kaisen.glb', (gltf) => {
      const gojo = gltf.scene;
      gojo.position.set(-4, 0, -4);
      gojo.scale.setScalar(1.5);
      gojo.rotation.y = Math.PI / 4;
      gojo.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(gojo);

      const box = new THREE.Box3().setFromObject(gojo);
      console.log('gojo size:', box.getSize(new THREE.Vector3()));

    });
    gltfLoader.load('assets/models/tung_tung_tung_sahur.glb', (gltf) => {
      const ttt = gltf.scene;
      ttt.position.set(4, 0, -1);
      ttt.scale.setScalar(0.2);
      ttt.rotation.y = - Math.PI / 4;
      ttt.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      group.add(ttt);

      const box = new THREE.Box3().setFromObject(ttt);
      console.log('ttt size:', box.getSize(new THREE.Vector3()));

    });

    // Wall text "distance means nothing"
    const msgTex  = makeWallMessageTexture();
    const msgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 0.7),
      new THREE.MeshBasicMaterial({ map: msgTex, transparent: true })
    );
    msgMesh.position.set(0, 1.4, -8.8);
    group.add(msgMesh);
  }


  // ── Furniture helpers ──
  function addTable(group, x, z, color) {
    const mat     = new THREE.MeshLambertMaterial({ color });
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.6), mat);
    tabletop.position.set(x, 0.82, z);
    tabletop.castShadow = true;
    group.add(tabletop);

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.82, 6);
    [[-0.65, -0.22], [-0.65, 0.22], [0.65, -0.22], [0.65, 0.22]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(x + lx, 0.41, z + lz);
      group.add(leg);
    });

    // Lamp on table
    addLampMesh(group, x, z);
  }

  function addLampMesh(group, x, z) {
    const mat  = new THREE.MeshLambertMaterial({ color: 0xf5c87a, emissive: 0xf5c87a, emissiveIntensity: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
    base.position.set(x, 0.9, z);
    group.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
    pole.position.set(x, 1.175, z);
    group.add(pole);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 8, 1, true), mat);
    shade.position.set(x, 1.6, z);
    group.add(shade);
  }

  function addSmallShelf(group, x, y, z) {
    const mat   = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 1.2), mat);
    shelf.position.set(x, y, z);
    shelf.castShadow = true;
    group.add(shelf);
  }

  function addStringLights(group) {
    const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe8a0 });
    for (let i = -4; i <= 4; i++) {
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      // slight sag in middle
      const sag  = Math.abs(i) * 0.05;
      bulb.position.set(i * 0.9, ROOM_H - 0.15 - sag, -7);
      group.add(bulb);
    }
  }


  // ── Canvas textures ──
  function makeBannerTexture() {
    const c   = document.createElement('canvas');
    c.width   = 1024;
    c.height  = 160;
    const ctx = c.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1024, 160);

    ctx.font      = 'bold italic 72px Georgia, serif';
    ctx.fillStyle = '#7a4a2a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Happy Birthday, Nini 🎂', 512, 80);

    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function makePawTexture() {
    const c   = document.createElement('canvas');
    c.width   = 256;
    c.height  = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    // main pad
    ctx.beginPath(); ctx.arc(128, 150, 38, 0, Math.PI * 2); ctx.fill();
    // toes
    [[75, 90], [110, 70], [148, 70], [182, 90]].forEach(([tx, ty]) => {
      ctx.beginPath(); ctx.arc(tx, ty, 20, 0, Math.PI * 2); ctx.fill();
    });

    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function makeWallMessageTexture() {
    const c   = document.createElement('canvas');
    c.width   = 1024;
    c.height  = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1024, 128);

    ctx.font      = 'italic 48px Georgia, serif';
    ctx.fillStyle = 'rgba(245, 200, 122, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('distance means nothing ✦', 512, 64);

    const tex = new THREE.CanvasTexture(c);
    return tex;
  }


  // ── Assemble all rooms ──
  ROOMS.forEach(({ name, z, wallColor, floorColor, ceilColor }) => {
    const group = buildRoom({ name, z, wallColor, floorColor, ceilColor });
    group.position.z = z;

    if (name === 'entry') addEntryFurniture(group);
    if (name === 'her')   addHerRoomFurniture(group);
    if (name === 'jazz')  addJazzRoomFurniture(group);
    if (name === 'tung')  addTungRoomFurniture(group);

    scene.add(group);
  });


  // ── Collision bounds per room (for player.js) ──
  // Returns wall bounds so player can't walk through walls
  const halfW   = ROOM_W / 2 - 0.3;
  const roomBounds = ROOMS.map(({ z }, i) => ({
    minX: -halfW,
    maxX:  halfW,
    minZ:  z - ROOM_D / 2 + (i === ROOMS.length - 1 ? 0.3 : -0.5),
    maxZ:  z + ROOM_D / 2 - (i === 0 ? 0.3 : -0.5),
  }));

  // Door Z thresholds (center of each connecting wall)
  const doorThresholds = [
    ROOMS[0].z - ROOM_D / 2,   // entry → her  (world z = 0 - 9 = -9)
    ROOMS[1].z - ROOM_D / 2,   // her   → jazz (world z = -20 - 9 = -29)
    ROOMS[2].z - ROOM_D / 2,   // jazz  → tung (world z = -40 - 9 = -49)
  ];

  return {
    roomBounds,
    doorThresholds,
    ROOMS,
    ROOM_W,
    ROOM_H,
    ROOM_D,
  };
}