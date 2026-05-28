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

const widgets = [
  {
    href: "/finance-bill-2026/finance-bill-2026",
    label: "Source document",
    text: "Open the hosted Finance Bill page.",
  },
  {
    href: "/public-participation",
    label: "Public participation",
    text: "Create polls and prepare views.",
  },
  {
    href: "/forum",
    label: "Forum",
    text: "Take the discussion public.",
  },
];

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dismissedWidgets, setDismissedWidgets] = useState<string[]>([]);
  const [loadedThread, setLoadedThread] = useState(false);

  const [state, formAction, isPending] = useActionState<AskState, FormData>(
    askQuestionAction,
    initialState,
  );

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
  }, [
    initialState.threadId,
    isPending,
    router,
    state.messages,
    state.sources,
    state.threadId,
  ]);

  function submitSuggestion(suggestion: string) {
    setQuestion(suggestion);
    window.requestAnimationFrame(() => {
      formRef.current?.requestSubmit();
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (question.trim() && !isPending) {
        formRef.current?.requestSubmit();
      }
    }
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

  return (
    <section className={styles.chatWorkspace} data-sidebar-open={isSidebarOpen}>
      <button
        aria-expanded={isSidebarOpen}
        aria-label={isSidebarOpen ? "Close recent chats" : "Open recent chats"}
        className={styles.sidebarToggle}
        onClick={() => setIsSidebarOpen((value) => !value)}
        type="button"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M9 3v18" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </button>

      {isSidebarOpen ? (
        <button
          aria-label="Close recent chats"
          className={styles.sidebarBackdrop}
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside className={styles.chatSidebar}>
        <Link
          className={styles.newThread}
          href="/ask?new=1"
          onClick={() => {
            deleteThread();
            setIsSidebarOpen(false);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New chat
        </Link>

        <div className={styles.sidebarBlock}>
          <span className={styles.sidebarHeading}>Recent chats</span>

          <div className={styles.sidebarThreads}>
            {threads.length > 0 ? (
              threads.map((thread) => (
                <Link
                  className={styles.sidebarThreadLink}
                  href={`/ask/${thread.id}`}
                  key={thread.id}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <strong className={styles.threadTitle}>{thread.title}</strong>
                  <small className={styles.threadMeta}>{thread.anonymous_name}</small>
                </Link>
              ))
            ) : (
              <p className={styles.emptyStateText}>No saved public chats yet.</p>
            )}
          </div>
        </div>

        <div className={styles.sidebarWidgets}>
          {widgets
            .filter((widget) => !dismissedWidgets.includes(widget.href))
            .map((widget) => (
              <article className={styles.dismissibleWidget} key={widget.href}>
                <button
                  aria-label={`Dismiss ${widget.label}`}
                  className={styles.dismissWidgetBtn}
                  onClick={() =>
                    setDismissedWidgets((current) => [...current, widget.href])
                  }
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                <Link href={widget.href} onClick={() => setIsSidebarOpen(false)} className={styles.widgetLink}>
                  <span className={styles.widgetLabel}>{widget.label}</span>
                  <p className={styles.widgetText}>{widget.text}</p>
                </Link>
              </article>
            ))}
        </div>
      </aside>

      <main className={styles.chatMain} aria-live="polite">
        <div className={styles.messages}>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <article
                className={styles.message}
                data-role={message.role}
                key={`${message.role}-${index}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.avatarIcon} data-role={message.role}>
                    {message.role === "user" ? "U" : "KB"}
                  </span>
                  <span className={styles.messageSender}>
                    {message.role === "user" ? "You" : "Kenyan Bill"}
                  </span>
                </div>

                <div className={styles.messageBody}>
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
                </div>
              </article>
            ))
          ) : (
            <div className={styles.chatWelcome}>
              <span className={styles.welcomeBadge}>Chat Finance Bill</span>

              <p className={styles.welcomeSubtitle}>
                Questions are cross-referenced with official, verified bill drafts with transparent inline source citations.
              </p>

              {suggestions.length > 0 ? (
                <div className={styles.suggestionsContainer}>
                  <h2 className={styles.suggestionsHeading}>Quick Topics</h2>
                  <div className={styles.suggestionsGrid}>
                    {suggestions.map((suggestion) => (
                      <button
                        className={styles.suggestionCard}
                        key={suggestion}
                        onClick={() => submitSuggestion(suggestion)}
                        type="button"
                      >
                        <span className={styles.suggestionText}>{suggestion}</span>
                        <svg className={styles.suggestionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {sources.length > 0 ? (
          <details className={styles.sourceDrawer}>
            <summary className={styles.sourceDrawerSummary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.summaryIcon}>
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Retrieved sources for latest answer ({sources.length})</span>
            </summary>

            <div className={styles.sourcesGrid}>
              {sources.map((source, index) => (
                <article key={source.id} className={styles.sourceCard}>
                  <div className={styles.sourceCardHeader}>
                    <span className={styles.sourceBadge}>Source {index + 1}</span>
                    <span className={styles.sourceMatch}>
                      {(source.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <p className={styles.sourcePreview}>"{source.preview}..."</p>

                  {sourceHref(source) ? (
                    <Link href={sourceHref(source)!} className={styles.sourceLink}>
                      <span>View details</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </details>
        ) : null}

        {state.error ? <div className={styles.errorMessage}>{state.error}</div> : null}

        <div className={styles.inputAreaContainer}>
          <form action={formAction} className={styles.chatForm} ref={formRef}>
            <input name="history" type="hidden" value={JSON.stringify(messages)} />
            <input name="thread_id" type="hidden" value={activeThreadId ?? ""} />

            <div className={styles.textareaWrapper}>
              <textarea
                aria-label="Chat question"
                name="question"
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a question about clauses, taxes, sectors, deadlines, or claims..."
                rows={1}
                value={question}
                className={styles.chatTextarea}
              />
              <button 
                disabled={isPending || !question.trim()} 
                type="submit" 
                className={styles.sendButton}
                aria-label="Send query"
              >
                {isPending ? (
                  <span className={styles.loaderElement} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </form>
          <p className={styles.inputDisclaimer}>
            Confirm with legal text before acting. Information parsed directly from local statutory bills.
          </p>
        </div>
      </main>
    </section>
  );
}