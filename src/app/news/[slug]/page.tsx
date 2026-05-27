import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedNewsBySlug } from "@/lib/news/aggregator";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await getPublishedNewsBySlug(slug);

  if (!article) {
    return {
      title: "News Summary",
      description: "External news summary on Kenyan Bill.",
    };
  }

  return {
    title: article.title,
    description:
      article.summary ??
      "External news summary with link to the original publisher.",
    alternates: {
      canonical: `/news/${article.slug}`,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const { article, error } = await getPublishedNewsBySlug(slug);

  if (!article || error) {
    notFound();
  }

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>{article.source_name ?? "External news"}</p>
        <h1>{article.title}</h1>
        <p>
          This is a Kenyan Bill summary of an external news link. Read the
          original publisher for the complete story.
        </p>
      </header>

      <section className={styles.summary}>
        <h2>Source summary</h2>
        <p>{article.summary ?? article.excerpt}</p>
        <div className={styles.tags}>
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className={styles.actions}>
        {article.original_url ? (
          <a href={article.original_url} target="_blank" rel="noreferrer">
            Read original source
          </a>
        ) : null}
        <Link href="/news">Back to news</Link>
      </section>
    </article>
  );
}
