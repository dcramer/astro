import { z } from "zod";
import { TelescopiusSearchResponseSchema, type TelescopiusDSO, type TelescopiusSearchResponse } from "./schema";

export interface TelescopiusTarget {
  name: string;
  catalogId: string;
  type: string;
  constellation?: string;
  magnitude?: number;
  size?: string;
  distance: number; // in arcminutes from search center
  thumbnailUrl?: string;
  catalogIds: string[];
}

export interface TelescopiusSearchResult {
  targets: TelescopiusTarget[];
  searchRadius: number; // in arcminutes
  searchCoordinates: {
    ra: number;
    dec: number;
  };
  totalMatched: number;
}

const TELESCOPIUS_API_BASE = "https://api.telescopius.com/v2.0";

export class TelescopiusClient {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TELESCOPIUS_API_KEY;
  }

  /**
   * Search for astronomical targets near given coordinates using v2.0 API
   * @param ra Right Ascension in degrees
   * @param dec Declination in degrees
   * @param radiusDegrees Search radius in degrees (default: 0.5 degrees = 30 arcminutes)
   * @param options Additional search options
   */
  async searchTargets(
    ra: number,
    dec: number,
    radiusDegrees: number = 0.5,
    options: {
      lat?: number;
      lon?: number;
      datetime?: string; // YYYY-MM-DD HH:mm:ss format
      minAltitude?: number; // Minimum altitude in degrees
      types?: string[]; // DSO types to filter
      catalogs?: string[]; // Specific catalogs (M, NGC, etc)
      magMax?: number; // Maximum magnitude (fainter limit)
      computeCurrent?: boolean; // Get current observation data
    } = {},
  ): Promise<TelescopiusSearchResult | null> {
    if (!this.apiKey) {
      console.error("Telescopius API key not configured");
      return null;
    }

    try {
      const url = new URL(`${TELESCOPIUS_API_BASE}/targets/search`);

      // Use dist_max for radius-based search which is cleaner than bounding box
      url.searchParams.append("center_ra", (ra / 15).toString()); // Convert to hours for API
      url.searchParams.append("center_dec", dec.toString());
      url.searchParams.append("dist_max", radiusDegrees.toString());

      // Add observer location if provided (for altitude calculations)
      if (options.lat !== undefined && options.lon !== undefined) {
        url.searchParams.append("lat", options.lat.toString());
        url.searchParams.append("lon", options.lon.toString());
      }

      // Add datetime if specified
      if (options.datetime) {
        url.searchParams.append("datetime", options.datetime);
      }

      // Add minimum altitude filter if specified
      if (options.minAltitude !== undefined) {
        url.searchParams.append("min_alt", options.minAltitude.toString());
      }

      // Add type filters if specified
      if (options.types?.length) {
        url.searchParams.append("types", options.types.join(","));
      }

      // Add catalog filters if specified
      if (options.catalogs?.length) {
        url.searchParams.append("cat", options.catalogs.join(","));
      } else {
        // Default to popular catalogs
        url.searchParams.append("cat", "M,NGC,IC,CALDWELL");
      }

      // Add magnitude filter if specified
      if (options.magMax !== undefined) {
        url.searchParams.append("mag_max", options.magMax.toString());
      }

      // Whether to compute current observation data
      if (options.computeCurrent) {
        url.searchParams.append("compute_current", "1");
      }

      // Reasonable defaults for overlay display
      url.searchParams.append("results_per_page", "25");
      url.searchParams.append("order", "mag"); // Order by magnitude (brightest first)
      url.searchParams.append("order_asc", "true");
      url.searchParams.append("mag_unknown", "true"); // Include objects without known magnitude
      url.searchParams.append("size_unknown", "true"); // Include objects without known size

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Telescopius API error: ${response.status} ${response.statusText}`, errorText);
        return null;
      }

      const data = await response.json();

      // Validate response with Zod schema
      const validated = TelescopiusSearchResponseSchema.safeParse(data);
      if (!validated.success) {
        console.error("Invalid Telescopius API response:", validated.error);
        return null;
      }

      // Transform to our format (note: searchRa should be in degrees for distance calc)
      const targets = this.transformTargets(validated.data, ra, dec);

      return {
        targets,
        searchRadius: radiusDegrees * 60, // Convert to arcminutes
        searchCoordinates: { ra, dec },
        totalMatched: validated.data.matched,
      };
    } catch (error) {
      console.error("Failed to search Telescopius targets:", error);
      return null;
    }
  }

  /**
   * Transform Telescopius API response to our internal format
   */
  private transformTargets(
    response: TelescopiusSearchResponse,
    searchRa: number,
    searchDec: number,
  ): TelescopiusTarget[] {
    return response.page_results.map((item) => {
      const obj = item.object;

      // Convert axis measurements from arcseconds to arcminutes for display
      let sizeStr: string | undefined;
      if (obj.major_axis && obj.minor_axis) {
        const majorArcmin = (obj.major_axis / 60).toFixed(1);
        const minorArcmin = (obj.minor_axis / 60).toFixed(1);
        sizeStr = `${majorArcmin}'×${minorArcmin}'`;
      } else if (obj.major_axis) {
        const majorArcmin = (obj.major_axis / 60).toFixed(1);
        sizeStr = `${majorArcmin}'`;
      }

      // Map object type
      const typeStr = this.mapObjectType(obj.types);

      // Note: obj.ra is in hours from the API, need to convert to degrees for distance calc
      const objRaDegrees = obj.ra * 15;

      return {
        name: obj.main_name || obj.main_id,
        catalogId: obj.main_id,
        type: typeStr,
        constellation: obj.con_name || obj.con || undefined,
        magnitude: obj.visual_mag ?? obj.photo_mag ?? undefined,
        size: sizeStr,
        distance: calculateAngularDistance(searchRa, searchDec, objRaDegrees, obj.dec),
        thumbnailUrl: obj.thumbnail_url ?? undefined,
        catalogIds: obj.ids,
      };
    }).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Map Telescopius object types to friendly names
   */
  private mapObjectType(types: string[]): string {
    const typeMap: Record<string, string> = {
      gal: "Galaxy",
      neb: "Nebula",
      snr: "Supernova Remnant",
      pneb: "Planetary Nebula",
      eneb: "Emission Nebula",
      dineb: "Dark Nebula",
      rneb: "Reflection Nebula",
      stcl: "Star Cluster",
      ocl: "Open Cluster",
      gcl: "Globular Cluster",
      h2r: "HII Region",
      star: "Star",
      dstar: "Double Star",
      mstar: "Multiple Star",
      vstar: "Variable Star",
    };

    // Find the first known type
    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    // Fallback to first type or "Deep Sky Object"
    return types[0] || "Deep Sky Object";
  }
}

/**
 * Calculate angular distance between two points on the celestial sphere
 * @returns Distance in arcminutes
 */
export function calculateAngularDistance(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number,
): number {
  // Convert to radians
  const ra1Rad = (ra1 * Math.PI) / 180;
  const dec1Rad = (dec1 * Math.PI) / 180;
  const ra2Rad = (ra2 * Math.PI) / 180;
  const dec2Rad = (dec2 * Math.PI) / 180;

  // Haversine formula
  const dRA = ra2Rad - ra1Rad;
  const dDec = dec2Rad - dec1Rad;

  const a =
    Math.sin(dDec / 2) * Math.sin(dDec / 2) +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(dRA / 2) * Math.sin(dRA / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Convert radians to arcminutes
  return (c * 180 * 60) / Math.PI;
}