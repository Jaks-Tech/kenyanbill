export type AskSource = {
  id: string;
  documentSlug: string | null;
  similarity: number;
  preview: string;
};

export type AskState = {
  threadId: string | null;
  question: string;
  answer: string;
  error: string | null;
  messages: {
    role: "user" | "assistant";
    content: string;
    sources?: AskSource[];
  }[];
  sources: AskSource[];
};

export const initialAskState: AskState = {
  threadId: null,
  question: "",
  answer: "",
  error: null,
  messages: [],
  sources: [],
};
