export function calculateAngularDistance(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number
): number {
  const ra1Rad = (ra1 * Math.PI) / 180;
  const dec1Rad = (dec1 * Math.PI) / 180;
  const ra2Rad = (ra2 * Math.PI) / 180;
  const dec2Rad = (dec2 * Math.PI) / 180;

  const dRA = ra2Rad - ra1Rad;
  const dDec = dec2Rad - dec1Rad;

  const a =
    Math.sin(dDec / 2) * Math.sin(dDec / 2) +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(dRA / 2) * Math.sin(dRA / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (c * 180 * 60) / Math.PI;
}

export function isInRadius(
  targetRa: number,
  targetDec: number,
  searchRa: number,
  searchDec: number,
  radiusArcmin: number
): boolean {
  return calculateAngularDistance(targetRa, targetDec, searchRa, searchDec) <= radiusArcmin;
}

export function normalizeRA(ra: number): number {
  while (ra < 0) ra += 360;
  while (ra >= 360) ra -= 360;
  return ra;
}

export function parseRA(raString: string): number {
  const parts = raString.split(/[hms\s]+/).filter(Boolean);
  if (parts.length !== 3) throw new Error(`Invalid RA format: ${raString}`);

  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  if (!isFinite(hours) || !isFinite(minutes) || !isFinite(seconds)) {
    throw new Error(`Invalid RA values: ${raString}`);
  }

  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    throw new Error(`RA values out of range: ${raString}`);
  }

  const ra = (hours + minutes / 60 + seconds / 3600) * 15;
  return normalizeRA(ra);
}

export function parseDec(decString: string): number {
  const isNegative = decString.includes('-');
  const parts = decString.replace(/[°′″'"dms\s-]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 3) throw new Error(`Invalid Dec format: ${decString}`);

  const degrees = Math.abs(parseFloat(parts[0]));
  const arcminutes = parseFloat(parts[1]);
  const arcseconds = parseFloat(parts[2]);

  if (!isFinite(degrees) || !isFinite(arcminutes) || !isFinite(arcseconds)) {
    throw new Error(`Invalid Dec values: ${decString}`);
  }

  if (degrees > 90 || arcminutes < 0 || arcminutes >= 60 || arcseconds < 0 || arcseconds >= 60) {
    throw new Error(`Dec values out of range: ${decString}`);
  }

  const decimal = degrees + arcminutes / 60 + arcseconds / 3600;
  const result = isNegative ? -decimal : decimal;

  if (Math.abs(result) > 90) {
    throw new Error(`Declination out of range: ${result}° (must be [-90, 90])`);
  }

  return result;
}