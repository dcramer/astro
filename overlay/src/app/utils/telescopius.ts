import type { NinaMountInfo } from "@nina/advanced";

/**
 * Fetch astronomical targets from Telescopius API based on mount coordinates
 */
export async function fetchTelescopiusTargets(
  mount: NinaMountInfo | null,
  radius: number = 30,
  lat?: number,
  lon?: number,
) {
  if (!mount || !mount.rightAscensionDegrees || !mount.declinationDegrees) {
    return null;
  }

  try {
    let url = `/api/telescopius?ra=${mount.rightAscensionDegrees}&dec=${mount.declinationDegrees}&radius=${radius}`;

    // Add observer location if provided
    if (lat !== undefined && lon !== undefined) {
      url += `&lat=${lat}&lon=${lon}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch targets:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Telescopius targets:", error);
    return null;
  }
}