import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedNews } from "@/lib/news/aggregator";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finance Bill 2026 News Summaries",
  description:
    "External news links and short source-based summaries about Kenya's Finance Bill 2026 and public finance issues.",
  alternates: {
    canonical: "/news",
  },
};

export default async function NewsPage() {
  const { articles, error } = await listPublishedNews();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>External news summaries</p>
        <h1>Finance Bill news, linked to the original sources.</h1>
        <p>
          Kenyan Bill indexes external reporting and publishes short summaries
          of what those sources say. Full stories remain with the original
          publishers.
        </p>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {articles.length > 0 ? (
        <section className={styles.grid}>
          {articles.map((article) => {
            const isBreaking = article.tags?.includes("breaking");
            return (
              <article 
                className={`${styles.card} ${isBreaking ? styles.breakingCard : ""}`} 
                key={article.id}
              >
                {isBreaking && <span className={styles.breakingLabel}>Breaking</span>}
                <div>
                  <span className={styles.sourceName}>{article.source_name ?? "External source"}</span>
                  <h2>
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary ?? article.excerpt}</p>
                </div>
                <div className={styles.cardFooter}>
                  <Link href={`/news/${article.slug}`}>View summary</Link>
                  {article.original_url ? (
                    <a href={article.original_url} target="_blank" rel="noreferrer">
                      Read full story
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>No news summaries yet.</h2>
          <p>Use the admin dashboard to fetch and publish external news links.</p>
        </section>
      )}
    </div>
  );
}
