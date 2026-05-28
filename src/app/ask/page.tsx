import type { Metadata } from "next";
import { listOpenAskThreads } from "@/lib/ask/threads";
import { getSuggestedQuestions } from "@/lib/rag/qa";
import { AskForm } from "./AskForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat Finance Bill 2026",
  description:
    "Chat with Kenyan Bill using uploaded Finance Bill documents and retrieved source chunks.",
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
      <AskForm
        forceNewThread={params.new === "1"}
        suggestions={suggestions}
        threads={threads}
      />
    </div>
  );
}
