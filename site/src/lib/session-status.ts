import type { StoredSession } from "./site-types";

type SessionStatusInput =
  | Pick<StoredSession, "activeSession" | "stale" | "currentState">
  | null
  | undefined;

export function isSessionOnline(session: SessionStatusInput): boolean {
  return Boolean(session?.activeSession && !session.stale && session.currentState);
}

export type SessionStatusTone = "online" | "offline" | "completed" | "waiting";

export function getSessionStatusTone(session: SessionStatusInput): SessionStatusTone {
  if (!session) {
    return "waiting";
  }

  if (isSessionOnline(session)) {
    return "online";
  }

  if (session.activeSession) {
    return "offline";
  }

  return "completed";
}

export function getSessionStatusLabel(session: SessionStatusInput): string {
  const tone = getSessionStatusTone(session);

  switch (tone) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "completed":
      return "Completed";
    case "waiting":
    default:
      return "Waiting";
  }
}
