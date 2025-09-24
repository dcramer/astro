"use client";

import type { ReactNode } from "react";

import styles from "../page.module.css";
import { Breadcrumb } from "./Breadcrumb";
import { ProgressBar } from "./ProgressBar";
import { StatCard } from "./StatCard";

export interface StatDefinition {
  key: string;
  label: string;
  value?: ReactNode;
  cardClassName?: string;
  progressPercent?: number;
  breadcrumb?: ReadonlyArray<string>;
}

export function StatsRow({
  stats,
  className,
}: {
  stats: ReadonlyArray<StatDefinition>;
  className?: string;
}) {
  if (!stats.length) {
    return null;
  }

  return (
    <div className={`${styles.statRow} ${className ?? ""}`.trim()}>
      {stats.map((stat) => {
        const valueNode = stat.breadcrumb?.length ? (
          <Breadcrumb entries={stat.breadcrumb} />
        ) : stat.value ? (
          stat.value
        ) : undefined;

        const footerNode =
          stat.progressPercent !== undefined
            ? (
                <div className={styles.statFooter}>
                  <ProgressBar percent={stat.progressPercent} />
                </div>
              )
            : undefined;

        return (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={valueNode}
            footer={footerNode}
            className={stat.cardClassName}
          />
        );
      })}
    </div>
  );
}
