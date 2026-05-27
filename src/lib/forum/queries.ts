import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ForumComment, ForumThread } from "./types";

const threadSelect =
  "id, slug, thread_type, title, body, category, anonymous_name, anonymous_session_id, ai_generated, status, like_count, comment_count, score, created_at, updated_at";

export async function listForumThreads(sort: "trending" | "latest" = "trending") {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { threads: [] as ForumThread[], error: "Supabase is not configured." };
  }

  const query = supabase
    .from("forum_threads")
    .select(threadSelect)
    .in("status", ["open", "locked"])
    .limit(30);

  if (sort === "latest") {
    query.order("created_at", { ascending: false });
  } else {
    query.order("score", { ascending: false }).order("updated_at", { ascending: false });
  }

  const { data, error } = await query;

  return {
    threads: (data ?? []) as ForumThread[],
    error: error?.message ?? null,
  };
}

export async function getForumThreadBySlug(slug: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      thread: null,
      comments: [] as ForumComment[],
      error: "Supabase is not configured.",
    };
  }

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select(threadSelect)
    .eq("slug", slug)
    .in("status", ["open", "locked"])
    .maybeSingle<ForumThread>();

  if (threadError || !thread) {
    return {
      thread: null,
      comments: [] as ForumComment[],
      error: threadError?.message ?? "Thread not found.",
    };
  }

  const { data: comments, error: commentsError } = await supabase
    .from("forum_comments")
    .select(
      "id, thread_id, parent_comment_id, body, anonymous_name, anonymous_session_id, is_ai_response, ai_sources, status, like_count, reply_count, created_at",
    )
    .eq("thread_id", thread.id)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  return {
    thread,
    comments: (comments ?? []) as ForumComment[],
    error: commentsError?.message ?? null,
  };
}
