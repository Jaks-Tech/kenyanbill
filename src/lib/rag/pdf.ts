import { createRequire } from "node:module";

type PdfParseResult = {
  text: string;
};

export async function extractPdfText(buffer: Buffer) {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    dataBuffer: Buffer,
  ) => Promise<PdfParseResult>;
  const result = await pdfParse(buffer);
  return result.text;
}
