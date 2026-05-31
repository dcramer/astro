import { NextResponse } from "next/server";

import {
  loadAdvancedStatus,
  loadImageHistory,
  loadMountInfo,
  loadWeatherInfo,
} from "@nina/advanced";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

export async function GET() {
  try {
    const [images, advanced, mount, weather] = await Promise.all([
      loadImageHistory(),
      loadAdvancedStatus(),
      loadMountInfo(),
      loadWeatherInfo(),
    ]);

    return NextResponse.json(
      { images, advanced, mount, weather },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Failed to load overlay session", error);
    return NextResponse.json(
      { error: "Failed to load overlay session" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
