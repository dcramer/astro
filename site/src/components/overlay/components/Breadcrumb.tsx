"use client";

import styles from "../page.module.css";

export function Breadcrumb({
  entries,
}: {
  entries: ReadonlyArray<string>;
}) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className={styles.breadcrumb}>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        return (
          <span
            key={`${entry}-${index}`}
            className={isLast ? styles.breadcrumbCurrent : styles.breadcrumbItem}
          >
            {entry}
            {!isLast ? <span className={styles.breadcrumbSeparator}>›</span> : null}
          </span>
        );
      })}
    </div>
  );
}
