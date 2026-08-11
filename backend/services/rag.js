import OpenAI from "openai";
import { searchSimilar } from "./vectorStore.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function answerQuestion(question) {
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  const queryEmbedding = await openai.embeddings.create({
    model: embeddingModel,
    input: question
  });

  const matches = await searchSimilar(queryEmbedding.data[0].embedding, 5);

  if (!matches.length) {
    return {
      answer: "No documents have been indexed yet. Upload a PDF first.",
      sources: []
    };
  }

  const context = matches
    .map((m, i) => `[Source ${i + 1}] ${m.source}\n${m.text}`)
    .join("\n\n");

  const model = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";

  const response = await openai.responses.create({
    model,
    instructions:
      "You are a document-grounded RAG assistant. Answer using only the supplied context. " +
      "If the context does not contain the answer, clearly say that the uploaded documents do not provide enough information. " +
      "Do not invent facts. Keep answers clear and useful.",
    input: `Context:\n${context}\n\nUser question: ${question}`
  });

  return {
    answer: response.output_text,
    sources: matches.map(m => ({
      source: m.source,
      page: m.page,
      score: Number(m.score.toFixed(4)),
      preview: m.text.slice(0, 180) + (m.text.length > 180 ? "..." : "")
    }))
  };
}
