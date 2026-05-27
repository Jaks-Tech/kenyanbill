import type { Metadata } from "next";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { listForumThreads } from "@/lib/forum/queries";
import { LikeButton, ReportButton } from "./ForumForms";
import styles from "./forum.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "Anonymous public discussion on Kenya's Finance Bill 2026, taxation, cost of living, and civic issues.",
};

export default async function ForumPage() {
  const { threads, error } = await listForumThreads();

  return (
    <div className={styles.page}>
      <RealtimeRefresh table="forum_threads" />
      <header className={styles.header}>
        <p className={styles.kicker}>Public forum</p>
        <h1>Anonymous real talk on the Finance Bill and Kenya.</h1>
        <p>
          Post questions, share views, reply to others, and mention
          @kenyanbill when you want a source-grounded AI explanation.
        </p>
        <div className={styles.actions}>
          <Link href="/forum/new">Start a thread</Link>
          <Link href="/ask">Ask AI privately</Link>
        </div>
      </header>

      {error ? <p className={styles.empty}>{error}</p> : null}

      <section className={styles.feed}>
        {threads.length > 0 ? (
          threads.map((thread) => (
            <article className={styles.threadCard} key={thread.id}>
              <h2>
                <Link href={`/forum/thread/${thread.slug}`}>{thread.title}</Link>
              </h2>
              <div className={styles.meta}>
                <span>{thread.anonymous_name}</span>
                <span>{thread.category}</span>
                <span>{thread.like_count} likes</span>
                <span>{thread.comment_count} comments</span>
              </div>
              <p>{thread.body}</p>
              <div className={styles.threadFooter}>
                <Link href={`/forum/thread/${thread.slug}`}>Open thread</Link>
                <LikeButton targetId={thread.id} targetType="thread" />
                <ReportButton targetId={thread.id} targetType="thread" />
              </div>
            </article>
          ))
        ) : (
          <section className={styles.empty}>
            <h2>No forum threads yet.</h2>
            <p>Start the first anonymous public conversation.</p>
          </section>
        )}
      </section>
    </div>
  );
}
