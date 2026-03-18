import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { jsonResponse } from "@/lib/api-response";
import { getLiveApiResponse } from "@/lib/db";

export const GET: APIRoute = async ({ request }) => {
  const payload = await getLiveApiResponse(env);

  return jsonResponse(request, payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
};
