import { useEffect, useRef, useState } from "react";

import type { AdvancedSequenceSnapshot, NinaMountInfo } from "@nina/advanced";

import { extractTargetWithCoordinates } from "./target-extractor";
import { findCurrentImagingTarget } from "./utils";

export interface CurrentTarget {
  name: string;
  ra: number;
  dec: number;
  source: "sequence" | "mount" | "manual" | "catalog";
  lastUpdated: Date;
  fullName?: string;
  type?: string;
  constellation?: string;
  magnitude?: number;
  size?: string;
  catalogIds?: string[];
}

interface UseTargetEnrichmentResult {
  currentTarget: CurrentTarget | null;
  isLoadingEnrichment: boolean;
  enrichmentError: string | null;
  lastApiCall: Date | null;
  cachedTargets: number;
}

export function useTargetEnrichment(
  sequence: AdvancedSequenceSnapshot | null,
  mount: NinaMountInfo | null,
  enabled: boolean = true,
): UseTargetEnrichmentResult {
  const [currentTarget, setCurrentTarget] = useState<CurrentTarget | null>(null);
  const prevTargetName = useRef<string | null>(null);
  const prevCoordinates = useRef<{ ra: number; dec: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const detectTarget = () => {
      let detectedTarget: Partial<CurrentTarget> | null = null;

      const extracted = extractTargetWithCoordinates(sequence);
      if (extracted?.name) {
        detectedTarget = {
          name: extracted.name,
          ra: extracted.ra,
          dec: extracted.dec,
          source: "sequence",
        };

        if ((!detectedTarget.ra || !detectedTarget.dec) && mount) {
          detectedTarget.ra = mount.rightAscensionDegrees ?? 0;
          detectedTarget.dec = mount.declinationDegrees ?? 0;
        }
      } else {
        const sequenceTarget = findCurrentImagingTarget(sequence);
        if (sequenceTarget) {
          detectedTarget = {
            name: sequenceTarget,
            ra: mount?.rightAscensionDegrees ?? 0,
            dec: mount?.declinationDegrees ?? 0,
            source: "sequence",
          };
        }
      }

      if (!detectedTarget?.name) {
        setCurrentTarget(null);
        return;
      }

      const targetChanged =
        detectedTarget.name !== prevTargetName.current ||
        ((detectedTarget.ra ?? 0) !== (prevCoordinates.current?.ra ?? 0)) ||
        ((detectedTarget.dec ?? 0) !== (prevCoordinates.current?.dec ?? 0));

      if (!targetChanged && currentTarget) {
        return;
      }

      prevTargetName.current = detectedTarget.name;
      prevCoordinates.current = {
        ra: detectedTarget.ra ?? 0,
        dec: detectedTarget.dec ?? 0,
      };

      setCurrentTarget({
        name: detectedTarget.name,
        ra: detectedTarget.ra ?? 0,
        dec: detectedTarget.dec ?? 0,
        source: detectedTarget.source ?? "manual",
        lastUpdated: new Date(),
      });
    };

    detectTarget();
    const interval = window.setInterval(detectTarget, 5000);
    return () => {
      window.clearInterval(interval);
    };
  }, [sequence, mount, enabled, currentTarget]);

  return {
    currentTarget,
    isLoadingEnrichment: false,
    enrichmentError: null,
    lastApiCall: null,
    cachedTargets: 0,
  };
}
