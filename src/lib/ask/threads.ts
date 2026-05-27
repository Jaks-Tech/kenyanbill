import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AskState } from "@/app/ask/state";

export type AskThread = {
  id: string;
  title: string;
  summary: string | null;
  anonymous_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AskMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  sources_used: unknown[];
  created_at: string;
};

export async function listOpenAskThreads(limit = 12) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { threads: [] as AskThread[], error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("ask_threads")
    .select("id, title, summary, anonymous_name, status, created_at, updated_at")
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(limit);

  return {
    threads: (data ?? []) as AskThread[],
    error: error?.message ?? null,
  };
}

export async function getAskThread(threadId: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      thread: null,
      messages: [] as AskMessage[],
      error: "Supabase is not configured.",
    };
  }

  const { data: thread, error: threadError } = await supabase
    .from("ask_threads")
    .select("id, title, summary, anonymous_name, status, created_at, updated_at")
    .eq("id", threadId)
    .eq("status", "open")
    .maybeSingle<AskThread>();

  if (threadError || !thread) {
    return {
      thread: null,
      messages: [] as AskMessage[],
      error: threadError?.message ?? "Thread not found.",
    };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ask_messages")
    .select("id, thread_id, role, content, sources_used, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return {
    thread,
    messages: (messages ?? []) as AskMessage[],
    error: messagesError?.message ?? null,
  };
}

export async function saveAskTurn({
  threadId,
  question,
  answer,
  sources,
}: {
  threadId: string | null;
  question: string;
  answer: string;
  sources: AskState["sources"];
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  let activeThreadId = threadId;

  if (!activeThreadId) {
    const { data, error } = await supabase
      .from("ask_threads")
      .insert({
        title: buildThreadTitle(question),
        summary: buildThreadSummary(question, answer),
        anonymous_name: buildAnonymousName(),
        status: "open",
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not create Ask thread.");
    }

    activeThreadId = data.id;
  } else {
    await supabase
      .from("ask_threads")
      .update({
        summary: buildThreadSummary(question, answer),
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeThreadId);
  }

  const { error } = await supabase.from("ask_messages").insert([
    {
      thread_id: activeThreadId,
      role: "user",
      content: question,
      sources_used: [],
    },
    {
      thread_id: activeThreadId,
      role: "assistant",
      content: answer,
      sources_used: sources,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return activeThreadId;
}

function buildThreadTitle(question: string) {
  return question.length > 82 ? `${question.slice(0, 79).trim()}...` : question;
}

function buildThreadSummary(question: string, answer: string) {
  const summary = `${question} ${answer}`.replace(/\s+/g, " ").trim();
  return summary.length > 180 ? `${summary.slice(0, 177).trim()}...` : summary;
}

function buildAnonymousName() {
  return `True Patriot ${Math.floor(1 + Math.random() * 999)
    .toString()
    .padStart(3, "0")}`;
}
