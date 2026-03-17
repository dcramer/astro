"use client";

import styles from "../page.module.css";

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className={styles.progressTrack}>
      <div
        className={styles.progressFill}
        style={{ width: `${Math.min(100, Math.max(0, percent * 100))}%` }}
      />
    </div>
  );
}
