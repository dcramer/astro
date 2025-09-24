import { NextResponse } from "next/server";

import {
  loadAdvancedStatus,
  loadImageHistory,
  loadMountInfo,
  loadWeatherInfo,
} from "@nina/advanced";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [images, advanced, mount, weather] = await Promise.all([
      loadImageHistory(),
      loadAdvancedStatus(),
      loadMountInfo(),
      loadWeatherInfo(),
    ]);

    return NextResponse.json({ images, advanced, mount, weather });
  } catch (error) {
    console.error("Failed to load overlay session", error);
    return NextResponse.json(
      { error: "Failed to load overlay session" },
      { status: 500 },
    );
  }
}
