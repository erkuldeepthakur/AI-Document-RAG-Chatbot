import "dotenv/config";

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { indexPdf } from "./services/ingest.js";
import { answerQuestion } from "./services/rag.js";
import { getStats } from "./services/vectorStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported."));
    }
  }
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "RAG backend is running"
  });
});

app.get("/api/stats", async (_req, res) => {
  try {
    res.json(await getStats());
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Please upload a PDF."
    });
  }

  try {
    const result = await indexPdf(
      req.file.path,
      req.file.originalname
    );

    fs.unlink(req.file.path, () => {});

    res.json(result);
  } catch (error) {
    fs.unlink(req.file.path, () => {});

    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const question = String(req.body?.question || "").trim();

  if (!question) {
    return res.status(400).json({
      error: "Question is required."
    });
  }

  try {
    const result = await answerQuestion(question);

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({
    error: err.message || "Request failed."
  });
});

app.listen(PORT, () => {
  console.log(
    `RAG backend running at http://localhost:${PORT}`
  );
});