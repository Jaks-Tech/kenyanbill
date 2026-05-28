"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  financeBillDocumentsBucket,
  getSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { chunkText } from "@/lib/rag/chunking";
import { createEmbeddings } from "@/lib/rag/embeddings";
import { extractPdfText } from "@/lib/rag/pdf";
import { fetchAndPublishNews } from "@/lib/news/aggregator";
import { fetchParticipationDeadlines } from "@/lib/public-participation/tracker";
import { generateDailyPublicPolls } from "@/lib/public-participation/daily-polls";
import { generateDailyForumTopics } from "@/lib/forum/ai-generator";
import { generateDailyPollAnalysis } from "@/lib/public-participation/analysis";
import { generateBreakingNews } from "@/lib/news/breaking-news-generator";
import { requireAdminSession } from "./auth";

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function idToString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function redirectWithNotice(type: "success" | "error", message: string): never {
  redirect(`/admin?${type}=${encodeURIComponent(message)}`);
}

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? String(error.digest) : "";
  const message = error instanceof Error ? error.message : "";

  return digest.startsWith("NEXT_REDIRECT") || message === "NEXT_REDIRECT";
}

export async function uploadFinanceBillDocument(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = supabase!;

  const title = cleanString(formData.get("title"));
  const submittedSlug = cleanString(formData.get("slug"));
  const description = cleanString(formData.get("description"));
  const summary = cleanString(formData.get("summary"));
  const sourceName = cleanString(formData.get("source_name"));
  const sourceUrl = cleanString(formData.get("source_url"));
  const publishedAt = cleanString(formData.get("published_at"));
  const status = cleanString(formData.get("status")) ?? "published";
  const pdf = formData.get("pdf");

  if (!title) {
    redirectWithNotice("error", "Document title is required.");
  }

  const titleValue = title ?? "";
  const slug = submittedSlug ? slugify(submittedSlug) : slugify(titleValue);

  if (!slug) {
    redirectWithNotice("error", "A valid slug is required.");
  }

  let pdfPath: string | null = null;

  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.type && pdf.type !== "application/pdf") {
      redirectWithNotice("error", "Only PDF uploads are supported.");
    }

    const safeFileName = slugify(pdf.name.replace(/\.pdf$/i, "")) || "document";
    pdfPath = `${slug}/${safeFileName}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(financeBillDocumentsBucket)
      .upload(pdfPath, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      redirectWithNotice("error", uploadError.message);
    }
  }

  const { error } = await supabaseAdmin.from("finance_bill_documents").upsert(
    {
      slug,
      title,
      description,
      summary,
      source_name: sourceName,
      source_url: sourceUrl,
      pdf_path: pdfPath,
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );

  if (error) {
    redirectWithNotice("error", error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/finance-bill-2026");
  revalidatePath(`/finance-bill-2026/${slug}`);
  redirectWithNotice("success", "Finance Bill document saved.");
}

export async function deleteFinanceBillDocument(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = supabase!;

  const id = idToString(formData.get("id"));
  const slug = cleanString(formData.get("slug"));
  const pdfPath = cleanString(formData.get("pdf_path"));

  if (!id) {
    redirectWithNotice("error", "Document id is required.");
  }

  const { error } = await supabaseAdmin
    .from("finance_bill_documents")
    .delete()
    .eq("id", id);

  if (error) {
    redirectWithNotice("error", error.message);
  }

  if (pdfPath) {
    await supabaseAdmin.storage.from(financeBillDocumentsBucket).remove([pdfPath]);
  }

  revalidatePath("/admin");
  revalidatePath("/finance-bill-2026");

  if (slug) {
    revalidatePath(`/finance-bill-2026/${slug}`);
  }

  return;
}

export async function processFinanceBillDocument(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = supabase!;

  const id = idToString(formData.get("id"));
  const slug = cleanString(formData.get("slug"));
  const pdfPath = cleanString(formData.get("pdf_path"));
  const pdfUrl = cleanString(formData.get("pdf_url"));

  if (!id || !slug) {
    redirectWithNotice("error", "Document id and slug are required.");
  }

  if (!pdfPath && !pdfUrl) {
    redirectWithNotice("error", "This document does not have a PDF to process.");
  }

  let processedChunkCount = 0;
  let errorNotice: string | null = null;

  try {
    let pdfBuffer: Buffer;

    if (pdfPath) {
      const { data, error } = await supabaseAdmin.storage
        .from(financeBillDocumentsBucket)
        .download(pdfPath);

      if (error || !data) {
        throw new Error(error?.message ?? "Could not download PDF from storage.");
      }

      pdfBuffer = Buffer.from(await data.arrayBuffer());
    } else {
      const response = await fetch(pdfUrl!);

      if (!response.ok) {
        throw new Error(`Could not fetch PDF URL: ${response.status}`);
      }

      pdfBuffer = Buffer.from(await response.arrayBuffer());
    }

    const text = await extractPdfText(pdfBuffer);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No extractable text was found in this PDF.");
    }

    await supabaseAdmin.from("document_chunks").delete().eq("document_id", id);

    const batchSize = 20;

    for (let start = 0; start < chunks.length; start += batchSize) {
      const batch = chunks.slice(start, start + batchSize);
      const embeddings = await createEmbeddings(batch.map((chunk) => chunk.text));

      const rows = batch.map((chunk, index) => ({
        document_id: id,
        chunk_index: chunk.chunkIndex,
        chunk_text: chunk.text,
        token_count: chunk.tokenCount,
        embedding: `[${embeddings[index].join(",")}]`,
        metadata: {
          slug,
          source: pdfPath ? "supabase_storage" : "external_pdf_url",
        },
      }));

      const { error } = await supabaseAdmin.from("document_chunks").insert(rows);

      if (error) {
        throw new Error(error.message);
      }
    }

    await supabaseAdmin
      .from("finance_bill_documents")
      .update({
        chunk_count: chunks.length,
        processed_at: new Date().toISOString(),
        processing_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    processedChunkCount = chunks.length;
    revalidatePath("/admin");
    revalidatePath(`/finance-bill-2026/${slug}`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Document processing failed.";

    await supabaseAdmin
      .from("finance_bill_documents")
      .update({
        processing_error: errorNotice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath("/admin");
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", `Processed ${processedChunkCount} chunks.`);
}

export async function fetchNewsAction() {
  await requireAdminSession();

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await fetchAndPublishNews();

    revalidatePath("/admin");
    revalidatePath("/news");
    notice = `News fetch complete. Added ${result.inserted}, skipped ${result.skipped}.`;
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "News fetch failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", notice);
}

export async function fetchParticipationDeadlinesAction() {
  await requireAdminSession();

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await fetchParticipationDeadlines();

    revalidatePath("/admin");
    revalidatePath("/public-participation");
    revalidatePath("/public-participation/deadlines");
    notice = `Deadline lookup complete. Saved ${result.updated} JSON records, skipped ${result.skipped}.`;

    if (result.errors.length > 0) {
      notice = `${notice} Last issue: ${result.errors[result.errors.length - 1]}`;
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Deadline tracker failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", notice);
}

export async function generateDailyPollsAction() {
  await requireAdminSession();

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await generateDailyPublicPolls();

    revalidatePath("/admin");
    revalidatePath("/public-participation");
    notice = `Daily polls complete for ${result.kenyaDate}. Created ${result.created}, already had ${result.alreadyHad}.`;

    if (result.newsRefresh.error) {
      notice = `${notice} News refresh issue: ${result.newsRefresh.error}`;
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Daily poll generator failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", notice);
}

export async function deleteAllNewsArticles() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    const { error } = await supabase.from("news_articles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/news");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete news articles.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All news articles deleted successfully.");
}

export async function deleteAllForumThreads() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    const { error } = await supabase.from("forum_threads").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/forum", "layout");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete forum threads.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All forum threads deleted successfully.");
}

export async function deleteAllPublicPolls() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    // Delete poll votes first (foreign key constraint)
    await supabase.from("public_poll_votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Delete poll options
    await supabase.from("public_poll_options").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Delete polls
    const { error } = await supabase.from("public_polls").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/public-participation", "layout");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete polls.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All public polls deleted successfully.");
}

export async function deleteAllDeadlines() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    const { error } = await supabase
      .from("public_participation_deadlines")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/public-participation/deadlines");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete deadlines.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All deadline records deleted successfully.");
}

export async function deleteAllForumComments() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    const { error } = await supabase
      .from("forum_comments")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      throw new Error(error.message);
    }

    await recountForumThreadComments(supabase);

    revalidatePath("/admin");
    revalidatePath("/forum", "layout");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete comments.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All forum comments deleted successfully.");
}

export async function deleteAllContent() {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  let errorNotice: string | null = null;

  try {
    // Delete in correct order to respect foreign key constraints
    await supabase.from("public_poll_votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("public_poll_options").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("public_polls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("forum_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await recountForumThreadComments(supabase);
    await supabase.from("forum_threads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("news_articles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("public_participation_deadlines")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    revalidatePath("/admin");
    revalidatePath("/news");
    revalidatePath("/forum", "layout");
    revalidatePath("/public-participation", "layout");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    errorNotice = error instanceof Error ? error.message : "Failed to delete all content.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", "All website content has been deleted.");
}

export async function deleteSelectedNewsArticles(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const selectedIds = formData.getAll("article_ids").map(id => String(id));

  if (selectedIds.length === 0) {
    return { success: false, message: "No articles selected." };
  }

  try {
    const { error } = await supabase
      .from("news_articles")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/news");
    return { success: true, message: `${selectedIds.length} news articles deleted.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete news articles.",
    };
  }
}

export async function deleteSelectedForumThreads(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const selectedIds = formData.getAll("thread_ids").map(id => String(id));

  if (selectedIds.length === 0) {
    return { success: false, message: "No threads selected." };
  }

  try {
    // Delete comments first (foreign key)
    await supabase
      .from("forum_comments")
      .delete()
      .in("thread_id", selectedIds);

    // Delete threads
    const { error } = await supabase
      .from("forum_threads")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/forum", "layout");
    return { success: true, message: `${selectedIds.length} forum threads deleted.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete forum threads.",
    };
  }
}

export async function deleteSelectedForumComments(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const selectedIds = formData.getAll("comment_ids").map(id => String(id));

  if (selectedIds.length === 0) {
    return { success: false, message: "No comments selected." };
  }

  try {
    const { data: commentsToDelete, error: lookupError } = await supabase
      .from("forum_comments")
      .select("thread_id")
      .in("id", selectedIds);

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    const { error } = await supabase
      .from("forum_comments")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(error.message);
    }

    const threadIds = Array.from(
      new Set((commentsToDelete ?? []).map((comment) => comment.thread_id)),
    ).filter(Boolean);

    await recountForumThreadComments(supabase, threadIds);

    revalidatePath("/admin");
    revalidatePath("/forum", "layout");
    return { success: true, message: `${selectedIds.length} forum comments deleted.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete comments.",
    };
  }
}

async function recountForumThreadComments(
  supabase: SupabaseAdminClient,
  threadIds?: string[],
) {
  let targetThreadIds = threadIds ?? [];

  if (targetThreadIds.length === 0) {
    const { data, error } = await supabase.from("forum_threads").select("id");

    if (error) {
      throw new Error(error.message);
    }

    targetThreadIds = (data ?? []).map((thread) => thread.id);
  }

  for (const threadId of targetThreadIds) {
    const { count, error } = await supabase
      .from("forum_comments")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId)
      .eq("status", "visible");

    if (error) {
      throw new Error(error.message);
    }

    const visibleCount = count ?? 0;
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("like_count")
      .eq("id", threadId)
      .maybeSingle<{ like_count: number }>();

    await supabase
      .from("forum_threads")
      .update({
        comment_count: visibleCount,
        score: (thread?.like_count ?? 0) + visibleCount * 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);
  }
}

export async function deleteSelectedPublicPolls(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const selectedIds = formData.getAll("poll_ids").map(id => String(id));

  if (selectedIds.length === 0) {
    return { success: false, message: "No polls selected." };
  }

  try {
    // Delete poll votes first (foreign key constraint)
    await supabase
      .from("public_poll_votes")
      .delete()
      .in("poll_id", selectedIds);

    // Delete poll options
    await supabase
      .from("public_poll_options")
      .delete()
      .in("poll_id", selectedIds);

    // Delete polls
    const { error } = await supabase
      .from("public_polls")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/public-participation", "layout");
    return { success: true, message: `${selectedIds.length} polls deleted.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete polls.",
    };
  }
}

export async function deleteSelectedDeadlines(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { success: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const selectedIds = formData.getAll("deadline_ids").map(id => String(id));

  if (selectedIds.length === 0) {
    return { success: false, message: "No deadlines selected." };
  }

  try {
    const { error } = await supabase
      .from("public_participation_deadlines")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    revalidatePath("/public-participation/deadlines");
    return { success: true, message: `${selectedIds.length} deadlines deleted.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete deadlines.",
    };
  }
}

export async function generateAiForumTopicsAction() {
  await requireAdminSession();

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await generateDailyForumTopics();

    revalidatePath("/admin");
    revalidatePath("/forum", "layout");
    revalidatePath("/public-participation", "layout");
    notice = `AI generation complete. Published ${result.insertedThreads} forum topics and ${result.insertedPolls} polls.`;
  } catch (error) {
    errorNotice = error instanceof Error ? error.message : "AI generation failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", notice);
}

export async function generatePollAnalysisAction() {
  await requireAdminSession();

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await generateDailyPollAnalysis();

    revalidatePath("/admin");
    revalidatePath("/public-participation", "layout");
    
    if (result.success) {
      notice = `Analysis complete. Generated report from ${result.pollCount} polls and ${result.voteCount} total votes.`;
    } else {
      notice = result.message || "No polls were analyzed.";
    }
  } catch (error) {
    errorNotice = error instanceof Error ? error.message : "Analysis failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }

  redirectWithNotice("success", notice);
}

export async function generateBreakingNewsAction(formData: FormData) {
  await requireAdminSession();
  const topic = formData.get("topic")?.toString();

  if (!topic) {
    redirectWithNotice("error", "Topic cannot be empty.");
  }

  let notice = "";
  let errorNotice: string | null = null;

  try {
    const result = await generateBreakingNews(topic!);
    if (result.success) {
      revalidatePath("/admin");
      revalidatePath("/news");
      revalidatePath("/");
      notice = `Successfully generated and published breaking news: "${result.title}"`;
    } else {
      errorNotice = result.message || "An unknown error occurred.";
    }
  } catch (error) {
    errorNotice =
      error instanceof Error ? error.message : "AI generation failed.";
  }

  if (errorNotice) {
    redirectWithNotice("error", errorNotice);
  }
  redirectWithNotice("success", notice);
}

