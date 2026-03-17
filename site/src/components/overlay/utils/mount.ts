import type { NinaMountInfo } from "@nina/advanced";

function normalizeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatHourAngle(hours: number | null | undefined): string | null {
  if (hours === undefined || hours === null || !Number.isFinite(hours)) {
    return null;
  }

  let totalSeconds = Math.round((((hours % 24) + 24) % 24) * 3600);

  let hh = Math.floor(totalSeconds / 3600);
  totalSeconds -= hh * 3600;
  let mm = Math.floor(totalSeconds / 60);
  totalSeconds -= mm * 60;
  let ss = totalSeconds;

  if (ss === 60) {
    ss = 0;
    mm += 1;
  }
  if (mm === 60) {
    mm = 0;
    hh = (hh + 1) % 24;
  }

  const hhString = hh.toString().padStart(2, "0");
  const mmString = mm.toString().padStart(2, "0");
  const ssString = ss.toString().padStart(2, "0");
  return `${hhString}h${mmString}m${ssString}s`;
}

function formatHourAngleFromDegrees(degrees: number | null | undefined): string | null {
  if (degrees === undefined || degrees === null || !Number.isFinite(degrees)) {
    return null;
  }
  const normalized = ((degrees % 360) + 360) % 360;
  return formatHourAngle(normalized / 15);
}

function formatDms(
  value: number | null | undefined,
  { signed, wrap360 = false }: { signed: boolean; wrap360?: boolean },
): string | null {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  let numeric = value;
  if (!signed && wrap360) {
    numeric = ((numeric % 360) + 360) % 360;
  }

  let working = Math.abs(numeric);
  let degrees = Math.floor(working);
  working = (working - degrees) * 60;
  let minutes = Math.floor(working);
  let seconds = Math.round((working - minutes) * 60);

  if (seconds === 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes === 60) {
    minutes = 0;
    degrees += 1;
  }

  const sign = numeric < 0 ? "-" : signed ? "+" : "";
  return `${sign}${degrees}°${minutes.toString().padStart(2, "0")}′${seconds
    .toString()
    .padStart(2, "0")}″`;
}

export function formatMountPointing(mount: NinaMountInfo | null): string {
  if (!mount) {
    return "—";
  }

  const raLabel = (() => {
    const explicit = normalizeString(mount.rightAscensionString);
    if (explicit) {
      return explicit.startsWith("RA") ? explicit : `RA ${explicit}`;
    }

    const hours = formatHourAngle(mount.rightAscensionHours);
    if (hours) {
      return `RA ${hours}`;
    }

    const hoursFromDegrees = formatHourAngleFromDegrees(mount.rightAscensionDegrees);
    if (hoursFromDegrees) {
      return `RA ${hoursFromDegrees}`;
    }

    return null;
  })();

  const decLabel = (() => {
    const explicit = normalizeString(mount.declinationString);
    if (explicit) {
      return explicit.startsWith("Dec") ? explicit : `Dec ${explicit}`;
    }

    const dms = formatDms(mount.declinationDegrees, { signed: true });
    if (dms) {
      return `Dec ${dms}`;
    }

    return null;
  })();

  if (raLabel && decLabel) {
    return `${raLabel} · ${decLabel}`;
  }

  const altLabel = (() => {
    const explicit = normalizeString(mount.altitudeString);
    if (explicit) {
      return explicit.startsWith("Alt") ? explicit : `Alt ${explicit}`;
    }

    const formatted = formatDms(mount.altitudeDegrees, { signed: true });
    if (formatted) {
      return `Alt ${formatted}`;
    }

    return null;
  })();

  const azLabel = (() => {
    const explicit = normalizeString(mount.azimuthString);
    if (explicit) {
      return explicit.startsWith("Az") ? explicit : `Az ${explicit}`;
    }

    const formatted = formatDms(mount.azimuthDegrees, { signed: false, wrap360: true });
    if (formatted) {
      return `Az ${formatted}`;
    }

    return null;
  })();

  if (altLabel && azLabel) {
    return `${altLabel} · ${azLabel}`;
  }

  if (raLabel) {
    return raLabel;
  }
  if (decLabel) {
    return decLabel;
  }
  if (altLabel) {
    return altLabel;
  }
  if (azLabel) {
    return azLabel;
  }

  return "—";
}

export function formatMountDisplay(
  mount: NinaMountInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!mount) {
    return "—";
  }

  const pointing = formatMountPointing(mount);
  return pointing;
}