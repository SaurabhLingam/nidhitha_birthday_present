// ─────────────────────────────────────────
//  PHOTOS
//  Places photo frames on walls
//  Proximity glow + interact hint
//  Tap/click opens modal
// ─────────────────────────────────────────

const HER_PHOTOS = [
  'IMG_20250328_201241_512.jpg',
  'IMG_20250328_201245_785.jpg',
  'IMG_20250831_153343_495.jpg',
  'IMG_20250831_154939_806.jpg',
  'IMG_20250831_155014_478.jpg',
  'IMG_20250831_155604_996.jpg',
  'IMG_20250831_155715_195.jpg',
  'IMG_20251021_000254_308.jpg',
  'IMG_20251021_000301_027.jpg',
  'IMG_20260118_003919_791.jpg',
  'IMG_20260811_211933_060.jpg',
  'IMG_20260912_195802_465.jpg',
  'IMG_20260912_195844_228.jpg',
];

const JAZZ_PHOTOS = [
  'IMG_20260523_143332_533.jpg',
  'IMG_20260523_143338_535.jpg',
  'IMG_20260812_212239_438.jpg',
  'IMG_20260820_225049_749.jpg',
  'IMG_20260821_005941_184.jpg',
  'IMG_20260906_151917_385.jpg',
  'IMG_20260909_102432_275.jpg',
  'IMG_20260909_225402_390.jpg',
  'IMG_20260909_231949_208.jpg',
  'IMG_20260909_232433_272.jpg',
  'IMG_20260910_122619_601.jpg',
  'IMG_20260910_122704_371.jpg',
  'IMG_20260910_122759_481.jpg',
  'IMG_20260910_122801_905.jpg',
];

const TUNG_PHOTOS = [
  'file_00000000018082119b36dece9e775639.png',
];

const HER_CAPTIONS = [
  'This picture has seen a lot of AI damage',   // IMG_20250328_201241_512.jpg
  'The cutest',   // IMG_20250328_201245_785.jpg
  'If padhathi was a photo it would be this',   // IMG_20250831_153343_495.jpg
  'Ms. Universe aint got nothin on you',   // IMG_20250831_154939_806.jpg
  'Em kanipistundi asala?',   // IMG_20250831_155014_478.jpg
  'Presenting You: The Ipad Kid',   // IMG_20250831_155604_996.jpg
  'Krishnudu unnadu anduke em anatle',   // IMG_20250831_155715_195.jpg
  'She is not posing she is eyeing the sweets',   // IMG_20251021_000254_308.jpg
  'Bank robbery chese mundhu iche expression idhi',   // IMG_20251021_000301_027.jpg
  'I am still wondering why there is a face on that tree',  // IMG_20260118_003919_791.jpg
  'Mari antha judge cheste ela?',  // IMG_20260811_211933_060.jpg
  'SHE GRADUATED!!!',  // IMG_20260912_195802_465.jpg
  'This is her after she found out Gojo does not exist',  // IMG_20260912_195844_228.jpg
];
const JAZZ_CAPTIONS = JAZZ_PHOTOS.map(() => '');
const TUNG_CAPTIONS = ["Here's to many more years together as besties!!"];

const ROOM_Z = { her: -18, jazz: -36, tung: -54 };

const FRAME_W   = 1.4;
const FRAME_H   = 1.0;
const NEAR_DIST = 2.5;

export function initPhotos(scene, loadManager) {

  const texLoader   = new THREE.TextureLoader(loadManager);
  const frames      = [];
  let   nearbyFrame = null;
  let   uiCallbacks = null;
  let   lastCamera  = null;

  const raycaster   = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0); // center of screen

  // ── Spread N positions evenly between min and max ──
  function spread(n, min, max) {
    if (n === 1) return [(min + max) / 2];
    const out = [];
    for (let i = 0; i < n; i++) out.push(min + (i / (n - 1)) * (max - min));
    return out;
  }

  // ── Build a single framed photo group ──
  function makeFrame(src, w, h) {
    const tex = texLoader.load(src);
    tex.encoding = THREE.sRGBEncoding;

    // Photo — MeshStandardMaterial so lighting affects it naturally
    const photoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 })
    );

    // White border behind photo
    const borderMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.22, h + 0.22),
      new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.8, metalness: 0.1 })
    );
    borderMesh.position.z = -0.005;

    // Amber glow behind border (opacity driven by proximity)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd07a,
      transparent: true,
      opacity: 0,
    });
    const glowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.32, h + 0.32),
      glowMat
    );
    glowMesh.position.z = -0.012;

    const group = new THREE.Group();
    const matMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.08, h + 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfaf7f2, roughness: 1, metalness: 0 })
    );
    matMesh.position.z = -0.002;

    group.add(glowMesh);
    group.add(borderMesh);
    group.add(matMesh);
    group.add(photoMesh);

    return { group, glowMat };
  }

  // ── Place one frame; store world-facing normal for tap check ──
  // normalDir: THREE.Vector3 pointing away from wall (toward player)
  function placeFrame(src, caption, x, y, z, rotY, w = FRAME_W, h = FRAME_H) {
    const { group, glowMat } = makeFrame(src, w, h);
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    scene.add(group);

    // Facing normal in world space (plane faces +Z in local, rotate by rotY)
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, rotY, 0));

    frames.push({ group, glowMat, src, caption, normal });
  }

  // ── Her Room (z = -18): 13 frames ──
  // Left wall (rotY = +π/2, normal points +X): 7 frames
  // Right wall (rotY = -π/2, normal points -X): 6 frames
  function placeHerPhotos() {
    const rz = ROOM_Z.her;
    const lx = -4.87;
    const rx =  4.87;

    // Left wall — 7 frames in a single row, evenly spaced
    spread(7, rz - 7, rz + 7).forEach((fz, i) =>
      placeFrame(`assets/photos/her/${HER_PHOTOS[i]}`, HER_CAPTIONS[i],
        lx, 2.0, fz, Math.PI / 2)
    );

    // Right wall — 6 frames in a single row, evenly spaced
    spread(6, rz - 6, rz + 6).forEach((fz, i) =>
      placeFrame(`assets/photos/her/${HER_PHOTOS[7 + i]}`, HER_CAPTIONS[7 + i],
        rx, 2.0, fz, -Math.PI / 2)
    );
  }

  // ── Jazz's Gallery (z = -36): 14 frames ──
  // Back wall: 5, Left wall: 5, Right wall: 4
  function placeJazzPhotos() {
    const rz     = ROOM_Z.jazz;
    const backZ  = rz - 8.88;
    const lx     = -4.87;
    const rx     =  4.87;

    // Back wall — facing +Z (rotY = π so normal points toward entry)


    // Left wall
    spread(5, rz - 6, rz + 5).forEach((fz, i) =>
      placeFrame(`assets/photos/jazz/${JAZZ_PHOTOS[5 + i]}`, JAZZ_CAPTIONS[5 + i],
        lx, 2.2, fz, Math.PI / 2)
    );

    // Right wall
    spread(4, rz - 5, rz + 4).forEach((fz, i) =>
      placeFrame(`assets/photos/jazz/${JAZZ_PHOTOS[10 + i]}`, JAZZ_CAPTIONS[10 + i],
        rx, 2.2, fz, -Math.PI / 2)
    );
  }

  // ── Tung Room (z = -54): 1 large frame on back wall ──
  function placeTungPhotos() {
    const backZ = ROOM_Z.tung - 8.88;
    placeFrame(
      `assets/photos/tung/${TUNG_PHOTOS[0]}`, TUNG_CAPTIONS[0],
      0, 2.4, backZ + 0.1, 0, 2.2, 1.6
    );
  }

  let cakeInteractable = null;
  let dogInteractable  = null;

  placeHerPhotos();
  placeJazzPhotos();
  placeTungPhotos();
  placeCakeInteractable();
  placeDogInteractable();

  // ── Camera direction helper ──
  const _camDir  = new THREE.Vector3();
  const _toFrame = new THREE.Vector3();
  const _wPos    = new THREE.Vector3();

  function update(cameraPos, camera) {
    if (camera) lastCamera = camera;

    // ── Cake proximity ──
    if (cakeInteractable) {
      const cakeDist = cameraPos.distanceTo(cakeInteractable.mesh.position);
      const isNear   = cakeDist < NEAR_DIST;
      cakeInteractable.glowMat.opacity = isNear ? Math.max(0, 1 - cakeDist / NEAR_DIST) * 0.7 : 0;
      cakeInteractable.isNearby = isNear;
    }

    // ── Dog proximity ──
    if (dogInteractable) {
      const dogDist = cameraPos.distanceTo(dogInteractable.mesh.position);
      const isNear  = dogDist < NEAR_DIST;
      dogInteractable.glowMat.opacity = isNear ? Math.max(0, 1 - dogDist / NEAR_DIST) * 0.7 : 0;
      dogInteractable.isNearby = isNear;
    }

    let closestDist  = Infinity;
    let closestFrame = null;

    frames.forEach(f => {
      f.group.getWorldPosition(_wPos);
      const dist = cameraPos.distanceTo(_wPos);

      _toFrame.subVectors(_wPos, cameraPos).normalize();
      const facing = f.normal.dot(_toFrame) < 0;

      // Glow stays proximity-based — feels natural as you walk up
      const glow = (dist < NEAR_DIST && facing)
        ? Math.max(0, 1 - dist / NEAR_DIST) * 0.6
        : 0;
      f.glowMat.opacity = glow;

      if (dist < closestDist && dist < NEAR_DIST && facing) {
        closestDist  = dist;
        closestFrame = f;
      }
    });

    nearbyFrame = closestFrame;
  }

  function setUICallbacks(callbacks) {
    uiCallbacks = callbacks;
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('click', (e) => handleTap(e.clientX, e.clientY));
    canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      handleTap(t.clientX, t.clientY);
    }, { passive: true });
  }

  function handleTap(clientX, clientY) {
    if (!uiCallbacks || !lastCamera) return;

    // Convert tap position to NDC (-1 to +1)
    const ndc = new THREE.Vector2(
      (clientX  / window.innerWidth)  * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(ndc, lastCamera);
    const photoMeshes = frames.map(f => f.group.children[2]);
    const cakeMesh    = cakeInteractable ? [cakeInteractable.mesh] : [];
    const dogMesh     = dogInteractable  ? [dogInteractable.mesh]  : [];
    const hits = raycaster.intersectObjects([...photoMeshes, ...cakeMesh, ...dogMesh]);

    if (hits.length > 0) {
      const hitMesh = hits[0].object;
      if (cakeInteractable && hitMesh === cakeInteractable.mesh) {
        uiCallbacks.openNote();
        return;
      }
      if (dogInteractable && hitMesh === dogInteractable.mesh) {
        uiCallbacks.openJazz();
        return;
      }
      const frame = frames.find(f => f.group.children[2] === hitMesh);
      if (frame) uiCallbacks.openModal(frame.src, frame.caption);
    }
  }

  // ── Dog interactable (Jazz message) ──
  function placeDogInteractable() {
    const geo  = new THREE.BoxGeometry(1.0, 1.5, 1.0);
    const mat  = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-2.5, 0.75, -33);
    scene.add(mesh);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd07a,
      transparent: true,
      opacity: 0,
    });
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), glowMat);
    glowMesh.position.set(-2.5, 0.75, -33);
    scene.add(glowMesh);

    dogInteractable = { mesh, glowMat, isDog: true };
  }

  // ── Cake interactable (note trigger) ──
  function placeCakeInteractable() {
    const geo  = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const mat  = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 1.4, -54);
    scene.add(mesh);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd07a,
      transparent: true,
      opacity: 0,
    });
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), glowMat);
    glowMesh.position.set(0, 1.4, -54);
    scene.add(glowMesh);

    cakeInteractable = { mesh, glowMat, isCake: true };
  }

 function getNearby() {
    return nearbyFrame
      || (cakeInteractable?.isNearby ? cakeInteractable : null)
      || (dogInteractable?.isNearby  ? dogInteractable  : null);
  }

  return { update, getNearby, setUICallbacks };
}