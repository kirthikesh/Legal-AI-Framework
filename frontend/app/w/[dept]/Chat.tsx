"use client";

import { useState, type FormEvent } from "react";
import { LockIcon, ShieldIcon } from "@/components/Icons.tsx";

interface ModelOption { id: string; label: string }
interface Message { role: "user" | "bot"; text: string; meta?: string; blocked?: boolean }

export function Chat({ deptName, approved, locked }: { deptName: string; approved: ModelOption[]; locked: ModelOption[] }) {
  const [model, setModel] = useState(approved[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !model || busy) return;
    setDraft("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { role: "bot", text: data.reply, meta: `${data.modelLabel} via AWS Bedrock · ${deptName} only` }]);
      } else {
        setMessages((m) => [...m, { role: "bot", text: data.error ?? "Request failed", blocked: true, meta: res.status === 422 ? "Blocked by guardrails · logged" : "Not sent" }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Network error. Try again.", blocked: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="assistant" aria-labelledby="assistant-title" className="card chat col-2">
      <div className="chat-top">
        <div className="card-head">
          <h2 id="assistant-title">AI assistant</h2>
          <span className="badge ok"><ShieldIcon size={14} /> Guardrails on: card numbers and personal IDs are blocked</span>
        </div>
        <div className="pills" role="group" aria-label="Model (AWS Bedrock)">
          <span className="muted" style={{ fontSize: 13, marginRight: 4 }}>Model (AWS Bedrock)</span>
          {approved.map((m) => (
            <button key={m.id} type="button" className="pill" aria-pressed={m.id === model} onClick={() => setModel(m.id)}>
              {m.label}
            </button>
          ))}
          {locked.map((m) => (
            <span key={m.id} className="pill locked" title={`Not approved for ${deptName} by the platform admin`}>
              <LockIcon /> {m.label} · not approved
            </span>
          ))}
        </div>
      </div>

      <div className="messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Ask anything about {deptName} work. Answers only use {deptName} documents. Try including a card number to see the guardrail.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="msg-user">{m.text}</div>
          ) : (
            <div key={i} className={`msg-bot${m.blocked ? " blocked" : ""}`}>
              <div>{m.text}</div>
              {m.meta && <span className="small muted">{m.meta}</span>}
            </div>
          ),
        )}
        {busy && <p className="small muted" style={{ margin: 0 }}>Thinking…</p>}
      </div>

      <form className="composer" onSubmit={send}>
        <label htmlFor="prompt" className="sr-only">Ask the {deptName} assistant</label>
        <input
          id="prompt"
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={approved.length ? `Ask about ${deptName} documents` : "No models approved for this department yet"}
          disabled={!approved.length}
          maxLength={4000}
        />
        <button type="submit" className="btn" disabled={busy || !approved.length}>Send</button>
      </form>
    </section>
  );
}
