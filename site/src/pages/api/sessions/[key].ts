import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { jsonResponse, textResponse } from "@/lib/api-response";
import { getSessionByKey } from "@/lib/db";

export const GET: APIRoute = async ({ params, request }) => {
  const sessionKey = params.key ? decodeURIComponent(params.key) : "";
  const session = sessionKey ? await getSessionByKey(env, sessionKey) : null;

  if (!session) {
    return textResponse(request, "Session not found", { status: 404 });
  }

  return jsonResponse(
    request,
    { session },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
};
