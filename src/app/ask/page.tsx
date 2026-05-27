import type { Metadata } from "next";
import Link from "next/link";
import { listOpenAskThreads } from "@/lib/ask/threads";
import { getSuggestedQuestions } from "@/lib/rag/qa";
import { AskForm } from "./AskForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask AI About the Finance Bill 2026",
  description:
    "Ask sourced AI questions about Kenya's Finance Bill 2026 using uploaded bill documents and retrieved source chunks.",
  alternates: {
    canonical: "/ask",
  },
};

type AskPageProps = {
  searchParams: Promise<{
    new?: string;
  }>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = await searchParams;
  const [suggestions, { threads }] = await Promise.all([
    getSuggestedQuestions(),
    listOpenAskThreads(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Ask AI</p>
          <h1>Ask the Finance Bill, not the internet.</h1>
          <p>
            Kenyan Bill retrieves relevant PDF chunks first, then uses AI to
            explain the answer in plain language with source references.
          </p>
          <div className={styles.heroLinks}>
            <Link href="/finance-bill-2026">Open bill hub</Link>
            <Link href="/finance-bill-2026/summary">Read summary</Link>
            <Link href="/forum">Discuss publicly</Link>
          </div>
        </div>

        <aside className={styles.sourcePanel}>
          <span>How answers work</span>
          <strong>Source chunks first</strong>
          <p>
            Answers should cite retrieved source numbers. If the source chunks
            are not enough, the AI should say so instead of guessing.
          </p>
        </aside>
      </header>

      <AskForm
        forceNewThread={params.new === "1"}
        suggestions={suggestions}
        threads={threads}
      />
    </div>
  );
}
