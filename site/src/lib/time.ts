export type LocalTimeFormat = "time" | "date-time" | "date-time-short";

export function normalizeTimestamp(value: string | number | Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function getDateTimeFormatter(format: LocalTimeFormat): Intl.DateTimeFormat {
  switch (format) {
    case "time":
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    case "date-time-short":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    case "date-time":
    default:
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  }
}

export function formatLocalTimeFallback(
  value: string | null | undefined,
  format: LocalTimeFormat,
): string {
  if (!value) {
    return "—";
  }

  const normalized = normalizeTimestamp(value);
  if (!normalized) {
    return "—";
  }

  return getDateTimeFormatter(format).format(new Date(normalized));
}
