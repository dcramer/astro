import { getFetchTimeoutMs } from "../config";
import { logAdvancedWarning, shouldLogFailure, clearFailureLog } from "./logging";
import type { ApiEnvelope } from "./types";
import { apiEnvelopeSchema } from "./schemas";
import type { ZodType } from "zod";

export async function fetchAdvancedEnvelope<T>(
  baseUrl: string,
  path: string,
  responseSchema?: ZodType<T>,
): Promise<ApiEnvelope<T> | null> {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (shouldLogFailure(url)) {
        logAdvancedWarning(
          `Advanced API request to ${url} failed: ${response.status} ${response.statusText}`,
        );
      }
      return null;
    }

    clearFailureLog(url);
    const raw = await response.json();
    if (!responseSchema) {
      return raw as ApiEnvelope<T>;
    }

    const parsed = apiEnvelopeSchema(responseSchema).safeParse(raw);
    if (!parsed.success) {
      if (shouldLogFailure(url)) {
        logAdvancedWarning(
          `Advanced API response from ${url} did not match the expected schema`,
          parsed.error.flatten(),
        );
      }
      return null;
    }

    return parsed.data as ApiEnvelope<T>;
  } catch (error) {
    if (shouldLogFailure(url)) {
      logAdvancedWarning(`Failed to fetch Advanced API endpoint ${url}`, error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAdvancedResponse<T>(
  baseUrl: string,
  path: string,
  responseSchema?: ZodType<T>,
): Promise<T | null> {
  const envelope = await fetchAdvancedEnvelope<T>(baseUrl, path, responseSchema);
  if (!envelope) {
    return null;
  }

  if (envelope.Success === false) {
    if (shouldLogFailure(`${baseUrl}${path}`)) {
      logAdvancedWarning(envelope.Error || `Advanced API request to ${path} failed`);
    }
    return null;
  }

  return envelope.Response;
}
