import { useEffect, useState, useRef } from "react";
import type { NinaMountInfo, AdvancedSequenceSnapshot } from "@nina/advanced";
import { findCurrentImagingTarget } from "./overlay-utils";
import { extractTargetWithCoordinates } from "./target-extractor";
import type { TelescopiusTarget } from "../telescopius/client";

export interface CurrentTarget {
  // From N.I.N.A
  name: string;
  ra: number;  // degrees
  dec: number; // degrees

  // Enriched from Telescopius
  fullName?: string;
  type?: string;
  constellation?: string;
  magnitude?: number;
  size?: string;
  catalogIds?: string[];

  // Metadata
  source: "sequence" | "mount" | "manual";
  lastUpdated: Date;
}

interface UseTargetEnrichmentResult {
  currentTarget: CurrentTarget | null;
  isLoadingEnrichment: boolean;
  enrichmentError: string | null;
  lastApiCall: Date | null;
  cachedTargets: number;
}

/**
 * Hook to track the current target and enrich it with Telescopius data
 * Monitors both sequence target names and mount coordinates
 */
export function useTargetEnrichment(
  sequence: AdvancedSequenceSnapshot | null,
  mount: NinaMountInfo | null,
  enabled: boolean = true
): UseTargetEnrichmentResult {
  const [currentTarget, setCurrentTarget] = useState<CurrentTarget | null>(null);
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);
  const [cachedTargets, setCachedTargets] = useState(0);

  // Cache for enriched targets to avoid repeated API calls
  const enrichmentCache = useRef<Map<string, TelescopiusTarget[]>>(new Map());

  // Track previous values to detect changes
  const prevTargetName = useRef<string | null>(null);
  const prevCoordinates = useRef<{ ra: number; dec: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const detectAndEnrichTarget = async () => {
      // Step 1: Detect current target from sequence or mount
      let detectedTarget: Partial<CurrentTarget> | null = null;

      // Try new extraction method first (gets both name and coordinates)
      const extracted = extractTargetWithCoordinates(sequence);
      if (extracted?.name) {
        detectedTarget = {
          name: extracted.name,
          ra: extracted.ra,
          dec: extracted.dec,
          source: "sequence" as const,
        };

        // Target extracted with coordinates

        // If we don't have coordinates from extraction, use mount as fallback
        if (!detectedTarget.ra || !detectedTarget.dec) {
          if (mount?.rightAscensionDegrees && mount?.declinationDegrees) {
            detectedTarget.ra = mount.rightAscensionDegrees;
            detectedTarget.dec = mount.declinationDegrees;
            // Using mount coordinates as fallback
          }
        }
      } else {
        // Fall back to old method
        const sequenceTarget = findCurrentImagingTarget(sequence);
        if (sequenceTarget) {
          detectedTarget = {
            name: sequenceTarget,
            source: "sequence" as const,
          };

          // Use mount coordinates
          if (mount?.rightAscensionDegrees && mount?.declinationDegrees) {
            detectedTarget.ra = mount.rightAscensionDegrees;
            detectedTarget.dec = mount.declinationDegrees;
          }
        }
      }

      if (!detectedTarget) {
        setCurrentTarget(null);
        return;
      }

      // Step 2: Check if target has changed
      const targetChanged =
        detectedTarget.name !== prevTargetName.current ||
        (detectedTarget.ra && detectedTarget.dec && (
          !prevCoordinates.current ||
          Math.abs(detectedTarget.ra - prevCoordinates.current.ra) > 0.5 ||
          Math.abs(detectedTarget.dec - prevCoordinates.current.dec) > 0.5
        ));

      if (!targetChanged && currentTarget) {
        // No change, keep current enriched target
        return;
      }

      // Step 3: Update tracking refs
      prevTargetName.current = detectedTarget.name;
      if (detectedTarget.ra && detectedTarget.dec) {
        prevCoordinates.current = { ra: detectedTarget.ra, dec: detectedTarget.dec };
      }

      // Step 4: Create base target object
      const newTarget: CurrentTarget = {
        name: detectedTarget.name,
        ra: detectedTarget.ra || 0,
        dec: detectedTarget.dec || 0,
        source: detectedTarget.source || "manual",
        lastUpdated: new Date(),
      };

      // Step 5: Try to enrich with Telescopius data
      if (detectedTarget.ra && detectedTarget.dec) {
        // Check cache first
        const cacheKey = `${detectedTarget.ra.toFixed(2)},${detectedTarget.dec.toFixed(2)}`;
        const cached = enrichmentCache.current.get(cacheKey);

        if (cached && cached.length > 0) {
          // Use cached enrichment
          const enrichment = findBestMatch(detectedTarget.name, cached);
          if (enrichment) {
            newTarget.fullName = enrichment.name;
            newTarget.type = enrichment.type;
            newTarget.constellation = enrichment.constellation;
            newTarget.magnitude = enrichment.magnitude;
            newTarget.size = enrichment.size;
            newTarget.catalogIds = enrichment.catalogIds;
          }
          setCachedTargets(enrichmentCache.current.size);
        } else {
          // Fetch from API
          setIsLoadingEnrichment(true);
          setEnrichmentError(null);

          try {
            // Fetching enrichment from Telescopius
            const response = await fetch(
              `/api/telescopius?ra=${detectedTarget.ra}&dec=${detectedTarget.dec}&radius=30&mag_max=16`
            );

            if (response.ok) {
              const data = await response.json();
              const targets = data.targets as TelescopiusTarget[];
              // Got targets from Telescopius

              // Cache the results
              enrichmentCache.current.set(cacheKey, targets);
              setCachedTargets(enrichmentCache.current.size);
              setLastApiCall(new Date());

              // Find best match for enrichment
              const enrichment = findBestMatch(detectedTarget.name, targets);
              if (enrichment) {
                // Found enrichment match
                newTarget.fullName = enrichment.name;
                newTarget.type = enrichment.type;
                newTarget.constellation = enrichment.constellation;
                newTarget.magnitude = enrichment.magnitude;
                newTarget.size = enrichment.size;
                newTarget.catalogIds = enrichment.catalogIds;
              } else {
                // No enrichment match found
              }
            } else {
              console.error(`API response not ok: ${response.status}`);
            }
          } catch (error) {
            console.error("Failed to enrich target:", error);
            setEnrichmentError(error instanceof Error ? error.message : "Unknown error");
          } finally {
            setIsLoadingEnrichment(false);
          }
        }
      }

      setCurrentTarget(newTarget);
    };

    detectAndEnrichTarget();

    // Poll every 5 seconds to check for changes
    const interval = setInterval(detectAndEnrichTarget, 5000);
    return () => clearInterval(interval);
  }, [sequence, mount, enabled, currentTarget]);

  // Clean old cache entries periodically
  useEffect(() => {
    const cleanCache = () => {
      const maxAge = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();

      // Keep a timestamp for each cache entry (would need to enhance this)
      // For now, just limit cache size
      if (enrichmentCache.current.size > 50) {
        // Remove oldest entries (simple FIFO for now)
        const entries = Array.from(enrichmentCache.current.entries());
        enrichmentCache.current.clear();
        entries.slice(-25).forEach(([key, value]) => {
          enrichmentCache.current.set(key, value);
        });
        setCachedTargets(enrichmentCache.current.size);
      }
    };

    const interval = setInterval(cleanCache, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, []);

  return {
    currentTarget,
    isLoadingEnrichment,
    enrichmentError,
    lastApiCall,
    cachedTargets,
  };
}

/**
 * Find the best matching target from Telescopius results
 * Prioritizes exact catalog matches, then closest/brightest objects
 */
function findBestMatch(
  targetName: string,
  telescopiusTargets: TelescopiusTarget[]
): TelescopiusTarget | null {
  if (!telescopiusTargets || telescopiusTargets.length === 0) {
    return null;
  }

  // Clean up the target name for matching - normalize spaces
  const cleanName = targetName.trim().toUpperCase().replace(/\s+/g, " ");
  const cleanNameNoSpace = cleanName.replace(/\s+/g, "");

  // First, try exact catalog ID match with various formats
  for (const target of telescopiusTargets) {
    if (target.catalogIds) {
      for (const id of target.catalogIds) {
        const cleanId = id.trim().toUpperCase().replace(/\s+/g, " ");
        const cleanIdNoSpace = cleanId.replace(/\s+/g, "");

        // Check various formats: "M33", "M 33", etc
        if (cleanId === cleanName ||
            cleanIdNoSpace === cleanNameNoSpace ||
            cleanId === `M ${cleanName}` ||
            cleanId === `NGC ${cleanName}` ||
            cleanId === `IC ${cleanName}` ||
            cleanIdNoSpace === `M${cleanNameNoSpace}` ||
            cleanIdNoSpace === `NGC${cleanNameNoSpace}` ||
            cleanIdNoSpace === `IC${cleanNameNoSpace}`) {
          // Matched target with catalog ID
          return target;
        }
      }
    }
  }

  // Second, try name contains match
  for (const target of telescopiusTargets) {
    if (target.name && target.name.toUpperCase().includes(cleanName)) {
      return target;
    }
  }

  // If the target name looks like coordinates, skip enrichment
  if (cleanName.includes("RA") && cleanName.includes("DEC")) {
    // Just return the closest bright object as context
    const brightTargets = telescopiusTargets
      .filter(t => t.magnitude && t.magnitude < 12)
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));

    return brightTargets[0] || telescopiusTargets[0];
  }

  // Otherwise, return the closest target
  return telescopiusTargets[0];
}