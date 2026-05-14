# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo orientation

- `progress.md` — resume point after a context reset. Ephemeral: current step and next action only. Overwritten at the start of each new plan.
- `plans/` — permanent plan records. Read the relevant plan before starting work on a component.
- `CLAUDE.md` (this file) — persistent project reference. Decisions, constraints, and lessons belong here.

---

## What Columbus is

A PWA that uses the iPhone's camera and compass to let the user point at the horizon. From their GPS position it projects a great-circle bearing across the ocean and identifies the first landfall — telling them the place name, bearing, distance, and travel times by sail, air, and foot.

---

## Design (locked)

| Decision | Choice |
|---|---|
| View | First-person AR — live rear camera feed fills the screen |
| Overlay | Ancient portolan chart aesthetic — compass rose, old serif typography, parchment-style info card |
| Overlay palette | Warm amber / ochre / sepia on transparent; camera is the background |
| Interaction | Live continuous update as the phone physically turns |
| Landfall card | Place name · bearing (NNE / 022°) · **distance in miles** · travel times |
| Travel times | Sail (10 knots = 18.52 km/h) · Fly (900 km/h) · Walk (5 km/h) |

---

## Stack

- Vanilla JS (ES modules) — no bundler
- D3 v7 and TopoJSON client v3 via CDN (`cdn.jsdelivr.net/npm/…/+esm`)
- Natural Earth 110m data (land polygons + country boundaries) bundled in `data/`
- No npm dependencies at runtime — `package.json` scripts only

---

## Development and serving

```bash
npm run dev       # python3 -m http.server 3000
```

iPhone access via Tailscale. **One-time setup only** (persists across restarts):

```bash
npm run tailscale-setup   # tailscale serve --bg http://localhost:3000
```

After setup, `npm run dev` is all that's needed. Open the Mac's Tailscale HTTPS hostname on the iPhone (e.g. `https://imac-pro.pizzly-algol.ts.net`). Both devices must be on the same Tailnet.

---

## Hard constraints

### Camera and DeviceOrientation require a secure context
Both APIs are HTTPS-only (or `localhost`). On iPhone this means the Tailscale HTTPS URL — plain HTTP will not work, even via Tailscale magic DNS.

### iOS requires a user gesture to request DeviceOrientation permission
`DeviceOrientationEvent.requestPermission()` must be called from inside a user-initiated event handler (tap). The splash "Begin" button triggers all three permissions in sequence: orientation → geolocation → camera.

### `webkitCompassHeading` vs `alpha`
iOS provides `event.webkitCompassHeading` (degrees clockwise from magnetic north, 0–360). Android/standard uses `event.alpha` (degrees anticlockwise). Both handled in `compass.js`. Only set `_orientationFired = true` when a non-null value is received — desktop Chrome fires a null event on listener attach and must not be treated as a real compass.

### Camera failure is non-fatal
If `getUserMedia` is denied or stalls (desktop), the app proceeds without a live feed — just a dark background. The compass and landfall logic still work. `video.play()` has a 3-second timeout via `Promise.race`.

---

## Landfall algorithm

Walk the great-circle bearing in 50 km steps. Use an `inOcean` state machine to skip the user's own coastline:

```
inOcean = false
for dist in 50..20000 step 50km:
    point = destinationPoint(userLon, userLat, bearing, dist)
    onLand = d3.geoContains(landFeature, point)
    if !inOcean && !onLand → inOcean = true
    if inOcean && onLand → return { point, dist, name: countryAt(point) }
return null  → show "Open ocean"
```

Max range 20,000 km. The result is **cached by rounded heading integer** in `main.js` (`lastHeadingInt`) — `findLandfall` only reruns when the heading changes by at least 0.5°. This keeps the RAF loop fast.

---

## Distance display

Internal calculations are in km throughout. `geodesy.js` exports `kmToMiles(km)` (× 0.621371). All user-facing distances are converted in `overlay.js` before rendering. Never change internal step sizes or algorithm distances — only the display layer converts.

---

## Country naming

`landfall.js` contains an inline ISO 3166-1 numeric → country name lookup table (`ISO_NAMES`). The world-atlas TopoJSON uses numeric IDs with no embedded names. If a country is missing from the table, it falls back to `"Territory <id>"`.

---

## Desktop testing

The bearing slider appears 1 second after Begin if no real orientation events fire. It is pre-set to 305° (Land's End → Newfoundland, Canada). Mock GPS defaults to Land's End (50.066°N, 5.715°W) in `compass.js`. Expected desktop results: 305° → Canada ~2,300 mi; 000° → United Kingdom ~311 mi.
