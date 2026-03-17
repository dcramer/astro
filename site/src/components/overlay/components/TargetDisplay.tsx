import React from "react";
import type { CurrentTarget } from "../use-target-enrichment";

interface TargetDisplayProps {
  target: CurrentTarget | null;
  isLoading?: boolean;
  className?: string;
}

export function TargetDisplay({ target, isLoading, className = "" }: TargetDisplayProps) {
  if (!target) {
    return (
      <div className={`target-display ${className}`}>
        <div className="target-name">No Target</div>
      </div>
    );
  }

  // Build the display string
  const displayParts: string[] = [];

  // Primary name (from sequence or catalog)
  if (target.fullName && target.fullName !== target.name) {
    // We have enrichment - show both
    displayParts.push(`${target.name} (${target.fullName})`);
  } else {
    // No enrichment or same name
    displayParts.push(target.name);
  }

  // Add type if available
  if (target.type) {
    displayParts.push(target.type);
  }

  // Add constellation if available
  if (target.constellation) {
    displayParts.push(target.constellation);
  }

  // Add magnitude if available
  if (target.magnitude !== undefined) {
    displayParts.push(`Mag ${target.magnitude.toFixed(1)}`);
  }

  // Add size if available
  if (target.size) {
    displayParts.push(target.size);
  }

  return (
    <div className={`target-display ${className}`}>
      <div className="target-primary">
        <span className="target-name">
          {target.name}
          {isLoading && " ⟳"}
        </span>
        {target.fullName && target.fullName !== target.name && (
          <span className="target-fullname"> ({target.fullName})</span>
        )}
      </div>
      {(target.type || target.constellation || target.magnitude !== undefined) && (
        <div className="target-details">
          {target.type && <span className="target-type">{target.type}</span>}
          {target.constellation && <span className="target-constellation">{target.constellation}</span>}
          {target.magnitude !== undefined && (
            <span className="target-magnitude">Mag {target.magnitude.toFixed(1)}</span>
          )}
          {target.size && <span className="target-size">{target.size}</span>}
        </div>
      )}
    </div>
  );
}

// Compact version for the stats bar
export function CompactTargetDisplay({ target, isLoading, className = "" }: TargetDisplayProps) {
  if (!target) {
    return <span className={`target-compact ${className}`}>—</span>;
  }

  return (
    <span className={`target-compact ${className}`}>
      {target.name}
      {target.fullName && target.fullName !== target.name && (
        <span style={{
          color: 'var(--text-muted, rgba(203, 213, 225, 0.75))',
          fontSize: '0.75em',
          fontWeight: 'normal'
        }}>
          {' '}{target.fullName}
        </span>
      )}
      {isLoading && " ⟳"}
    </span>
  );
}