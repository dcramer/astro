"use client";

import type { ReactNode } from "react";

import styles from "../page.module.css";

export function StatCard({
  label,
  value,
  footer,
  className,
}: {
  label: string;
  value?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.statCard} ${className ?? ""}`.trim()}>
      <span className={styles.statLabel}>{label}</span>
      {value}
      {footer}
    </div>
  );
}
