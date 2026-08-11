import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "http://localhost:5000/api";

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Upload a PDF to start.");
  const [sources, setSources] = useState([]);

  async function uploadFile() {
    if (!file) return;
    setUploading(true);
    setStatus("Reading PDF and creating embeddings...");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus(data.message);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function ask() {
    const q = question.trim();
    if (!q || asking) return;

    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      setMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
      setSources(data.sources || []);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: `Error: ${e.message}` }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>RAG Document Chatbot</h1>
          <p>Upload a PDF and ask questions grounded in its content.</p>
        </div>
        <span className="badge">RAG</span>
      </header>

      <main>
        <section className="card upload-card">
          <h2>1. Upload document</h2>
          <div className="upload-row">
            <input type="file" accept=".pdf,application/pdf" onChange={e => setFile(e.target.files[0])} />
            <button onClick={uploadFile} disabled={!file || uploading}>
              {uploading ? "Indexing..." : "Upload & Index"}
            </button>
          </div>
          <p className="status">{status}</p>
        </section>

        <section className="card chat-card">
          <h2>2. Ask your document</h2>

          <div className="messages">
            {messages.length === 0 && (
              <div className="empty">Try: “What is this document about?”</div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <strong>{m.role === "user" ? "You" : "AI"}</strong>
                <div>{m.text}</div>
              </div>
            ))}
            {asking && <div className="message assistant"><strong>AI</strong><div>Thinking...</div></div>}
          </div>

          <div className="composer">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ask()}
              placeholder="Ask a question about your PDF..."
            />
            <button onClick={ask} disabled={asking || !question.trim()}>Send</button>
          </div>
        </section>

        {sources.length > 0 && (
          <section className="card">
            <h2>Retrieved sources</h2>
            {sources.map((s, i) => (
              <div className="source" key={i}>
                <div><strong>{s.source}</strong> · similarity {s.score}</div>
                <p>{s.preview}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
