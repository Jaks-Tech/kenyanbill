"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnonymousFields } from "@/components/AnonymousFields";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ShareMenu } from "@/components/ShareMenu";
import { SiteLikeButton } from "@/components/SiteLikeButton";
import type { PublicPoll } from "@/lib/public-participation/queries";
import { createPublicPoll } from "./actions";
import { LiveVoteGraph } from "./LiveVoteGraph";
import { PollMicroChart } from "./PollMicroChart"; // Updated to the Bar Graph version
import styles from "./page.module.css";

type PublicPollsProps = {
  polls: PublicPoll[];
};

export function PublicPolls({ polls }: PublicPollsProps) {
  const router = useRouter();
  const [isComposerOpen, setIsComposerOpen] = useState(polls.length === 0);
  const [isPending, startTransition] = useTransition();
  const [clientTime, setClientTime] = useState<number | null>(null);

  useEffect(() => {
    setClientTime(Date.now());
    const ticker = setInterval(() => setClientTime(Date.now()), 30000);
    return () => clearInterval(ticker);
  }, []);

  function submitPoll(formData: FormData) {
    startTransition(async () => {
      try {
        await createPublicPoll(formData);
        setIsComposerOpen(false);
        router.refresh();
      } catch (err) {
        console.error("Failed to compile poll:", err);
      }
    });
  }

  return (
    <>
      <div className={styles.composerTriggerRow}>
        <button
          className={styles.toggleComposer}
          onClick={() => setIsComposerOpen((value) => !value)}
          type="button"
        >
          {isComposerOpen ? <span>Collapse Creator</span> : <span>Launch a New Poll</span>}
        </button>
      </div>

      {isComposerOpen && (
        <form action={submitPoll} className={styles.pollComposer}>
          <AnonymousFields />
          <div className={styles.inputGroup}>
            <label htmlFor="poll-question">Poll Question</label>
            <input id="poll-question" name="question" placeholder="What issue should Kenyans vote on?" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="poll-description">Context (Optional)</label>
            <textarea id="poll-description" name="description" placeholder="Briefly state context..." rows={2} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="poll-options">Options (one per line)</label>
            <textarea id="poll-options" name="options" placeholder={"Yes\nNo"} required rows={2} />
          </div>
          <button className={styles.submitComposerBtn} disabled={isPending} type="submit">
            {isPending ? <span className={styles.loaderElement} /> : "Publish Poll"}
          </button>
        </form>
      )}

      {polls.length > 0 ? (
        <div className={styles.pollList}>
          {polls.map((poll, index) => {
            const totalVotes = poll.public_poll_options.reduce((sum, o) => sum + o.vote_count, 0);
            const expiresAt = new Date(poll.expires_at);
            const isEnded = clientTime ? expiresAt.getTime() <= clientTime : false;

            return (
              <article id={`poll-${poll.id}`} className={styles.pollCard} data-ended={isEnded} key={poll.id}>
                <header className={styles.pollHeader}>
                  <span className={styles.pollIndexIndicator}>Poll #{index + 1}</span>
                  <strong className={styles.totalVotesPill}>
                    {totalVotes.toLocaleString()} votes
                  </strong>
                </header>

                <div className={styles.pollWindow} data-active={!isEnded}>
                  <span className={styles.windowStatusTag}>{isEnded ? "Ended" : "Live"}</span>
                  <p className={styles.windowTimeline}>
                    {isEnded ? "Concluded: " : "Closes: "} {formatDate(expiresAt)}
                  </p>
                </div>

                <h3 className={styles.pollCardQuestion}>{poll.question}</h3>
                {poll.description && (
                  <div className={styles.pollCardDescription}>
                    <MarkdownContent content={poll.description} />
                  </div>
                )}

                {/* Localized Bar Graph Standings */}
                <PollMicroChart options={poll.public_poll_options} />

                <div className={styles.liveGraphContainer}>
                  <LiveVoteGraph
                    isEnded={isEnded}
                    options={poll.public_poll_options}
                    pollId={poll.id}
                  />
                </div>

                <footer className={styles.pollCardFooter}>
                  <span className={styles.pollAuthorField}>
                    By {poll.anonymous_name || "Anonymous"}
                  </span>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <SiteLikeButton targetType="poll" targetId={poll.id} initialLikeCount={poll.like_count} />
                    <ShareMenu 
                      title={poll.question} 
                      urlPath={`/public-participation#poll-${poll.id}`} 
                    />
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyTool}>
          <p>No citizen polls active.</p>
        </div>
      )}
    </>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}