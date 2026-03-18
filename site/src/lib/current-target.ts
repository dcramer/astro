import type { CurrentTargetSnapshot, StoredSession } from "./site-types";

function isSource(
  snapshot: CurrentTargetSnapshot | null | undefined,
  source: CurrentTargetSnapshot["source"],
): boolean {
  return snapshot?.source === source;
}

function getJoinedTargetNames(targetNames: ReadonlyArray<string> | undefined): string | null {
  return targetNames && targetNames.length ? targetNames.join(" / ") : null;
}

export function getPreferredTargetName(input: {
  currentTarget: CurrentTargetSnapshot | null;
  latestExposureTargetName?: string | null;
  targetNames?: ReadonlyArray<string>;
  primaryTargetName?: string | null;
}): string | null {
  const { currentTarget, latestExposureTargetName, targetNames, primaryTargetName } = input;

  return (
    (currentTarget && !isSource(currentTarget, "mount") && !isSource(currentTarget, "catalog")
      ? currentTarget.name
      : null) ??
    latestExposureTargetName ??
    getJoinedTargetNames(targetNames) ??
    primaryTargetName ??
    (isSource(currentTarget, "catalog") ? currentTarget?.name ?? null : null) ??
    currentTarget?.name ??
    null
  );
}

export function getStoredSessionTargetName(session: StoredSession | null): string | null {
  if (!session) {
    return null;
  }

  return getPreferredTargetName({
    currentTarget: session.currentState?.currentTarget ?? null,
    targetNames: session.targetNames,
    primaryTargetName: session.primaryTargetName,
  });
}
