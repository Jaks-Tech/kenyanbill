import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownContent } from "@/components/MarkdownContent";
import { listPollAnalyses } from "@/lib/public-participation/analysis";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Daily Analysis - Kenyan Bill",
  description: "Daily AI-powered analysis of public sentiment and poll results on the Finance Bill 2026.",
};

export const dynamic = "force-dynamic";

export default async function DailyAnalysisPage() {
  const { analyses, error } = await listPollAnalyses(15);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Public Sentiment</p>
        <h1>Daily Analysis Reports</h1>
        <p>Daily results analysis into how Kenyans are voting and what the data tells us about the national mood.</p>
        <div className={styles.actions}>
          <Link href="/public-participation">Go to active polls</Link>
        </div>
      </header>

      {error ? (
        <section className={styles.emptyTool}>
          <p>Error loading analyses: {error}</p>
        </section>
      ) : null}

      <section className={styles.analysisFeed}>
        {analyses.length > 0 ? (
          analyses.map((analysis) => (
            <article className={styles.analysisCard} key={analysis.id}>
              <div className={styles.analysisMeta}>
                <span>{new Date(analysis.analyzed_at).toLocaleDateString('en-KE', { dateStyle: 'long' })}</span>
                <span>{analysis.poll_count} Polls Analyzed</span>
                <span>{analysis.vote_count.toLocaleString()} Total Votes</span>
              </div>
              <h2>
                <Link href={`/public-participation/analysis/${analysis.slug}`}>{analysis.title}</Link>
              </h2>
              <p className={styles.analysisSummary}>{analysis.summary}</p>
              <div className={styles.analysisFooter}>
                <Link href={`/public-participation/analysis/${analysis.slug}`} className={styles.readMore}>
                  Read Full Report →
                </Link>
              </div>
            </article>
          ))
        ) : (
          <section className={styles.emptyTool}>
            <h3>No reports published yet.</h3>
            <p>Once polls are active and processed, the daily sentiment analysis will appear here.</p>
          </section>
        )}
      </section>
    </div>
  );
}
