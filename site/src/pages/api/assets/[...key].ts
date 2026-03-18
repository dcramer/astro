import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { withCorsHeaders } from "@/lib/api-response";

export const GET: APIRoute = async (context) => {
  const key = context.params.key;

  if (!key) {
    return new Response("Missing asset key", { status: 400 });
  }

  const normalizedKey = key
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");

  const object = await env.THUMBNAILS.get(normalizedKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(await object.arrayBuffer(), {
    headers: withCorsHeaders(context.request, {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    }),
  });
};
