import Link from "next/link";
import { listBreakingNews } from "@/lib/news/aggregator";
import styles from "./BreakingNewsBanner.module.css";

export async function BreakingNewsBanner() {
  const { articles } = await listBreakingNews(8);

  if (articles.length === 0) {
    return null;
  }

  const tickerItems = [...articles, ...articles];

  return (
    <aside className={styles.banner} aria-label="Breaking news">
      <div className={styles.container}>
        <span className={styles.label}>Breaking</span>
        <div className={styles.ticker} aria-live="polite">
          <div className={styles.track}>
            {tickerItems.map((article, index) => (
              <Link
                aria-hidden={index >= articles.length}
                href={`/news/${article.slug}`}
                key={`${article.id}-${index}`}
                tabIndex={index >= articles.length ? -1 : undefined}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
        <Link href="/news" className={styles.arrow}>
          News
        </Link>
      </div>
    </aside>
  );
}
