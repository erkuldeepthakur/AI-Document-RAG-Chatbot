# RAG Document Chatbot

A complete beginner-friendly RAG chatbot using:

- React + Vite frontend
- Node.js + Express backend
- OpenAI embeddings + chat model
- Local JSON vector store (no Pinecone account required)
- PDF upload and text extraction
- Cosine-similarity retrieval
- Chat history in the browser

## 1. Requirements

Install Node.js 20+.

You also need an OpenAI API key.

## 2. Setup

Open a terminal in this project folder:

```bash
npm install
```

Copy `.env.example` to `.env` and put your API key in it:

```env
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
PORT=5000
```

## 3. Run

```bash
npm run dev
```

Open:

http://localhost:5173

## 4. How to use

1. Upload a PDF.
2. Wait for indexing to finish.
3. Ask a question about the PDF.
4. The backend retrieves the most relevant chunks.
5. Those chunks are passed to the model as context.
6. The answer also shows the source document and page when available.

## RAG flow

PDF -> text extraction -> chunking -> embeddings -> local vector store
-> similarity search -> relevant context -> LLM -> grounded answer

## Important

Never commit `.env` or your API key to GitHub.

This project intentionally uses a local vector store so you can learn the RAG architecture without first configuring Pinecone/Qdrant. You can replace `backend/services/vectorStore.js` later with a production vector database.
