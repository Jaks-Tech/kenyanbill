import type { Metadata } from "next";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { listOpenPublicPolls } from "@/lib/public-participation/queries";
import { PublicPolls } from "./PublicPolls";
import { ParticipationWidgets } from "./ParticipationWidgets";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Polls - Finance Bill 2026",
  description: "Vote anonymously on live polls and track real-time public sentiment on the Finance Bill 2026.",
  alternates: { canonical: "/public-participation" },
};

// Explicitly drop standard static pre-rendering caches to process live on every single reload
export const dynamic = "force-dynamic";
export const revalidate = 0; 

export default async function PublicParticipationPage() {
  // We no longer need listRecentPublicPollVotes() since the bars read from option aggregates!
  const pollsResult = await listOpenPublicPolls().catch(() => ({ polls: [] }));
  const allFetchedPolls = pollsResult?.polls || [];

  const now = Date.now();
  
  // Clean filtering based on calculated active/expired timelines
  const activePolls = allFetchedPolls.filter(
    (p) => p?.expires_at && new Date(p.expires_at).getTime() > now
  );
  
  const expiredPolls = allFetchedPolls.filter(
    (p) => p?.expires_at && new Date(p.expires_at).getTime() <= now
  );

  return (
    <div className={styles.page}>
      <RealtimeRefresh table="public_polls" />
      <RealtimeRefresh table="public_poll_options" />
      <RealtimeRefresh table="public_poll_votes" />
      
      <header className={styles.hero}>
        <p className={styles.kicker}>Public Sentiment</p>
        <h1>Finance Bill 2026 Polls</h1>
        <p>Vote anonymously or launch a 24-hour poll to see where the public stands.</p>
        <div className={styles.actions}>
          <Link href="/public-participation/analysis">View Daily Sentiment Analysis</Link>
        </div>
      </header>

      {/* Active Polls Row */}
      <section className={styles.toolSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Active Polls</p>
        </div>
        {/* Fixed: Removed votes={votes} to match your clean bar-chart props interface */}
        <PublicPolls polls={activePolls} />
      </section>

      {/* Closed Archive Accordion Dropdown */}
      {expiredPolls.length > 0 && (
        <section className={styles.archiveSection}>
          <div className={styles.archiveCard}>
            <header className={styles.archiveHeader}>
              <div className={styles.archiveBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.archiveBadgeIcon}>
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Concluded Polls</span>
              </div>
              <span className={styles.archiveCount}>{expiredPolls.length} Polls Saved</span>
            </header>

            <div className={styles.archiveBody}>
              <h2>Past Citizen Polls Archive</h2>
              <p>Review the historical data, final public spreads, and absolute vote breakdowns on concluded bills.</p>
            </div>

            <details className={styles.sourceDrawer}>
              <summary className={styles.sourceDrawerSummary}>
                <span className={styles.summaryTitle}>Explore Historical Records</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.chevronIcon}>
                  <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              
              <div className={styles.archivedPollsWrapper}>
                <PublicPolls polls={expiredPolls} />
              </div>
            </details>
          </div>
        </section>
      )}

      <hr className={styles.sectionDivider} />

      <footer className={styles.secondaryNavigation}>
        <div className={styles.footerIntro}>
          <h3>Participation Toolkits</h3>
          <p>Ready to submit formal feedback? Use the guides and templates below.</p>
        </div>
        <ParticipationWidgets />
      </footer>
    </div>
  );
}