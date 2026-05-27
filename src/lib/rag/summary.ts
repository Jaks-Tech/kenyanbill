import OpenAI from "openai";
import type { DocumentChunk, FinanceBillDocument } from "@/lib/supabase/server";

export type GeneratedBillSummary = {
  summary: string;
  source: "ai" | "document-summary" | "extractive";
};

function trimForPrompt(chunks: DocumentChunk[]) {
  return chunks
    .map((chunk, index) => {
      const label = chunk.page_number
        ? `Source ${index + 1}, page ${chunk.page_number}`
        : `Source ${index + 1}`;

      return `[${label}]\n${chunk.chunk_text.slice(0, 2600)}`;
    })
    .join("\n\n---\n\n");
}

function firstSentences(text: string, count: number) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 80)
    .slice(0, count);
}

function buildExtractiveSummary(
  document: FinanceBillDocument,
  chunks: DocumentChunk[],
) {
  const combined = chunks.map((chunk) => chunk.chunk_text).join(" ");
  const proposalSentences = firstSentences(combined, 7);

  if (proposalSentences.length === 0) {
    return `This page found processed chunks for ${document.title}, but there was not enough clean sentence-level text to prepare a readable proposal summary yet.`;
  }

  return [
    `This summary is prepared from the processed source chunks for ${document.title}.`,
    "",
    "Main points visible in the source text:",
    ...proposalSentences.map((sentence) => `- ${sentence}`),
    "",
    "These points should be checked against the linked source document before being treated as final legal interpretation.",
  ].join("\n");
}

export async function summarizeFinanceBillFromChunks(
  document: FinanceBillDocument,
  chunks: DocumentChunk[],
): Promise<GeneratedBillSummary> {
  if (chunks.length === 0 && document.summary) {
    return {
      summary: document.summary,
      source: "document-summary",
    };
  }

  if (chunks.length === 0) {
    return {
      summary:
        "No processed document chunks are available yet. Process the Finance Bill PDF from the admin page to generate a source-based proposal summary.",
      source: "extractive",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: buildExtractiveSummary(document, chunks),
      source: "extractive",
    };
  }

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
          "You are Kenyan Bill, a careful civic explainer. Summarize only from the provided Finance Bill source chunks. Use plain language for Kenyan citizens. Do not invent proposals. If the chunks are incomplete, say so. Use short headings and bullets. Mention source numbers inline like [Source 1].",
      },
      {
        role: "user",
        content: `Prepare a plain-language summary of the proposals in this document: ${document.title}\n\nSource chunks:\n${trimForPrompt(chunks)}`,
      },
    ],
  });

  return {
    summary:
      completion.choices[0]?.message.content ??
      buildExtractiveSummary(document, chunks),
    source: "ai",
  };
}
