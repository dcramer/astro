"use client";

import type { ReactNode } from "react";

import styles from "../page.module.css";

export function StatValue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`${styles.statValue} ${className ?? ""}`.trim()}>{children}</span>
  );
}
