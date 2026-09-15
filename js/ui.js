// ─────────────────────────────────────────
//  UI
//  - Room label updates on door crossing
//  - Photo modal open / close
//  - Interact hint visibility
// ─────────────────────────────────────────

const ROOM_NAMES = ['Entry Hall', "Her Room", "Jazz's Gallery", 'Tung Tung Tung'];

// Door thresholds in world Z — player crosses from room N to N+1
// entry(z=0) → her(z=-18) boundary at z = -9
// her(z=-18) → jazz(z=-36) boundary at z = -27
// jazz(z=-36) → tung(z=-54) boundary at z = -45
const DOOR_Z = [-9, -27, -45];

export function initUI(camera, photos, player) {

  // ── DOM refs ──
  const roomLabel    = document.getElementById('room-label');
  const interactHint = document.getElementById('interact-hint');
  const photoModal   = document.getElementById('photo-modal');
  const modalImg     = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');
  const modalClose   = document.getElementById('modal-close');
  const noteModal    = document.getElementById('note-modal');
  const noteClose    = document.getElementById('note-close');
  const jazzModal    = document.getElementById('jazz-modal');
  const jazzClose    = document.getElementById('jazz-close');
  const roomToast    = document.getElementById('room-toast');
  const roomToastText = document.getElementById('room-toast-text');

  // ── State ──
  let currentRoom  = 0;   // index into ROOM_NAMES
  let labelTimeout = null;
  let toastTimeout = null;
  const ROOM_TOASTS = [null, 'tap the pictures 📸', 'tap on Jazz 🐾', null];

  // ── Room label fade ──
  function setRoomLabel(index) {
    if (index === currentRoom) return;
    currentRoom = index;

    roomLabel.classList.add('fade-out');

    clearTimeout(labelTimeout);
    labelTimeout = setTimeout(() => {
      roomLabel.textContent = ROOM_NAMES[index];
      roomLabel.classList.remove('fade-out');
      roomLabel.classList.add('fade-in');

      setTimeout(() => roomLabel.classList.remove('fade-in'), 400);
    }, 200);
  }

  // ── Room detection from camera Z ──
  function detectRoom(z) {
    // Rooms go in -Z direction; DOOR_Z thresholds are negative
    if      (z > DOOR_Z[0]) return 0;  // z > -9  → Entry Hall
    else if (z > DOOR_Z[1]) return 1;  // z > -27 → Her Room
    else if (z > DOOR_Z[2]) return 2;  // z > -45 → Jazz's Gallery
    else                    return 3;  // z < -45 → Tung Tung Tung
  }

  // ── Modal open ──
  function openModal(src, caption) {
    modalImg.src        = src;
    modalCaption.textContent = caption || '';
    photoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // ── Modal close ──
  function closeModal() {
    photoModal.classList.add('hidden');
    modalImg.src = '';
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);

  // Close on backdrop tap (outside modal-inner)
  photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) closeModal();
  });

  noteClose.addEventListener('click', () => noteModal.classList.add('hidden'));
  noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) noteModal.classList.add('hidden');
  });

  jazzClose.addEventListener('click', () => jazzModal.classList.add('hidden'));
  jazzModal.addEventListener('click', (e) => {
    if (e.target === jazzModal) jazzModal.classList.add('hidden');
  });

  // ── Expose openModal so photos.js can call it ──
  // photos.js receives the ui object and calls ui.openModal(src, caption)
  function openNote() {
    noteModal.classList.remove('hidden');
  }

  function openJazz() {
    jazzModal.classList.remove('hidden');
  }

  function showRoomToast(index) {
    const msg = ROOM_TOASTS[index];
    if (!msg) return;
    clearTimeout(toastTimeout);
    roomToastText.textContent = msg;
    roomToast.classList.remove('hidden', 'fade-out');
    toastTimeout = setTimeout(() => {
      roomToast.classList.add('fade-out');
      setTimeout(() => roomToast.classList.add('hidden'), 400);
    }, 3000);
  }

  if (photos && typeof photos.setUICallbacks === 'function') {
    photos.setUICallbacks({ openModal, closeModal, openNote, openJazz });
  }

  // ── Update — called every frame from main.js ──
  function update() {
    const z       = camera.position.z;
    const roomIdx = detectRoom(z);
    const prevRoom = currentRoom;
    setRoomLabel(roomIdx);
    if (roomIdx !== prevRoom) showRoomToast(roomIdx);

    // Interact hint — photos.js sets a flag when player is near a frame
    if (photos && typeof photos.getNearby === 'function') {
      const nearby = photos.getNearby();
      if (nearby) {
        interactHint.classList.remove('hidden');
      } else {
        interactHint.classList.add('hidden');
      }
    }
  }

  return {
    update,
    openModal,
    closeModal,
  };
}