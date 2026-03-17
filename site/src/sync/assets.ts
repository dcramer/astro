import type { NinaImageHistoryEntry } from "../lib/nina";
import type { NinaStretchOptions } from "../lib/nina/session";
import type { SessionLivePreview } from "../lib/site-types";
import { normalizeTimestamp } from "../lib/time";

export interface GeneratedAsset {
  bodyBase64: string;
  contentType: string;
}

export interface GeneratedExposureAssetResult {
  asset: GeneratedAsset | null;
  reason: string | null;
  sourceUrl: string | null;
}

interface SessionViewerImageStatus {
  id: string;
  cached: string;
  urlPath: string;
}

const DEFAULT_STRETCH_OPTIONS: NinaStretchOptions = {
  autoStretchFactor: 0.2,
  blackClipping: -2.8,
  unlinkedStretch: true,
};

const SESSION_VIEWER_IMAGE_SCALE = 0.5;
const SESSION_VIEWER_IMAGE_QUALITY = 85;

function toGeneratedAsset(bytes: Uint8Array, contentType = "image/jpeg"): GeneratedAsset {
  return {
    bodyBase64: Buffer.from(bytes).toString("base64"),
    contentType,
  };
}

function getStretchOptions(stretchOptions: NinaStretchOptions | null | undefined): NinaStretchOptions {
  return stretchOptions ?? DEFAULT_STRETCH_OPTIONS;
}

export async function createSessionViewerExposureAsset(input: {
  sessionBaseUrl: string;
  sessionKey: string;
  exposureId: string;
  fullPath: string | null;
  stretchOptions: NinaStretchOptions | null | undefined;
}): Promise<GeneratedExposureAssetResult> {
  if (!input.fullPath) {
    return {
      asset: null,
      reason: "No source path was recorded for this exposure.",
      sourceUrl: null,
    };
  }

  const createResponse = await fetch(`${input.sessionBaseUrl}/api/1020/image/create`, {
    method: "PUT",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      sessionName: input.sessionKey,
      id: input.exposureId,
      fullPath: input.fullPath,
      stretchOptions: getStretchOptions(input.stretchOptions),
      imageScale: SESSION_VIEWER_IMAGE_SCALE,
      qualityLevel: SESSION_VIEWER_IMAGE_QUALITY,
    }),
  });

  if (!createResponse.ok) {
    return {
      asset: null,
      reason: `Session viewer image/create failed for ${input.exposureId}: ${createResponse.status} ${createResponse.statusText}`,
      sourceUrl: null,
    };
  }

  let status: SessionViewerImageStatus;
  try {
    status = (await createResponse.json()) as SessionViewerImageStatus;
  } catch (error) {
    return {
      asset: null,
      reason: `Session viewer image/create returned invalid JSON for ${input.exposureId}: ${String(error)}`,
      sourceUrl: null,
    };
  }

  if (!status.urlPath) {
    return {
      asset: null,
      reason: `Session viewer image/create returned no urlPath for ${input.exposureId}`,
      sourceUrl: null,
    };
  }

  const imageUrl = new URL(status.urlPath, input.sessionBaseUrl).toString();
  const imageResponse = await fetch(imageUrl, {
    headers: {
      Accept: "image/*",
    },
  });

  if (!imageResponse.ok) {
    return {
      asset: null,
      reason: `Session viewer rendered image fetch failed for ${input.exposureId}: ${imageResponse.status} ${imageResponse.statusText}`,
      sourceUrl: imageUrl,
    };
  }

  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  if (!bytes.length) {
    return {
      asset: null,
      reason: `Session viewer rendered image was empty for ${input.exposureId}`,
      sourceUrl: imageUrl,
    };
  }

  const contentType = imageResponse.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return {
      asset: null,
      reason: `Session viewer rendered image had unexpected content type for ${input.exposureId}: ${contentType}`,
      sourceUrl: imageUrl,
    };
  }

  return {
    asset: toGeneratedAsset(bytes, contentType),
    reason: null,
    sourceUrl: imageUrl,
  };
}

export function buildLivePreview(
  sessionKey: string,
  latestImage: NinaImageHistoryEntry | null,
  generatedAsset: GeneratedAsset,
): SessionLivePreview {
  const capturedAt = normalizeTimestamp(latestImage?.startTime) ?? new Date().toISOString();

  return {
    assetKey: `sessions/${sessionKey}/live-preview/latest.jpg`,
    contentType: generatedAsset.contentType,
    capturedAt,
    imageType: latestImage?.imageType ?? null,
    targetName: latestImage?.targetName ?? null,
    filterName: latestImage?.filterName ?? null,
    durationSeconds: latestImage?.exposureDurationSeconds ?? null,
    hfr: latestImage?.hfr ?? null,
  };
}
