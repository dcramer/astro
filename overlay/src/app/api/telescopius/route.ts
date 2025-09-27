import { NextRequest, NextResponse } from "next/server";
import { TelescopiusClient } from "@telescopius/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ra = searchParams.get("ra");
  const dec = searchParams.get("dec");
  const radius = searchParams.get("radius"); // in arcminutes
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const datetime = searchParams.get("datetime");
  const minAltitude = searchParams.get("min_altitude");
  const types = searchParams.get("types");
  const catalogs = searchParams.get("catalogs");
  const magMax = searchParams.get("mag_max");
  const computeCurrent = searchParams.get("compute_current");

  if (!ra || !dec) {
    return NextResponse.json(
      { error: "Missing required parameters: ra and dec" },
      { status: 400 },
    );
  }

  const client = new TelescopiusClient();

  // Convert radius from arcminutes to degrees if provided
  const radiusDegrees = radius ? parseFloat(radius) / 60 : 0.5;

  // Build options object
  const options: any = {};
  if (lat) options.lat = parseFloat(lat);
  if (lon) options.lon = parseFloat(lon);
  if (datetime) options.datetime = datetime;
  if (minAltitude) options.minAltitude = parseFloat(minAltitude);
  if (types) options.types = types.split(",");
  if (catalogs) options.catalogs = catalogs.split(",");
  if (magMax) options.magMax = parseFloat(magMax);
  if (computeCurrent === "true" || computeCurrent === "1") options.computeCurrent = true;

  const result = await client.searchTargets(
    parseFloat(ra),
    parseFloat(dec),
    radiusDegrees,
    options,
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to fetch targets from Telescopius" },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}