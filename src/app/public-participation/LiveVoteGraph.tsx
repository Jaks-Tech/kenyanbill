"use client";

import { useEffect, useState, useTransition } from "react";
import { AnonymousFields } from "@/components/AnonymousFields";
import type { PublicPollOption } from "@/lib/public-participation/queries";
import { votePublicPoll } from "./actions";
import styles from "./page.module.css";

type LiveVoteGraphProps = {
  isEnded: boolean;
  options: PublicPollOption[];
  pollId: string;
};

export function LiveVoteGraph({ isEnded, options, pollId }: LiveVoteGraphProps) {
  const storageKey = `kenyan-bill-public-poll-vote-${pollId}`;
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Safeguard array bounds cleanly to prevent layout division errors
  const safeOptions = options || [];
  const totalVotes = safeOptions.reduce((sum, opt) => sum + opt.vote_count, 0);
  const maxVotes = Math.max(...safeOptions.map((option) => option.vote_count), 1);

  useEffect(() => {
    setVotedOptionId(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  async function handleVoteSubmit(formData: FormData) {
    const optionId = formData.get("option_id") as string;
    if (!optionId) return;

    // Fire optimistic local UI locks
    setVotedOptionId(optionId);
    window.localStorage.setItem(storageKey, optionId);

    // Coordinate the Server Action lifecycle safely under a transition hook
    startTransition(async () => {
      try {
        await votePublicPoll(formData);
      } catch (error) {
        // Rollback state smoothly if things break on the server wire
        setVotedOptionId(null);
        window.localStorage.removeItem(storageKey);
        console.error("Voting action failed:", error);
      }
    });
  }

  return (
    <div className={styles.liveVoteGraph}>
      {votedOptionId ? (
        <p className={styles.voteLock}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Your device has registered a vote in this poll.
        </p>
      ) : null}

      {/* Unified Single Form Architecture */}
      <form action={handleVoteSubmit}>
        <AnonymousFields />
        <input name="poll_id" type="hidden" value={pollId} />

        <div className={styles.pollOptions}>
          {safeOptions.map((option) => {
            const width = totalVotes > 0 ? (option.vote_count / maxVotes) * 100 : 0;
            const isSelected = votedOptionId === option.id;
            const hasUserVoted = Boolean(votedOptionId);

            return (
              <button
                key={option.id}
                name="option_id"
                value={option.id}
                className={styles.graphVoteButton}
                data-selected={isSelected}
                disabled={isEnded || hasUserVoted || isPending}
                type="submit"
              >
                <span>
                  <strong>{option.label}</strong>
                  {hasUserVoted && (
                    <small>
                      {option.vote_count.toLocaleString()} votes ({totalVotes > 0 ? ((option.vote_count / totalVotes) * 100).toFixed(0) : 0}%)
                    </small>
                  )}
                </span>
                
                {/* Visual bar width indicator */}
                <i style={{ width: `${Math.max(width, 0)}%` }} />
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}