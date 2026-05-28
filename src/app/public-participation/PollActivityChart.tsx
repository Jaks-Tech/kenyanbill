"use client";

import { useMemo } from "react";
import type {
  PublicPoll,
  PublicPollVoteEvent,
} from "@/lib/public-participation/queries";
import styles from "./page.module.css";

type PollActivityChartProps = {
  polls: PublicPoll[];
  votes: PublicPollVoteEvent[];
};

const pointCount = 12;
const colors = ["#0b6b44", "#1f6feb", "#b35309", "#7a3db8", "#ad1457", "#087990"];

export function PollActivityChart({ polls, votes }: PollActivityChartProps) {
  // Normalize timestamps
  const normalizedVotes = useMemo(() => {
    return (votes || []).map((vote) => ({
      ...vote,
      timestamp: new Date(vote.created_at).getTime(),
    }));
  }, [votes]);

  const { series, maxCount, totalVotes, isHistoricView } = useMemo(() => {
    const activePolls = (polls || []).slice(0, 6);
    
    // Find absolute bounds based on the actual polls provided
    const pollTimes = activePolls.flatMap(p => [
      new Date(p.created_at).getTime(), 
      new Date(p.expires_at).getTime()
    ]);

    const now = Date.now();
    
    // Check if the latest poll expired. If yes, view its actual lifespan instead of tracking "Now"
    const latestExpiry = pollTimes.length > 0 ? Math.max(...pollTimes) : now;
    const pastDeadlines = latestExpiry < now;

    // Set chart runtime window dynamically
    const end = pastDeadlines ? latestExpiry : now;
    const start = pastDeadlines 
      ? (pollTimes.length > 0 ? Math.min(...pollTimes) : end - 24 * 60 * 60 * 1000)
      : now - 24 * 60 * 60 * 1000;

    const interval = (end - start) / (pointCount - 1);

    const computedSeries = activePolls.map((poll, pollIndex) => {
      const pollVotes = normalizedVotes.filter((vote) => vote.poll_id === poll.id);

      const points = Array.from({ length: pointCount }, (_, pointIndex) => {
        const time = start + interval * pointIndex;
        // Collect votes incrementally up to this snapshot point
        const count = pollVotes.filter((vote) => vote.timestamp <= time).length;

        return { count, time };
      });

      return {
        color: colors[pollIndex % colors.length],
        label: `Poll ${pollIndex + 1}`,
        points,
        poll,
        totalVotes: pollVotes.length,
      };
    });

    const calculatedMax = Math.max(
      ...computedSeries.flatMap((item) => item.points.map((point) => point.count)),
      1
    );

    return {
      series: computedSeries,
      maxCount: calculatedMax,
      totalVotes: normalizedVotes.length,
      isHistoricView: pastDeadlines
    };
  }, [polls, normalizedVotes]);

  return (
    <section className={styles.activityChart}>
      <div className={styles.chartIntro}>
        <div>
          <p className={styles.sectionLabel}>
            {isHistoricView ? "Archived Vote Activity" : "Live vote activity"}
          </p>
          <h2>
            {isHistoricView 
              ? "Final consensus curves across active poll windows." 
              : "Votes by poll over the last 24 hours."}
          </h2>
        </div>
        <strong>{totalVotes.toLocaleString()} votes recorded</strong>
      </div>

      {series.length > 0 ? (
        <>
          <div className={styles.chartFrame}>
            <svg
              aria-label="Votes by poll line chart"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <line x1="0" x2="100" y1="84" y2="84" />
              <line x1="0" x2="100" y1="50" y2="50" />
              <line x1="0" x2="100" y1="16" y2="16" />
              {series.map((item) => {
                const polyline = item.points
                  .map((point, index) => {
                    const x = (index / (pointCount - 1)) * 100;
                    const y = 84 - (point.count / maxCount) * 68;
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <g key={item.poll.id}>
                    <polyline points={polyline} style={{ stroke: item.color }}>
                      <title>{`${item.label}: ${item.poll.question}`}</title>
                    </polyline>
                    {item.points.map((point, index) => {
                      const x = (index / (pointCount - 1)) * 100;
                      const y = 84 - (point.count / maxCount) * 68;

                      return (
                        <circle
                          cx={x}
                          cy={y}
                          key={`${item.poll.id}-${point.time}`}
                          r="1.8"
                          style={{ fill: item.color }}
                        >
                          <title>
                            {`${item.label}: ${item.poll.question} - ${point.count} votes`}
                          </title>
                        </circle>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={styles.chartLabels}>
            <span>{isHistoricView ? "Poll Opened" : "24 hours ago"}</span>
            <span>{isHistoricView ? "Poll Concluded" : "Now"}</span>
          </div>

          <div className={styles.chartLegend}>
            {series.map((item) => (
              <div key={item.poll.id} title={item.poll.question}>
                <span style={{ background: item.color }} />
                <strong>{item.label}</strong>
                <p>{item.poll.question}</p>
                <small>{item.totalVotes.toLocaleString()} votes</small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.emptyTool}>
          <h3>No historical data available.</h3>
          <p>Launch an active tracking instance to view data generation trends.</p>
        </div>
      )}
    </section>
  );
}