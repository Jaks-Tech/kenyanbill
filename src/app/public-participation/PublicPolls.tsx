"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnonymousFields } from "@/components/AnonymousFields";
import type { PublicPoll } from "@/lib/public-participation/queries";
import { createPublicPoll } from "./actions";
import { LiveVoteGraph } from "./LiveVoteGraph";
import styles from "./page.module.css";

type PublicPollsProps = {
  polls: PublicPoll[];
};

export function PublicPolls({ polls }: PublicPollsProps) {
  const router = useRouter();
  const [isComposerOpen, setIsComposerOpen] = useState(polls.length === 0);
  const [isPending, startTransition] = useTransition();

  function submitPoll(formData: FormData) {
    startTransition(async () => {
      await createPublicPoll(formData);
      setIsComposerOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        className={styles.toggleComposer}
        onClick={() => setIsComposerOpen((value) => !value)}
        type="button"
      >
        {isComposerOpen ? "Hide poll creator" : "Create another poll"}
      </button>

      {isComposerOpen ? (
        <form action={submitPoll} className={styles.pollComposer}>
          <AnonymousFields />
          <div>
            <label htmlFor="poll-question">Start a 24-hour public poll</label>
            <input
              id="poll-question"
              name="question"
              placeholder="What should Kenyans vote on?"
              required
            />
          </div>
          <div>
            <label htmlFor="poll-description">Context</label>
            <textarea
              id="poll-description"
              name="description"
              placeholder="Add a short reason for this poll."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="poll-options">Options, one per line</label>
            <textarea
              id="poll-options"
              name="options"
              placeholder={
                "Reduce fuel taxes\nProtect small businesses\nImprove public services"
              }
              required
              rows={4}
            />
          </div>
          <button disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create poll"}
          </button>
        </form>
      ) : null}

      {polls.length > 0 ? (
        <div className={styles.pollList}>
          {polls.map((poll, index) => {
            const totalVotes = poll.public_poll_options.reduce(
              (sum, option) => sum + option.vote_count,
              0,
            );
            const expiresAt = new Date(poll.expires_at);
            const createdAt = new Date(poll.created_at);
            const isEnded = expiresAt.getTime() <= Date.now();

            return (
              <article
                className={styles.pollCard}
                data-ended={isEnded}
                key={poll.id}
              >
                <div className={styles.pollHeader}>
                  <span>Poll {index + 1}</span>
                  <strong>{totalVotes.toLocaleString()} total votes</strong>
                </div>
                <div className={styles.pollWindow}>
                  <span>{isEnded ? "Ended" : "Active now"}</span>
                  <p>
                    Started {formatDate(createdAt)} - Ends {formatDate(expiresAt)}
                  </p>
                </div>
                <h3>{poll.question}</h3>
                <p className={styles.pollAuthor}>Started by {poll.anonymous_name}</p>
                {poll.description ? <p>{poll.description}</p> : null}
                <LiveVoteGraph
                  isEnded={isEnded}
                  options={poll.public_poll_options}
                  pollId={poll.id}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyTool}>
          <h3>No citizen polls yet.</h3>
          <p>
            Start the first participation poll so others can vote on the issue
            they want discussed.
          </p>
        </div>
      )}
    </>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
