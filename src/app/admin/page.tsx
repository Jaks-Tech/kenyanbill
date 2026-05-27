import type { Metadata } from "next";
import Link from "next/link";
import {
  hasSupabaseAdminConfig,
  listFinanceBillDocuments,
} from "@/lib/supabase/admin";
import { listParticipationDeadlines } from "@/lib/public-participation/queries";
import { AdminDocumentForm } from "./AdminDocumentForm";
import { AdminTabs } from "./AdminTabs";
import { logoutAdmin, requireAdminSession } from "./auth";
import {
  deleteFinanceBillDocument,
  fetchParticipationDeadlinesAction,
  fetchNewsAction,
  processFinanceBillDocument,
} from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Kenyan Bill admin dashboard for documents and content.",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const { documents, error } = await listFinanceBillDocuments();
  const { deadlines } = await listParticipationDeadlines();
  const isConfigured = hasSupabaseAdminConfig();
  const processedCount = documents.filter((document) => document.processed_at).length;
  const publishedCount = documents.filter(
    (document) => document.status === "published",
  ).length;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      kicker: "Dashboard",
      title: "System snapshot",
      description:
        "Review the current content state before opening a specific management area.",
      content: (
        <section className={styles.metricGrid}>
          <article>
            <span>Published documents</span>
            <strong>{publishedCount}</strong>
            <p>Public bill sources available on the Finance Bills hub.</p>
          </article>
          <article>
            <span>Processed documents</span>
            <strong>{processedCount}</strong>
            <p>Documents with chunks ready for summaries and Ask AI retrieval.</p>
          </article>
          <article>
            <span>Deadline records</span>
            <strong>{deadlines.length}</strong>
            <p>Model-extracted public participation notices in the database.</p>
          </article>
        </section>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      kicker: "Source PDFs",
      title: "Upload and process Finance Bill sources",
      description:
        "Publish official PDFs, process chunks, and manage public document pages.",
      content: (
        <section className={styles.documentTabLayout}>
          <AdminDocumentForm />
          <DocumentList documents={documents} />
        </section>
      ),
    },
    {
      id: "automation",
      label: "Automation",
      kicker: "Fetch jobs",
      title: "Run source lookups",
      description:
        "Fetch external news and ask the model to extract public participation deadline JSON.",
      content: (
        <div className={styles.automationGrid}>
          <section className={styles.newsPanel}>
            <div>
              <p className={styles.sectionLabel}>Automated news</p>
              <h3>Collect external links and publish summaries</h3>
              <p>
                Fetch active RSS sources, summarize external article metadata,
                and publish cards that link readers to the original source.
              </p>
            </div>
            <form action={fetchNewsAction}>
              <button type="submit">Fetch news now</button>
            </form>
          </section>

          <section className={styles.newsPanel}>
            <div>
              <p className={styles.sectionLabel}>Participation tracker</p>
              <h3>Look up deadline notices online</h3>
              <p>
                Scan internet sources for public participation notices, extract
                structured JSON, and save it to the deadline table.
              </p>
            </div>
            <form action={fetchParticipationDeadlinesAction}>
              <button type="submit">Look up deadlines now</button>
            </form>
          </section>
        </div>
      ),
    },
    {
      id: "deadlines",
      label: "Deadlines",
      kicker: "Extracted JSON",
      title: "Public participation deadline records",
      description:
        "Read the current records saved by the automated internet lookup.",
      content: <DeadlineList deadlines={deadlines} />,
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin dashboard</p>
          <h1>Manage Kenyan Bill content.</h1>
          <p>
            Use tabs to manage source documents, automated lookups, extracted
            deadline records, and public content state.
          </p>
        </div>
        <form action={logoutAdmin}>
          <button className={styles.logoutButton} type="submit">
            Log out
          </button>
        </form>
      </header>

      {params.success ? (
        <div className={styles.notice} data-kind="success">
          {params.success}
        </div>
      ) : null}
      {params.error ? (
        <div className={styles.notice} data-kind="error">
          {params.error}
        </div>
      ) : null}

      {!isConfigured ? <SetupPanel /> : null}
      {error && isConfigured ? (
        <div className={styles.notice} data-kind="error">
          {error}
        </div>
      ) : null}

      <AdminTabs tabs={tabs} />
    </div>
  );
}

type DocumentListProps = {
  documents: Awaited<ReturnType<typeof listFinanceBillDocuments>>["documents"];
};

function DocumentList({ documents }: DocumentListProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionLabel}>Documents</p>
          <h2>Loaded sources</h2>
        </div>
        <span>{documents.length}</span>
      </div>

      {documents.length > 0 ? (
        <div className={styles.documentList}>
          {documents.map((document) => (
            <article className={styles.documentCard} key={document.id}>
              <div>
                <h3>{document.title}</h3>
                <p>{document.description ?? "No description added."}</p>
                <div className={styles.documentMeta}>
                  <span>{document.status ?? "unknown"}</span>
                  <span>{document.slug}</span>
                  <span>{document.chunk_count ?? 0} chunks</span>
                  {document.processed_at ? <span>processed</span> : null}
                </div>
                {document.processing_error ? (
                  <p className={styles.processingError}>
                    {document.processing_error}
                  </p>
                ) : null}
              </div>
              <div className={styles.documentActions}>
                <Link href={`/finance-bill-2026/${document.slug}`}>View page</Link>
                <form action={processFinanceBillDocument}>
                  <input name="id" type="hidden" value={document.id} />
                  <input name="slug" type="hidden" value={document.slug} />
                  <input
                    name="pdf_path"
                    type="hidden"
                    value={document.pdf_path ?? ""}
                  />
                  <input
                    name="pdf_url"
                    type="hidden"
                    value={document.pdf_url ?? ""}
                  />
                  <button type="submit">Process chunks</button>
                </form>
                <form action={deleteFinanceBillDocument}>
                  <input name="id" type="hidden" value={document.id} />
                  <input name="slug" type="hidden" value={document.slug} />
                  <input
                    name="pdf_path"
                    type="hidden"
                    value={document.pdf_path ?? ""}
                  />
                  <button type="submit">Delete</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No documents loaded yet.</h3>
          <p>
            Upload the first Finance Bill PDF to create its public slug page and
            prepare it for RAG ingestion.
          </p>
        </div>
      )}
    </section>
  );
}

type DeadlineListProps = {
  deadlines: Awaited<ReturnType<typeof listParticipationDeadlines>>["deadlines"];
};

function DeadlineList({ deadlines }: DeadlineListProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionLabel}>Extracted deadline JSON</p>
          <h2>Current database records</h2>
        </div>
        <span>{deadlines.length}</span>
      </div>

      {deadlines.length > 0 ? (
        <div className={styles.documentList}>
          {deadlines.map((deadline) => (
            <article className={styles.documentCard} key={deadline.id}>
              <div>
                <h3>{deadline.title}</h3>
                <p>{deadline.description ?? "No description added."}</p>
                <div className={styles.documentMeta}>
                  <span>{deadline.status.replaceAll("_", " ")}</span>
                  {deadline.deadline_at ? (
                    <span>
                      {new Intl.DateTimeFormat("en-KE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(deadline.deadline_at))}
                    </span>
                  ) : null}
                  {deadline.committee ? <span>{deadline.committee}</span> : null}
                </div>
              </div>
              <div className={styles.documentActions}>
                <Link href="/public-participation/deadlines">View public</Link>
                {deadline.source_url ? (
                  <a href={deadline.source_url} target="_blank" rel="noreferrer">
                    Source
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No deadline records yet.</h3>
          <p>
            Use the internet lookup in Automation to scan active sources and
            save model-extracted records into the database.
          </p>
        </div>
      )}
    </section>
  );
}

function SetupPanel() {
  return (
    <section className={styles.setup}>
      <p className={styles.sectionLabel}>Setup required</p>
      <h2>Add the Supabase service role key for admin writes.</h2>
      <p>
        The public anon key can read public data, but admin upload/delete
        actions need the server-only service role key.
      </p>
      <code>SUPABASE_SERVICE_ROLE_KEY=...</code>
    </section>
  );
}
