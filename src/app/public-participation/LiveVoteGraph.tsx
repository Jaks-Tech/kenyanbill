"use client";

import { useEffect, useState } from "react";
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
  const maxVotes = Math.max(...options.map((option) => option.vote_count), 1);

  useEffect(() => {
    setVotedOptionId(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  return (
    <div className={styles.liveVoteGraph}>
      {votedOptionId ? (
        <p className={styles.voteLock}>Your device has already voted in this poll.</p>
      ) : null}

      {options.map((option) => {
        const width = Math.max((option.vote_count / maxVotes) * 100, 4);
        const isSelected = votedOptionId === option.id;

        return (
          <form
            action={votePublicPoll}
            key={option.id}
            onSubmit={() => setVotedOptionId(option.id)}
          >
            <AnonymousFields />
            <input name="poll_id" type="hidden" value={pollId} />
            <input name="option_id" type="hidden" value={option.id} />
            <button
              className={styles.graphVoteButton}
              data-selected={isSelected}
              disabled={isEnded || Boolean(votedOptionId)}
              type="submit"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.vote_count.toLocaleString()} votes</small>
              </span>
              <i style={{ width: `${width}%` }} />
            </button>
          </form>
        );
      })}
    </div>
  );
}
