const FAILURE_LOG_COOLDOWN_MS = 60_000;
const MAX_TRACKED_FAILURE_ENDPOINTS = 16;
const lastFailureLog = new Map<string, number>();

function stampFailure(key: string, timestamp: number) {
  if (lastFailureLog.size >= MAX_TRACKED_FAILURE_ENDPOINTS) {
    const oldestKey = lastFailureLog.keys().next().value;
    if (oldestKey) {
      lastFailureLog.delete(oldestKey);
    }
  }
  lastFailureLog.set(key, timestamp);
}

export function shouldLogFailure(key: string): boolean {
  const now = Date.now();
  const last = lastFailureLog.get(key);
  if (last && now - last < FAILURE_LOG_COOLDOWN_MS) {
    return false;
  }
  stampFailure(key, now);
  return true;
}

export function clearFailureLog(key: string) {
  if (lastFailureLog.has(key)) {
    lastFailureLog.delete(key);
  }
}

export function logAdvancedWarning(message: string, error?: unknown) {
  if (error && error instanceof Error && error.name === "AbortError") {
    console.warn(`${message} (timed out)`);
    return;
  }

  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}
