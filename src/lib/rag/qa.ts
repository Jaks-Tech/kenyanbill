import OpenAI from "openai";
import {
  getSupabaseServerClient,
  type FinanceBillDocument,
} from "@/lib/supabase/server";
import { createEmbedding } from "./embeddings";

export type MatchedChunk = {
  id: string;
  document_id: string;
  chunk_text: string;
  section_title: string | null;
  page_number: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type AskResult = {
  answer: string;
  sources: MatchedChunk[];
  error: string | null;
};

export const starterQuestions = [
  "What are the main proposals in the Finance Bill 2026?",
  "How could the Finance Bill 2026 affect transport and fuel costs?",
  "How could the Finance Bill 2026 affect small businesses?",
  "What does the bill say about VAT?",
  "How could the bill affect households and cost of living?",
  "Which sectors of the economy are most affected?",
];

export async function getSuggestedQuestions() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return starterQuestions;
  }

  const { data } = await supabase
    .from("finance_bill_documents")
    .select("title, summary, description, chunk_count")
    .eq("status", "published")
    .gt("chunk_count", 0)
    .limit(3);

  const documents = (data ?? []) as Pick<
    FinanceBillDocument,
    "title" | "summary" | "description" | "chunk_count"
  >[];

  if (documents.length === 0) {
    return starterQuestions;
  }

  const documentTitle = documents[0].title;

  return [
    `Summarize ${documentTitle} in simple language.`,
    "How could this Finance Bill affect transport, fuel, and logistics?",
    "How could this Finance Bill affect businesses and employers?",
    "How could this Finance Bill affect households and cost of living?",
    "What tax areas does this Finance Bill focus on?",
    "Which proposals are likely to attract public debate?",
  ];
}

export async function askFinanceBillQuestion(question: string): Promise<AskResult> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      answer: "",
      sources: [],
      error: "Supabase is not configured.",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: "",
      sources: [],
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  const queryEmbedding = await createEmbedding(question);
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_count: 8,
  });

  if (error) {
    return {
      answer: "",
      sources: [],
      error: error.message,
    };
  }

  const sources = (data ?? []) as MatchedChunk[];

  if (sources.length === 0) {
    return {
      answer:
        "I could not find relevant Finance Bill source chunks yet. Please process the PDF chunks from the admin page first.",
      sources: [],
      error: null,
    };
  }

  const context = sources
    .map(
      (source, index) =>
        `[Source ${index + 1} | similarity ${source.similarity.toFixed(3)}]\n${source.chunk_text}`,
    )
    .join("\n\n---\n\n");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are Kenyan Bill, a careful civic explainer. Answer only from the provided Finance Bill context. If the context is insufficient, say so. Use clear language for Kenyan citizens. Format answers in clean Markdown with short headings and bullets when useful. Mention source numbers inline like [Source 1]. Do not use tables unless the comparison is genuinely clearer as a table.",
      },
      {
        role: "user",
        content: `Question: ${question}\n\nFinance Bill context:\n${context}`,
      },
    ],
  });

  const answer =
    completion.choices[0]?.message.content ??
    "I could not generate an answer from the available context.";

  await supabase.from("rag_queries").insert({
    question,
    answer,
    sources_used: sources.map((source, index) => ({
      source_number: index + 1,
      chunk_id: source.id,
      document_id: source.document_id,
      similarity: source.similarity,
      metadata: source.metadata,
    })),
  });

  return {
    answer,
    sources,
    error: null,
  };
}
