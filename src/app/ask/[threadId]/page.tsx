import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAskThread, listOpenAskThreads } from "@/lib/ask/threads";
import { getSuggestedQuestions } from "@/lib/rag/qa";
import { AskForm } from "../AskForm";
import type { AskState } from "../state";
import styles from "../page.module.css";

type PageProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { threadId } = await params;
  const { thread } = await getAskThread(threadId);

  return {
    title: thread ? thread.title : "Finance Bill Chat",
    description:
      thread?.summary ??
      "Read a public Kenyan Bill chat about the Finance Bill 2026.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function AskThreadPage({ params }: PageProps) {
  const { threadId } = await params;
  const [{ thread, messages, error }, suggestions, { threads }] =
    await Promise.all([
      getAskThread(threadId),
      getSuggestedQuestions(),
      listOpenAskThreads(),
    ]);

  if (!thread || error) {
    notFound();
  }

  const latestAssistantWithSources = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const initialState: AskState = {
    threadId: thread.id,
    question: "",
    answer: "",
    error: null,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
      sources:
        message.role === "assistant"
          ? normalizeSources(message.sources_used)
          : undefined,
    })),
    sources: normalizeSources(latestAssistantWithSources?.sources_used),
  };

  return (
    <div className={styles.page}>
      <AskForm
        initialState={initialState}
        suggestions={suggestions}
        threads={threads.filter((item) => item.id !== thread.id)}
      />
    </div>
  );
}

function normalizeSources(value: unknown): AskState["sources"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((source) => source && typeof source === "object")
    .map((source) => {
      const item = source as Record<string, unknown>;

      return {
        id: typeof item.id === "string" ? item.id : "",
        documentSlug:
          typeof item.documentSlug === "string" ? item.documentSlug : null,
        similarity:
          typeof item.similarity === "number" ? item.similarity : 0,
        preview: typeof item.preview === "string" ? item.preview : "",
      };
    })
    .filter((source) => source.id);
}
