"use client";

import { useMemo } from "react";
import type { PublicPollOption } from "@/lib/public-participation/queries";
import styles from "./page.module.css";

type PollMicroChartProps = {
  options: PublicPollOption[];
};

const optionColors = ["#1f6feb", "#0b6b44", "#b35309", "#7a3db8", "#ad1457"];

export function PollMicroChart({ options }: PollMicroChartProps) {
  const { totalVotes, processedOptions } = useMemo(() => {
    const safeOptions = options || [];
    const total = safeOptions.reduce((sum, opt) => sum + opt.vote_count, 0);
    const maxVotes = Math.max(...safeOptions.map((opt) => opt.vote_count), 1);

    const processed = safeOptions.map((option, index) => {
      const percentage = total > 0 ? (option.vote_count / total) * 100 : 0;
      const barWidth = total > 0 ? (option.vote_count / maxVotes) * 100 : 0;

      return {
        ...option,
        percentage,
        barWidth: Math.max(barWidth, 0), // Safe baseline width
        color: optionColors[index % optionColors.length],
      };
    });

    return { totalVotes: total, processedOptions: processed };
  }, [options]);

  if (totalVotes === 0) {
    return (
      <div className={styles.noVotesBox}>
        <p>No votes cast yet. Be the first to weigh in!</p>
      </div>
    );
  }

  return (
    <div className={styles.microChartWrapper}>
      <span className={styles.microChartLabel}>Current Standings</span>
      
      <div className={styles.barChartContainer}>
        {processedOptions.map((option) => (
          <div key={option.id} className={styles.barRow}>
            <div className={styles.barMeta}>
              <span className={styles.barText}>{option.label}</span>
              <span className={styles.barNumbers}>
                <strong>{option.vote_count.toLocaleString()}</strong> ({option.percentage.toFixed(0)}%)
              </span>
            </div>
            <div className={styles.barTrack}>
              <div 
                className={styles.barFill} 
                style={{ 
                  width: `${option.barWidth}%`, 
                  backgroundColor: option.color 
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}