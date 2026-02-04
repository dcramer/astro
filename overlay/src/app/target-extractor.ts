import type { NinaSequenceItem, AdvancedSequenceSnapshot } from "@nina/advanced";

// Type guard for objects with numeric coordinate properties
type CoordinateObject = Record<string, unknown>;

function getNumericProp(obj: CoordinateObject | undefined, ...keys: string[]): number | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number") return val;
  }
  return undefined;
}

function getNestedObject(obj: CoordinateObject | undefined, key: string): CoordinateObject | undefined {
  if (!obj) return undefined;
  const val = obj[key];
  return typeof val === "object" && val !== null ? val as CoordinateObject : undefined;
}

export interface ExtractedTarget {
  name: string;
  ra?: number;  // in degrees
  dec?: number; // in degrees
  source: "sequence";
}

/**
 * Find the current/upcoming target and its coordinates from the sequence
 * Looks for target containers and extracts coordinates from "Slew, center and rotate" or similar steps
 */
export function extractTargetWithCoordinates(
  sequence: AdvancedSequenceSnapshot | null
): ExtractedTarget | null {
  if (!sequence?.items) {
    return null;
  }

  // Helper to extract coordinates from a sequence item's metadata
  function extractCoordinates(item: NinaSequenceItem): { ra?: number; dec?: number } | null {
    if (!item.metadata) return null;

    // Check various possible field names for coordinates
    const metadata = item.metadata as CoordinateObject;

    // Look for RA/Dec in various formats
    let ra: number | undefined;
    let dec: number | undefined;

    // Check for Coordinates field (might be a string or object)
    const coords = getNestedObject(metadata, "Coordinates");
    if (coords) {
      ra = getNumericProp(coords, "RA", "Ra", "ra");
      dec = getNumericProp(coords, "DEC", "Dec", "dec");
    } else if (typeof metadata.Coordinates === "string") {
      // Parse string format if needed
      console.log("Coordinates as string:", metadata.Coordinates);
    }

    // Check for nested Coordinates object (N.I.N.A sometimes nests this)
    const target = getNestedObject(metadata, "Target");
    const targetCoords = getNestedObject(target, "Coordinates");
    if (targetCoords) {
      ra = ra || getNumericProp(targetCoords, "RA", "Ra", "ra");
      dec = dec || getNumericProp(targetCoords, "DEC", "Dec", "dec");
    }

    // Direct fields
    ra = ra || getNumericProp(metadata, "RA", "Ra", "ra", "RightAscension", "RightAscensionHours");
    dec = dec || getNumericProp(metadata, "DEC", "Dec", "dec", "Declination", "DeclinationDegrees");

    // Check TargetRA/TargetDec pattern
    ra = ra || getNumericProp(metadata, "TargetRA", "TargetRa", "Target_RA");
    dec = dec || getNumericProp(metadata, "TargetDEC", "TargetDec", "Target_DEC");

    // Convert from hours to degrees if needed (RA is often in hours)
    if (ra !== undefined && ra < 24) {
      // Likely in hours, convert to degrees
      ra = ra * 15;
    }

    if (ra !== undefined && dec !== undefined) {
      return { ra, dec };
    }

    return null;
  }

  // Helper to find "Slew, center and rotate" or similar steps
  function findSlewStep(items: ReadonlyArray<NinaSequenceItem>): { ra?: number; dec?: number } | null {
    for (const item of items) {
      const nameLower = item.name?.toLowerCase() || "";

      // Check if this is a slew-related step
      if (nameLower.includes("slew") ||
          nameLower.includes("center") ||
          nameLower.includes("rotate") ||
          nameLower.includes("go to")) {

        const coords = extractCoordinates(item);
        if (coords) {
          return coords;
        }
      }

      // Recurse into children
      if (item.items?.length) {
        const coords = findSlewStep(item.items);
        if (coords) return coords;
      }
    }
    return null;
  }

  // Helper to extract target name from container name
  function extractTargetName(containerName: string): string | null {
    // Remove "_Container" or " Container" suffix
    const name = containerName
      .replace(/_Container$/i, "")
      .replace(/ Container$/i, "")
      .trim();

    // Don't return generic names
    if (name.toLowerCase() === "targets" ||
        name.toLowerCase() === "target" ||
        name.toLowerCase() === "prepare target") {
      return null;
    }

    return name;
  }

  // Main search logic - finds the current/next target
  function findTargetInSequence(
    items: ReadonlyArray<NinaSequenceItem>,
    breadcrumb: ReadonlyArray<string> = [],
    currentPath: string[] = []
  ): ExtractedTarget | null {
    for (const item of items) {
      const itemPath = [...currentPath, item.name];

      // Check if this is a Targets_Container
      if (item.name === "Targets_Container" || item.name === "Targets Container") {
        // The first child is the current/next target
        if (item.items && item.items.length > 0) {
          // Check if we're currently inside one of these target containers
          let targetContainer = item.items![0]; // Default to first (we know items exists from check above)

          // If breadcrumb shows we're inside a specific target, use that one
          if (breadcrumb.length > 0) {
            for (const child of item.items!) {
              if (breadcrumb.includes(child.name)) {
                targetContainer = child;
                // Currently active in target container
                break;
              }
            }
          }

          const targetName = extractTargetName(targetContainer.name);
          if (targetName) {
            // Found the target container, look for coordinates in its children
            const coords = targetContainer.items ? findSlewStep(targetContainer.items) : null;

            // Found target with coordinates

            return {
              name: targetName,
              ra: coords?.ra,
              dec: coords?.dec,
              source: "sequence",
            };
          }
        }
      }

      // Recurse into children
      if (item.items?.length) {
        const result = findTargetInSequence(item.items, breadcrumb, itemPath);
        if (result) return result;
      }
    }

    return null;
  }

  // If we have a breadcrumb, we might be inside a target already
  if (sequence.breadcrumb?.length) {
    // Check if we're inside a target container under Targets_Container
    const targetsIndex = sequence.breadcrumb.findIndex(
      seg => seg === "Targets_Container" || seg === "Targets Container"
    );

    // Only look for targets if we're inside Targets_Container
    if (targetsIndex !== -1) {
      for (let i = targetsIndex + 1; i < sequence.breadcrumb.length; i++) {
        const segment = sequence.breadcrumb[i];

        // Check if this segment is a target container
        const targetName = extractTargetName(segment);
        if (targetName) {
        // We're inside a target container, find its coordinates
        // Navigate to this container in the sequence
        let currentItems = sequence.items;
        let targetContainer: NinaSequenceItem | null = null;

        // Navigate through the breadcrumb to find the target container
        for (let j = 0; j <= i && currentItems; j++) {
          const breadcrumbSegment = sequence.breadcrumb[j];
          const found = currentItems.find(item => item.name === breadcrumbSegment);
          if (found) {
            if (j === i) {
              targetContainer = found;
            } else {
              currentItems = found.items || [];
            }
          }
        }

        if (targetContainer?.items) {
          const coords = findSlewStep(targetContainer.items);
          return {
            name: targetName,
            ra: coords?.ra,
            dec: coords?.dec,
            source: "sequence",
          };
        }
      }
      }
    }
  }

  // Otherwise, search the entire sequence
  return findTargetInSequence(sequence.items, sequence.breadcrumb || []);
}