import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { NO_STORE_HEADERS, jsonResponse } from "@/lib/api-response";
import { getLiveApiResponse } from "@/lib/db";

export const GET: APIRoute = async ({ request }) => {
  const payload = await getLiveApiResponse(env);

  return jsonResponse(request, payload, {
    headers: NO_STORE_HEADERS,
  });
};
