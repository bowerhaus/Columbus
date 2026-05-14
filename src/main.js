import { init as initLandfall, findLandfall } from './landfall.js';
import * as compass from './compass.js';
import { drawFrame } from './overlay.js';

const splash = document.getElementById('splash');
const beginBtn = document.getElementById('begin-btn');
const errorEl = document.getElementById('error-msg');
const video = document.getElementById('camera');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const sliderWrap = document.getElementById('slider-wrap');
const slider = document.getElementById('bearing-slider');
const sliderVal = document.getElementById('slider-value');

let lastHeadingInt = -1;
let cachedLandfall = null;
let position = null;
let dataReady = false;

async function loadData() {
  try {
    await initLandfall();
    dataReady = true;
  } catch (err) {
    showError('Failed to load map data. Please reload.');
    throw err;
  }
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await Promise.race([
    video.play(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('play timeout')), 3000)),
  ]);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function getLandfall(lon, lat, heading) {
  const h = Math.round(((heading % 360) + 360) % 360);
  if (h !== lastHeadingInt) {
    lastHeadingInt = h;
    cachedLandfall = findLandfall(lon, lat, heading);
  }
  return cachedLandfall;
}

function animate() {
  const { lon, lat } = compass.getPosition();
  const heading = compass.getHeading();
  const landfall = dataReady ? getLandfall(lon, lat, heading) : null;
  drawFrame(canvas, ctx, { heading, landfall });
  requestAnimationFrame(animate);
}

beginBtn.addEventListener('click', async () => {
  beginBtn.disabled = true;
  beginBtn.textContent = 'Starting…';

  try {
    await compass.requestPermissions();
  } catch (err) {
    if (err.message === 'orientation-denied') {
      showError('Compass permission denied. Reload and allow orientation access.');
      beginBtn.disabled = false;
      beginBtn.textContent = 'Begin';
      return;
    }
    // Other errors (e.g. desktop without orientation) — continue anyway
  }

  try {
    await startCamera();
  } catch (err) {
    // Camera unavailable (desktop, denied) — continue without live feed
    // The overlay still works; just shows on a dark background
  }

  // Hide splash and start AR
  splash.style.display = 'none';
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Wire up the slider (always, but only shown when needed)
  slider.addEventListener('input', () => {
    const deg = parseInt(slider.value, 10);
    sliderVal.textContent = `${deg}°`;
    compass.setHeading(deg);
  });

  // Show bearing slider if no real orientation events arrive within 1 second
  // (desktop: DeviceOrientationEvent may be defined but never fires)
  setTimeout(() => {
    if (!compass.hasOrientation()) {
      sliderWrap.style.display = 'flex';
      // Prime the landfall with the slider's starting value
      compass.setHeading(parseInt(slider.value, 10));
    }
  }, 1000);

  requestAnimationFrame(animate);
});

// Start loading data immediately (before user taps Begin)
loadData();
