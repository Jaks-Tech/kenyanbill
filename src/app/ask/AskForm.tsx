"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { AskThread } from "@/lib/ask/threads";
import { askQuestionAction } from "./actions";
import { initialAskState, type AskSource, type AskState } from "./state";
import styles from "./page.module.css";

type AskFormProps = {
  forceNewThread?: boolean;
  initialState?: AskState;
  suggestions: string[];
  threads: AskThread[];
};

const threadStorageKey = "kenyan-bill-ask-thread";
const threadTtlMs = 24 * 60 * 60 * 1000;

type StoredThread = {
  savedAt: number;
  threadId: string | null;
  messages: AskState["messages"];
  sources: AskState["sources"];
};

function sourceHref(source: AskSource) {
  if (!source.documentSlug) {
    return null;
  }

  return `/finance-bill-2026/${source.documentSlug}?source=${source.id}#source-highlight`;
}

function linkSourceCitations(content: string, activeSources: AskSource[]) {
  return content.replace(/\[Source\s+(\d+)\]/gi, (match, sourceNumber) => {
    const source = activeSources[Number(sourceNumber) - 1];
    const href = source ? sourceHref(source) : null;

    return href ? `[${match}](${href})` : match;
  });
}

export function AskForm({
  forceNewThread = false,
  initialState = initialAskState,
  suggestions,
  threads,
}: AskFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [question, setQuestion] = useState("");
  const [localThreadId, setLocalThreadId] = useState<string | null>(
    initialState.threadId,
  );
  const [messages, setMessages] = useState<AskState["messages"]>([]);
  const [sources, setSources] = useState<AskState["sources"]>([]);
  const [loadedThread, setLoadedThread] = useState(false);
  const [state, formAction, isPending] = useActionState<AskState, FormData>(
    askQuestionAction,
    initialState,
  );
  const hasConversation = messages.length > 0;
  const activeThreadId = state.threadId ?? localThreadId;

  useEffect(() => {
    if (forceNewThread) {
      window.localStorage.removeItem(threadStorageKey);
      setMessages([]);
      setSources([]);
      setLocalThreadId(null);
      setLoadedThread(true);
      return;
    }

    if (initialState.messages.length > 0) {
      setMessages(initialState.messages);
      setSources(initialState.sources);
      setLoadedThread(true);
      return;
    }

    const stored = window.localStorage.getItem(threadStorageKey);

    if (!stored) {
      setLoadedThread(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredThread;

      if (Date.now() - parsed.savedAt > threadTtlMs) {
        window.localStorage.removeItem(threadStorageKey);
      } else {
        setMessages(parsed.messages ?? []);
        setSources(parsed.sources ?? []);
        setLocalThreadId(parsed.threadId ?? null);
      }
    } catch {
      window.localStorage.removeItem(threadStorageKey);
    }

    setLoadedThread(true);
  }, [forceNewThread, initialState.messages, initialState.sources]);

  useEffect(() => {
    if (!isPending && state.messages.length > 0) {
      setMessages(state.messages);
      setSources(state.sources);
      setLocalThreadId(state.threadId);
      setQuestion("");

      window.localStorage.setItem(
        threadStorageKey,
        JSON.stringify({
          savedAt: Date.now(),
          threadId: state.threadId,
          messages: state.messages,
          sources: state.sources,
        } satisfies StoredThread),
      );

      if (!initialState.threadId && state.threadId) {
        router.replace(`/ask/${state.threadId}`);
      }
    }
  }, [initialState.threadId, isPending, router, state.messages, state.sources, state.threadId]);

  function submitSuggestion(suggestion: string) {
    setQuestion(suggestion);
    window.requestAnimationFrame(() => {
      formRef.current?.requestSubmit();
    });
  }

  function deleteThread() {
    window.localStorage.removeItem(threadStorageKey);
    setMessages([]);
    setSources([]);
    setLocalThreadId(null);
    setQuestion("");
  }

  if (!loadedThread) {
    return null;
  }

  if (hasConversation) {
    return (
      <section className={styles.chatPage} aria-live="polite">
        <div className={styles.chatHeader}>
          <div>
            <span>Finance Bill AI</span>
            <h2>Conversation</h2>
            <p>This anonymous thread is kept on this browser for 24 hours.</p>
          </div>
          <button onClick={deleteThread} type="button">
            Delete thread
          </button>
        </div>

        <div className={styles.messages}>
          {messages.map((message, index) => (
            <article
              className={styles.message}
              data-role={message.role}
              key={`${message.role}-${index}`}
            >
              <span>{message.role === "user" ? "You" : "Kenyan Bill AI"}</span>
              {message.role === "assistant" ? (
                <MarkdownContent
                  content={linkSourceCitations(
                    message.content,
                    message.sources ?? sources,
                  )}
                />
              ) : (
                <p>{message.content}</p>
              )}
            </article>
          ))}
        </div>

        <div className={styles.chatLinks}>
          <Link href="/ask?new=1" onClick={deleteThread}>
            Start a new thread
          </Link>
          <Link href="/ask#public-threads">See other threads</Link>
        </div>

        {sources.length > 0 ? (
          <details className={styles.sourceDrawer}>
            <summary>Retrieved sources for latest answer</summary>
            <div className={styles.sources}>
              {sources.map((source, index) => (
                <article key={source.id}>
                  <span>Source {index + 1}</span>
                  <p>{source.preview}...</p>
                  <small>
                    Similarity: {(source.similarity * 100).toFixed(1)}%
                  </small>
                  {sourceHref(source) ? (
                    <Link href={sourceHref(source)!}>
                      Open highlighted source
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </details>
        ) : null}

        {state.error ? <p className={styles.error}>{state.error}</p> : null}

        <form action={formAction} className={styles.chatForm} ref={formRef}>
          <input
            name="history"
            type="hidden"
            value={JSON.stringify(messages)}
          />
          <input name="thread_id" type="hidden" value={activeThreadId ?? ""} />
          <textarea
            aria-label="Ask a follow-up question"
            name="question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a follow-up question..."
            rows={2}
            value={question}
          />
          <button disabled={isPending} type="submit">
            {isPending ? "Thinking..." : "Send"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className={styles.askShell}>
      <section className={styles.promptPanel}>
        <div className={styles.promptIntro}>
          <span>Ask from sources</span>
          <h2>What do you want clarified?</h2>
          <p>
            Ask about proposals, tax areas, impact, public participation, or a
            specific claim you want checked against the uploaded bill.
          </p>
        </div>

        <form action={formAction} className={styles.form} ref={formRef}>
          <input
            name="history"
            type="hidden"
            value={JSON.stringify(messages)}
          />
          <input name="thread_id" type="hidden" value={activeThreadId ?? ""} />
          <label htmlFor="question">Your question</label>
          <textarea
            id="question"
            name="question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How could this Finance Bill affect transport and fuel costs?"
            rows={5}
            value={question}
          />
          <button disabled={isPending} type="submit">
            {isPending ? "Searching sources..." : "Ask AI"}
          </button>
        </form>

        <div className={styles.suggestions}>
          <p>Try asking</p>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => submitSuggestion(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.answerPanel}>
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <div className={styles.empty}>
          <span>Source-grounded answer</span>
          <h2>Each answer should point back to the bill text.</h2>
          <p>
            The first answer will open a conversation view where you can keep
            asking follow-up questions.
          </p>
        </div>

        <div className={styles.answerChecklist}>
          <article>
            <span>1</span>
            <p>Searches the processed Finance Bill chunks.</p>
          </article>
          <article>
            <span>2</span>
            <p>Writes a plain-language explanation.</p>
          </article>
          <article>
            <span>3</span>
            <p>Links source citations back to highlighted document text.</p>
          </article>
        </div>
      </section>

      <ThreadList threads={threads} />
    </div>
  );
}

function ThreadList({ threads }: { threads: AskThread[] }) {
  return (
    <details className={styles.threadList} id="public-threads">
      <summary>
        <span>Public threads</span>
        <h2>What others are asking</h2>
      </summary>
      <Link
        className={styles.newThread}
        href="/ask?new=1"
        onClick={() => window.localStorage.removeItem(threadStorageKey)}
      >
        Start a new thread
      </Link>
      {threads.length > 0 ? (
        <div className={styles.threadCards}>
          {threads.map((thread) => (
            <Link href={`/ask/${thread.id}`} key={thread.id}>
              <span>{thread.anonymous_name}</span>
              <strong>{thread.title}</strong>
              <p>{thread.summary ?? "Open this public Ask AI thread."}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.noThreads}>
          No public Ask AI threads yet. Start a new Finance Bill question and
          the saved answer thread will appear here.
        </p>
      )}
    </details>
  );
}
