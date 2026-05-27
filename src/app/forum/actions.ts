"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { askFinanceBillQuestion } from "@/lib/rag/qa";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function redirectForum(type: "success" | "error", message: string): never {
  redirect(`/forum?${type}=${encodeURIComponent(message)}`);
}

export async function createForumThread(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectForum("error", "Admin database key is missing.");
  }

  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  const category = clean(formData.get("category")) || "general";
  const anonymousName = clean(formData.get("anonymous_name")) || "True Patriot 001";
  const anonymousSessionId = clean(formData.get("anonymous_session_id"));
  const threadType = title.endsWith("?") ? "user_question" : "user_post";

  if (!title || !body) {
    redirectForum("error", "Title and body are required.");
  }

  const slug = `${slugify(title).slice(0, 72)}-${Date.now().toString(36)}`;
  const { error } = await supabase!.from("forum_threads").insert({
    slug,
    thread_type: threadType,
    title,
    body,
    category,
    anonymous_name: anonymousName,
    anonymous_session_id: anonymousSessionId,
    status: "open",
  });

  if (error) {
    redirectForum("error", error.message);
  }

  revalidatePath("/forum");
  redirect(`/forum/thread/${slug}`);
}

export async function createForumComment(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectForum("error", "Admin database key is missing.");
  }

  const threadId = clean(formData.get("thread_id"));
  const threadSlug = clean(formData.get("thread_slug"));
  const parentCommentId = clean(formData.get("parent_comment_id")) || null;
  const body = clean(formData.get("body"));
  const anonymousName = clean(formData.get("anonymous_name")) || "True Patriot 001";
  const anonymousSessionId = clean(formData.get("anonymous_session_id"));

  if (!threadId || !threadSlug || !body) {
    redirectForum("error", "Comment body is required.");
  }

  const { error } = await supabase!.from("forum_comments").insert({
    thread_id: threadId,
    parent_comment_id: parentCommentId,
    body,
    anonymous_name: anonymousName,
    anonymous_session_id: anonymousSessionId,
  });

  if (error) {
    redirectForum("error", error.message);
  }

  await supabase!
    .from("forum_threads")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  await supabase!.rpc("increment_forum_counts", {
    target_thread_id: threadId,
    parent_comment_id: parentCommentId,
  }).then(async ({ error: rpcError }) => {
    if (rpcError) {
      await fallbackIncrementCommentCount(threadId, parentCommentId);
    }
  });

  revalidatePath("/forum");
  revalidatePath(`/forum/thread/${threadSlug}`);
  redirect(`/forum/thread/${threadSlug}`);
}

export async function verifyForumTarget(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectForum("error", "Admin database key is missing.");
  }

  const threadId = clean(formData.get("thread_id"));
  const threadSlug = clean(formData.get("thread_slug"));
  const targetType = clean(formData.get("target_type"));
  const targetId = clean(formData.get("target_id"));
  const body = clean(formData.get("body"));

  if (!threadId || !threadSlug || !targetId || !body) {
    redirectForum("error", "Could not verify this item.");
  }

  await createAiForumReply({
    body,
    threadId,
    parentCommentId: targetType === "comment" ? targetId : null,
  });

  revalidatePath("/forum");
  revalidatePath(`/forum/thread/${threadSlug}`);
  redirect(`/forum/thread/${threadSlug}`);
}

export async function likeForumTarget(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectForum("error", "Admin database key is missing.");
  }

  const targetType = clean(formData.get("target_type"));
  const targetId = clean(formData.get("target_id"));
  const threadSlug = clean(formData.get("thread_slug"));
  const anonymousSessionId = clean(formData.get("anonymous_session_id"));

  if (!targetType || !targetId || !anonymousSessionId) {
    redirectForum("error", "Could not register like.");
  }

  const { error } = await supabase!.from("forum_reactions").insert({
    target_type: targetType,
    target_id: targetId,
    anonymous_session_id: anonymousSessionId,
    reaction_type: "like",
  });

  if (!error) {
    const table = targetType === "thread" ? "forum_threads" : "forum_comments";
    const { data } = await supabase!
      .from(table)
      .select("like_count")
      .eq("id", targetId)
      .single<{ like_count: number }>();

    await supabase!
      .from(table)
      .update({ like_count: (data?.like_count ?? 0) + 1 })
      .eq("id", targetId);
  }

  revalidatePath("/forum");

  if (threadSlug) {
    revalidatePath(`/forum/thread/${threadSlug}`);
    redirect(`/forum/thread/${threadSlug}`);
  }

  redirect("/forum");
}

export async function reportForumTarget(formData: FormData) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectForum("error", "Admin database key is missing.");
  }

  const targetType = clean(formData.get("target_type"));
  const targetId = clean(formData.get("target_id"));
  const threadSlug = clean(formData.get("thread_slug"));
  const reason = clean(formData.get("reason")) || "Needs review";
  const reporterSessionId = clean(formData.get("anonymous_session_id"));

  await supabase!.from("forum_reports").insert({
    target_type: targetType,
    target_id: targetId,
    reason,
    reporter_session_id: reporterSessionId,
  });

  revalidatePath("/forum");

  if (threadSlug) {
    revalidatePath(`/forum/thread/${threadSlug}`);
    redirect(`/forum/thread/${threadSlug}`);
  }

  redirect("/forum");
}

async function createAiForumReply({
  body,
  threadId,
  parentCommentId,
}: {
  body: string;
  threadId: string;
  parentCommentId: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const question = body.replace(/@kenyanbill/gi, "").trim() || body;
  const result = await askFinanceBillQuestion(
    `Verify this forum claim or question in exactly three concise sentences using Finance Bill sources. Do not use markdown headings. Include source citations like [Source 1]. If it cannot be verified, say that clearly. Text: ${question}`,
  );

  await supabase!.from("forum_comments").insert({
    thread_id: threadId,
    parent_comment_id: parentCommentId,
    body:
      result.answer ||
      "I could not verify that from the currently processed Finance Bill sources.",
    anonymous_name: "Kenyan Bill AI",
    anonymous_session_id: "kenyan-bill-ai",
    is_ai_response: true,
    ai_sources: result.sources.map((source, index) => ({
      source_number: index + 1,
      chunk_id: source.id,
      document_slug:
        typeof source.metadata.slug === "string" ? source.metadata.slug : null,
    })),
  });

  await fallbackIncrementCommentCount(threadId, parentCommentId);
}

async function fallbackIncrementCommentCount(
  threadId: string,
  parentCommentId: string | null,
) {
  const supabase = getSupabaseAdminClient();
  const { data: thread } = await supabase!
    .from("forum_threads")
    .select("comment_count, score")
    .eq("id", threadId)
    .single<{ comment_count: number; score: number }>();

  await supabase!
    .from("forum_threads")
    .update({
      comment_count: (thread?.comment_count ?? 0) + 1,
      score: (thread?.score ?? 0) + 4,
    })
    .eq("id", threadId);

  if (parentCommentId) {
    const { data: comment } = await supabase!
      .from("forum_comments")
      .select("reply_count")
      .eq("id", parentCommentId)
      .single<{ reply_count: number }>();

    await supabase!
      .from("forum_comments")
      .update({ reply_count: (comment?.reply_count ?? 0) + 1 })
      .eq("id", parentCommentId);
  }
}
