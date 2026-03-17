import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

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
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    },
  });
};
