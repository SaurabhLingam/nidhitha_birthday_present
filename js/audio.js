// ─────────────────────────────────────────
//  AUDIO
//  Room-based music with crossfade
//  Call initAudio() once, updateAudio() every frame
// ─────────────────────────────────────────

const TRACKS = [
  {
    src:      'assets/HAPPY BIRTHDAY INSTRUMENTAL ( LOFI VERSION ).mp3',
    startAt:  3,
    loopFrom: 0,
  },
  {
    src:      'assets/One Direction - What Makes You Beautiful(Lyrics)🎵.mp3',
    startAt:  30,     // always re-enter at 0:30
    loopFrom: 0,
  },
  {
    src:      'assets/Happy Birthday Jazz (VOL 1).mp3',
    startAt:  0,
    loopFrom: 0,
  },
  {
    src:      'assets/Ribs.mp3',
    startAt:  213,    // 3:33 on first entry
    loopFrom: 0,      // then loops from 0:00 via 'ended' event
  },
];

const CROSSFADE_DURATION = 1.5;            // seconds
const ROOM_THRESHOLDS    = [-9, -27, -45]; // Z midpoints between room centers

// ── State ──
let audios      = [];   // one HTMLAudioElement per track
let currentRoom = -1;   // -1 forces a trigger on the very first update
let fadeOutEl   = null;
let fadeInEl    = null;
let fadeInStart = null;
let isFading    = false;


function seekAndPlay(audio, startAt) {
  return new Promise((resolve, reject) => {
    const playFromStart = () => {
      if (startAt <= 0) {
        audio.play().then(resolve).catch(reject);
        return;
      }

      const onSeeked = () => {
        audio.removeEventListener('seeked', onSeeked);
        audio.play().then(resolve).catch(reject);
      };

      audio.addEventListener('seeked', onSeeked, { once: true });
      audio.currentTime = startAt;
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      playFromStart();
    } else {
      audio.addEventListener('loadedmetadata', playFromStart, { once: true });
      audio.load();
    }
  });
}

export function initAudio() {
  TRACKS.forEach((t, i) => {
    const el   = new Audio();
    el.src     = t.src;
    el.volume  = 0;
    el.preload = 'auto';

    if (i === 3) {
      // Tung room: native loop won't respect loopFrom, so use 'ended'
      el.loop = false;
      el.addEventListener('ended', () => {
        seekAndPlay(el, TRACKS[3].loopFrom).catch(() => {});
      });
    } else {
      el.loop = true;
    }

    audios.push(el);
  });
}


// ── Call every frame from main.js ──
export function updateAudio(cameraZ, delta) {
  const room = getRoomIndex(cameraZ);

  if (room === currentRoom) {
    tickFade(delta);
    return;
  }

  // Room changed — kick off a crossfade
  const prev  = currentRoom;
  currentRoom = room;

  if (prev >= 0 && audios[prev].volume > 0) {
    fadeOutEl = audios[prev];
  }

  const next   = audios[room];
  const track  = TRACKS[room];
  next.volume  = 0;
  seekAndPlay(next, track.startAt).catch(() => {});

  fadeInEl    = next;
  fadeInStart = performance.now() / 1000;
  isFading    = true;
}


// ── Lerp volumes each frame ──
function tickFade() {
  if (!isFading) return;

  const elapsed = performance.now() / 1000 - fadeInStart;
  const t       = Math.min(elapsed / CROSSFADE_DURATION, 1);

  if (fadeInEl)  fadeInEl.volume  = t;
  if (fadeOutEl) fadeOutEl.volume = 1 - t;

  if (t >= 1) {
    if (fadeOutEl) {
      fadeOutEl.pause();
      fadeOutEl.volume = 0;
    }
    if (fadeInEl) fadeInEl.volume = 1;

    fadeOutEl = null;
    fadeInEl  = null;
    isFading  = false;
  }
}


function getRoomIndex(z) {
  if (z > ROOM_THRESHOLDS[0]) return 0;
  if (z > ROOM_THRESHOLDS[1]) return 1;
  if (z > ROOM_THRESHOLDS[2]) return 2;
  return 3;
}