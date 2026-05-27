import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownContent } from "@/components/MarkdownContent";
import { summarizeFinanceBillFromChunks } from "@/lib/rag/summary";
import {
  listDocumentChunksForDocument,
  listPublishedFinanceBillDocuments,
} from "@/lib/supabase/server";
import styles from "../topic-page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plain-Language Finance Bill Summary",
  description:
    "A citizen-friendly summary of Kenya's Finance Bill prepared from processed source document chunks.",
  alternates: {
    canonical: "/finance-bill-2026/summary",
  },
};

export default async function FinanceBillSummaryPage() {
  const { documents, error: documentsError } =
    await listPublishedFinanceBillDocuments();
  const document = documents[0] ?? null;
  const { chunks, error: chunksError } = document
    ? await listDocumentChunksForDocument(document.id, 18)
    : { chunks: [], error: null };
  const generated = document
    ? await summarizeFinanceBillFromChunks(document, chunks)
    : null;

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/finance-bill-2026">
        Back to Finance Bills
      </Link>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Plain-language summary</p>
          <h1>Plain summary of the proposal.</h1>
          <p>
            This page reads the processed database chunks for the latest
            published Finance Bill document and prepares a citizen-friendly
            summary from that source text.
          </p>
        </div>

        <aside className={styles.status}>
          <p className={styles.kicker}>Current source</p>
          <strong>{document?.title ?? "No published document yet"}</strong>
          <p>
            {chunks.length > 0
              ? `${chunks.length} processed chunks used for this summary.`
              : "No processed chunks are available for summary generation yet."}
          </p>
        </aside>
      </section>

      <section className={styles.section}>
        <h2>Summary</h2>
        {documentsError ? <p className={styles.errorText}>{documentsError}</p> : null}
        {chunksError ? <p className={styles.errorText}>{chunksError}</p> : null}
        {generated ? (
          <div className={styles.summaryBody}>
            <MarkdownContent content={generated.summary} />
          </div>
        ) : (
          <p className={styles.errorText}>
            Publish a Finance Bill document first, then process its PDF chunks
            from the admin page.
          </p>
        )}
      </section>

      {document ? (
        <section className={styles.sourceNote}>
          <h2>Source handling</h2>
          <p>
            {generated?.source === "ai"
              ? "This summary was generated from database chunks and should cite source numbers where the source text supports the point."
              : "This page is using the stored document summary or an extractive fallback because AI generation is not available."}{" "}
            <Link href={`/finance-bill-2026/${document.slug}`}>
              Open the source document.
            </Link>
          </p>
        </section>
      ) : null}
    </main>
  );
}
