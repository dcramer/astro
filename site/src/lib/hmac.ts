const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export async function signMessage(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

export async function verifySignedRequest(
  secret: string,
  timestamp: string | null,
  signature: string | null,
  rawBody: string,
  maxSkewSeconds = 300,
): Promise<boolean> {
  if (!timestamp || !signature) {
    return false;
  }

  const numericTimestamp = Number(timestamp);
  if (!Number.isFinite(numericTimestamp)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - numericTimestamp) > maxSkewSeconds) {
    return false;
  }

  const expected = await signMessage(secret, `${timestamp}.${rawBody}`);
  return timingSafeEqual(expected, signature);
}
