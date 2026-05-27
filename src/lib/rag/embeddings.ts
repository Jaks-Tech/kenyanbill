import OpenAI from "openai";

const embeddingModel = "text-embedding-3-large";
const embeddingDimensions = 1536;

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function createEmbeddings(inputs: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    model: embeddingModel,
    input: inputs,
    dimensions: embeddingDimensions,
  });

  return response.data.map((item) => item.embedding);
}

export async function createEmbedding(input: string) {
  const [embedding] = await createEmbeddings([input]);
  return embedding;
}
