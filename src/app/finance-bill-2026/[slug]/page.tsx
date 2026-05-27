import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobilePdfViewer } from "@/components/MobilePdfViewer";
import {
  getDocumentChunkById,
  getFinanceBillDocumentBySlug,
  getPublicStorageUrl,
  hasSupabaseConfig,
} from "@/lib/supabase/server";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    source?: string;
  }>;
};

const pdfBucket = "finance-bill-documents";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { document } = await getFinanceBillDocumentBySlug(slug);

  if (!document) {
    return {
      title: "Finance Bill 2026 Document",
      description:
        "Read Finance Bill 2026 source documents, summaries, and related public discussion on Kenyan Bill.",
    };
  }

  return {
    title: document.title,
    description:
      document.description ??
      `Read ${document.title}, view the source PDF, and explore related public discussion on Kenyan Bill.`,
    alternates: {
      canonical: `/finance-bill-2026/${document.slug}`,
    },
  };
}

export default async function FinanceBillDocumentPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sourceId = (await searchParams)?.source;

  if (!hasSupabaseConfig()) {
    return <SupabaseSetupState slug={slug} />;
  }

  const { document, error } = await getFinanceBillDocumentBySlug(slug);

  if (error) {
    return <DataErrorState slug={slug} error={error} />;
  }

  if (!document) {
    notFound();
  }

  const pdfUrl =
    document.pdf_url ??
    (document.pdf_path ? getPublicStorageUrl(pdfBucket, document.pdf_path) : null);
  const mobilePdfViewerUrl = pdfUrl
    ? `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`
    : null;
  const { chunk: highlightedChunk } = sourceId
    ? await getDocumentChunkById(sourceId)
    : { chunk: null };
  const canShowHighlightedChunk =
    highlightedChunk &&
    highlightedChunk.document_id === document.id &&
    highlightedChunk.metadata?.slug === document.slug;

  return (
    <article className={styles.page}>
      <Link className={styles.backLink} href="/finance-bill-2026">
        Back to Finance Bills
      </Link>

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Finance Bill source document</p>
          <h1>{document.title}</h1>
          <p>
            {document.description ??
              "Read the official source document, inspect highlighted retrieved chunks, and move into summaries, AI questions, or public discussion from the same source."}
          </p>
        </div>

        <aside className={styles.sourceCard}>
          <span>Document source</span>
          <strong>{document.source_name ?? "Uploaded source"}</strong>
          <p>
            {document.processed_at
              ? "This document has been processed for source-based summaries and AI retrieval."
              : "This document is published. Processing status will appear here after chunking."}
          </p>
        </aside>
      </header>

      <section className={styles.documentBar} aria-label="Document status">
        {document.published_at ? (
          <time dateTime={document.published_at}>
            Published{" "}
            {new Intl.DateTimeFormat("en-KE", {
              dateStyle: "medium",
            }).format(new Date(document.published_at))}
          </time>
        ) : (
          <span>Publication date pending</span>
        )}
        <span>{document.chunk_count ?? 0} source chunks</span>
        {document.processed_at ? <span>Processed for AI</span> : null}
        {pdfUrl ? <span>PDF available</span> : <span>PDF pending</span>}
      </section>

      {canShowHighlightedChunk ? (
        <section className={styles.highlight} id="source-highlight">
          <div>
            <p className={styles.kicker}>Highlighted retrieved source</p>
            <h2>
              {highlightedChunk.section_title ??
                "Matched Finance Bill source text"}
            </h2>
            {highlightedChunk.page_number ? (
              <span>Page {highlightedChunk.page_number}</span>
            ) : null}
          </div>
          <mark>{highlightedChunk.chunk_text}</mark>
        </section>
      ) : null}

      <section className={styles.layout}>
        <section className={styles.reader}>
          <div className={styles.readerHeader}>
            <div>
              <p className={styles.kicker}>Document reader</p>
              <h2>Read the source PDF</h2>
            </div>
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Open PDF in new tab
              </a>
            ) : null}
          </div>

          <div className={styles.viewer}>
            {pdfUrl ? (
              <>
                <iframe
                  src={pdfUrl}
                  title={`${document.title} PDF`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {mobilePdfViewerUrl ? (
                  <MobilePdfViewer title={document.title} url={mobilePdfViewerUrl} />
                ) : null}
              </>
            ) : (
              <div className={styles.emptyPdf}>
                <span>PDF pending</span>
                <p>
                  Add a `pdf_path` from Supabase Storage or a direct `pdf_url` for
                  this document.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.summaryPanel}>
            <h2>Document summary</h2>
            <p>
              {document.summary ??
                "The verified summary for this document will appear here after the RAG ingestion and summarization workflow runs."}
            </p>
            <Link href="/finance-bill-2026/summary">Open plain summary</Link>
          </section>

          <section className={styles.panel}>
            <h2>Actions</h2>
            <div className={styles.actions}>
              <Link href={`/ask?source=${document.slug}`}>Ask about this PDF</Link>
              <Link href={`/forum/new?topic=${document.slug}`}>
                Discuss anonymously
              </Link>

            </div>
          </section>

          <section className={styles.panel}>
            <h2>Source use</h2>
            <p>
              AI answers, highlights, and summaries should point back to this
              document so readers can check public claims against source text.
            </p>
          </section>
        </aside>
      </section>
    </article>
  );
}

function SupabaseSetupState({ slug }: { slug: string }) {
  return (
    <div className={styles.statePage}>
      <p className={styles.kicker}>Supabase setup needed</p>
      <h1>Connect Supabase to load this document.</h1>
      <p>
        The slug page is ready for <strong>{slug}</strong>, but it needs
        Supabase environment variables before it can fetch the PDF and document
        metadata.
      </p>
      <code>NEXT_PUBLIC_SUPABASE_URL</code>
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
    </div>
  );
}

function DataErrorState({ slug, error }: { slug: string; error: string }) {
  return (
    <div className={styles.statePage}>
      <p className={styles.kicker}>Document lookup failed</p>
      <h1>Could not load this Finance Bill document.</h1>
      <p>
        The page for <strong>{slug}</strong> reached Supabase, but the document
        query returned an error.
      </p>
      <code>{error}</code>
    </div>
  );
}
