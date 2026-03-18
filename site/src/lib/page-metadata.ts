import { formatDuration } from "@nina/format";

import { getStoredSessionTargetName } from "./current-target";
import { isSessionOnline } from "./session-status";
import type { LiveApiResponse, StoredSession } from "./site-types";

export const SITE_NAME = "astro.cra.mr";
const DEFAULT_DESCRIPTION = "Astrophotography session status and archive.";

export interface PageMetadata {
  title: string;
  description: string;
  imagePath: string | null;
  imageAlt: string | null;
  ogType: "website" | "article";
  publishedTime: string | null;
  modifiedTime: string | null;
}

function formatIntegration(totalExposureSeconds: number): string {
  return totalExposureSeconds > 0 ? formatDuration(totalExposureSeconds) : "no integration yet";
}

function getSessionTargetName(session: StoredSession | null): string | null {
  return getStoredSessionTargetName(session);
}

export function buildHomePageMetadata(live: LiveApiResponse): PageMetadata {
  const session = live.session;
  const targetName = getSessionTargetName(session);

  if (!session) {
    return {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      imagePath: null,
      imageAlt: null,
      ogType: "website",
      publishedTime: null,
      modifiedTime: null,
    };
  }

  const sessionSummary = `${session.exposureCount} valid subs, ${formatIntegration(session.totalExposureSeconds)}.`;
  const liveImage =
    live.liveMode === "active-pending"
      ? null
      : live.images.find((image) => image.detectedStars !== null && image.thumbnailUrl)?.thumbnailUrl ??
        session.heroThumbnailUrl ??
        null;
  const imageAlt = targetName ? `${targetName} latest sub` : "Latest archived sub";
  const description =
    live.liveMode === "active-pending"
      ? targetName
        ? `Active session for ${targetName}. Sequence is running and waiting for the first valid sub.`
        : "Active astrophotography session. Sequence is running and waiting for the first valid sub."
      : isSessionOnline(session)
        ? targetName
          ? `Online session for ${targetName}. ${sessionSummary}`
          : `Online astrophotography session. ${sessionSummary}`
        : session.activeSession
          ? targetName
            ? `Offline session for ${targetName}. ${sessionSummary}`
            : `Offline astrophotography session. ${sessionSummary}`
          : targetName
            ? `Recent session for ${targetName}. ${sessionSummary}`
            : `Recent astrophotography session. ${sessionSummary}`;

  return {
    title: SITE_NAME,
    description,
    imagePath: liveImage,
    imageAlt: liveImage ? imageAlt : null,
    ogType: "website",
    publishedTime: session.startedAt,
    modifiedTime: session.endedAt ?? session.lastSeenAt,
  };
}

export function buildArchivePageMetadata(sessions: ReadonlyArray<StoredSession>): PageMetadata {
  const latestSession = sessions[0] ?? null;

  return {
    title: `Session History · ${SITE_NAME}`,
    description: `Recent archived astrophotography sessions on ${SITE_NAME}.`,
    imagePath: latestSession?.heroThumbnailUrl ?? null,
    imageAlt: getSessionTargetName(latestSession) ?? "Archived session",
    ogType: "website",
    publishedTime: latestSession?.startedAt ?? null,
    modifiedTime: latestSession?.endedAt ?? latestSession?.lastSeenAt ?? null,
  };
}

export function buildSessionPageMetadata(session: StoredSession | null): PageMetadata {
  if (!session) {
    return {
      title: `Session not found · ${SITE_NAME}`,
      description: "Requested session could not be found.",
      imagePath: null,
      imageAlt: null,
      ogType: "article",
      publishedTime: null,
      modifiedTime: null,
    };
  }

  const targetName = getSessionTargetName(session) ?? session.displayName;
  const statusPrefix = isSessionOnline(session)
    ? "Online session"
    : session.activeSession
      ? "Offline session"
      : "Completed session";

  return {
    title: `${targetName} · ${SITE_NAME}`,
    description: `${statusPrefix} with ${session.exposureCount} valid subs and ${formatIntegration(session.totalExposureSeconds)}.`,
    imagePath: session.heroThumbnailUrl,
    imageAlt: targetName,
    ogType: "article",
    publishedTime: session.startedAt,
    modifiedTime: session.endedAt ?? session.lastSeenAt,
  };
}

export function toAbsoluteUrl(baseUrl: URL, path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  return new URL(path, baseUrl).toString();
}

export interface OEmbedPayload {
  version: "1.0";
  type: "link";
  provider_name: string;
  provider_url: string;
  title: string;
  author_name: string;
  author_url: string;
  cache_age: 300;
  thumbnail_url?: string;
}

export function buildOEmbedPayload(
  pageUrl: URL,
  metadata: PageMetadata,
): OEmbedPayload {
  const absoluteImageUrl = toAbsoluteUrl(pageUrl, metadata.imagePath);

  return {
    version: "1.0",
    type: "link",
    provider_name: SITE_NAME,
    provider_url: pageUrl.origin,
    title: metadata.title,
    author_name: SITE_NAME,
    author_url: pageUrl.origin,
    cache_age: 300,
    ...(absoluteImageUrl ? { thumbnail_url: absoluteImageUrl } : {}),
  };
}
