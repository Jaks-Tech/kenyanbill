"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const widgets = [
  {
    href: "/public-participation/how-to-submit-views",
    label: "How to submit views",
    text: "Turn concerns into a clear submission.",
  },
  {
    href: "/public-participation/memoranda",
    label: "Memoranda",
    text: "Use structures for citizens, groups, and businesses.",
  },
  {
    href: "/public-participation/deadlines",
    label: "Deadlines",
    text: "Track confirmed dates and official notices.",
  },
];

export function ParticipationWidgets() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleWidgets = widgets.filter((widget) => !dismissed.includes(widget.href));

  if (!visibleWidgets.length) {
    return null;
  }

  return (
    <section className={styles.widgetRail} aria-label="Helpful participation links">
      {visibleWidgets.map((widget) => (
        <article className={styles.widgetCard} key={widget.href}>
          <button
            className={styles.dismissWidgetBtn}
            aria-label={`Dismiss ${widget.label}`}
            onClick={() => setDismissed((current) => [...current, widget.href])}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </button>
          
          <Link href={widget.href} className={styles.widgetLink}>
            <span className={styles.widgetLabel}>{widget.label}</span>
            <p className={styles.widgetText}>{widget.text}</p>
          </Link>
        </article>
      ))}
    </section>
  );
}