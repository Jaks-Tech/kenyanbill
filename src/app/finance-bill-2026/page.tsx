import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedFinanceBillDocuments } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Finance Bills Kenya",
  description:
    "Understand Kenya's Finance Bills with plain-language explainers, sourced AI answers, news updates, and anonymous public discussion.",
  alternates: {
    canonical: "/finance-bill-2026",
  },
};

const topicCards = [
  {
    title: "Plain-language summary",
    description:
      "A citizen-friendly breakdown of the bill once verified source documents are loaded.",
    href: "/finance-bill-2026/summary",
  },
  {
    title: "Ask AI",
    description:
      "Ask questions and get answers grounded in bill documents, news, and cited sources.",
    href: "/ask",
  },
  {
    title: "Public views",
    description:
      "Join anonymous conversations from citizens, workers, businesses, and communities.",
    href: "/forum",
  },
];

export default async function FinanceBill2026Page() {
  const { documents, error } = await listPublishedFinanceBillDocuments();
  const primaryDocument = documents[0] ?? null;
  const otherDocuments = documents.slice(1);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Finance Bills Kenya</p>
          <h1>One place to understand, question, and discuss each bill.</h1>
          <p>
            This hub starts with Kenya&apos;s Finance Bill 2026 and is structured
            to support future Finance Bills with official documents, news
            updates, AI-powered explanations, and anonymous public conversations.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/ask">
              Ask about the bill
            </Link>
            <Link className={styles.secondary} href="/forum">
              View public discussion
            </Link>
          </div>
        </div>

        <aside className={styles.statusPanel} aria-label="Finance Bill status">
          <span>Knowledge base status</span>
          <strong>Source documents pending</strong>
          <p>
            This system will answer from verified bill documents and trusted
            updates from news sources.
          </p>
        </aside>
      </section>

      <section className={styles.documents} aria-label="Loaded source documents">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Official source document</p>
            <h2>The bill document comes first.</h2>
          </div>
          {documents.length > 0 ? <span>{documents.length} published</span> : null}
        </div>

        {error ? (
          <p className={styles.loadError}>{error}</p>
        ) : primaryDocument ? (
          <>
            <article className={styles.featuredDocument}>
              <div>
                <p className={styles.featuredLabel}>
                  {primaryDocument.source_name ?? "Finance Bill source"}
                </p>
                <h3>{primaryDocument.title}</h3>
                <p>
                  {primaryDocument.description ??
                    "Open the verified public document, read the PDF, and use it as the source for summaries, AI answers, and public discussion."}
                </p>
                <div className={styles.documentMeta}>
                  {primaryDocument.published_at ? (
                    <time dateTime={primaryDocument.published_at}>
                      Published{" "}
                      {new Intl.DateTimeFormat("en-KE", {
                        dateStyle: "medium",
                      }).format(new Date(primaryDocument.published_at))}
                    </time>
                  ) : null}
                  <span>{primaryDocument.chunk_count ?? 0} source chunks</span>
                  {primaryDocument.processed_at ? <span>Processed</span> : null}
                </div>
              </div>

              <div className={styles.featuredActions}>
                <Link
                  className={styles.openDocument}
                  href={`/finance-bill-2026/${primaryDocument.slug}`}
                >
                  Open the bill document
                </Link>
                <Link href="/finance-bill-2026/summary">Read plain summary</Link>
                <Link href={`/ask?source=${primaryDocument.slug}`}>
                  Ask about this bill
                </Link>
              </div>
            </article>

            {otherDocuments.length > 0 ? (
              <div className={styles.secondaryDocuments}>
                <p className={styles.sectionLabel}>Other published documents</p>
                <div className={styles.documentGrid}>
                  {otherDocuments.map((document) => (
                    <Link
                      className={styles.documentCard}
                      href={`/finance-bill-2026/${document.slug}`}
                      key={document.id}
                    >
                      <span>{document.source_name ?? "Finance Bill source"}</span>
                      <strong>{document.title}</strong>
                      <p>
                        {document.description ??
                          "Open the public PDF and source details."}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className={styles.emptyDocuments}>
            No published source documents have been loaded yet.
          </p>
        )}
      </section>

      <section className={styles.grid} aria-label="Finance Bill 2026 sections">
        {topicCards.map((card) => (
          <Link className={styles.card} href={card.href} key={card.href}>
            <span>{card.title}</span>
            <p>{card.description}</p>
          </Link>
        ))}
      </section>

      <section className={styles.sourceSection}>
        <div>
          <p className={styles.sectionLabel}>Source-first answers</p>
          <h2>No guesswork on legal details.</h2>
        </div>
        <p>
          Until official bill text, committee updates, and trusted articles are
          added to the database, this page avoids making specific claims about
          proposals. Once documents are loaded, every AI answer should include
          the source material used.
        </p>
      </section>
    </div>
  );
}
