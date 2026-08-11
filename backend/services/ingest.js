import fs from "fs";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import { addDocuments } from "./vectorStore.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function chunkText(text, size = 900, overlap = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];

  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    const chunk = clean.slice(start, end).trim();

    if (chunk.length > 40) {
      chunks.push(chunk);
    }

    if (end === clean.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

export async function indexPdf(filePath, fileName) {
  const buffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: buffer
  });

  const result = await parser.getText();

  await parser.destroy();

  if (!result.text?.trim()) {
    throw new Error("Could not extract text from this PDF.");
  }

  const chunks = chunkText(result.text);

  const embeddingModel =
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  const response = await openai.embeddings.create({
    model: embeddingModel,
    input: chunks
  });

  const docs = chunks.map((text, i) => ({
    id: `${Date.now()}-${i}`,
    text,
    source: fileName,
    page: null,
    embedding: response.data[i].embedding
  }));

  await addDocuments(docs);

  return {
    success: true,
    fileName,
    chunksIndexed: docs.length,
    message: `${docs.length} chunks indexed successfully.`
  };
}