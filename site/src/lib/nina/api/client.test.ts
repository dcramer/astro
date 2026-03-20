import assert from "node:assert/strict";
import test from "node:test";

import { z } from "zod";

import { fetchAdvancedResponse } from "./client";

function mockJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

test("fetchAdvancedResponse accepts JSON-encoded envelope responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    mockJsonResponse({
      Success: true,
      Response: JSON.stringify([
        {
          Name: "Rosette",
          Status: "RUNNING",
        },
      ]),
    })) as typeof fetch;

  try {
    const response = await fetchAdvancedResponse(
      "http://example.test",
      "/v2/api/sequence/json",
      z.array(
        z.object({
          Name: z.string(),
          Status: z.string().optional(),
        }),
      ),
    );

    assert.deepEqual(response, [
      {
        Name: "Rosette",
        Status: "RUNNING",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
