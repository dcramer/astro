const ALLOWED_ORIGINS = new Set([
  "https://cra.mr",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:4322",
  "http://127.0.0.1:4322",
]);

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("vary");
  if (!current) {
    headers.set("vary", value);
    return;
  }

  const values = current
    .split(",")
    .map((item) => item.trim().toLowerCase());

  if (!values.includes(value.toLowerCase())) {
    headers.set("vary", `${current}, ${value}`);
  }
}

export function withCorsHeaders(
  request: Request,
  headersInit?: HeadersInit,
): Headers {
  const headers = new Headers(headersInit);
  const origin = request.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    appendVary(headers, "Origin");
  }

  return headers;
}

export function jsonResponse(
  request: Request,
  payload: unknown,
  init?: ResponseInit,
): Response {
  const headers = withCorsHeaders(request, init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

export function textResponse(
  request: Request,
  body: string,
  init?: ResponseInit,
): Response {
  const headers = withCorsHeaders(request, init?.headers);
  return new Response(body, {
    ...init,
    headers,
  });
}
