import type { AdvancedSequenceSnapshot, NinaSequenceItem } from "@nina/advanced";

function isTargetContainer(item: NinaSequenceItem): boolean {
  return item.name === "Targets_Container" || item.name === "Targets Container";
}

function extractTargetName(itemName: string): string | null {
  if (!itemName) return null;

  // Remove "_Container" suffix if present
  const cleaned = itemName.replace(/_Container$/i, "").replace(/ Container$/i, "").trim();

  // Don't return generic container names
  if (cleaned.toLowerCase() === "targets" || cleaned.toLowerCase() === "target") {
    return null;
  }

  return cleaned;
}

function findTargetsInContainer(container: NinaSequenceItem): string[] {
  const targets: string[] = [];

  if (!container.items) return targets;

  for (const item of container.items) {
    const targetName = extractTargetName(item.name);
    if (targetName) {
      targets.push(targetName);
    }
  }

  return targets;
}

export function findCurrentImagingTarget(
  sequenceData: AdvancedSequenceSnapshot | null,
): string | null {
  if (!sequenceData?.items) {
    return null;
  }

  // First, try to find the target from the current breadcrumb path
  if (sequenceData.breadcrumb?.length) {
    // Check if we're currently inside a Targets_Container
    let insideTargetsContainer = false;
    let lastTarget: string | null = null;

    for (let i = 0; i < sequenceData.breadcrumb.length; i++) {
      const segment = sequenceData.breadcrumb[i];

      if (segment === "Targets_Container" || segment === "Targets Container") {
        insideTargetsContainer = true;
        continue;
      }

      if (insideTargetsContainer) {
        const targetName = extractTargetName(segment);
        if (targetName) {
          lastTarget = targetName;
        }
      }
    }

    if (lastTarget) {
      return lastTarget;
    }
  }

  // If we couldn't find a target in the current path, search the entire sequence
  // Look for all Targets_Container items
  const findTargetsRecursive = (
    items: ReadonlyArray<NinaSequenceItem>,
    currentPath: string[] = [],
  ): { path: string[]; target: string }[] => {
    const results: { path: string[]; target: string }[] = [];

    for (const item of items) {
      const itemPath = [...currentPath, item.name];

      if (isTargetContainer(item)) {
        // Found a targets container, extract targets from its children
        const targets = findTargetsInContainer(item);
        for (const target of targets) {
          results.push({ path: [...itemPath, target], target });
        }
      }

      // Recurse into children
      if (item.items?.length) {
        results.push(...findTargetsRecursive(item.items, itemPath));
      }
    }

    return results;
  };

  const allTargets = findTargetsRecursive(sequenceData.items);

  if (allTargets.length === 0) {
    return null;
  }

  // If we have a current breadcrumb, try to find the closest target
  if (sequenceData.breadcrumb?.length) {
    // Find targets that come before or at our current position
    const currentDepth = sequenceData.breadcrumb.length;

    // Look for the most recently passed target
    let bestMatch: { path: string[]; target: string } | null = null;

    for (const targetInfo of allTargets) {
      // Check if this target is in our path or before us
      let matches = true;
      for (let i = 0; i < Math.min(targetInfo.path.length, currentDepth); i++) {
        if (i < sequenceData.breadcrumb.length &&
            targetInfo.path[i] !== sequenceData.breadcrumb[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        bestMatch = targetInfo;
      }
    }

    if (bestMatch) {
      return bestMatch.target;
    }
  }

  // Fall back to the first target in the sequence
  return allTargets[0].target;
}