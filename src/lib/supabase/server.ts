import { createClient } from "@supabase/supabase-js";

export type FinanceBillDocument = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  pdf_path: string | null;
  pdf_url: string | null;
  status?: string | null;
  chunk_count?: number | null;
  processed_at?: string | null;
  processing_error?: string | null;
  published_at: string | null;
  updated_at: string | null;
};

export type DocumentChunk = {
  id: string;
  document_id: string;
  chunk_index?: number | null;
  chunk_text: string;
  section_title: string | null;
  page_number: number | null;
  metadata: Record<string, unknown>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getFinanceBillDocumentBySlug(slug: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { document: null, error: "Supabase environment variables are not set." };
  }

  const { data, error } = await supabase
    .from("finance_bill_documents")
    .select(
      "id, slug, title, description, summary, source_name, source_url, pdf_path, pdf_url, chunk_count, processed_at, processing_error, published_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<FinanceBillDocument>();

  if (error) {
    return { document: null, error: error.message };
  }

  return { document: data, error: null };
}

export async function listPublishedFinanceBillDocuments() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      documents: [] as FinanceBillDocument[],
      error: "Supabase environment variables are not set.",
    };
  }

  const { data, error } = await supabase
    .from("finance_bill_documents")
    .select(
      "id, slug, title, description, summary, source_name, source_url, pdf_path, pdf_url, chunk_count, processed_at, processing_error, published_at, updated_at, status",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    return { documents: [] as FinanceBillDocument[], error: error.message };
  }

  return { documents: data ?? [], error: null };
}

export async function getDocumentChunkById(id: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      chunk: null,
      error: "Supabase environment variables are not set.",
    };
  }

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_text, section_title, page_number, metadata")
    .eq("id", id)
    .maybeSingle<DocumentChunk>();

  if (error) {
    return { chunk: null, error: error.message };
  }

  return { chunk: data, error: null };
}

export async function listDocumentChunksForDocument(
  documentId: string,
  limit = 18,
) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      chunks: [] as DocumentChunk[],
      error: "Supabase environment variables are not set.",
    };
  }

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, chunk_text, section_title, page_number, metadata")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true })
    .limit(limit);

  if (error) {
    return { chunks: [] as DocumentChunk[], error: error.message };
  }

  return { chunks: data ?? [], error: null };
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
