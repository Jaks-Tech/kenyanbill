import type { Metadata } from "next";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { listParticipationDeadlines } from "@/lib/public-participation/queries";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Public Participation Deadlines",
  description:
    "Track confirmed public participation deadlines and official notices for the Finance Bill 2026.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}


function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function PublicParticipationDeadlinesPage() {
  const { deadlines, error } = await listParticipationDeadlines();
  const confirmedCount = deadlines.filter(
    (deadline) => deadline.status === "confirmed",
  ).length;

  return (
    <main className={styles.page}>
      <RealtimeRefresh table="public_participation_deadlines" />

      <Link className={styles.back} href="/public-participation">
        Back to public participation
      </Link>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Deadlines and notices</p>
          <h1>Track official participation dates.</h1>
          <p>
            This page shows
            confirmed notices, submission channels, committees, and source links
            when available.
          </p>
        </div>

        <aside className={styles.statusPanel}>
          <p className={styles.kicker}>Tracker status</p>

          <p>
            Tracked source notices refresh here automatically
            when the Finance Bill 2026 is updated.
          </p>
        </aside>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Current records</p>
        <h2>Public participation notices</h2>
        {error ? <p className={styles.errorText}>{error}</p> : null}

        {deadlines.length > 0 ? (
          <div className={styles.deadlineGrid}>
            {deadlines.map((deadline) => (
              <article className={styles.deadlineCard} key={deadline.id}>
                <span>{formatStatus(deadline.status)}</span>
                <strong>{deadline.title}</strong>
                {deadline.description ? <p>{deadline.description}</p> : null}
                <div className={styles.deadlineMeta}>
                  {deadline.deadline_at ? (
                    <span>{formatDate(deadline.deadline_at)}</span>
                  ) : (
                    <span>Date to be confirmed</span>
                  )}
                  {deadline.committee ? <span>{deadline.committee}</span> : null}
                  {deadline.submission_channel ? (
                    <span>{deadline.submission_channel}</span>
                  ) : null}
                </div>
                {deadline.source_url ? (
                  <p>
                    <a href={deadline.source_url} target="_blank" rel="noreferrer">
                      Open official source
                    </a>
                  </p>
                ) : deadline.source_name ? (
                  <p>Source: {deadline.source_name}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No public participation deadline records have been published from
            admin yet.
          </p>
        )}
      </section>

      <section className={styles.notice}>
        <h2>Preparing views?</h2>
        <p>
          Use the{" "}
          <Link href="/public-participation/how-to-submit-views">
            submission guide
          </Link>{" "}
          and{" "}
          <Link href="/public-participation/memoranda">memoranda templates</Link>{" "}
          before sending views through the official channel listed here.
        </p>
      </section>
    </main>
  );
}
