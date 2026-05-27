import { createClient } from "@supabase/supabase-js";
import type { FinanceBillDocument } from "./server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const financeBillDocumentsBucket = "finance-bill-documents";

export function hasSupabaseAdminConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function listFinanceBillDocuments() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      documents: [] as FinanceBillDocument[],
      error: "SUPABASE_SERVICE_ROLE_KEY is not set.",
    };
  }

  const { data, error } = await supabase
    .from("finance_bill_documents")
    .select(
      "id, slug, title, description, summary, source_name, source_url, pdf_path, pdf_url, chunk_count, processed_at, processing_error, published_at, updated_at, status",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { documents: [] as FinanceBillDocument[], error: error.message };
  }

  return { documents: data ?? [], error: null };
}
