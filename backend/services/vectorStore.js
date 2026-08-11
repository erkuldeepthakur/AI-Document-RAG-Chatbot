import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../data");
const dbPath = path.join(dataDir, "vectors.json");

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, "[]", "utf8");
  }
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await fs.readFile(dbPath, "utf8"));
}

async function writeDb(items) {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(items), "utf8");
}

export async function addDocuments(docs) {
  const current = await readDb();
  current.push(...docs);
  await writeDb(current);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchSimilar(queryEmbedding, topK = 5) {
  const docs = await readDb();

  return docs
    .map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function getStats() {
  const docs = await readDb();
  const sources = [...new Set(docs.map(d => d.source))];
  return { chunks: docs.length, documents: sources };
}
