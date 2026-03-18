import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { jsonResponse } from "@/lib/api-response";
import { getRecentSessions } from "@/lib/db";

function parseLimit(value: string | null, fallback: number, max: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 60, 120);
  const sessions = await getRecentSessions(env, limit);

  return jsonResponse(
    request,
    { sessions },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
};
