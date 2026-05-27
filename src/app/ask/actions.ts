"use server";

import { askFinanceBillQuestion } from "@/lib/rag/qa";
import { saveAskTurn } from "@/lib/ask/threads";
import { initialAskState, type AskState } from "./state";

export async function askQuestionAction(
  previousState: AskState,
  formData: FormData,
): Promise<AskState> {
  const question = String(formData.get("question") ?? "").trim();
  const submittedHistory = String(formData.get("history") ?? "");
  const threadId = String(formData.get("thread_id") ?? "").trim() || null;
  const history = parseSubmittedHistory(submittedHistory) ?? previousState.messages;

  if (!question) {
    return {
      ...previousState,
      threadId,
      messages: history,
      error: "Enter a question first.",
    };
  }

  const result = await askFinanceBillQuestion(question);
  const sources = result.sources.map((source) => ({
    id: source.id,
    documentSlug:
      typeof source.metadata.slug === "string" ? source.metadata.slug : null,
    similarity: source.similarity,
    preview: source.chunk_text.slice(0, 260),
  }));
  let activeThreadId = threadId;

  if (!result.error && result.answer) {
    try {
      activeThreadId = await saveAskTurn({
        threadId,
        question,
        answer: result.answer,
        sources,
      });
    } catch (error) {
      return {
        threadId,
        question,
        answer: result.answer,
        error:
          error instanceof Error
            ? `Answer generated, but the public thread could not be saved: ${error.message}`
            : "Answer generated, but the public thread could not be saved.",
        messages: history,
        sources,
      };
    }
  }

  return {
    threadId: activeThreadId,
    question,
    answer: result.answer,
    error: result.error,
    messages: result.error
      ? history
      : [
          ...history,
          { role: "user", content: question },
          { role: "assistant", content: result.answer, sources },
        ],
    sources,
  };
}

function parseSubmittedHistory(value: string): AskState["messages"] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AskState["messages"];

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string",
      )
      .slice(-20);
  } catch {
    return null;
  }
}
