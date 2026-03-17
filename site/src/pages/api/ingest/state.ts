import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { upsertSessions } from "@/lib/db";
import { verifySignedRequest } from "@/lib/hmac";
import { getRequestSyncHmacSecret } from "@/lib/site-config";
import type { IngestStatePayload } from "@/lib/site-types";

const exposureSchema = z.object({
  exposureId: z.string(),
  exposureIndex: z.number().int().nullable(),
  targetName: z.string().nullable(),
  fileName: z.string().nullable(),
  fullPath: z.string().nullable(),
  startedAt: z.string(),
  epochMilliseconds: z.number().int().nullable(),
  durationSeconds: z.number(),
  filterName: z.string().nullable(),
  detectedStars: z.number().int().nullable(),
  hfr: z.number().nullable(),
  guidingRms: z.number().nullable(),
  guidingRmsArcSec: z.number().nullable(),
  guidingRmsRa: z.number().nullable(),
  guidingRmsRaArcSec: z.number().nullable(),
  guidingRmsDec: z.number().nullable(),
  guidingRmsDecArcSec: z.number().nullable(),
  focuserTemperature: z.number().nullable(),
  weatherTemperature: z.number().nullable(),
  thumbnailKey: z.string().nullable(),
  thumbnailContentType: z.string().nullable(),
});

const stateSchema = z.object({
  syncedAt: z.string(),
  sessions: z.array(
    z.object({
      sessionKey: z.string(),
      displayName: z.string(),
      startedAt: z.string(),
      endedAt: z.string().nullable(),
      profileName: z.string().nullable(),
      activeSession: z.boolean(),
      sessionStatus: z.string().nullable(),
      lastSeenAt: z.string(),
      currentState: z
        .object({
          syncedAt: z.string(),
          advanced: z.unknown().nullable(),
          mount: z.unknown().nullable(),
          weather: z.unknown().nullable(),
          currentTarget: z
            .object({
              name: z.string(),
              ra: z.number().optional(),
              dec: z.number().optional(),
              source: z.enum(["sequence", "mount", "manual"]),
            })
            .nullable(),
          latestPreview: z
            .object({
              assetKey: z.string(),
              contentType: z.string(),
              capturedAt: z.string(),
              imageType: z.string().nullable(),
              targetName: z.string().nullable(),
              filterName: z.string().nullable(),
              durationSeconds: z.number().nullable(),
              hfr: z.number().nullable(),
            })
            .nullable(),
        })
        .nullable(),
      exposures: z.array(exposureSchema),
    }),
  ),
});

export const POST: APIRoute = async (context) => {
  const rawBody = await context.request.text();
  let secret: string;
  try {
    secret = getRequestSyncHmacSecret(env.SYNC_HMAC_SECRET, context.request.url);
  } catch (error) {
    console.error(error);
    return new Response("Server missing SYNC_HMAC_SECRET", { status: 500 });
  }
  const valid = await verifySignedRequest(
    secret,
    context.request.headers.get("x-astro-timestamp"),
    context.request.headers.get("x-astro-signature"),
    rawBody,
  );

  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: IngestStatePayload;
  try {
    payload = stateSchema.parse(JSON.parse(rawBody)) as IngestStatePayload;
  } catch (error) {
    console.error("Invalid ingest payload", error);
    return new Response("Invalid payload", { status: 400 });
  }

  await upsertSessions(env, payload.sessions);

  return new Response(JSON.stringify({ ok: true, syncedAt: payload.syncedAt }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
};
