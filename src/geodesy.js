const R = 6371;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const KM_TO_MI = 0.621371;

export function kmToMiles(km) {
  return km * KM_TO_MI;
}

export function destinationPoint(lon, lat, bearingDeg, distKm) {
  const φ1 = lat * RAD;
  const λ1 = lon * RAD;
  const θ = bearingDeg * RAD;
  const δ = distKm / R;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  return [
    ((λ2 * DEG) + 540) % 360 - 180,
    φ2 * DEG,
  ];
}

export function haversineDistance(lon1, lat1, lon2, lat2) {
  const φ1 = lat1 * RAD;
  const φ2 = lat2 * RAD;
  const Δφ = (lat2 - lat1) * RAD;
  const Δλ = (lon2 - lon1) * RAD;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingToCompass(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

export function formatTravel(distKm) {
  const sailH = distKm / 18.52;
  const flyH = distKm / 900;
  const walkH = distKm / 5;

  const sailDays = Math.floor(sailH / 24);
  const sailHrs = Math.floor(sailH % 24);
  const sail = sailDays > 0 ? `${sailDays}d ${sailHrs}h` : `${Math.floor(sailH)}h`;

  const flyHrs = Math.floor(flyH);
  const flyMin = Math.round((flyH % 1) * 60);
  const fly = flyHrs > 0 ? `${flyHrs}h ${flyMin}m` : `${flyMin}m`;

  const walkDays = Math.round(walkH / 24);
  const walk = `${walkDays}d`;

  return { sail, fly, walk };
}
