# Columbus — Progress

## Current State

**Active phase: P001 — Columbus AR PWA**
**Branch:** `columbus-ar-pwa`
**Plan:** `plans/001-columbus-ar-pwa.md`
**Next action:** Step 14 — one-time Tailscale setup, then iPhone test

---

## Step Tracker

| # | Step | Status |
|---|---|---|
| 1 | Create `package.json` with `dev` and `serve` scripts | DONE |
| 2 | Download Natural Earth TopoJSON data (land-110m.json, countries-110m.json) into `data/` | DONE |
| 3 | Write `src/geodesy.js` — `destinationPoint()`, `haversineDistance()` | DONE |
| 4 | Write `src/landfall.js` — `findLandfall()`, `countryAt()` using D3 + TopoJSON | DONE |
| 5 | Write `src/compass.js` — DeviceOrientation wrapper + Geolocation, iOS permission flow | DONE |
| 6 | Write `src/overlay.js` — canvas renderer: compass rose, bearing readout, parchment card | DONE |
| 7 | Write `src/main.js` — permission orchestration, RAF animation loop, wires all modules | DONE |
| 8 | Write `index.html` — video + canvas layers, splash screen, desktop bearing slider | DONE |
| 9 | Write `css/app.css` — full-viewport layout, video/canvas stack, splash styles | DONE |
| 10 | Write `manifest.json` + `sw.js` — PWA manifest, cache-first service worker | DONE |
| 11 | Portolan chart design — compass rose, typography, parchment card | DONE (implemented in overlay.js) |
| 12 | Generate placeholder icons (192×192, 512×512) | DONE |
| 13 | Desktop test: mock GPS (Land's End) + bearing slider, verify landfall logic | DONE ✓ Canada 2.3k mi @ 305° |
| 14 | One-time Tailscale setup: `npm run tailscale-setup`, then `npm run dev` and open Mac's Tailscale HTTPS URL on iPhone | TODO |

---

## Desktop Test Results (Step 13)

All verified via Chrome DevTools automation:

| Test | Result |
|---|---|
| Land's End 305° | Canada @ 2,298 mi (Newfoundland) ✓ |
| Land's End 040° | United Kingdom @ 155 mi (England clips first) ✓ |
| Land's End 270° | Cuba @ 4,285 mi (great circle curves south) ✓ |
| bearingToCompass(305) | NW ✓ |
| formatTravel(3800km) | 8d 13h sail · 4h 13m fly · 32d walk ✓ |
| Distances displayed | Miles ✓ (2.3k mi, 311 mi, etc.) |
| Compass rose | Rotates correctly with heading ✓ |
| Parchment card | Country · bearing · distance in mi · travel times ✓ |
| Desktop slider | Shows after 1s timeout, primes heading to 305° ✓ |
| Camera failure | Non-fatal — app continues on dark background ✓ |

---

## Key Implementation Notes (from plan)

- **Stack**: Vanilla JS (ES modules) + D3 v7 (CDN) + TopoJSON client v3 (CDN). No bundler.
- **Serving**: `npm run dev` → `python3 -m http.server 3000`. One-time Tailscale setup: `npm run tailscale-setup` (`tailscale serve https / http://localhost:3000` — persists, never needs repeating). iPhone accesses via Mac's Tailscale HTTPS URL; both devices on same Tailnet.
- **Land detection**: `d3.geoContains(landFeature, [lon, lat])` against Natural Earth 110m polygons
- **Landfall algorithm**: Walk great circle in 50 km steps with `inOcean` state machine
- **Distances**: Displayed in miles. Internal calculations stay in km; `kmToMiles()` converts for display.
- **iOS permissions**: `DeviceOrientationEvent.requestPermission()` MUST be triggered from a user tap gesture — single "Begin" splash button requests orientation, then geolocation, then camera in sequence
- **Desktop fallback**: Mock GPS defaults to Land's End, UK (50.066°N, 5.715°W); bearing slider appears after 1s timeout if no real orientation events fire
- **Camera failure**: Non-fatal — app proceeds without live feed; dark background with overlay still works
- **Do NOT auto-stage git changes** — user stages manually

---

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| P001 Columbus AR PWA | Ready for iPhone test | All code complete, desktop tests pass |
