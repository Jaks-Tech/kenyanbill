import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedFinanceBillDocuments } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Finance Bills Kenya",
  description: "Official documents, plain-language explainers, AI chat tools, and anonymous citizen sentiment trackers.",
  alternates: { canonical: "/finance-bill-2026" },
};

export const dynamic = "force-dynamic";
export const revalidate = 0; 

export default async function FinanceBill2026Page() {
  const { documents = [], error } = await listPublishedFinanceBillDocuments() || { documents: [] };
  const primaryDocument = documents[0] ?? null;
  const otherDocuments = documents.slice(1);

  // Compute live metrics for the badge content extensions
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunk_count ?? 0), 0);
  const totalDocumentsCount = documents.length;

  return (
    <div className={styles.page}>
      {/* Hero Block */}
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Finance Bills Kenya</p>
          <h1>Understand, query, and debate public policy.</h1>
          <p>
            Access official source frameworks, breaking media reporting vectors, and unmoderated 
            citizen-to-citizen commentary trackers for the Finance Bill 2026.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/ask">Finance Bill GPT</Link>
            <Link className={styles.secondary} href="/forum">Citizen Public Forum</Link>
          </div>
        </div>

        {/* Enhanced Dynamic Knowledge Status Badge */}
        <aside className={styles.statusBadgeWrapper} aria-label="Knowledge base status">
          <div className={styles.statusBadge} data-verified={!!primaryDocument}>
            <div className={styles.badgeCore}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                {primaryDocument ? "Knowledge Engine Live" : "Awaiting Official Text"}
              </span>
            </div>
            
            {primaryDocument && (
              <div className={styles.badgeMetaMetrics}>
                <span className={styles.metricSeparator}>•</span>
                <span className={styles.metricPill}>
                  <strong>{totalDocumentsCount}</strong> {totalDocumentsCount === 1 ? "File" : "Files"} Loaded
                </span>
                <span className={styles.metricSeparator}>•</span>
                <span className={styles.metricPill}>
                  <strong>{totalChunks.toLocaleString()}</strong> Reference Nodes
                </span>
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* Main Source Asset Matrix */}
      <section className={styles.documents} aria-label="Loaded source documents">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Primary Framework</p>
            <h2>KENYA FINANCE BILL</h2>
          </div>
          {documents.length > 0 && <span className={styles.countBadge}>{documents.length} Available</span>}
        </div>

        {error ? (
          <p className={styles.loadError}>{error}</p>
        ) : primaryDocument ? (
          <>
            <article className={styles.featuredDocument}>
              <div>
                <p className={styles.featuredLabel}>
                  {primaryDocument.source_name ?? "Official Gazette"}
                </p>
                <h3>{primaryDocument.title}</h3>
                <p>
                  {primaryDocument.description ?? "Core text layer for automated summarization models and community cross-examinations."}
                </p>
                
                <div className={styles.documentMeta}>
                  {primaryDocument.published_at && (
                    <time dateTime={primaryDocument.published_at}>
                      Issued: {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(primaryDocument.published_at))}
                    </time>
                  )}
                  <span>{primaryDocument.chunk_count ?? 0} Mapped Chunks</span>
                  {primaryDocument.processed_at && <span className={styles.statusTag}>Vectorized</span>}
                </div>
              </div>

              {/* Direct Page Interactivity Index */}
              <div className={styles.featuredActions}>
                <Link className={styles.openDocument} href={`/finance-bill-2026/${primaryDocument.slug}`}>
                  Read the finance bill →
                </Link>
                <Link href="/finance-bill-2026/summary">
                  Our Finance Bill Summary →
                </Link>
                <Link href={`/ask?source=${primaryDocument.slug}`}>
                  Ask anything about the finance bill →
                </Link>
              </div>
            </article>

            {/* Supplementary Materials */}
            {otherDocuments.length > 0 && (
              <div className={styles.secondaryDocuments}>
                <p className={styles.sectionLabel}>Addenda & Custom Memorandums</p>
                <div className={styles.documentGrid}>
                  {otherDocuments.map((doc) => (
                    <Link className={styles.documentCard} href={`/finance-bill-2026/${doc.slug}`} key={doc.id}>
                      <span>{doc.source_name ?? "Official Submissions"}</span>
                      <strong>{doc.title}</strong>
                      <p>{doc.description ?? "View associated legal PDF attachment parameters."}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className={styles.emptyDocuments}>
            Awaiting official document uploads from Parliamentary repositories.
          </p>
        )}
      </section>

{/* Core Grounding Guardrail Note */}
<aside className={styles.note} aria-label="Zero-Speculation Protocol">
  <p className={styles.sectionLabel}>Zero-Speculation Protocol</p>
  <h2>Strict Source Attribution</h2>
  <p>
    Every response rendered via chat endpoints maps back to active database row identifiers. 
    Unverified commentary and conjecture are discarded to preserve maximum informational fidelity.
  </p>
</aside>
    </div>
  );
}