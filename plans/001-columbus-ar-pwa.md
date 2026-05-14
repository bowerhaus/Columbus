# Columbus PWA — Implementation Plan

**Status: COMPLETE** — all steps implemented and desktop-tested. iPhone test pending (requires Tailscale HTTPS).

## Context

Build a proof-of-concept PWA called **Columbus** at `~/Projects/Columbus`. The user points an iPhone in any direction; the app projects a great-circle bearing from their current coastal position across the ocean and identifies the first landfall, telling them what country/region it is, the bearing and distance, and travel times by sail, air and foot.

## Design decisions (locked in via brainstorm)

| Decision | Choice |
|---|---|
| View | First-person AR — live camera feed is the background |
| Overlay style | Minimal AR + ancient portolan chart aesthetic |
| Interaction | Live update — compass and landfall refresh continuously as phone turns |
| Landfall card | Place name · bearing · distance · sail/fly/walk times |

The overlay palette is warm amber/ochre/sepia on transparent — compass rose, old serif typography, parchment-style frosted card — contrasted against the raw camera feed. Use the **frontend-design skill** for final visual polish.

---

## Technical architecture

### Stack
- Vanilla JS (ES modules, no bundler for PoC)
- D3 v7 (CDN) — `d3.geoContains()` for land detection, geodesic math
- TopoJSON client v3 (CDN)
- Natural Earth 110m data (land polygons + country boundaries, ~400 KB total)
- Service worker (Workbox-free hand-rolled, simple cache-first)

### Key browser APIs
| API | Usage | Notes |
|---|---|---|
| `getUserMedia` | Rear camera as background | `{ video: { facingMode: 'environment' } }` |
| `DeviceOrientationEvent` | Live compass heading | `requestPermission()` required on iOS 13+ from a user gesture |
| `navigator.geolocation` | User's GPS position | One-shot `getCurrentPosition()` on start |

### iOS permission sequencing
1. Show a "Begin" splash with a single tap target
2. On tap: request `DeviceOrientationEvent.requestPermission()` first, then geolocation
3. Only start camera after both are granted

### Great-circle landfall algorithm (`geodesy.js` + `landfall.js`)
```
destinationPoint(lon, lat, bearingDeg, distKm):
  φ2 = asin(sin(φ1)·cos(d/R) + cos(φ1)·sin(d/R)·cos(θ))
  λ2 = λ1 + atan2(sin(θ)·sin(d/R)·cos(φ1), cos(d/R) − sin(φ1)·sin(φ2))

findLandfall(userLon, userLat, bearingDeg):
  inOcean = false
  for dist in 1..20000 step 50km:
    [lon, lat] = destinationPoint(..., dist)
    onLand = d3.geoContains(landFeature, [lon, lat])
    if !inOcean && !onLand → inOcean = true
    if inOcean && onLand → return { lon, lat, dist, name: countryAt(lon, lat) }
  return null
```

The `inOcean` state-machine skips the user's own coastline before searching for the next landfall.

### Travel times
- **Sail**: 10 knots = 18.52 km/h → format as "X days Y hrs"
- **Fly**: 900 km/h → format as "X hrs Y min"
- **Walk**: 5 km/h → format as "X days"

### AR overlay rendering (`overlay.js`)
Canvas element positioned `absolute` over the `<video>` element. On each animation frame:
1. Clear canvas
2. Draw compass rose centred top (portolan style, amber ink aesthetic)
3. Draw fine crosshair at canvas centre
4. Draw bearing readout (e.g. "NNE · 022°") in old serif below compass
5. If landfall found: draw frosted parchment card at bottom with landfall data

### Desktop testing fallback
If `DeviceOrientationEvent` is unavailable (desktop), show a bearing slider (0–360°) so the logic can be exercised without a phone. Mock GPS defaults to Land's End, UK (50.066°N, 5.715°W).

---

## File structure

```
~/Projects/Columbus/
├── index.html                 — App shell, video + canvas layers, splash
├── manifest.json              — PWA manifest (standalone, theme #1a1008)
├── sw.js                      — Service worker, cache-first for shell + data
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── data/
│   ├── land-110m.json         — Natural Earth land polygons (TopoJSON)
│   └── countries-110m.json    — Country boundaries for reverse naming
├── src/
│   ├── main.js                — Orchestration, permission flow, animation loop
│   ├── geodesy.js             — destinationPoint(), haversineDistance()
│   ├── landfall.js            — findLandfall(), countryAt()
│   ├── compass.js             — DeviceOrientation wrapper, geolocation
│   └── overlay.js             — Canvas drawing: compass rose, card, crosshair
└── css/
    └── app.css                — Full-screen layout, video/canvas stack, splash
```

---

## Implementation steps

1. `mkdir -p ~/Projects/Columbus/{data,src,css,icons}` — scaffold dirs
2. Download Natural Earth data:
   - `land-110m.json` from naturalearthdata.com (or CDN)
   - `countries-110m.json`
3. Write `geodesy.js` — `destinationPoint` + `haversineDistance`
4. Write `landfall.js` — `findLandfall` + `countryAt` using D3 + TopoJSON
5. Write `compass.js` — DeviceOrientation wrapper with iOS permission handling + geolocation
6. Write `overlay.js` — canvas renderer for compass rose + bearing + card
7. Write `main.js` — permission flow, RAF loop, wires all modules together
8. Write `index.html` — video element, canvas overlay, splash screen, desktop slider fallback
9. Write `css/app.css` — full-viewport layout, video/canvas stack
10. Write `manifest.json` + `sw.js`
11. Apply **frontend-design skill** to make compass rose, typography, and parchment card visually distinct
12. Generate placeholder icons (192×192 and 512×512)

---

## Verification

- **Desktop**: Open via `npx serve .` (HTTPS not needed for geolocation on localhost). Use bearing slider from Land's End mock position — pointing ~305° should reach Newfoundland (~3,800 km), ~040° should reach Norway.
- **iPhone**: Serve over local HTTPS (e.g. `npx serve . --ssl-cert/--ssl-key` or ngrok). Grant camera + orientation + location. Point phone north from a coastal location and verify landfall.
- **Offline**: Open app, kill network, reload — app shell and data should serve from service worker cache.
- **Edge cases**: Pointing south from Antarctica (no landfall within 20,000 km → show "Open ocean" message). Pointing due north from North Pole.
