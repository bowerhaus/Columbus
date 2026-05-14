import { bearingToCompass, formatTravel, kmToMiles } from './geodesy.js';

const AMBER = 'rgba(212, 165, 60, 0.92)';
const AMBER_DIM = 'rgba(212, 165, 60, 0.45)';
const OCHRE = 'rgba(240, 200, 100, 0.95)';
const SEPIA = 'rgba(80, 45, 10, 0.90)';
const PARCHMENT = 'rgba(240, 220, 165, 0.88)';
const PARCHMENT_BORDER = 'rgba(160, 110, 40, 0.85)';
const RED_N = 'rgba(200, 60, 40, 0.95)';

export function drawFrame(canvas, ctx, { heading, landfall }) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const roseRadius = Math.min(W, H) * 0.13;
  const roseCx = W / 2;
  const roseCy = H * 0.20;

  drawCompassRose(ctx, roseCx, roseCy, roseRadius, heading);
  drawBearingText(ctx, roseCx, roseCy + roseRadius + 28, heading);
  drawCrosshair(ctx, W / 2, H / 2, 36, W);

  if (landfall) {
    drawLandfallCard(ctx, W, H, landfall, heading);
  } else {
    drawOpenOcean(ctx, W, H);
  }
}

function drawCompassRose(ctx, cx, cy, r, headingDeg) {
  ctx.save();
  ctx.translate(cx, cy);
  // Rotate so N points toward current heading at top
  ctx.rotate((-headingDeg) * Math.PI / 180);

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = AMBER_DIM;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 16 tick marks
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16;
    const inner = i % 4 === 0 ? r * 0.7 : r * 0.82;
    ctx.beginPath();
    ctx.moveTo(Math.sin(angle) * inner, -Math.cos(angle) * inner);
    ctx.lineTo(Math.sin(angle) * r, -Math.cos(angle) * r);
    ctx.strokeStyle = i % 4 === 0 ? AMBER : AMBER_DIM;
    ctx.lineWidth = i % 4 === 0 ? 1.5 : 0.8;
    ctx.stroke();
  }

  // 8 main points (diamond shapes)
  const cardinals = [0, 45, 90, 135, 180, 225, 270, 315];
  cardinals.forEach(angleDeg => {
    const angle = angleDeg * Math.PI / 180;
    const isCardinal = angleDeg % 90 === 0;
    const tipLen = isCardinal ? r * 0.85 : r * 0.6;
    const sideLen = isCardinal ? r * 0.12 : r * 0.08;
    const isNorth = angleDeg === 0;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(angle - Math.PI / 2) * sideLen, -Math.cos(angle - Math.PI / 2) * sideLen);
    ctx.lineTo(Math.sin(angle) * tipLen, -Math.cos(angle) * tipLen);
    ctx.lineTo(Math.sin(angle + Math.PI / 2) * sideLen, -Math.cos(angle + Math.PI / 2) * sideLen);
    ctx.closePath();
    ctx.fillStyle = isNorth ? RED_N : (isCardinal ? OCHRE : AMBER_DIM);
    ctx.fill();
    ctx.strokeStyle = isNorth ? 'rgba(160,40,20,0.6)' : AMBER_DIM;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = OCHRE;
  ctx.fill();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cardinal letters (counter-rotated so they stay upright)
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);

  const labels = [
    { letter: 'N', angle: -headingDeg, color: RED_N, bold: true },
    { letter: 'S', angle: 180 - headingDeg, color: OCHRE, bold: false },
    { letter: 'E', angle: 90 - headingDeg, color: OCHRE, bold: false },
    { letter: 'W', angle: 270 - headingDeg, color: OCHRE, bold: false },
  ];

  labels.forEach(({ letter, angle, color, bold }) => {
    const rad = angle * Math.PI / 180;
    const lx = Math.sin(rad) * (r * 1.22);
    const ly = -Math.cos(rad) * (r * 1.22);
    ctx.font = `${bold ? '700' : '500'} ${Math.round(r * 0.28)}px 'Cinzel', Georgia, serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, lx, ly);
  });

  ctx.restore();
}

function drawBearingText(ctx, x, y, heading) {
  const deg = Math.round(((heading % 360) + 360) % 360);
  const compass = bearingToCompass(deg);
  const text = `${compass}  ·  ${String(deg).padStart(3, '0')}°`;

  ctx.save();
  ctx.font = "600 17px 'Cinzel', Georgia, serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';

  // Shadow for readability over camera feed
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = OCHRE;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCrosshair(ctx, cx, cy, size, W) {
  ctx.save();
  ctx.strokeStyle = 'rgba(240, 200, 100, 0.55)';
  ctx.lineWidth = 1;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(W, cy);
  ctx.stroke();

  // Vertical crosshair ticks
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = OCHRE;
  ctx.fill();

  ctx.restore();
}

function drawLandfallCard(ctx, W, H, landfall, heading) {
  const { name, dist } = landfall;
  const { sail, fly, walk } = formatTravel(dist);
  const deg = Math.round(((heading % 360) + 360) % 360);
  const compass = bearingToCompass(deg);
  const miles = kmToMiles(dist);
  const distStr = miles >= 1000 ? `${Math.round(miles / 100) / 10}k mi` : `${Math.round(miles)} mi`;

  const cardW = Math.min(W - 32, 380);
  const cardH = 110;
  const cardX = (W - cardW) / 2;
  const cardY = H - cardH - 28;
  const r = 12;

  // Parchment card background
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 16;
  roundRect(ctx, cardX, cardY, cardW, cardH, r);
  ctx.fillStyle = PARCHMENT;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PARCHMENT_BORDER;
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, r);
  ctx.stroke();
  ctx.restore();

  const mx = cardX + cardW / 2;

  // Place name
  ctx.save();
  ctx.font = "700 22px 'Cinzel', Georgia, serif";
  ctx.fillStyle = SEPIA;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name, mx, cardY + 12);
  ctx.restore();

  // Bearing + distance row
  ctx.save();
  ctx.font = "500 13px 'Cinzel', Georgia, serif";
  ctx.fillStyle = 'rgba(80,45,10,0.75)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${compass}  ·  ${String(deg).padStart(3, '0')}°  ·  ${distStr}`, mx, cardY + 40);
  ctx.restore();

  // Divider
  ctx.save();
  ctx.strokeStyle = PARCHMENT_BORDER;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cardX + 20, cardY + 60);
  ctx.lineTo(cardX + cardW - 20, cardY + 60);
  ctx.stroke();
  ctx.restore();

  // Travel times
  const timeY = cardY + 68;
  const cols = [
    { label: 'SAIL', value: sail, x: cardX + cardW * 0.18 },
    { label: 'FLY', value: fly, x: cardX + cardW * 0.50 },
    { label: 'WALK', value: walk, x: cardX + cardW * 0.82 },
  ];

  cols.forEach(({ label, value, x }) => {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = "400 9px 'Cinzel', Georgia, serif";
    ctx.fillStyle = 'rgba(80,45,10,0.55)';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x, timeY);

    ctx.font = "600 14px 'Cinzel', Georgia, serif";
    ctx.fillStyle = SEPIA;
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, timeY + 13);
    ctx.restore();
  });
}

function drawOpenOcean(ctx, W, H) {
  const text = 'Open ocean';
  const y = H - 60;

  ctx.save();
  ctx.font = "500 16px 'Cinzel', Georgia, serif";
  ctx.fillStyle = 'rgba(240, 200, 100, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
