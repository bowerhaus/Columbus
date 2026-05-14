// Land's End, UK — default mock GPS for desktop testing
const MOCK_POSITION = { lon: -5.715, lat: 50.066 };

let _heading = 0;
let _position = { ...MOCK_POSITION };
let _onUpdate = null;
let _orientationFired = false;

function handleOrientation(e) {
  if (e.webkitCompassHeading != null) {
    _heading = e.webkitCompassHeading;
    _orientationFired = true;
  } else if (e.alpha != null) {
    _heading = (360 - e.alpha) % 360;
    _orientationFired = true;
  }
  _onUpdate?.();
}

export function isOrientationSupported() {
  return typeof DeviceOrientationEvent !== 'undefined';
}

export async function requestPermissions() {
  // iOS 13+ requires explicit permission from a user gesture
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    const result = await DeviceOrientationEvent.requestPermission();
    if (result !== 'granted') throw new Error('orientation-denied');
  }

  if (isOrientationSupported()) {
    window.addEventListener('deviceorientation', handleOrientation);
  }

  // Geolocation — best-effort, falls back to mock on failure
  await new Promise((resolve) => {
    if (!navigator.geolocation) return resolve();
    navigator.geolocation.getCurrentPosition(
      pos => {
        _position = { lon: pos.coords.longitude, lat: pos.coords.latitude };
        resolve();
      },
      () => resolve(), // keep mock position on error
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export function hasOrientation() {
  return _orientationFired;
}

export function getHeading() {
  return _heading;
}

export function getPosition() {
  return _position;
}

export function setHeading(deg) {
  _heading = ((deg % 360) + 360) % 360;
  _onUpdate?.();
}

export function setOnUpdate(fn) {
  _onUpdate = fn;
}

export function destroy() {
  window.removeEventListener('deviceorientation', handleOrientation);
}
