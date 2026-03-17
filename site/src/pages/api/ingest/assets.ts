import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { verifySignedRequest } from "@/lib/hmac";
import { getRequestSyncHmacSecret } from "@/lib/site-config";

const assetSchema = z.object({
  exposureId: z.string().nullable().optional(),
  assetKey: z.string(),
  contentType: z.string(),
  bodyBase64: z.string(),
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

  let payload: z.infer<typeof assetSchema>;
  try {
    payload = assetSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    console.error("Invalid asset ingest payload", error);
    return new Response("Invalid payload", { status: 400 });
  }

  const bytes = Uint8Array.from(atob(payload.bodyBase64), (char) => char.charCodeAt(0));
  await env.THUMBNAILS.put(payload.assetKey, bytes, {
    httpMetadata: {
      contentType: payload.contentType,
    },
  });

  if (payload.exposureId) {
    await env.DB.prepare(
      `
        UPDATE exposures
        SET thumbnail_key = ?, thumbnail_content_type = ?, updated_at = ?
        WHERE exposure_id = ?
      `,
    )
      .bind(payload.assetKey, payload.contentType, new Date().toISOString(), payload.exposureId)
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
};
