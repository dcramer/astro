import type { APIRoute } from "astro";

import { jsonResponse } from "@/lib/api-response";
import {
  getImageThumbnailUrl,
  loadAdvancedStatus,
  loadImageHistory,
  loadMountInfo,
  loadWeatherInfo,
} from "@nina/advanced";
import { getNinaAdvancedApiBaseUrl } from "@nina/config";

export const GET: APIRoute = async ({ request }) => {
  try {
    const [imagesResult, advancedResult, mountResult, weatherResult] = await Promise.allSettled([
      loadImageHistory(),
      loadAdvancedStatus(),
      loadMountInfo(),
      loadWeatherInfo(),
    ]);
    const images = imagesResult.status === "fulfilled" ? imagesResult.value : [];
    const advanced = advancedResult.status === "fulfilled" ? advancedResult.value : null;
    const mount = mountResult.status === "fulfilled" ? mountResult.value : null;
    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const hadFailures = [imagesResult, advancedResult, mountResult, weatherResult].some(
      (result) => result.status === "rejected",
    );

    if (imagesResult.status === "rejected") {
      console.error("Failed to load overlay image history", imagesResult.reason);
    }
    if (advancedResult.status === "rejected") {
      console.error("Failed to load overlay advanced status", advancedResult.reason);
    }
    if (mountResult.status === "rejected") {
      console.error("Failed to load overlay mount info", mountResult.reason);
    }
    if (weatherResult.status === "rejected") {
      console.error("Failed to load overlay weather info", weatherResult.reason);
    }

    const hasDirectData =
      images.length > 0 ||
      advanced !== null ||
      mount !== null ||
      weather !== null;

    if (!hasDirectData && hadFailures) {
      throw new Error("Direct overlay session is unavailable.");
    }

    const advancedBaseUrl = getNinaAdvancedApiBaseUrl();
    const imagesWithThumbnails = images.map((image) => ({
      ...image,
      thumbnailUrl: advancedBaseUrl && image.originalIndex !== undefined
        ? getImageThumbnailUrl(advancedBaseUrl, image.originalIndex)
        : null,
    }));

    return jsonResponse(request, { images: imagesWithThumbnails, advanced, mount, weather }, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to load overlay session", error);

    return jsonResponse(request, { error: "Failed to load overlay session" }, {
      status: 500,
      headers: {
        "cache-control": "no-store",
      },
    });
  }
};
