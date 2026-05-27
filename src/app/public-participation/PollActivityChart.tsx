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
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;
  const interval = (now - start) / (pointCount - 1);
  const activePolls = polls.slice(0, 6);
  const series = activePolls.map((poll, pollIndex) => {
    const points = Array.from({ length: pointCount }, (_, pointIndex) => {
      const time = start + interval * pointIndex;
      const count = votes.filter(
        (vote) =>
          vote.poll_id === poll.id && new Date(vote.created_at).getTime() <= time,
      ).length;

      return { count, time };
    });

    return {
      color: colors[pollIndex % colors.length],
      label: `Poll ${pollIndex + 1}`,
      points,
      poll,
      totalVotes: votes.filter((vote) => vote.poll_id === poll.id).length,
    };
  });
  const maxCount = Math.max(
    ...series.flatMap((item) => item.points.map((point) => point.count)),
    1,
  );
  const totalVotes = votes.length;

  return (
    <section className={styles.activityChart}>
      <div className={styles.chartIntro}>
        <div>
          <p className={styles.sectionLabel}>Live vote activity</p>
          <h2>Votes by poll over the last 24 hours.</h2>
        </div>
        <strong>{totalVotes.toLocaleString()} votes</strong>
      </div>

      {series.length > 0 ? (
        <>
          <div className={styles.chartFrame}>
            <svg
              aria-label="Live votes by poll line chart"
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
            <span>24 hours ago</span>
            <span>Now</span>
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
          <h3>No poll activity yet.</h3>
          <p>Create a poll and the vote activity chart will begin tracking it.</p>
        </div>
      )}
    </section>
  );
}
