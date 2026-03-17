export type NumericLike = number | string | null | undefined;

export function toNumber(value: NumericLike): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function toPositiveNumber(value: NumericLike): number | null {
  const numeric = toNumber(value);
  return numeric !== null && numeric > 0 ? numeric : null;
}
