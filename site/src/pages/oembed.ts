import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import {
  getLiveApiResponse,
  getRecentSessions,
  getSessionByKey,
} from "@/lib/db";
import {
  buildArchivePageMetadata,
  buildHomePageMetadata,
  buildOEmbedPayload,
  buildSessionPageMetadata,
} from "@/lib/page-metadata";

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const format = requestUrl.searchParams.get("format");

  if (format && format !== "json") {
    return new Response("Unsupported oEmbed format", { status: 400 });
  }

  const rawPageUrl = requestUrl.searchParams.get("url");
  if (!rawPageUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let pageUrl: URL;
  try {
    pageUrl = new URL(rawPageUrl);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  const pathname = normalizePathname(pageUrl.pathname);
  let payload;

  if (pathname === "/") {
    payload = buildOEmbedPayload(pageUrl, buildHomePageMetadata(await getLiveApiResponse(env)));
  } else if (pathname === "/sessions") {
    payload = buildOEmbedPayload(pageUrl, buildArchivePageMetadata(await getRecentSessions(env, 60)));
  } else if (pathname.startsWith("/sessions/")) {
    const sessionKey = decodeURIComponent(pathname.slice("/sessions/".length));
    const session = sessionKey ? await getSessionByKey(env, sessionKey) : null;

    if (!session) {
      return new Response("Session not found", { status: 404 });
    }

    payload = buildOEmbedPayload(pageUrl, buildSessionPageMetadata(session));
  } else {
    return new Response("Unsupported url", { status: 404 });
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "application/json+oembed; charset=utf-8",
    },
  });
};
