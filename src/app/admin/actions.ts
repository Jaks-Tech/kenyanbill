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
import { requireAdminSession } from "./auth";

function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
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

  const id = cleanString(formData.get("id"));
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

  redirectWithNotice("success", "Document deleted.");
}

export async function processFinanceBillDocument(formData: FormData) {
  await requireAdminSession();

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirectWithNotice("error", "Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = supabase!;

  const id = cleanString(formData.get("id"));
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
    const message =
      error instanceof Error ? error.message : "Document processing failed.";

    await supabaseAdmin
      .from("finance_bill_documents")
      .update({
        processing_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath("/admin");
    redirectWithNotice("error", message);
  }

  redirectWithNotice("success", `Processed ${processedChunkCount} chunks.`);
}

export async function fetchNewsAction() {
  await requireAdminSession();

  let notice = "";

  try {
    const result = await fetchAndPublishNews();

    revalidatePath("/admin");
    revalidatePath("/news");
    notice = `News fetch complete. Added ${result.inserted}, skipped ${result.skipped}.`;
  } catch (error) {
    redirectWithNotice(
      "error",
      error instanceof Error ? error.message : "News fetch failed.",
    );
  }

  redirectWithNotice("success", notice);
}

export async function fetchParticipationDeadlinesAction() {
  await requireAdminSession();

  let notice = "";

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
    redirectWithNotice(
      "error",
      error instanceof Error ? error.message : "Deadline tracker failed.",
    );
  }

  redirectWithNotice("success", notice);
}
