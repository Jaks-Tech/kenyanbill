export type TextChunk = {
  chunkIndex: number;
  text: string;
  tokenCount: number;
};

const maxChunkCharacters = 3200;
const overlapCharacters = 450;

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokenCount(text: string) {
  return Math.ceil(text.length / 4);
}

export function chunkText(rawText: string) {
  const text = normalizeText(rawText);

  if (!text) {
    return [] as TextChunk[];
  }

  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const chunks: TextChunk[] = [];
  let current = "";

  function pushCurrent() {
    const trimmed = current.trim();

    if (!trimmed) {
      return;
    }

    chunks.push({
      chunkIndex: chunks.length,
      text: trimmed,
      tokenCount: estimateTokenCount(trimmed),
    });

    current = trimmed.slice(-overlapCharacters);
  }

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;

    if (next.length > maxChunkCharacters && current) {
      pushCurrent();
      current = paragraph;
    } else {
      current = next;
    }

    while (current.length > maxChunkCharacters) {
      const splitAt = current.lastIndexOf(" ", maxChunkCharacters);
      const safeSplit = splitAt > 800 ? splitAt : maxChunkCharacters;
      const part = current.slice(0, safeSplit);
      const rest = current.slice(safeSplit);

      chunks.push({
        chunkIndex: chunks.length,
        text: part.trim(),
        tokenCount: estimateTokenCount(part),
      });

      current = `${part.slice(-overlapCharacters)} ${rest}`.trim();
    }
  }

  pushCurrent();

  return chunks;
}
