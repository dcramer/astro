import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { jsonResponse, textResponse } from "@/lib/api-response";
import { getSessionByKey, getSessionExposures } from "@/lib/db";

function parseLimit(value: string | null, fallback: number, max: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export const GET: APIRoute = async ({ params, request }) => {
  const sessionKey = params.key ? decodeURIComponent(params.key) : "";
  const session = sessionKey ? await getSessionByKey(env, sessionKey) : null;

  if (!session) {
    return textResponse(request, "Session not found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 60, 500);
  const exposures = await getSessionExposures(env, sessionKey, limit);

  return jsonResponse(
    request,
    { exposures },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
};
