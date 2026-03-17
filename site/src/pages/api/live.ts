import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { getLiveApiResponse } from "@/lib/db";

export const GET: APIRoute = async () => {
  const payload = await getLiveApiResponse(env);

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
