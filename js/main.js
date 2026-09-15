import { initLighting } from './lighting.js';
import { initRoom }     from './room.js';
import { initPhotos }   from './photos.js';
import { initPlayer }   from './player.js';
import { initUI }       from './ui.js';
import { initAudio, updateAudio } from './audio.js';

// ─────────────────────────────────────────
//  SCENE SETUP
// ─────────────────────────────────────────
const canvas   = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputEncoding    = THREE.sRGBEncoding;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x1a1008);
scene.fog        = new THREE.Fog(0x1a1008, 18, 35);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.65, 0); // eye height


// ─────────────────────────────────────────
//  LOADING MANAGER
// ─────────────────────────────────────────
const loadingBar    = document.getElementById('loading-bar');
const loadingScreen = document.getElementById('loading-screen');
const birthdaySplash = document.getElementById('birthday-splash');

const loadManager = new THREE.LoadingManager();

loadManager.onProgress = (_url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loadingBar.style.width = pct + '%';
};

loadManager.onLoad = () => {
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    birthdaySplash.classList.remove('hidden');
    const enterBtn = document.getElementById('splash-enter');
    enterBtn.disabled = false;
    enterBtn.textContent = 'explore →';
  }, 400);
};

loadManager.onError = (url) => {
  console.warn('Could not load asset:', url);
};


// ─────────────────────────────────────────
//  INIT ALL MODULES
// ─────────────────────────────────────────
const lighting = initLighting(scene);
const room     = initRoom(scene, loadManager);
const photos   = initPhotos(scene, loadManager);
const player   = initPlayer(camera, renderer.domElement);
player.setBounds(room.roomBounds);
const ui       = initUI(camera, photos, player);
initAudio();



// ─────────────────────────────────────────
//  SPLASH ENTER BUTTON
// ─────────────────────────────────────────
const hud          = document.getElementById('hud');
const joystickZone = document.getElementById('joystick-zone');

document.getElementById('splash-enter').addEventListener('click', () => {
  birthdaySplash.classList.add('hidden');
  hud.classList.remove('hidden');
  joystickZone.classList.remove('hidden');
});


// ─────────────────────────────────────────
//  RESIZE HANDLER
// ─────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// ─────────────────────────────────────────
//  RENDER LOOP
// ─────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  player.update(delta);
  updateAudio(camera.position.z, delta);
  photos.update(camera.position, camera);  // proximity glow + raycast
  ui.update();

  renderer.render(scene, camera);
}

animate();


// ─────────────────────────────────────────
//  EXPORTS (other modules may need these)
// ─────────────────────────────────────────
export { scene, camera, renderer, loadManager };