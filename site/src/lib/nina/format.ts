export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    if (secs === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

export function formatNumber(
  value: number | undefined | null,
  fractionDigits = 2,
): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function formatTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) {
    return "—";
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
